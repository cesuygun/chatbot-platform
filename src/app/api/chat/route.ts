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

export const dynamic = 'force-dynamic';

const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const embeddings = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPEN_AI_KEY,
});

const llm = new OpenAI({
    openAIApiKey: process.env.OPEN_AI_KEY,
});

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
    const { question, chatbotId, chat_history } = await req.json();

    if (!question || !chatbotId) {
      return NextResponse.json({ error: 'Question and chatbotId are required' }, { status: 400 });
    }

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
        question: question,
        chat_history: chat_history || [],
    });

    return NextResponse.json({ answer: result });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: 'An internal error occurred' }, { status: 500 });
  }
}
