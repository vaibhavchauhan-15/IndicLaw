import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot, User, FileText, Image as ImageIcon } from 'lucide-react';
import { TypingEffect } from './TypingEffect';

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

  return (
    <div className={`flex gap-4 mb-6 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <Avatar className="w-8 h-8 flex-shrink-0">
        <AvatarFallback className={`${isUser ? 'bg-blue-600 text-white' : 'bg-primary text-primary-foreground'}`}>
          {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
        </AvatarFallback>
      </Avatar>

      {/* Message Content */}
      <div className={`flex-1 max-w-3xl ${isUser ? 'text-right' : ''}`}>
        <div className={`
          inline-block p-4 rounded-lg w-auto
          ${isUser 
            ? 'bg-blue-600 text-white rounded-br-sm' 
            : 'bg-gray-100 text-gray-900 rounded-bl-sm'
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
                      ? 'bg-blue-500 border-blue-400' 
                      : 'bg-white border-gray-200'
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
        <p className={`text-xs text-gray-500 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
          {message.timestamp}
        </p>
      </div>
    </div>
  );
};
