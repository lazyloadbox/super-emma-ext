// 事件类型定义
export type ActionType = 
  | 'GET_PAGE_MARKDOWN_CONTENT'
  | 'OPEN_CHAT'
  | 'SAVE_TABS'
  | 'SHOW_NOTIFICATION';

// 事件数据接口
export interface ActionEvent {
  type: ActionType;
  data?: any;
  timestamp: number;
}

// 页面内容相关接口
export interface PageData {
  title: string;
  url: string;
  content: string;
}

export interface CaptureResult {
  success: boolean;
  data?: {
    markdown: string;
    pageData: PageData;
  };
  error?: string;
}

// Chat 消息相关接口
export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date | string;
  type?: 'markdown' | 'text';
  metadata?: {
    source?: string;
    url?: string;
    captureTime?: string;
  };
}

// Storage 数据结构
export interface StorageData {
  latestPageMarkdown?: string;
  pageMarkdownTimestamp?: number;
  lastAction?: ActionEvent;
  chatMessages?: ChatMessage[];
} 