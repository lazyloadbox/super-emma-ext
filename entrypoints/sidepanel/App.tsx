import React, { useEffect, useState } from 'react';
import { ChatInterface } from '../../src/components/chat/chat-interface';
import { ThemeProvider } from '../../src/lib/theme-provider';
import { eventManager } from '../../src/lib/event-manager';
import { ActionEvent } from '../../src/lib/types';

function App() {
  const [currentEvent, setCurrentEvent] = useState<ActionEvent | null>(null);

  useEffect(() => {
    // 初始化事件管理器的 storage 监听
    eventManager.initializeStorageListener();

    // 监听页面内容抓取事件
    const handlePageMarkdownEvent = (event: ActionEvent) => {
      console.log('Sidepanel App 收到页面内容抓取事件:', event);
      
      if (event.type === 'GET_PAGE_MARKDOWN_CONTENT') {
        setCurrentEvent(event);
        
        // 设置一个定时器来清除事件，避免重复处理
        setTimeout(() => {
          setCurrentEvent(null);
        }, 1000);
      }
    };

    // 注册事件监听器
    eventManager.addEventListener('GET_PAGE_MARKDOWN_CONTENT', handlePageMarkdownEvent);

    // 检查是否有待处理的事件（用于页面刷新后的恢复）
    // chrome.storage.local.get(['lastAction'], (result) => {
    //   if (result.lastAction && result.lastAction.type === 'GET_PAGE_MARKDOWN_CONTENT') {
    //     handlePageMarkdownEvent(result.lastAction);
    //     // 清除已处理的事件
    //     chrome.storage.local.remove(['lastAction']);
    //   }
    // });

    console.log('Sidepanel App 已初始化');

    // 清理函数
    return () => {
      eventManager.removeEventListener('GET_PAGE_MARKDOWN_CONTENT', handlePageMarkdownEvent);
    };
  }, []);

  return (
    <ThemeProvider defaultTheme="light" storageKey="browser-ext-theme">
      <div className="w-full h-screen bg-background">
        <ChatInterface actionEvent={currentEvent} />
      </div>
    </ThemeProvider>
  );
}

export default App; 