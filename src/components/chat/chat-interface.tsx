import React, { useState, useEffect, useRef } from 'react';
import { Bot, RefreshCw, AlertCircle, Settings, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { Button } from '../ui/button';
import { Message, MessageProps } from './message';
import { ChatInput } from './chat-input';
import { ModelSelector } from './model-selector';

import { LMStudioClient, ChatMessage as LMStudioChatMessage } from '../../lib/lm-studio-client';
import { OllamaClient, OllamaMessage } from '../../lib/ollama-client';
import { OpenAILikeClient } from '../../lib/openai-like-client';
import { SettingsManager, AIProviderConfig } from '../../lib/settings';
import { StreamingMarkdown } from './streaming-markdown';
import { ChatMessage, ActionEvent } from '../../lib/types';
import { exportChatToMarkdown, exportChatToPDF, exportChatToHTML, exportChat, ExportFormat } from '../../lib/export-utils';
import { Download, FileText, Trash2, Upload, Globe, Archive, History } from 'lucide-react';
import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator } from '../ui/dropdown-menu';
import { SaveChatDialog } from '../ui/save-chat-dialog';
import { LoadChatDialog } from '../ui/load-chat-dialog';
import { ChatStorageManager } from '../../lib/chat-storage';
import { storageUtil, STORAGE_KEYS } from '../../lib/storage-util';

interface ChatInterfaceProps {
  className?: string;
  actionEvent?: ActionEvent | null;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ className, actionEvent }) => {
  const [messages, setMessages] = useState<MessageProps[]>([]);
  const [lmStudioModels, setLmStudioModels] = useState<string[]>([]);
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [customModels, setCustomModels] = useState<{ [providerId: string]: string[] }>({});
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [enabledProviders, setEnabledProviders] = useState<AIProviderConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [streamingReasoning, setStreamingReasoning] = useState('');
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [showSaveChatDialog, setShowSaveChatDialog] = useState(false);
  const [isSavingChat, setIsSavingChat] = useState(false);
  const [showLoadChatDialog, setShowLoadChatDialog] = useState(false);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const lmStudioClient = useRef(new LMStudioClient());
  const ollamaClient = useRef(new OllamaClient());
  const customClients = useRef<{ [providerId: string]: OpenAILikeClient }>({});
  const settingsManager = useRef(SettingsManager.getInstance());
  const chatStorageManager = useRef(ChatStorageManager.getInstance());

  // 初始化连接和获取模型
  useEffect(() => {
    initializeConnection();
  }, []);

  // Listen for settings changes
  useEffect(() => {
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes[STORAGE_KEYS.EXTENSION_SETTINGS]) {
        initializeConnection();
      }
    };

    storageUtil.addChangeListener(STORAGE_KEYS.EXTENSION_SETTINGS, handleStorageChange);
    return () => {
      storageUtil.removeChangeListener(STORAGE_KEYS.EXTENSION_SETTINGS, handleStorageChange);
    };
  }, []);

  // 自动滚动到底部
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('.overflow-auto');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages, streamingMessage, streamingReasoning]);

  // Handle incoming events
  useEffect(() => {
    if (actionEvent) {
      console.log('ChatInterface received event:', actionEvent);
      
      if (actionEvent.type === 'GET_PAGE_MARKDOWN_CONTENT' && actionEvent.data?.message) {
        const message = actionEvent.data.message as ChatMessage;
        console.log('ChatInterface adding page content message to chat:', message.content.substring(0, 100) + '...');
        
        // Check if there's already a message with the same content (avoid duplicates)
        const hasExistingMessage = messages.some(msg => 
          msg.content === message.content && 
          msg.type === 'markdown' &&
          msg.metadata?.url === message.metadata?.url
        );
        
        if (!hasExistingMessage) {
          setMessages(prev => [
            ...prev,
            {
              id: message.id,
              content: message.content,
              role: message.role as 'user' | 'assistant',
              timestamp: message.timestamp instanceof Date ? message.timestamp : new Date(message.timestamp),
              type: message.type,
              metadata: message.metadata,
            },
          ]);
        }
      }
    }
  }, [actionEvent, messages]); // Depends on actionEvent and messages

  const initializeConnection = async () => {
    setIsLoading(true);
    try {
      // Load settings to get providers
      const settings = await settingsManager.current.loadSettings();
      
      // Get enabled providers
      const enabledProviders = Object.values(settings.providers).filter(provider => provider.enabled);
      setEnabledProviders(enabledProviders);
      
      let anyConnected = false;
      const newLmStudioModels: string[] = [];
      const newOllamaModels: string[] = [];
      const newCustomModels: { [providerId: string]: string[] } = {};
      
      // Test connection for each enabled provider
      for (const provider of enabledProviders) {
        try {
          // Only process providers that have selected models
          if (provider.selectedModels.length === 0) {
            console.log(`Skipping provider ${provider.name} - no models selected`);
            continue;
          }

            if (provider.type === 'lmstudio') {
              lmStudioClient.current.setBaseUrl(provider.url);
              const connected = await lmStudioClient.current.testConnection();
              if (connected) {
                newLmStudioModels.push(...provider.selectedModels);
                anyConnected = true;
              }
            } else if (provider.type === 'ollama') {
              ollamaClient.current.setBaseUrl(provider.url);
              const connected = await ollamaClient.current.testConnection();
              if (connected) {
                newOllamaModels.push(...provider.selectedModels);
                anyConnected = true;
              }
            } else if (provider.type === 'openai-like') {
              // Create or update custom client
              const client = new OpenAILikeClient({
                baseUrl: provider.url,
                apiKey: provider.apiKey,
              });
              
              customClients.current[provider.id] = client;
              
              const connected = await client.testConnection();
              if (connected) {
                newCustomModels[provider.id] = provider.selectedModels;
                anyConnected = true;
              }
            }
        } catch (error) {
          console.error(`Connection failed for provider ${provider.name}:`, error);
        }
      }
      
      // Update state with all discovered models
      setLmStudioModels(newLmStudioModels);
      setOllamaModels(newOllamaModels);
      setCustomModels(newCustomModels);
      setIsConnected(anyConnected);
      
      // Set default selected model
      setTimeout(() => {
        const allModels = [
          ...newLmStudioModels,
          ...newOllamaModels,
          ...Object.values(newCustomModels).flat()
        ];
        
        if (allModels.length > 0 && !selectedModel) {
          // Just select the first available model
          setSelectedModel(allModels[0]);
        }
      }, 100);
    } catch (error) {
      console.error('Failed to initialize connection:', error);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const getProviderModels = (
    provider: AIProviderConfig,
    lmStudioModels: string[],
    ollamaModels: string[],
    customModels: { [providerId: string]: string[] }
  ): string[] => {
    switch (provider.type) {
      case 'lmstudio':
        return lmStudioModels;
      case 'ollama':
        return ollamaModels;
      case 'openai-like':
        return customModels[provider.id] || [];
      default:
        return [];
    }
  };

  const getModelProvider = (modelName: string): AIProviderConfig | null => {
    for (const provider of enabledProviders) {
      if (provider.type === 'lmstudio' && lmStudioModels.includes(modelName)) {
        return provider;
      }
      if (provider.type === 'ollama' && ollamaModels.includes(modelName)) {
        return provider;
      }
      if (provider.type === 'openai-like' && customModels[provider.id]?.includes(modelName)) {
        return provider;
      }
    }
    return null;
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedModel || isTyping) return;

    // Create abort controller for this request
    const controller = new AbortController();
    setAbortController(controller);

    const userMessage: MessageProps = {
      id: Date.now().toString(),
      content,
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);
    setStreamingMessage('');
    setStreamingReasoning('');
    
    // Generate ID for the streaming message
    const assistantMessageId = (Date.now() + 1).toString();
    setStreamingMessageId(assistantMessageId);

    try {
      let fullResponse = '';
      let fullReasoning = '';
      let response: { content: string; reasoning_content?: string };

      // Find the provider for the selected model
      const provider = getModelProvider(selectedModel);
      if (!provider) {
        throw new Error(`No provider found for model: ${selectedModel}`);
      }

      if (provider.type === 'lmstudio') {
        const chatMessages: LMStudioChatMessage[] = [
          ...messages.map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
          { role: 'user', content },
        ];

        response = await lmStudioClient.current.sendMessage(
          chatMessages,
          selectedModel,
          (token: string, reasoning?: string) => {
            if (token) {
              fullResponse += token;
              setStreamingMessage(fullResponse);
            }
            if (reasoning) {
              fullReasoning += reasoning;
              setStreamingReasoning(fullReasoning);
            }
          },
          controller.signal
        );
      } else if (provider.type === 'ollama') {
        const ollamaMessages: OllamaMessage[] = [
          ...messages.map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
          { role: 'user', content },
        ];

        response = await ollamaClient.current.sendMessage(
          ollamaMessages,
          selectedModel,
          (token: string, reasoning?: string) => {
            if (token) {
              fullResponse += token;
              setStreamingMessage(fullResponse);
            }
            if (reasoning) {
              fullReasoning += reasoning;
              setStreamingReasoning(fullReasoning);
            }
          },
          controller.signal
        );
      } else if (provider.type === 'openai-like') {
        const client = customClients.current[provider.id];
        if (!client) {
          throw new Error(`No client found for provider: ${provider.name}`);
        }

        const chatMessages = [
          ...messages.map(msg => ({
            role: msg.role as 'user' | 'assistant' | 'system',
            content: msg.content,
          })),
          { role: 'user' as const, content },
        ];

        response = await client.sendMessage(
          chatMessages,
          selectedModel,
          (token: string, reasoning?: string) => {
            if (token) {
              fullResponse += token;
              setStreamingMessage(fullResponse);
            }
            if (reasoning) {
              fullReasoning += reasoning;
              setStreamingReasoning(fullReasoning);
            }
          },
          undefined,
          controller.signal
        );
      } else {
        throw new Error(`Unknown provider type: ${provider.type}`);
      }

      const assistantMessage: MessageProps = {
        id: assistantMessageId,
        content: response.content || fullResponse,
        role: 'assistant',
        timestamp: new Date(),
        reasoning_content: response.reasoning_content || fullReasoning || undefined,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      // Only show error if not aborted
      if (error instanceof Error && error.name !== 'AbortError') {
        const errorMessage: MessageProps = {
          id: assistantMessageId,
          content: 'Sorry, I encountered an error while processing your message. Please try again.',
          role: 'assistant',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } finally {
      setIsTyping(false);
      setStreamingMessage('');
      setStreamingReasoning('');
      setStreamingMessageId(null);
      setAbortController(null);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setStreamingMessage('');
    setStreamingReasoning('');
    if (abortController) {
      abortController.abort();
    }
  };

  const handleCancel = () => {
    if (abortController) {
      abortController.abort();
    }
  };

  const handleRegenerate = (messageId: string) => {
    // Find the message to regenerate
    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    if (messageIndex === -1) return;

    // Find the previous user message
    let userMessageIndex = -1;
    for (let i = messageIndex - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        userMessageIndex = i;
        break;
      }
    }

    if (userMessageIndex === -1) return;

    // Get the user content before removing messages
    const userContent = messages[userMessageIndex].content;
    
    // Remove the AI message and the user message (since we'll recreate both)
    setMessages(prev => prev.slice(0, userMessageIndex));
    
    // Regenerate with the user's content
    setTimeout(() => {
      handleSendMessage(userContent);
    }, 100);
  };

  const handleRegenerateFromHere = (messageId: string) => {
    // Find the message index
    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    if (messageIndex === -1) return;

    // Get the user message content before removing
    const userContent = messages[messageIndex].content;
    
    // Remove all messages after this one (including this one since we'll recreate it)
    setMessages(prev => prev.slice(0, messageIndex));
    
    // Regenerate with this message's content
    setTimeout(() => {
      handleSendMessage(userContent);
    }, 100);
  };

  const handleOpenSettings = () => {
    try {
      // Use the new navigation utility to open settings tab
      const { openOptionsPage } = require('../../lib/utils');
      openOptionsPage('settings');
    } catch (error) {
      console.error('Failed to open settings page:', error);
      // Fallback: directly open options page with hash
      try {
        const optionsUrl = chrome.runtime.getURL('options.html#settings');
        chrome.tabs.create({ url: optionsUrl });
      } catch (fallbackError) {
        console.error('All methods failed to open options page:', fallbackError);
      }
    }
  };

  // Export chat history as Markdown
  const handleExportMarkdown = () => {
    if (messages.length === 0) return;
    
    try {
      exportChatToMarkdown(messages);
    } catch (error) {
      console.error('Error exporting to Markdown:', error);
    }
  };

  // Export chat history as PDF
  const handleExportPDF = async () => {
    if (messages.length === 0) return;
    
    try {
      await exportChatToPDF(messages);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
    }
  };

  // Export chat history as HTML
  const handleExportHTML = () => {
    if (messages.length === 0) return;
    
    try {
      exportChatToHTML(messages);
    } catch (error) {
      console.error('Error exporting to HTML:', error);
    }
  };

  // Generic export handler function
  const handleExport = async (format: ExportFormat) => {
    if (messages.length === 0) return;
    
    try {
      await exportChat(messages, format);
    } catch (error) {
      console.error(`Error exporting to ${format}:`, error);
    }
  };

  // Open save chat dialog
  const handleSaveChatClick = () => {
    if (messages.length === 0) return;
    setShowSaveChatDialog(true);
  };

  // Save chat session
  const handleSaveChat = async (chatName: string) => {
    if (messages.length === 0) return;
    
    setIsSavingChat(true);
    try {
      const chatId = await chatStorageManager.current.saveChat(chatName, messages);
      console.log('Chat saved successfully with ID:', chatId);
      // Success notification can be added here
    } catch (error) {
      console.error('Error saving chat:', error);
      // Error notification can be added here
    } finally {
      setIsSavingChat(false);
    }
  };

  // Generate default chat name
  const getDefaultChatName = (): string => {
    return chatStorageManager.current.generateDefaultChatName(messages);
  };

  // Open load chat dialog
  const handleLoadChatClick = () => {
    setShowLoadChatDialog(true);
  };

  // Load chat session
  const handleLoadChat = async (chatKeyId: string) => {
    setIsLoadingChat(true);
    try {
      const chatMessages = await chatStorageManager.current.loadChatMessages(chatKeyId);
      if (chatMessages) {
        // Clear current chat
        setMessages(chatMessages);
        setStreamingMessage('');
        setStreamingReasoning('');
        setStreamingMessageId(null);
        setIsTyping(false);
        
        // Cancel ongoing request if any
        if (abortController) {
          abortController.abort();
          setAbortController(null);
        }
        
        console.log('Chat loaded successfully:', chatKeyId);
        // Success notification can be added here
      } else {
        console.error('Failed to load chat messages');
        // Error notification can be added here
      }
    } catch (error) {
      console.error('Error loading chat:', error);
      // Error notification can be added here
    } finally {
      setIsLoadingChat(false);
    }
  };

  // Check if we have any enabled providers with selected models
  const hasAvailableModels = lmStudioModels.length > 0 || ollamaModels.length > 0 || Object.values(customModels).some(models => models.length > 0);
  const hasEnabledProviders = enabledProviders.length > 0;
  const hasProvidersWithModels = enabledProviders.some(provider => provider.selectedModels.length > 0);

  if (!isLoading && (!hasEnabledProviders || !hasProvidersWithModels || !hasAvailableModels)) {
    return (
      <div className="flex flex-col h-full bg-background">
        {/* Header */}
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center justify-between px-4">
            <h1 className="text-lg font-semibold">Super Emma</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenSettings}
                className="flex items-center justify-center w-9 h-9 rounded-md transition-colors hover:bg-muted text-muted-foreground hover:text-foreground"
                title="Open Settings"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <Bot className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            {!hasEnabledProviders ? (
              <>
                <h3 className="text-lg font-semibold mb-2">No AI Providers Configured</h3>
                <p className="text-muted-foreground mb-4">
                  Please configure and enable at least one AI provider to start chatting.
                </p>
              </>
            ) : !hasProvidersWithModels ? (
              <>
                <h3 className="text-lg font-semibold mb-2">No Models Selected</h3>
                <p className="text-muted-foreground mb-4">
                  You have AI providers configured, but no models are selected. Please go to settings and select models for your providers.
                </p>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold mb-2">Connection Failed</h3>
                <p className="text-muted-foreground mb-4">
                  Unable to connect to your AI providers. Please check your settings and ensure the services are running.
                </p>
              </>
            )}
            <div className="flex gap-2 justify-center">
              <Button onClick={handleOpenSettings} variant="default">
                <Settings className="h-4 w-4 mr-2" />
                Open Settings
              </Button>
              {hasProvidersWithModels && (
                <Button onClick={initializeConnection} disabled={isLoading} variant="outline">
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Retry Connection
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-4">
          <h1 className="text-lg font-semibold">Super Emma</h1>
          <div className="flex items-center gap-1">
            {/* Export dropdown */}
            {messages.length > 0 ? (
              <DropdownMenu
                align="right"
                trigger={
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    title="Export chat"
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                }
              >
                <DropdownMenuItem onClick={() => handleExport('markdown')}>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Markdown
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('html')}>
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    HTML
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('pdf')}>
                  <div className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    PDF
                  </div>
                </DropdownMenuItem>
              </DropdownMenu>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                disabled={true}
                className="h-8 w-8 p-0"
                title="Export chat"
              >
                <Upload className="h-4 w-4" />
              </Button>
            )}

            {/* Save Chat button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSaveChatClick}
              disabled={messages.length === 0 || isSavingChat}
              className="h-8 w-8 p-0"
              title="Save chat session"
            >
              <Archive className="h-4 w-4" />
            </Button>
            
            {/* Load Chat History button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLoadChatClick}
              disabled={isLoadingChat}
              className="h-8 w-8 p-0"
              title="Load chat history"
            >
              <History className="h-4 w-4" />
            </Button>
            
            {/* Clear button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearChat}
              disabled={messages.length === 0}
              className="h-8 w-8 p-0"
              title="Clear chat history"
            >
              <Trash2 className="h-4 w-4" />
            </Button>

            {/* Settings button */}
            <button
              onClick={handleOpenSettings}
              className="flex items-center justify-center w-8 h-8 rounded-md transition-colors hover:bg-muted text-muted-foreground hover:text-foreground"
              title="Open Settings"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.50 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col p-2 space-y-2 overflow-hidden">
        {/* Model selector */}
        <Card>
          <CardContent className="p-2">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <ModelSelector
                  lmStudioModels={lmStudioModels}
                  ollamaModels={ollamaModels}
                  customModels={customModels}
                  enabledProviders={enabledProviders}
                  selectedModel={selectedModel}
                  onModelChange={setSelectedModel}
                  disabled={isLoading || isTyping}
                />
              </div>
              {/* Refresh button in model area */}
              <Button
                variant="outline"
                size="sm"
                onClick={initializeConnection}
                disabled={isLoading}
                title="Refresh connection"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Messages area */}
        <Card className="flex-1 flex flex-col min-h-0">
          <CardContent className="flex-1 p-0 flex flex-col min-h-0">
            <ScrollArea ref={scrollAreaRef} className="flex-1">
              <div className="p-2 space-y-3">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                    <Bot className="h-8 w-8 mb-2" />
                    <p>Start a conversation with super emma</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <Message 
                      key={message.id} 
                      {...message}
                      isStreaming={isTyping && message.id === streamingMessageId}
                      onCancel={message.role === 'assistant' && isTyping && message.id === streamingMessageId ? handleCancel : undefined}
                      onRegenerate={message.role === 'assistant' && !isTyping ? () => handleRegenerate(message.id) : undefined}
                      onRegenerateFromHere={message.role === 'user' ? () => handleRegenerateFromHere(message.id) : undefined}
                    />
                  ))
                )}
                
                {/* 流式消息显示 */}
                {isTyping && (streamingReasoning || streamingMessage) && (
                  <div className="flex w-full justify-start mb-4">
                    <Card className="max-w-[80%] p-4 bg-muted">
                      <div className="space-y-2">
                        <div className="text-xs opacity-70 text-left">
                          Super Emma • typing...
                        </div>
                        {/* Show reasoning content first */}
                        {streamingReasoning && (
                          <div className="border-l-4 border-blue-500 pl-3 mb-3">
                            <div className="text-xs text-blue-600 font-medium mb-1">🤔 Thinking...</div>
                            <div className="relative">
                              <StreamingMarkdown content={streamingReasoning} className="text-sm text-muted-foreground" />
                              {!streamingMessage && <span className="animate-pulse text-primary">|</span>}
                            </div>
                          </div>
                        )}
                        {/* Then show main response */}
                        {streamingMessage && (
                          <div className="relative">
                            <StreamingMarkdown content={streamingMessage} className="text-sm" />
                            <span className="animate-pulse text-primary">|</span>
                          </div>
                        )}
                        {/* Cancel button */}
                        <div className="flex justify-end pt-2 mt-3 border-t border-gray-200 dark:border-gray-700">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCancel}
                            className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 border-red-300 hover:border-red-400"
                          >
                            <X className="w-3 h-3" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </div>
                )}
                
                {/* Loading indicator */}
                {isTyping && !streamingMessage && !streamingReasoning && (
                  <div className="flex w-full justify-start mb-4">
                    <Card className="max-w-[80%] p-4 bg-muted">
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                        <span className="text-xs text-muted-foreground">Emma is thinking...</span>
                      </div>
                    </Card>
                  </div>
                )}
              </div>
            </ScrollArea>
            
            {/* Input area */}
            <ChatInput
              onSendMessage={handleSendMessage}
              disabled={!selectedModel || isTyping}
              placeholder={
                !selectedModel 
                  ? "Please select a model first..." 
                  : isTyping 
                    ? "Emma is responding..." 
                    : "Type your message..."
              }
            />
          </CardContent>
        </Card>
      </div>

      {/* Save Chat Dialog */}
      <SaveChatDialog
        isOpen={showSaveChatDialog}
        onClose={() => setShowSaveChatDialog(false)}
        onSave={handleSaveChat}
        defaultName={messages.length > 0 ? getDefaultChatName() : ''}
      />

      {/* Load Chat Dialog */}
      <LoadChatDialog
        isOpen={showLoadChatDialog}
        onClose={() => setShowLoadChatDialog(false)}
        onLoadChat={handleLoadChat}
      />
    </div>
  );
}; 