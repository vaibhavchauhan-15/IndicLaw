/**
 * Utilities for formatting AI responses with proper structure and styling
 */
import { marked } from 'marked';

/**
 * Convert markdown to HTML if needed
 * @param {string} text The markdown text to convert
 * @returns {string} HTML formatted text
 */
const markdownToHtml = (text) => {
  if (!text) return '';
  
  try {
    // Configure marked options for security and formatting preferences
    marked.setOptions({
      renderer: new marked.Renderer(),
      highlight: function(code, lang) {
        return code;
      },
      pedantic: false,
      gfm: true,
      breaks: true,
      sanitize: false,
      smartypants: false,
      xhtml: false
    });

    // Convert the markdown to HTML
    const html = marked.parse(text);
    return html;
  } catch (error) {
    console.error("Error converting markdown to HTML:", error);
    return text; // Return original text if conversion fails
  }
};

/**
 * Format AI response with structured sections if needed
 * @param {string} response The original AI response
 * @returns {string} Properly formatted response
 */
const formatStructuredResponse = (response) => {
  // If response already has formatting, return as-is
  if (response.includes('#') || response.includes('*') || response.includes('```')) {
    return response;
  }

  // Check if this looks like a legal response that should be structured
  const isLegalResponse = /\b(section|article|law|court|judgment|legal|statute|act)\b/i.test(response);
  
  if (isLegalResponse && response.length > 200) {
    const lines = response.split('\n');
    let formattedResponse = '';
    
    // Attempt to identify potential title in first line
    if (lines.length > 0) {
      formattedResponse += `# ${lines[0]}\n\n`;
      lines.shift();
    }
    
    // Process remaining content
    let paragraphs = lines.join('\n').split('\n\n');
    
    // Format paragraphs
    paragraphs = paragraphs.map((paragraph, index) => {
      paragraph = paragraph.trim();
      
      // Check for potential section headers
      if (/^[A-Z][^.!?]*[:—-]/.test(paragraph) || 
          /^(Section|Article|Chapter|Part) [0-9IVX]+/i.test(paragraph)) {
        return `## ${paragraph}`;
      } 
      
      // Format case citations or references
      if (/v\.|\bvs\.\b|\bversus\b|\([0-9]{4}\)|\b[0-9]+ [A-Za-z]+ [0-9]+\b/.test(paragraph)) {
        return `*${paragraph}*`;
      }
      
      // Make key points stand out
      if (/\b(note|important|key|conclusion|summary)\b/i.test(paragraph)) {
        return `**${paragraph}**`;
      }
      
      return paragraph;
    });
    
    formattedResponse += paragraphs.join('\n\n');
    return formattedResponse;
  }
  
  return response;
};

/**
 * Process an AI response to enhance formatting and structure
 * @param {string} aiResponse The original AI response
 * @returns {string} Enhanced response with proper formatting
 */
export const enhanceResponse = (aiResponse) => {
  // First apply any structured formatting
  const formattedResponse = formatStructuredResponse(aiResponse);
  
  // Most basic formatting is already handled by the frontend renderer
  return formattedResponse;
};

/**
 * Specify formatting instructions to be included in system message to AI
 * @returns {string} Formatting instructions
 */
export const getFormattingInstructions = () => {
  return `Format your responses using proper Markdown syntax for better readability:
- Use **bold** for important text
- Use *italic* for emphasis
- Use headings: # Main Title, ## Section, ### Subsection
- Use bullet points for lists:
  * Item 1
  * Item 2
- Use numbered lists when order matters:
  1. First step
  2. Second step
- Use \`inline code\` for technical terms
- Use code blocks with language for code examples:
\`\`\`javascript
function example() {
  console.log("Hello world");
}
\`\`\`
- Use > for blockquotes
- Use tables with | for structured data:
| Column 1 | Column 2 |
|----------|----------|
| Data 1   | Data 2   |

When explaining documents, legal concepts, or complex information, use proper document structure with clear headings, sections, and emphasis on key points.`;
};

export default {
  enhanceResponse,
  markdownToHtml,
  getFormattingInstructions
};
