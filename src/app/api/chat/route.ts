import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { OpenAIEmbeddings } from "@langchain/openai";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { OpenAI } from '@langchain/openai';
import { StringOutputParser } from '@langchain/core/output_parsers';
import {
  RunnableSequence,
  RunnablePassthrough,
} from '@langchain/core/runnables';
import { PromptTemplate } from '@langchain/core/prompts';
import { checkUsageLimits, trackMessageUsage, checkRateLimit } from '@/lib/usage';

export const dynamic = 'force-dynamic';

const condenseQuestionTemplate = `Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question.

Chat History:
{chat_history}

Follow Up Input: {question}
Standalone question:`;
const CONDENSE_QUESTION_PROMPT = PromptTemplate.fromTemplate(
  condenseQuestionTemplate
);

const answerTemplate = `You are an expert customer support agent for a company. Use the following pieces of context to answer the question at the end. If you don't know the answer, just say that you don't know, don't try to make up an answer.

Context:
{context}

Question: {question}
Helpful Answer:`;
const ANSWER_PROMPT = PromptTemplate.fromTemplate(answerTemplate);

const formatChatHistory = (chatHistory: [string, string][]) => {
  const formattedDialogueTurns = chatHistory.map(
    (dialogueTurn) => `Human: ${dialogueTurn[0]}\nAssistant: ${dialogueTurn[1]}`
  );
  return formattedDialogueTurns.join('\n');
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, chatbotId, conversationId, chat_history, question, userId } = body;

    // Support both old and new message formats
    const userQuestion = message || question;
    
    if (!userQuestion || !chatbotId) {
      return NextResponse.json({ error: 'Message and chatbotId are required' }, { status: 400 });
    }

    // Rate limiting
    const rateLimitResult = await checkRateLimit(`chat:${chatbotId}`);
    if (!rateLimitResult.success) {
      return NextResponse.json({ 
        error: 'Rate limit exceeded. Please try again later.',
        response: "I'm sorry, you're sending messages too quickly. Please wait a moment and try again."
      }, { status: 429 });
    }

    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get chatbot details to find the owner
    const { data: chatbot, error: chatbotError } = await supabaseClient
      .from('chatbots')
      .select('user_id')
      .eq('id', chatbotId)
      .single();

    if (chatbotError || !chatbot) {
      return NextResponse.json({ error: 'Chatbot not found' }, { status: 404 });
    }

    // Check usage limits if userId is provided (for authenticated users)
    if (userId) {
      const usageCheck = await checkUsageLimits(userId, chatbotId);
      if (!usageCheck.allowed) {
        return NextResponse.json({ 
          error: usageCheck.reason,
          response: `I'm sorry, but ${usageCheck.reason?.toLowerCase()}. Please upgrade your plan to continue chatting.`
        }, { status: 403 });
      }
    }

    // For now, return a mock response if no OpenAI key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ 
        response: "I'm a demo chatbot. In a real implementation, I would connect to your knowledge base and provide helpful answers based on your uploaded documents. Please configure your OpenAI API key to enable full functionality.",
        conversationId: conversationId || 'demo-conversation'
      });
    }

    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    const llm = new OpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    const vectorStore = new SupabaseVectorStore(embeddings, {
      client: supabaseClient,
      tableName: 'knowledge_embeddings',
      queryName: 'match_documents',
      filter: { chatbot_id: chatbotId },
    });

    const standaloneQuestionChain = RunnableSequence.from([
      {
        question: (input: { question: string; chat_history: [string, string][] }) =>
          input.question,
        chat_history: (input: { question: string; chat_history: [string, string][] }) =>
          formatChatHistory(input.chat_history),
      },
      CONDENSE_QUESTION_PROMPT,
      llm,
      new StringOutputParser(),
    ]);

    const retriever = vectorStore.asRetriever();

    const answerChain = RunnableSequence.from([
        {
          context: retriever.pipe(docs => docs.map(d => d.pageContent).join('\n')),
          question: new RunnablePassthrough(),
        },
        ANSWER_PROMPT,
        llm,
        new StringOutputParser(),
    ]);

    const conversationalChain = standaloneQuestionChain.pipe(answerChain);

    const result = await conversationalChain.invoke({
        question: userQuestion,
        chat_history: chat_history || [],
    });

    // Track message usage if userId is provided
    if (userId && conversationId) {
      try {
        await trackMessageUsage(userId, chatbotId, conversationId);
      } catch (error) {
        console.error('Failed to track message usage:', error);
        // Don't fail the request if usage tracking fails
      }
    }

    // Return in the new format expected by the frontend
    return NextResponse.json({ 
      response: result,
      conversationId: conversationId || 'conversation-' + Date.now()
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ 
      error: 'An internal error occurred',
      response: "I'm sorry, I encountered an error while processing your request. Please try again."
    }, { status: 500 });
  }
}
