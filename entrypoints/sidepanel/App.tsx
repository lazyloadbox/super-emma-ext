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

    // Listen for page content capture events
    const handlePageMarkdownEvent = (event: ActionEvent) => {
      console.log('Sidepanel App received page content capture event:', event);
      
      if (event.type === 'GET_PAGE_MARKDOWN_CONTENT') {
        setCurrentEvent(event);
        
        // Set a timer to clear the event to avoid duplicate processing
        setTimeout(() => {
          setCurrentEvent(null);
        }, 1000);
      }
    };

    // Register event listener
    eventManager.addEventListener('GET_PAGE_MARKDOWN_CONTENT', handlePageMarkdownEvent);

    // Check for pending events (for recovery after page refresh)
    // chrome.storage.local.get(['lastAction'], (result) => {
    //   if (result.lastAction && result.lastAction.type === 'GET_PAGE_MARKDOWN_CONTENT') {
    //     handlePageMarkdownEvent(result.lastAction);
    //     // Clear processed event
    //     chrome.storage.local.remove(['lastAction']);
    //   }
    // });

    console.log('Sidepanel App initialized');

    // Cleanup function
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