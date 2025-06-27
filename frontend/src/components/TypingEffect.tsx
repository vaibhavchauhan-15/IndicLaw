import { useEffect, useRef, useState } from 'react';

interface TypingEffectProps {
  content: string;
  isStreaming?: boolean;
}

/**
 * Component to create a more natural typing effect for streaming text word by word
 */
export const TypingEffect = ({ content, isStreaming }: TypingEffectProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [displayedContent, setDisplayedContent] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const contentRef = useRef<string>('');
  const wordQueueRef = useRef<string[]>([]);
  const typeSpeedRef = useRef<number>(15); // Milliseconds between words, adjust for speed
  
  // Process new content as it comes in
  useEffect(() => {
    if (!isStreaming) {
      // If not streaming, show content immediately
      setDisplayedContent(content);
      return;
    }
    
    // Only add to the queue if there's new content
    if (content !== contentRef.current) {
      // Get just the new part of the content
      const newContent = content.slice(contentRef.current.length);
      contentRef.current = content;
      
      // Split new content into words and add to queue
      const words = newContent.split(/(\s+|[.,!?;:])/);
      words.forEach(word => {
        if (word) wordQueueRef.current.push(word);
      });
      
      // Start typing if not already in progress
      if (!isTyping) {
        setIsTyping(true);
        typeNextWord();
      }
    }
  }, [content, isStreaming]);
  
  // Function to type the next word from the queue
  const typeNextWord = () => {
    if (wordQueueRef.current.length > 0) {
      const nextWord = wordQueueRef.current.shift();
      setDisplayedContent(prev => prev + nextWord);
      
      // Schedule next word
      setTimeout(() => {
        requestAnimationFrame(typeNextWord);
      }, typeSpeedRef.current);
    } else {
      setIsTyping(false);
    }
  };
  
  // Smoothly scroll to the bottom of the content
  useEffect(() => {
    if (containerRef.current) {
      // Use requestAnimationFrame for smoother scrolling
      requestAnimationFrame(() => {
        containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      });
    }
  }, [displayedContent]);
  
  // Function to format message content with advanced Markdown-like syntax
  const formatMessageContent = (text: string) => {
    if (!text) return '';
    
    // Replace code blocks with syntax highlighting placeholders
    const formattedWithCodeBlocks = text.replace(
      /```(\w*)([\s\S]*?)```/g, 
      (match, language, code) => {
        const lang = language || 'text';
        return `<pre class="bg-gray-800 text-gray-100 p-3 rounded my-2 overflow-x-auto"><div class="code-header">${lang}</div><code class="language-${lang}">${code.trim()}</code></pre>`;
      }
    );
    
    // Replace inline code with styled spans
    const formattedWithInlineCode = formattedWithCodeBlocks.replace(
      /`([^`]+)`/g,
      '<code class="bg-gray-200 px-1 rounded text-red-600 font-mono">$1</code>'
    );
    
    // Handle bullet points and ordered lists
    let formattedWithLists = formattedWithInlineCode;
    
    // Find bullet point groups and wrap them in <ul> tags
    formattedWithLists = formattedWithLists.replace(
      /((?:^\s*[-*]\s.+\n?)+)/gm,
      '<ul class="list-disc pl-6 my-2">$1</ul>'
    );
    
    // Process individual bullet points
    formattedWithLists = formattedWithLists.replace(
      /^\s*[-*]\s(.+)$/gm,
      '<li class="mb-1">$1</li>'
    );
    
    // Handle numbered lists (find numbered list groups and wrap in <ol>)
    formattedWithLists = formattedWithLists.replace(
      /((?:^\s*\d+\.\s.+\n?)+)/gm,
      '<ol class="list-decimal pl-6 my-2">$1</ol>'
    );
    
    // Process individual numbered items
    formattedWithLists = formattedWithLists.replace(
      /^\s*(\d+)\.\s(.+)$/gm,
      '<li class="mb-1">$2</li>'
    );
    
    // Replace headers with properly sized and styled elements
    const formattedWithHeaders = formattedWithLists
      .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold my-3 border-b pb-1">$1</h1>')
      .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold my-2">$1</h2>')
      .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold my-2">$1</h3>')
      .replace(/^#### (.+)$/gm, '<h4 class="text-base font-semibold my-2">$1</h4>');
    
    // Handle text styling: bold, italic, underline, etc.
    let formattedWithStyles = formattedWithHeaders
      .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold">$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>')
      .replace(/___([^_]+)___/g, '<span class="underline italic font-bold">$1</span>')
      .replace(/__([^_]+)__/g, '<span class="underline font-bold">$1</span>')
      .replace(/_([^_]+)_/g, '<span class="underline">$1</span>')
      .replace(/~~([^~]+)~~/g, '<span class="line-through">$1</span>');

    // Handle blockquotes
    formattedWithStyles = formattedWithStyles.replace(
      /^>\s(.+)$/gm,
      '<blockquote class="border-l-4 border-gray-300 pl-4 py-1 my-2 italic text-gray-700">$1</blockquote>'
    );
    
    // Replace URLs with links - using a simpler regex to avoid negative lookbehind which isn't supported in all browsers
    const formattedWithLinks = formattedWithStyles.replace(
      /(https?:\/\/[^\s<]+)/g,
      (match) => {
        // Skip URLs that are already in an HTML tag
        if (match.startsWith('"') || match.endsWith('"')) {
          return match;
        }
        return `<a href="${match}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">${match}</a>`;
      }
    );
    
    // Handle tables
    let formattedWithTables = formattedWithLinks;
    // Regex to find markdown tables
    const tableRegex = /(\|[^\n]+\|\n)((?:\|[^\n]+\|\n)+)/g;
    
    formattedWithTables = formattedWithTables.replace(tableRegex, (match) => {
      // Convert markdown table to HTML table
      let htmlTable = '<div class="overflow-x-auto my-4"><table class="min-w-full border-collapse border border-gray-300">';
      
      const rows = match.trim().split('\n');
      let isFirstRow = true;
      
      for (const row of rows) {
        if (row.match(/^\|[-:\s|]+\|$/)) continue; // Skip separator row
        
        const cells = row
          .replace(/^\||\|$/g, '') // Remove starting/ending pipes
          .split('|')
          .map(cell => cell.trim());
        
        htmlTable += isFirstRow 
          ? '<thead><tr>' 
          : '<tr>';
          
        for (const cell of cells) {
          htmlTable += isFirstRow 
            ? `<th class="border border-gray-300 px-4 py-2 bg-gray-100">${cell}</th>` 
            : `<td class="border border-gray-300 px-4 py-2">${cell}</td>`;
        }
        
        htmlTable += isFirstRow ? '</tr></thead><tbody>' : '</tr>';
        isFirstRow = false;
      }
      
      return htmlTable + '</tbody></table></div>';
    });
    
    // Handle paragraph breaks
    return formattedWithTables
      .replace(/\n\n/g, '</p><p class="my-2">')
      .replace(/^(.+)(?!\<\/)$/gm, '<p class="my-2">$1</p>');
  };

  return (
    <div ref={containerRef} className="typing-effect">
      <div 
        className="whitespace-pre-wrap text-left" 
        dangerouslySetInnerHTML={{ __html: formatMessageContent(displayedContent) }}
      />
    </div>
  );
};
