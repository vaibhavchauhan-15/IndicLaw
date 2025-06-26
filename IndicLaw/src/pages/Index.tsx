import { useState, useEffect, useRef } from 'react';
import { Menu, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatSidebar } from '@/components/ChatSidebar';
import { ChatMessage, Message } from '@/components/ChatMessage';
import { ChatInput } from '@/components/ChatInput';
import { TypingIndicator } from '@/components/TypingIndicator';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { API_CONFIG } from '@/lib/config';

const API_BASE_URL = API_CONFIG.baseUrl;

const Index = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Load session ID and chat history on component mount
  useEffect(() => {
    const savedSessionId = localStorage.getItem('chatSessionId');
    if (savedSessionId) {
      setSessionId(savedSessionId);
      loadChatHistory(savedSessionId);
    } else {
      // Create a new session
      const newSessionId = uuidv4();
      setSessionId(newSessionId);
      localStorage.setItem('chatSessionId', newSessionId);
      
      // Add welcome message
      setMessages([{
        id: '1',
        content: 'Hello! I\'m your AI assistant. How can I help you today? Feel free to ask questions, upload documents or images, and I\'ll do my best to assist you.',
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Load chat history from the server
  const loadChatHistory = async (sid: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/history/${sid}`);
      if (response.ok) {
        const data = await response.json();
        if (data.history && data.history.length > 0) {
          // Format messages for our UI
          const formattedMessages = data.history.map((msg: any) => ({
            id: msg.id || uuidv4(),
            content: msg.content,
            sender: msg.role,
            timestamp: new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }));
          setMessages(formattedMessages);
        } else {
          // Add welcome message if history is empty
          setMessages([{
            id: '1',
            content: 'Hello! I\'m your AI assistant. How can I help you today? Feel free to ask questions, upload documents or images, and I\'ll do my best to assist you.',
            sender: 'assistant',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }]);
        }
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      toast.error('Failed to load chat history');
    }
  };

  // Handle sending a message to the AI with streaming response
  const handleSendMessage = async (content: string, attachments: any[]) => {
    if (!content.trim() && attachments.length === 0) return;
    
    // Add user message immediately for UI feedback
    const userMessageId = uuidv4();
    const userMessage: Message = {
      id: userMessageId,
      content,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachments: attachments.map(att => ({
        type: att.type,
        name: att.file.name,
        url: att.preview || '#',
        size: (att.file.size / 1024).toFixed(1) + ' KB'
      }))
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);
    
    // Create AI message placeholder for streaming
    const aiMessageId = uuidv4();
    const aiMessage: Message = {
      id: aiMessageId,
      content: '',
      sender: 'assistant',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isStreaming: true
    };
    
    setMessages(prev => [...prev, aiMessage]);
    
    // Prepare form data for file upload
    const formData = new FormData();
    formData.append('message', content);
    formData.append('sessionId', sessionId);
    
    if (attachments.length > 0) {
      formData.append('file', attachments[0].file);
    }
    
    try {
      // Use a URLSearchParams object to properly encode the sessionId parameter
      const url = new URL(`${API_BASE_URL}/chat/stream`);
      url.searchParams.append('sessionId', sessionId);
      
      // Make a POST request with the formData
      const fetchOptions = {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'text/event-stream',
        }
      };
      
      // Use the fetch API directly for streaming
      const response = await fetch(url, fetchOptions);
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      // Get the reader from the response body
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) {
        throw new Error('Failed to get response reader');
      }
      
      // Process the stream chunks
      let buffer = '';
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            break;
          }
          
          // Decode the chunk and add to buffer
          buffer += decoder.decode(value, { stream: true });
          
          // Process complete SSE messages
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.substring(6));
                
                // If we received content, update the AI message
                if (data.content) {
                  setMessages(prev => {
                    return prev.map(msg => {
                      if (msg.id === aiMessageId) {
                        // Append each new chunk of content immediately
                        return {
                          ...msg,
                          content: msg.content + data.content,
                          isStreaming: true
                        };
                      }
                      return msg;
                    });
                  });
                  
                  // Use requestAnimationFrame for smoother scrolling
                  requestAnimationFrame(() => {
                    if (scrollAreaRef.current) {
                      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
                    }
                  });
                }
                
                // If streaming is done, clean up
                if (data.done) {
                  setIsTyping(false);
                  
                  // Update the message to indicate it's no longer streaming
                  setMessages(prev => {
                    return prev.map(msg => {
                      if (msg.id === aiMessageId) {
                        return {
                          ...msg,
                          isStreaming: false
                        };
                      }
                      return msg;
                    });
                  });
                  break;
                }
                
                // If there was an error but we got some response content
                if (data.error && !data.content) {
                  toast.error(`Error: ${data.error}`);
                  setIsTyping(false);
                  
                  // Update the message to show the error
                  setMessages(prev => {
                    return prev.map(msg => {
                      if (msg.id === aiMessageId) {
                        return {
                          ...msg,
                          content: "Sorry, there was an error processing your request. Please try again with a shorter or different question.",
                          isStreaming: false
                        };
                      }
                      return msg;
                    });
                  });
                  break;
                }
              } catch (e) {
                console.error('Error parsing SSE message:', e);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error in stream processing:', error);
      }
      
      // Error handling for stream
      if (!response.ok || !response.body) {
        toast.error('Connection to server failed');
        setIsTyping(false);
        
        // Fallback to regular API if streaming fails
        fallbackToRegularApi(content, attachments, aiMessageId, formData);
      }
      
      // Upload the form data separately for file handling
      if (attachments.length > 0) {
        const uploadResponse = await fetch(`${API_BASE_URL}/chat`, {
          method: 'POST',
          body: formData,
        });
        
        if (!uploadResponse.ok) {
          throw new Error(`Error uploading file: ${uploadResponse.status}`);
        }
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
      setIsTyping(false);
      
      // Try the regular endpoint as fallback
      fallbackToRegularApi(content, attachments, aiMessageId, formData);
    }
  };
  
  // Fallback to regular API if streaming fails
  const fallbackToRegularApi = async (content: string, attachments: any[], aiMessageId: string, formData: FormData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Update the existing AI message with the response
      setMessages(prev => {
        return prev.map(msg => {
          if (msg.id === aiMessageId) {
            return {
              ...msg,
              content: data.reply,
              isStreaming: false
            };
          }
          return msg;
        });
      });
    } catch (error) {
      console.error('Error in fallback API call:', error);
      toast.error('Failed to get a response. Please try again.');
      
      // Remove the empty AI message
      setMessages(prev => prev.filter(msg => msg.id !== aiMessageId));
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearConversation = async () => {
    try {
      if (sessionId) {
        // Call the API to clear the history
        const response = await fetch(`${API_BASE_URL}/history/${sessionId}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        // Create a new session
        const newSessionId = uuidv4();
        localStorage.setItem('chatSessionId', newSessionId);
        setSessionId(newSessionId);
        
        // Reset messages with welcome message
        setMessages([{
          id: '1',
          content: 'Hello! I\'m your AI assistant. How can I help you today? Feel free to ask questions, upload documents or images, and I\'ll do my best to assist you.',
          sender: 'assistant',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
        
        toast.success('Conversation cleared successfully');
      }
    } catch (error) {
      console.error('Error clearing conversation:', error);
      toast.error('Failed to clear conversation');
    }
  };

  return (
    <div className="flex h-screen bg-zinc-50">
      {/* Sidebar for desktop */}
      <div className="w-64 border-r hidden lg:block bg-white shadow-sm">
        <div className="flex flex-col h-full">
          <div className="bg-primary p-4">
            <h2 className="text-xl font-bold text-primary-foreground flex items-center gap-2">
              <Bot className="w-5 h-5" />
              AI Chatbot
            </h2>
            <Button 
              variant="outline"
              className="w-full mt-4 flex items-center justify-center gap-1 bg-white text-primary hover:bg-gray-100" 
              onClick={handleClearConversation}
            >
              New Chat
            </Button>
          </div>
          
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              <div className="text-sm">
                <h3 className="font-medium mb-2">About this chatbot</h3>
                <p className="text-muted-foreground">
                  This AI assistant can help you with various tasks, answer questions, 
                  and process uploaded documents and images for analysis.
                </p>
              </div>
              
              <div className="text-sm">
                <h3 className="font-medium mb-2">Features</h3>
                <ul className="text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Ask questions on any topic</li>
                  <li>Upload and analyze PDFs, documents</li>
                  <li>Process images with OCR</li>
                  <li>Persistent conversation memory</li>
                </ul>
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Mobile sidebar */}
      <ChatSidebar 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)} 
        onClearConversation={handleClearConversation}
      />

      {/* Main chat area */}
      <div className="flex flex-col w-full">
        {/* Mobile header */}
        <div className="flex items-center justify-between p-4 border-b lg:hidden bg-white">
          <Button size="icon" variant="ghost" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold text-lg flex items-center gap-2">
            <Bot className="w-5 h-5" />
            AI Chatbot
          </h1>
          <Button size="icon" variant="ghost" onClick={handleClearConversation}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12h18"></path>
              <path d="M12 3v18"></path>
            </svg>
          </Button>
        </div>

        {/* Chat messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center p-8">
              <div className="text-center max-w-md">
                <h2 className="text-2xl font-bold mb-2">Welcome to AI Chatbot</h2>
                <p className="text-muted-foreground mb-4">
                  Ask me anything or upload documents for analysis. I'm here to help with your legal questions.
                </p>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6 pb-20">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
            </div>
          )}
        </ScrollArea>
        
        {/* Input area - fixed at the bottom */}
        <div className="border-t bg-white p-4 relative z-10">
          <div className="max-w-3xl mx-auto">
            <ChatInput 
              onSendMessage={handleSendMessage} 
              isLoading={isTyping} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
