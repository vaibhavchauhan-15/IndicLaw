import * as React from "react"
import { useEffect } from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  autoResize?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, autoResize = false, ...props }, ref) => {
    const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
    
    // Handle auto-resize functionality
    const handleResize = () => {
      const textarea = textareaRef.current;
      if (!textarea || !autoResize) return;
      
      // Reset height to calculate proper scrollHeight
      textarea.style.height = 'auto';
      
      // Set to scrollHeight to accommodate content
      textarea.style.height = `${textarea.scrollHeight}px`;
    };
    
    // Auto-resize on content change
    useEffect(() => {
      if (autoResize) {
        handleResize();
      }
    }, [props.value, autoResize]);

    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={(element) => {
          // Pass the ref to the parent component
          if (typeof ref === 'function') {
            ref(element);
          } else if (ref) {
            ref.current = element;
          }
          // Store ref for internal use
          textareaRef.current = element;
        }}
        {...props}
        onInput={autoResize ? handleResize : undefined}
      />
    );
  }
)
Textarea.displayName = "Textarea";

export { Textarea }
