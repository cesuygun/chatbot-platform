import ChatbotEditorClient from './ChatbotEditorClient';

export default async function ChatbotEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ChatbotEditorClient chatbotId={id} />;
}
