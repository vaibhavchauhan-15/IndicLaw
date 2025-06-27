import { Sheet, SheetContent } from '@/components/ui/sheet';
import { SidebarContent } from './SidebarContent';
import { useEffect, useState } from 'react';

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onClearConversation: () => void;
}

export const ChatSidebar = ({ isOpen, onClose, onClearConversation }: ChatSidebarProps) => {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent 
        side="left" 
        className={`w-80 p-0 border-r border-slate-200 shadow-lg bg-white/95 backdrop-blur-sm
                   data-[state=open]:animate-slide-in-left data-[state=closed]:animate-slide-out-left
                   transition-transform duration-300 ease-in-out ${mounted ? 'transform-gpu' : ''}`}
      >
        <SidebarContent 
          onClose={onClose}
          onClearConversation={onClearConversation}
          showCloseButton={true}
        />
      </SheetContent>
    </Sheet>
  );
};
