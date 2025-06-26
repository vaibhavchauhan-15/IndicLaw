
import { useState, useRef } from 'react';
import { Send, Paperclip, Image as ImageIcon, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface Attachment {
  file: File;
  type: 'image' | 'document';
  preview?: string;
}

interface ChatInputProps {
  onSendMessage: (content: string, attachments: Attachment[]) => void;
  isLoading?: boolean;
}

export const ChatInput = ({ onSendMessage, isLoading }: ChatInputProps) => {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

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
    <div className="border-t border-gray-200 bg-white p-4">
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {attachments.map((attachment, index) => (
            <div
              key={index}
              className="relative flex items-center gap-2 bg-gray-100 rounded-lg p-2 pr-8"
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
      <div className="flex gap-2">
        {/* Attachment Buttons */}
        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => imageInputRef.current?.click()}
            className="p-2 text-gray-500 hover:text-gray-700"
            title="Upload Image"
          >
            <ImageIcon className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-500 hover:text-gray-700"
            title="Upload Document"
          >
            <Paperclip className="w-4 h-4" />
          </Button>
        </div>

        {/* Text Input */}
        <div className="flex-1 relative">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type your message here..."
            className="min-h-[44px] max-h-32 resize-none pr-12 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading}
            autoResize={true}
          />
          <Button
            onClick={handleSend}
            disabled={(!message.trim() && attachments.length === 0) || isLoading}
            className="absolute right-2 top-2 p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            size="sm"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        {/* Hidden File Inputs */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFileUpload(e, 'image')}
          className="hidden"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt,.rtf"
          multiple
          onChange={(e) => handleFileUpload(e, 'document')}
          className="hidden"
        />
      </div>

      {/* Helper Text */}
      <div className="mt-2 text-xs text-gray-500 text-center">
        Press Enter to send, Shift+Enter for new line
      </div>
    </div>
  );
};
