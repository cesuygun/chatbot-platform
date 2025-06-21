import { createClient } from '@supabase/supabase-js';
import { OpenAIEmbeddings } from "@langchain/openai";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import fs from 'fs/promises';

export async function processPdfDocument(file: File, chatbotId: string) {
  try {
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    const buffer = Buffer.from(await file.arrayBuffer());
    const tempFilePath = `/tmp/${Date.now()}-${file.name}`;
    await fs.writeFile(tempFilePath, buffer);

    const loader = new PDFLoader(tempFilePath);
    const docs = await loader.load();

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const chunks = await textSplitter.splitDocuments(docs);

    const { data, error } = await supabaseClient
      .from('knowledge_sources')
      .insert({
        chatbot_id: chatbotId,
        source_type: 'pdf',
        source_name: file.name,
        metadata: {
          pages: docs.length,
          size: file.size,
        },
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to store document: ${error.message}`);
    }

    await SupabaseVectorStore.fromDocuments(
      chunks,
      embeddings,
      {
        client: supabaseClient,
        tableName: 'knowledge_embeddings',
        queryName: 'match_documents',
        filter: {
            chatbot_id: chatbotId,
            source_id: data.id,
        }
      }
    );

    await fs.unlink(tempFilePath);

    return {
      success: true,
      sourceId: data.id,
    };
  } catch (error) {
    console.error('Error processing PDF:', error);
    return {
      success: false,
      error: 'Failed to process PDF document',
    };
  }
} 