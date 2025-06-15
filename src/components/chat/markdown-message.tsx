import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Card } from '../ui/card';
import { cn } from '../../lib/utils';
import { ExternalLink, Clock, Globe } from 'lucide-react';

interface MarkdownMessageProps {
  content: string;
  metadata?: {
    source?: string;
    url?: string;
    captureTime?: string;
  };
  className?: string;
}

export const MarkdownMessage: React.FC<MarkdownMessageProps> = ({
  content,
  metadata,
  className
}) => {
  const isPageCapture = metadata?.source === 'page_capture';

  return (
    <div className={cn("space-y-3", className)}>
      {/* 元数据显示 */}
      {isPageCapture && metadata && (
        <Card className="p-3 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
            <Globe className="h-4 w-4" />
            <span className="font-medium">页面内容抓取</span>
          </div>
          <div className="mt-2 space-y-1 text-xs text-blue-600 dark:text-blue-400">
            {metadata.url && (
              <div className="flex items-center gap-1">
                <ExternalLink className="h-3 w-3" />
                <a 
                  href={metadata.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:underline truncate max-w-[300px]"
                  title={metadata.url}
                >
                  {metadata.url}
                </a>
              </div>
            )}
            {metadata.captureTime && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{metadata.captureTime}</span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Markdown 内容 */}
      <div className="prose prose-sm max-w-none dark:prose-invert">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
          components={{
            // 自定义链接渲染
            a: ({ href, children, ...props }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                {...props}
              >
                {children}
                <ExternalLink className="inline h-3 w-3 ml-1" />
              </a>
            ),
            // 自定义代码块渲染
            pre: ({ children, ...props }) => (
              <pre className="bg-gray-100 dark:bg-gray-800 rounded-md p-3 overflow-x-auto" {...props}>
                {children}
              </pre>
            ),
            // 自定义表格渲染
            table: ({ children, ...props }) => (
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600" {...props}>
                  {children}
                </table>
              </div>
            ),
            th: ({ children, ...props }) => (
              <th className="border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 px-3 py-2 text-left" {...props}>
                {children}
              </th>
            ),
            td: ({ children, ...props }) => (
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2" {...props}>
                {children}
              </td>
            ),
            // 自定义引用块渲染
            blockquote: ({ children, ...props }) => (
              <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic text-gray-700 dark:text-gray-300" {...props}>
                {children}
              </blockquote>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}; 