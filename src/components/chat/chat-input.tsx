import React, { useState, KeyboardEvent, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  disabled = false,
  placeholder = "Type your message..."
}) => {
  const [message, setMessage] = useState('');
  const [textareaHeight, setTextareaHeight] = useState(36);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto';
      
      // Calculate the appropriate height
      const scrollHeight = textarea.scrollHeight;
      const lineHeight = 20; // Adjusted line height
      const maxLines = 6; // Maximum number of lines before scrolling
      const minHeight = 36; // Minimum height (about 1.5 lines)
      const maxHeight = lineHeight * maxLines + 16; // Add padding
      
      // Set height based on content, with min/max constraints
      const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
      textarea.style.height = `${newHeight}px`;
      setTextareaHeight(newHeight);
    }
  }, [message]);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Shift+Enter: Add new line (default behavior)
        return;
      } else {
        // Enter: Send message
        e.preventDefault();
        handleSend();
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };

  // Determine if we should show as single line or multi-line
  const lineCount = message.split('\n').length;
  const shouldShowMultiLine = lineCount > 1 || message.length > 50;

  return (
    <div className="border-t bg-background">
      <div className="flex flex-col gap-2 p-4">
        {/* Hint text - moved to top */}
        {!disabled && (
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>Press Enter to send, Shift+Enter for new line</span>
            {message.length > 100 && (
              <span>{message.length} characters</span>
            )}
          </div>
        )}
        
        {/* Input area */}
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleChange}
              onKeyDown={handleKeyPress}
              placeholder={placeholder}
              disabled={disabled}
              rows={1}
              className={cn(
                "w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors",
                "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                "disabled:cursor-not-allowed disabled:opacity-50"
              )}
              style={{
                minHeight: '36px',
                maxHeight: '144px', // 6 lines * 20px + padding
                lineHeight: '20px',
              }}
            />
          </div>
          
          {/* Send button - moved outside textarea */}
          <Button
            onClick={handleSend}
            disabled={disabled || !message.trim()}
            size="sm"
            className={cn(
              "shrink-0 transition-all duration-200",
              "hover:bg-primary/90 focus-visible:ring-1 focus-visible:ring-ring"
            )}
            style={{
              height: `${textareaHeight}px`,
              minHeight: '36px'
            }}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}; 