import { MessageSquare, Plus, Trash2, User, LogOut, Settings, Bot, Info, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { IndicLawLogo } from './IndicLawLogo';
import { useTranslation } from 'react-i18next';

interface SidebarContentProps {
  onClose?: () => void;
  onClearConversation: () => void;
  showCloseButton?: boolean;
}

export const SidebarContent = ({ 
  onClose, 
  onClearConversation,
  showCloseButton = false 
}: SidebarContentProps) => {
  const { currentUser, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
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
    <div className="flex flex-col h-full">
      {/* Header with Logo */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <IndicLawLogo size="medium" className="text-blue-600" />
          {showCloseButton && onClose && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose} 
              className="text-slate-600 hover:bg-blue-100 hover:text-blue-700 rounded-full transition-all duration-200 ease-in-out"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </Button>
          )}
        </div>
      </div>

      {/* New Chat Button */}
      <div className="p-4">
        <Button 
          variant="default" 
          className="w-full flex items-center gap-2 mb-4 bg-gradient-to-r from-blue-500 to-indigo-600 
                     hover:from-blue-600 hover:to-indigo-700 text-white shadow-md 
                     transition-all duration-300 ease-in-out transform hover:scale-[1.02] hover:shadow-lg"
          onClick={() => {
            onClearConversation();
            if (onClose) onClose();
          }}
        >
          <Plus size={16} className="transition-transform duration-300 group-hover:rotate-90" />
          {t("chatbot.startNewChat")}
        </Button>
      </div>

      {/* Chat History */}
      <ScrollArea className="flex-1 px-4 py-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1 py-1.5 text-xs uppercase font-medium text-slate-600 tracking-wider">
            <span>{t("chatbot.recentConversations")}</span>
            <History size={14} className="text-slate-500" />
          </div>
          
          {/* Placeholder for empty chat history */}
          <div className="text-center mt-6 bg-slate-50 p-6 rounded-lg border border-slate-100">
            <Bot size={40} className="mx-auto mb-3 text-blue-500/70" />
            <p className="text-sm text-slate-700 font-medium">{t("chatbot.conversationsWillAppear")}</p>
            <p className="text-xs mt-1 text-slate-500">{t("chatbot.startChattingHint")}</p>
          </div>
          
          {/* Tips section */}
          <div className="mt-6 rounded-lg bg-blue-50 p-4 border border-blue-100 shadow-sm">
            <p className="text-sm text-slate-700 font-medium mb-2">{t("chatbot.helpfulTips")}</p>
            <ul className="text-xs space-y-2 list-disc pl-4 text-slate-600">
              <li>{t("chatbot.tips.specificQuestions")}</li>
              <li>{t("chatbot.tips.uploadDocuments")}</li>
              <li>{t("chatbot.tips.tryDifferentPhrasings")}</li>
            </ul>
          </div>
        </div>
      </ScrollArea>

      <Separator className="my-1" />

      {/* Footer with utilities */}
      <div className="p-4 space-y-4">
        {/* Action buttons */}
        <Button 
          variant="outline" 
          className="w-full flex items-center gap-2 text-slate-700 hover:text-red-600 hover:bg-red-50 border-slate-200
                   transition-all duration-200" 
          onClick={onClearConversation}
        >
          <Trash2 size={16} />
          {t("chatbot.clearConversation")}
        </Button>
        
        {/* Settings and Info buttons */}
        <TooltipProvider>
          <div className="flex items-center justify-between mb-2 px-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-colors duration-200">
                  <Settings size={18} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("chatbot.settings")}</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-colors duration-200">
                  <Info size={18} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("chatbot.aboutIndiclaw")}</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
        
        <Separator className="bg-slate-100" />
        
        {/* User profile */}
        <div className="flex items-center gap-3 mt-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
          <Avatar className="border-2 border-blue-100 ring-2 ring-white">
            <AvatarImage src={userProfile?.photoURL || undefined} />
            <AvatarFallback className="bg-blue-500 text-white">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col flex-1 overflow-hidden">
            <p className="font-medium truncate text-slate-800">
              {userProfile?.name || currentUser?.displayName || 'User'}
            </p>
            <p className="text-xs text-slate-500 truncate">
              {currentUser?.email || ''}
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleLogout} 
            className="hover:bg-red-50 hover:text-red-600 rounded-full transition-colors duration-200"
          >
            <LogOut size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
};
