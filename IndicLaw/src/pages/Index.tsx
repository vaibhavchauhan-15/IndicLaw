import { useState, useEffect, useRef } from 'react';
import { Menu, Bot, FileUp, ChevronDown, Info, Shield, MoreHorizontal, Globe, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChatSidebar } from '@/components/ChatSidebar';
import { SidebarContent } from '@/components/SidebarContent';
import { ChatMessage, Message } from '@/components/ChatMessage';
import { ChatInput } from '@/components/ChatInput';
import { TypingIndicator } from '@/components/TypingIndicator';
import { IndicLawLogo } from '@/components/IndicLawLogo';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { API_CONFIG } from '@/lib/config';
import { ApiStatusCheck } from '@/components/ApiStatusCheck';
import LanguageSelector from '@/components/LanguageSelector';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from 'react-i18next';

const API_BASE_URL = API_CONFIG.baseUrl;

const Index = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(() => {
    // Get saved sidebar state from localStorage or default to true
    const saved = localStorage.getItem('sidebarVisible');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { selectedLanguage } = useLanguage();
  const { t, i18n } = useTranslation();

  // Log language changes
  useEffect(() => {
    console.log(`Chat page current language: ${selectedLanguage} (${i18n.language})`);
  }, [selectedLanguage, i18n.language]);

  // Save sidebar visibility state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarVisible', JSON.stringify(sidebarVisible));
  }, [sidebarVisible]);

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
      
      // Use welcome message from translations
      const welcomeMessage = t('chatbot.welcome');
        
      setMessages([{
        id: '1',
        content: welcomeMessage,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }
  }, [selectedLanguage]);

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
            content: 'Hello! I\'m your INDICLAW AI assistant. How can I help you with legal questions today? Feel free to ask questions, upload documents or images, and I\'ll do my best to assist you.',
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
                if (data.error) {
                  const errorMessage = data.error;
                  let userFriendlyMessage = "Sorry, there was an error processing your request. Please try again with a shorter or different question.";
                  
                  // Handle authentication errors specifically
                  if (data.errorType === "auth" || errorMessage.includes("auth credentials") || errorMessage.includes("401")) {
                    userFriendlyMessage = "The AI service is currently unavailable due to authentication issues. Please contact the administrator to check the API key configuration.";
                    toast.error("API authentication error", { duration: 5000 });
                  } else {
                    toast.error(`Error: ${errorMessage.substring(0, 50)}...`, { duration: 3000 });
                  }
                  
                  setIsTyping(false);
                  
                  // Update the message to show the error
                  setMessages(prev => {
                    return prev.map(msg => {
                      if (msg.id === aiMessageId) {
                        return {
                          ...msg,
                          content: userFriendlyMessage,
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
        
        // Reset messages with welcome message based on selected language
        const welcomeMessage = t('chatbot.welcome');
          
        setMessages([{
          id: '1',
          content: welcomeMessage,
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

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setSidebarVisible(prev => !prev);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar for desktop */}
      <div 
        className={`w-72 border-r border-slate-200 ${sidebarVisible ? 'lg:block' : 'lg:hidden'} hidden bg-white shadow-md
                   transition-all duration-300 ease-in-out transform ${sidebarVisible ? 'lg:translate-x-0' : 'lg:-translate-x-full'}`}
      >
        <SidebarContent 
          onClearConversation={handleClearConversation}
        />
      </div>

      {/* Mobile sidebar */}
      <ChatSidebar 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)} 
        onClearConversation={handleClearConversation}
      />

      {/* Main chat area */}
      <div className="flex flex-col w-full transition-all duration-300 ease-in-out">          {/* Main Chat Area */}
        {/* Floating sidebar toggle button - appears when sidebar is hidden */}
        <div 
          className={`fixed left-0 top-1/2 transform -translate-y-1/2 z-30 transition-all duration-500 ease-in-out 
                    ${sidebarVisible ? 'opacity-0 pointer-events-none translate-x-[-100%]' : 'opacity-100 translate-x-0'} 
                    lg:block hidden`}
        >
          <Button 
            variant="outline" 
            size="icon" 
            className="h-14 w-14 rounded-r-full rounded-l-none border-l-0 bg-white shadow-lg 
                      hover:bg-blue-50 hover:text-blue-600 transition-all duration-300
                      hover:shadow-xl border-slate-200 sidebar-toggle-pulse"
            onClick={toggleSidebar}
            aria-label="Show sidebar"
          >
            <ChevronRight className="h-6 w-6 transition-transform duration-300 hover:scale-125" />
          </Button>
        </div>
        
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Unified Chat Header - responsive for both mobile and desktop */}
          <header className="p-4 border-b bg-white z-10 shadow-md">
            <div className="max-w-5xl mx-auto w-full flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Mobile menu button - hidden on large screens */}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="lg:hidden text-slate-800 hover:bg-blue-50 hover:text-blue-600 
                          transition-all duration-300 rounded-full" 
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="h-5 w-5 transition-transform duration-300 ease-in-out" />
                </Button>
                
                {/* Sidebar toggle slider button - visible on all screens */}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-slate-800 hover:bg-blue-50 hover:text-blue-600 
                           transition-all duration-300 hidden lg:flex rounded-full"
                  onClick={toggleSidebar}
                  aria-label="Toggle sidebar"
                  title={sidebarVisible ? "Hide sidebar" : "Show sidebar"}
                >
                  {sidebarVisible ? (
                    <ChevronLeft className="h-5 w-5 transform transition-transform duration-300 ease-in-out" />
                  ) : (
                    <ChevronRight className="h-5 w-5 transform transition-transform duration-300 ease-in-out" />
                  )}
                </Button>
                
                {/* Text logo with scales emoji in black background */}
                <span className="font-bold text-lg text-slate-800 flex items-center gap-2">
                  <span className="bg-black text-amber-500 p-1 rounded-md flex items-center justify-center">⚖️</span> INDICLAW AI
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Clear conversation button - visible only on mobile */}
                <Button size="icon" variant="ghost" className="lg:hidden text-slate-800 hover:bg-slate-100" onClick={handleClearConversation}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 12h18"></path>
                    <path d="M12 3v18"></path>
                  </svg>
                </Button>
                
                {/* Language Selector */}
                <div className="flex items-center gap-2 border border-slate-200 rounded-md px-2 py-1 bg-slate-50">
                  <Globe className="w-4 h-4 text-slate-600" />
                  <LanguageSelector className="!p-0" />
                </div>
                
                {/* API Status Check Component */}
                <ApiStatusCheck />
              </div>
            </div>
          </header>

          {/* Chat messages */}
          <ScrollArea className="flex-1 p-4 pb-20" ref={scrollAreaRef}>
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center p-8">
                <div className="text-center max-w-md">
                  <h2 className="text-2xl font-bold mb-2 text-slate-900">
                    {t('chatbot.title')}
                  </h2>
                  <p className="text-slate-700 mb-4 font-medium">
                    {t('chatbot.emptyState')}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6 text-sm">
                    <div className="bg-white p-3 rounded-lg border shadow-sm">
                      <h3 className="font-semibold mb-1 text-slate-800">
                        {t('chatbot.sidebar.title')}
                      </h3>
                      <p className="text-slate-600 text-xs">
                        {t('features.multilingualChatbot.description')}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border shadow-sm">
                      <h3 className="font-semibold mb-1 text-slate-800">
                        {t('chatbot.sidebar.uploadTitle')}
                      </h3>
                      <p className="text-slate-600 text-xs">
                        {t('features.documentAnalysis.description')}
                      </p>
                    </div>
                  </div>
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
          <div className="border-t bg-slate-50 p-4 relative z-10 shadow-md">
            <div className="max-w-3xl mx-auto">
              <ChatInput 
                onSendMessage={handleSendMessage} 
                isLoading={isTyping}
                placeholder="chatbot.placeholder"
              />
              <div className="mt-2 text-xs text-center text-slate-700">
                <span className="inline-flex items-center font-medium">
                  {selectedLanguage === 'Hindi' ? 'द्वारा संचालित' : 
                   selectedLanguage === 'Marathi' ? 'द्वारे संचालित' :
                   'Powered by'} <strong className="ml-1">INDICLAW AI</strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
