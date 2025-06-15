import React, { useState, useMemo } from 'react';
import { cn } from '../../lib/utils';
import { Card } from '../ui/card';
import { StreamingMarkdown } from './streaming-markdown';
import { MarkdownMessage } from './markdown-message';
import { Button } from '../ui/button';
import { ChevronDown, ChevronUp, User, Bot, X, RotateCcw, FileText } from 'lucide-react';
import { exportMessageToMarkdown } from '../../lib/export-utils';

export interface MessageProps {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date | string;
  reasoning_content?: string;
  isStreaming?: boolean;
  onCancel?: () => void;
  onRegenerate?: () => void;
  onRegenerateFromHere?: () => void;
  type?: 'markdown' | 'text';
  metadata?: {
    source?: string;
    url?: string;
    captureTime?: string;
  };
}

export const Message: React.FC<MessageProps> = ({
  id,
  content,
  role,
  timestamp,
  reasoning_content,
  isStreaming = false,
  onCancel,
  onRegenerate,
  onRegenerateFromHere,
  type = 'text',
  metadata
}) => {
  const isUser = role === 'user';
  const [showThinking, setShowThinking] = useState(true);
  const [showDebug, setShowDebug] = useState(false);

  // 保存AI消息为Markdown
  const handleSaveMessage = () => {
    if (isUser) return; // 只允许保存AI消息
    
    try {
      exportMessageToMarkdown({
        id,
        content,
        role,
        timestamp,
        reasoning_content,
        type,
        metadata
      });
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

    // Extract thinking content and main content
  const { thinkingContent, mainContent } = useMemo(() => {
    if (isUser) {
      return { thinkingContent: '', mainContent: content };
    }

    // Use reasoning_content from LM Studio if available
    if (reasoning_content && reasoning_content.trim()) {
      return { 
        thinkingContent: reasoning_content.trim(), 
        mainContent: content.trim() 
      };
    }

    // Fallback: Try multiple patterns for different AI models (for backward compatibility)
    const patterns = [
      // Standard <think>...</think> tags
      /<think\s*>([\s\S]*?)<\/think\s*>/gi,
      // Alternative thinking patterns
      /<thinking\s*>([\s\S]*?)<\/thinking\s*>/gi,
      // Claude-style thinking
      /<antThinking\s*>([\s\S]*?)<\/antThinking\s*>/gi,
      // OpenAI o1-style reasoning
      /<reasoning\s*>([\s\S]*?)<\/reasoning\s*>/gi,
      // Generic reasoning tags
      /<reason\s*>([\s\S]*?)<\/reason\s*>/gi,
      // Internal monologue style
      /<internal\s*>([\s\S]*?)<\/internal\s*>/gi,
      // Thought process
      /<thought\s*>([\s\S]*?)<\/thought\s*>/gi,
    ];

    let allThinkingContent = [];
    let processedContent = content;

    // Try each pattern
    for (const pattern of patterns) {
      const matches = [...content.matchAll(pattern)];
      if (matches.length > 0) {
        // Extract thinking content
        const thinkingParts = matches
          .map(match => match[1]?.trim() || '')
          .filter(text => text.length > 0);
        
        allThinkingContent.push(...thinkingParts);

        // Remove matches from content
        matches.forEach(match => {
          processedContent = processedContent.replace(match[0], '');
        });
      }
    }

    const thinking = allThinkingContent.join('\n\n').trim();
    const main = processedContent.trim();

    return { thinkingContent: thinking, mainContent: main };
  }, [content, reasoning_content, isUser]);

  const hasThinking = thinkingContent.length > 0;

  return (
    <div className="w-full mb-4">
      <Card className={cn(
        "w-full overflow-hidden",
        isUser 
          ? "bg-blue-50 dark:bg-blue-950/20 border-r-4 border-r-blue-500 text-foreground" 
          : "bg-green-50 dark:bg-green-950/20 border-l-4 border-l-green-500 text-foreground"
      )}>
        {/* Header */}
        <div className={cn(
          "px-4 py-2 border-b",
          isUser 
            ? "bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800" 
            : "bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800"
        )}>
          <div className={cn(
            "text-xs font-medium flex items-center gap-2",
            isUser ? "justify-end text-blue-700 dark:text-blue-300" : "justify-start text-green-700 dark:text-green-300"
          )}>
            {isUser ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
            <span>{isUser ? "You" : "Emma"} • {timestamp instanceof Date ? timestamp.toLocaleTimeString() : new Date(timestamp).toLocaleTimeString()}</span>
            {!isUser && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDebug(!showDebug)}
                className="h-5 px-1 text-xs ml-2 hover:bg-green-200 dark:hover:bg-green-800/50"
                title="Show raw content"
              >
                🐛
              </Button>
            )}
          </div>
        </div>
        
        {/* Content */}
        <div className="p-4 space-y-2 min-w-0">
            
            {/* Debug Section */}
            {showDebug && !isUser && (
              <div className="border border-red-300 bg-red-50 dark:bg-red-950/20 rounded-md p-3 mb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-red-700 dark:text-red-300">
                    🐛 Raw Content Debug
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDebug(false)}
                    className="h-5 px-1 text-xs"
                  >
                    ✕
                  </Button>
                </div>
                {reasoning_content && (
                  <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded border">
                    <div className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">
                      Reasoning Content:
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-800 rounded p-2 text-xs font-mono whitespace-pre-wrap overflow-auto max-h-40 break-all">
                      {reasoning_content}
                    </div>
                  </div>
                )}
                {content && (
                  <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded border">
                    <div className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">
                      Main Content:
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-800 rounded p-2 text-xs font-mono whitespace-pre-wrap overflow-auto max-h-40 break-all">
                      {content}
                    </div>
                  </div>
                )}
                <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                  <div>Content length: {content.length}</div>
                  <div>Has reasoning_content: {reasoning_content ? 'Yes' : 'No'}</div>
                  <div>Reasoning Content length: {reasoning_content?.length || 0}</div>
                </div>
              </div>
            )}

            
            {/* Thinking Section */}
            {hasThinking && (
              <div className="border-l-4 border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/20 rounded-r-md pl-4 pr-3 py-2 mb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-1">
                    💭 Thinking Process
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowThinking(!showThinking)}
                    className="h-6 px-2 text-xs hover:bg-blue-100 dark:hover:bg-blue-900/50"
                  >
                    {showThinking ? (
                      <>
                        <ChevronUp className="w-3 h-3 mr-1" />
                        Hide
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3 h-3 mr-1" />
                        Show
                      </>
                    )}
                  </Button>
                </div>
                
                {showThinking && (
                  <div className="bg-white/70 dark:bg-gray-800/70 rounded-md p-3 text-sm border border-blue-200/50 dark:border-blue-800/50">
                    <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono text-xs leading-relaxed break-words overflow-wrap-anywhere">
                      {thinkingContent}
                    </div>
                  </div>
                )}
              </div>
            )}

          {/* Main Content */}
          {mainContent && (
            <div className="min-w-0">
              {isUser ? (
                type === 'markdown' ? (
                  <MarkdownMessage content={mainContent} metadata={metadata} className="text-sm" />
                ) : (
                  <div className="text-sm whitespace-pre-wrap break-words overflow-wrap-anywhere">{mainContent}</div>
                )
              ) : (
                <StreamingMarkdown content={mainContent} className="text-sm" />
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
            {/* Save button for AI messages */}
            {!isUser && !isStreaming && content && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveMessage}
                className="flex items-center gap-1 text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/20 border-purple-300 hover:border-purple-400"
                title="Save message as Markdown"
              >
                <FileText className="w-3 h-3" />
                Save
              </Button>
            )}

            {/* Cancel button for streaming AI messages */}
            {!isUser && isStreaming && onCancel && (
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel}
                className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 border-red-300 hover:border-red-400"
              >
                <X className="w-3 h-3" />
                Cancel
              </Button>
            )}

            {/* Regenerate button for completed AI messages */}
            {!isUser && !isStreaming && onRegenerate && content && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRegenerate}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/20 border-blue-300 hover:border-blue-400"
              >
                <RotateCcw className="w-3 h-3" />
                Regenerate
              </Button>
            )}

            {/* Regenerate from here button for user messages */}
            {isUser && onRegenerateFromHere && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRegenerateFromHere}
                className="flex items-center gap-1 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/20 border-green-300 hover:border-green-400"
              >
                <RotateCcw className="w-3 h-3" />
                Regenerate from here
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}; 