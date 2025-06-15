import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import TurndownService from 'turndown';
import { PageData, CaptureResult, ChatMessage } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 检查URL是否可以注入脚本
 */
export function isValidUrlForScriptInjection(url: string): boolean {
  return !(
    url.startsWith('chrome://') || 
    url.startsWith('chrome-extension://') || 
    url.startsWith('edge://') || 
    url.startsWith('about:') ||
    url.startsWith('moz-extension://') ||
    url.startsWith('safari-extension://')
  );
}

/**
 * 获取页面内容的脚本函数
 */
export function getPageContentScript(): () => PageData {
  return () => {
    // Get page title and content
    const title = document.title;
    const url = window.location.href;
    
    // Try to get main content, fallback to body
    let content = '';
    
    // Try common content selectors
    const contentSelectors = [
      'main',
      'article',
      '[role="main"]',
      '.content',
      '.main-content',
      '#content',
      '#main'
    ];
    
    let contentElement = null;
    for (const selector of contentSelectors) {
      contentElement = document.querySelector(selector);
      if (contentElement) break;
    }
    
    // If no main content found, use body but exclude nav, header, footer, sidebar
    if (!contentElement) {
      contentElement = document.body;
    }
    
    if (contentElement) {
      // Clone the element to avoid modifying the original
      const cloned = contentElement.cloneNode(true) as Element;
      
      // Remove unwanted elements
      const unwantedSelectors = [
        'nav', 'header', 'footer', 'aside',
        '.nav', '.header', '.footer', '.sidebar',
        '.advertisement', '.ads', '.ad',
        'script', 'style', 'noscript'
      ];
      
      unwantedSelectors.forEach(selector => {
        const elements = cloned.querySelectorAll(selector);
        elements.forEach(el => el.remove());
      });
      
      content = cloned.innerHTML;
    }
    
    return {
      title,
      url,
      content: content || document.body.innerHTML
    };
  };
}

/**
 * 将HTML转换为Markdown
 */
export function convertHtmlToMarkdown(html: string): string {
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced'
  });
  
  // Configure turndown to handle more elements
  turndownService.addRule('strikethrough', {
    filter: ['del', 's'],
    replacement: (content) => `~~${content}~~`
  });

  return turndownService.turndown(html);
}

/**
 * 格式化Markdown内容，添加元数据
 */
export function formatMarkdownWithMetadata(pageData: PageData, markdown: string): string {
  return `# ${pageData.title}

**URL:** ${pageData.url}
**抓取时间:** ${new Date().toLocaleString()}

---

${markdown}`;
}

/**
 * 抓取当前页面内容并转换为Markdown
 */
export async function captureCurrentPageContent(): Promise<CaptureResult> {
  try {
    console.log('开始抓取页面内容...');
    
    // Get the current active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
      return {
        success: false,
        error: 'No active tab found'
      };
    }

    console.log('当前标签页:', tab.title, tab.url);

    // Check if the tab URL is valid for script injection
    const url = tab.url || '';
    if (!isValidUrlForScriptInjection(url)) {
      return {
        success: false,
        error: '无法在此页面抓取内容（系统页面）'
      };
    }

    // Execute script to get page content
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: getPageContentScript()
    });

    if (results && results[0] && results[0].result) {
      const pageData = results[0].result;
      console.log('页面数据获取成功:', pageData.title);

      // Convert HTML to Markdown
      const markdown = convertHtmlToMarkdown(pageData.content);
      
      // Create formatted markdown with metadata
      const formattedMarkdown = formatMarkdownWithMetadata(pageData, markdown);

      console.log('Markdown 转换完成，长度:', formattedMarkdown.length);

      // Store in chrome.storage
      await chrome.storage.local.set({ 
        latestPageMarkdown: formattedMarkdown,
        pageMarkdownTimestamp: Date.now()
      });

      console.log('页面内容已保存到 storage');
      
      return {
        success: true,
        data: {
          markdown: formattedMarkdown,
          pageData
        }
      };
      
    } else {
      return {
        success: false,
        error: 'Failed to get page content'
      };
    }

  } catch (error) {
    console.error('Failed to capture page content:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * 创建 Chat 消息对象
 */
export function createChatMessage(
  content: string, 
  role: 'user' | 'assistant' = 'user',
  type: 'markdown' | 'text' = 'text',
  metadata?: ChatMessage['metadata']
): ChatMessage {
  return {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    content,
    role,
    timestamp: new Date(),
    type,
    metadata
  };
} 