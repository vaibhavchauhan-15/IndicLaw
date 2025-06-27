import { useState, useRef } from 'react';
import { Send, Paperclip, Image as ImageIcon, FileText, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from 'react-i18next';

interface Attachment {
  file: File;
  type: 'image' | 'document';
  preview?: string;
}

interface ChatInputProps {
  onSendMessage: (content: string, attachments: Attachment[]) => void;
  isLoading?: boolean;
  placeholder?: string;
}

export const ChatInput = ({ onSendMessage, isLoading, placeholder = "chatbot.placeholder" }: ChatInputProps) => {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  const handleSend = () => {
    if (message.trim() || attachments.length > 0) {
      onSendMessage(message.trim(), attachments);
      setMessage('');
      setAttachments([]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'document') => {
    const files = Array.from(e.target.files || []);
    
    files.forEach(file => {
      const attachment: Attachment = {
        file,
        type
      };

      if (type === 'image' && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          attachment.preview = e.target?.result as string;
          setAttachments(prev => [...prev, attachment]);
        };
        reader.readAsDataURL(file);
      } else {
        setAttachments(prev => [...prev, attachment]);
      }
    });

    // Reset input
    e.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="rounded-xl border border-slate-300 bg-slate-50 shadow-md">
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="p-3 pb-0 flex flex-wrap gap-2 border-b">
          {attachments.map((attachment, index) => (
            <div
              key={index}
              className="relative flex items-center gap-2 bg-gray-50 rounded-lg p-2 pr-8 border border-gray-100"
            >
              {attachment.type === 'image' ? (
                attachment.preview ? (
                  <img
                    src={attachment.preview}
                    alt="Preview"
                    className="w-8 h-8 object-cover rounded"
                  />
                ) : (
                  <ImageIcon className="w-4 h-4 text-gray-500" />
                )
              ) : (
                <FileText className="w-4 h-4 text-gray-500" />
              )}
              <span className="text-sm font-medium text-gray-700 truncate max-w-32">
                {attachment.file.name}
              </span>
              <button
                onClick={() => removeAttachment(index)}
                className="absolute top-1 right-1 p-1 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end p-2">
        {/* File Upload Buttons */}
        <div className="flex space-x-1 mr-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full text-gray-500 hover:text-slate-700 hover:bg-slate-200"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="h-5 w-5" />
            <span className="sr-only">{t('attach_document')}</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full text-gray-500 hover:text-slate-700 hover:bg-slate-200"
            onClick={() => imageInputRef.current?.click()}
          >
            <ImageIcon className="h-5 w-5" />
            <span className="sr-only">{t('attach_image')}</span>
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={(e) => handleFileUpload(e, 'document')}
            accept=".pdf,.doc,.docx,.txt"
          />
          <input
            type="file"
            ref={imageInputRef}
            className="hidden"
            onChange={(e) => handleFileUpload(e, 'image')}
            accept="image/*"
          />
        </div>

        {/* Text Input */}
        <div className="flex-1 relative">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={t(placeholder)}
            className="min-h-12 resize-none px-4 py-3 rounded-lg border-0 bg-white focus-visible:ring-1 focus-visible:ring-slate-400"
            disabled={isLoading}
            rows={1}
            style={{
              height: 'auto',
              minHeight: '48px',
              maxHeight: '200px',
            }}
          />
          <div className="absolute right-2 bottom-2 flex items-center gap-2">
            {isLoading && <Sparkles className="h-4 w-4 text-slate-600 animate-pulse" />}
          </div>
        </div>

        {/* Send Button */}
        <Button
          type="button"
          onClick={handleSend}
          disabled={isLoading || (!message.trim() && attachments.length === 0)}
          className={`ml-2 h-10 w-10 rounded-full p-0 transition-all ${
            message.trim() || attachments.length > 0
              ? 'bg-slate-700 hover:bg-slate-800'
              : 'bg-gray-200 text-gray-500'
          }`}
          aria-label={t("chatbot.send")}
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};
