import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ChatInterface } from './ChatInterface';
import { MessageSquareIcon, XIcon } from 'lucide-react';

interface ChatbotWidgetProps {
  botId: string;
  className?: string;
}

export const ChatbotWidget = ({ botId, className }: ChatbotWidgetProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)} className={className} size="icon" variant="default">
        <MessageSquareIcon className="h-5 w-5" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px] h-[600px] p-0">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Chat with us</h2>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                <XIcon className="h-4 w-4" />
              </Button>
            </div>
            <ChatInterface botId={botId} className="flex-1" />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
