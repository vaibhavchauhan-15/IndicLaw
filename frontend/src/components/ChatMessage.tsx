import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot, User, FileText, Image as ImageIcon } from 'lucide-react';
import { TypingEffect } from './TypingEffect';
import { IndicLawLogo } from './IndicLawLogo';
import { useTranslation } from 'react-i18next';

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  isStreaming?: boolean;
  attachments?: Array<{
    type: 'image' | 'document';
    name: string;
    url: string;
    size?: string;
  }>;
}

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage = ({ message }: ChatMessageProps) => {
  const isUser = message.sender === 'user';
  const { t } = useTranslation();

  return (
    <div className={`flex gap-4 mb-6 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <Avatar className={`w-8 h-8 flex-shrink-0 ${isUser ? '' : 'ring-2 ring-accent/30'}`}>
        {isUser ? (
          <AvatarFallback className="bg-slate-700 text-white">
            <User className="w-4 h-4" />
          </AvatarFallback>
        ) : (
          <AvatarFallback className="bg-slate-600 text-white flex items-center justify-center">
            <Bot className="w-4 h-4" />
          </AvatarFallback>
        )}
      </Avatar>

      {/* Message Content */}
      <div className={`flex-1 max-w-3xl ${isUser ? 'text-right' : ''}`}>
        {/* Message sender label - only for assistant */}
        {!isUser && (
          <div className="flex items-center gap-1.5 mb-1 text-sm font-semibold text-slate-800">
            <span>{t('chatbot_name')}</span>
          </div>
        )}          <div className={`
          inline-block p-4 rounded-xl w-auto shadow-sm
          ${isUser 
            ? 'bg-gradient-to-br from-slate-700 to-slate-800 text-white rounded-br-sm' 
            : 'bg-white border border-gray-200 text-slate-900 rounded-bl-sm'
          }
          ${!isUser ? 'formatted-response' : ''}
        `}>
          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mb-3 space-y-2">
              {message.attachments.map((attachment, index) => (
                <div
                  key={index}
                  className={`
                    flex items-center gap-2 p-2 rounded border
                    ${isUser 
                      ? 'bg-slate-600 border-slate-500 text-white' 
                      : 'bg-gray-50 border-gray-200 text-gray-800'
                    }
                  `}
                >
                  {attachment.type === 'image' ? (
                    <ImageIcon className="w-4 h-4" />
                  ) : (
                    <FileText className="w-4 h-4" />
                  )}
                  <span className="text-sm font-medium">{attachment.name}</span>
                  {attachment.size && (
                    <span className="text-xs opacity-75">({attachment.size})</span>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {/* Use the TypingEffect component for message content with enhanced styling */}
          <div className={`message-content ${!isUser ? 'ai-message-content' : ''}`}>
            <TypingEffect 
              content={message.content} 
              isStreaming={message.isStreaming}
            />
          </div>
        </div>
        
        {/* Timestamp */}
        <p className={`text-xs text-slate-600 font-medium mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
          {message.timestamp}
        </p>
      </div>
    </div>
  );
};
