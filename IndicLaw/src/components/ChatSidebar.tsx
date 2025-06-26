import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageSquare, Plus, Trash2, X, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onClearConversation: () => void;
}

export const ChatSidebar = ({ isOpen, onClose, onClearConversation }: ChatSidebarProps) => {
  const { currentUser, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };
  
  // Get initials for avatar fallback
  const getInitials = () => {
    const name = userProfile?.name || currentUser?.displayName || '';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="left" className="w-80 p-0">
        <div className="flex flex-col h-full">
          <div className="bg-primary p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-primary-foreground flex items-center gap-2">
                <MessageSquare size={20} />
                AI Chatbot
              </h2>
              <Button variant="ghost" size="icon" onClick={onClose} className="text-primary-foreground">
                <X size={18} />
              </Button>
            </div>
            <Button 
              className="w-full flex items-center gap-2 bg-primary-foreground text-primary" 
              onClick={onClearConversation}
            >
              <Trash2 size={16} />
              Clear Conversation
            </Button>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Start a new conversation by typing a message below.
              </div>
              
              <div className="text-sm">
                <h3 className="font-medium mb-2">About this chatbot</h3>
                <p className="text-muted-foreground">
                  This AI assistant can help you with various tasks, answer questions, 
                  and process uploaded documents and images for analysis using advanced language models.
                </p>
              </div>
              
              <div className="text-sm">
                <h3 className="font-medium mb-2">Features</h3>
                <ul className="text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Ask questions on any topic</li>
                  <li>Upload and analyze PDFs, Word documents</li>
                  <li>Process images with OCR</li>
                  <li>Persistent conversation memory</li>
                  <li>Multiple AI model support</li>
                </ul>
              </div>
              
              <Separator />
              
              <div className="text-sm">
                <h3 className="font-medium mb-2">Account</h3>
                <div className="space-y-2">
                  <Link to="/profile">
                    <Button variant="ghost" className="w-full justify-start gap-2">
                      <User size={16} />
                      Manage Profile
                    </Button>
                  </Link>
                  
                  <Button variant="ghost" className="w-full justify-start gap-2 text-destructive" onClick={handleLogout}>
                    <LogOut size={16} />
                    Sign Out
                  </Button>
                </div>
              </div>
            </div>
          </ScrollArea>
          
          <div className="p-4 border-t">
            {currentUser && (
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={currentUser.photoURL || undefined} />
                  <AvatarFallback>{getInitials()}</AvatarFallback>
                </Avatar>
                <div className="text-sm truncate">
                  <div className="font-medium">{userProfile?.name || currentUser.displayName}</div>
                  <div className="text-xs text-muted-foreground truncate">{currentUser.email}</div>
                </div>
              </div>
            )}
            
            <div className="text-xs text-muted-foreground">
              Powered by OpenAI Models via OpenRouter
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
