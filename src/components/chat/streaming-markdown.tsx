import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { cn } from '../../lib/utils';
import { useTheme } from '../../lib/theme-provider';

interface StreamingMarkdownProps {
  content: string;
  className?: string;
}

export const StreamingMarkdown: React.FC<StreamingMarkdownProps> = ({ 
  content, 
  className 
}) => {
  const { actualTheme } = useTheme();
  
  // Memoize the syntax highlighter style based on theme
  const syntaxStyle = useMemo(() => {
    return actualTheme === 'dark' ? oneDark : oneLight;
  }, [actualTheme]);

  // Process content to handle incomplete markdown gracefully
  const processedContent = useMemo(() => {
    let processedText = content;
    
    // Handle <think> tags - extract and style them differently
    processedText = processedText.replace(
      /<think>([\s\S]*?)<\/think>/gi,
      '<div class="thinking-block border-l-4 border-blue-500 pl-3 mb-3 bg-blue-50 dark:bg-blue-950/20 p-2 rounded-r"><div class="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">🤔 Thinking...</div><div class="text-sm text-blue-700 dark:text-blue-300">$1</div></div>'
    );
    
    // Handle incomplete <think> tags
    const incompleteThinkMatch = processedText.match(/<think>([^<]*)$/i);
    if (incompleteThinkMatch) {
      processedText = processedText.replace(
        /<think>([^<]*)$/i,
        '<div class="thinking-block border-l-4 border-blue-500 pl-3 mb-3 bg-blue-50 dark:bg-blue-950/20 p-2 rounded-r"><div class="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">🤔 Thinking...</div><div class="text-sm text-blue-700 dark:text-blue-300">$1</div></div>'
      );
    }
    
    // Handle incomplete code blocks
    const codeBlockMatches = processedText.match(/```[\s\S]*?(?:```|$)/g);
    if (codeBlockMatches) {
      const lastMatch = codeBlockMatches[codeBlockMatches.length - 1];
      if (!lastMatch.endsWith('```')) {
        // Add temporary closing for incomplete code block
        processedText = processedText + '\n```';
      }
    }
    
    // Handle incomplete inline code
    const inlineCodeMatches = processedText.match(/`[^`]*$/);
    if (inlineCodeMatches) {
      processedText = processedText + '`';
    }
    
    return processedText;
  }, [content]);

  return (
    <div className={cn("prose prose-sm max-w-none dark:prose-invert", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          div({ className, children, ...props }: any) {
            if (className?.includes('thinking-block')) {
              return (
                <div className="border-l-4 border-blue-500 pl-3 mb-3 bg-blue-50 dark:bg-blue-950/20 p-2 rounded-r" {...props}>
                  {children}
                </div>
              );
            }
            return <div className={className} {...props}>{children}</div>;
          },
          code({ className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            const isInline = !match;
            
            if (!isInline && language) {
              return (
                <div className="relative">
                  <SyntaxHighlighter
                    style={syntaxStyle as any}
                    language={language}
                    PreTag="div"
                    className="rounded-md !mt-0 !mb-0"
                    wrapLines={true}
                    wrapLongLines={true}
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                </div>
              );
            }
            
            return (
              <code 
                className={cn(
                  className,
                  "bg-muted px-1.5 py-0.5 rounded text-sm font-mono break-words"
                )} 
                {...props}
              >
                {children}
              </code>
            );
          },
          pre({ children, ...props }: any) {
            return (
              <pre 
                className="bg-muted p-4 rounded-md overflow-x-auto whitespace-pre-wrap break-words" 
                {...props}
              >
                {children}
              </pre>
            );
          },
          p({ children, ...props }: any) {
            return (
              <p 
                className="mb-4 last:mb-0 break-words overflow-wrap-anywhere" 
                {...props}
              >
                {children}
              </p>
            );
          },
          a({ children, href, ...props }: any) {
            return (
              <a 
                href={href}
                className="text-primary hover:underline break-all"
                target="_blank"
                rel="noopener noreferrer"
                {...props}
              >
                {children}
              </a>
            );
          },
          table({ children, ...props }: any) {
            return (
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse border border-border" {...props}>
                  {children}
                </table>
              </div>
            );
          },
          th({ children, ...props }: any) {
            return (
              <th className="border border-border bg-muted px-4 py-2 text-left font-medium" {...props}>
                {children}
              </th>
            );
          },
          td({ children, ...props }: any) {
            return (
              <td className="border border-border px-4 py-2 break-words" {...props}>
                {children}
              </td>
            );
          },
          blockquote({ children, ...props }: any) {
            return (
              <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground" {...props}>
                {children}
              </blockquote>
            );
          },
          ul({ children, ...props }: any) {
            return (
              <ul className="list-disc list-inside space-y-1 break-words" {...props}>
                {children}
              </ul>
            );
          },
          ol({ children, ...props }: any) {
            return (
              <ol className="list-decimal list-inside space-y-1 break-words" {...props}>
                {children}
              </ol>
            );
          },
          li({ children, ...props }: any) {
            return (
              <li className="break-words overflow-wrap-anywhere" {...props}>
                {children}
              </li>
            );
          },
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}; 