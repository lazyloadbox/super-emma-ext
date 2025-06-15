import { useState } from 'react';
import './App.css';
import { ThemeProvider } from '../../src/lib/theme-provider';
import { Button } from '../../src/components/ui/button';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../src/components/ui/alert-dialog';
import { EmmaAnimation } from '../../src/components/ui/emma-animation';
import { captureCurrentPageContent, createChatMessage } from '../../src/lib/utils';
import { eventManager } from '../../src/lib/event-manager';

interface AlertState {
  open: boolean;
  title: string;
  description: string;
  type: 'success' | 'error';
}

function App() {
  const [alertState, setAlertState] = useState<AlertState>({
    open: false,
    title: '',
    description: '',
    type: 'success'
  });

  const showAlert = (title: string, description: string, type: 'success' | 'error' = 'success') => {
    setAlertState({
      open: true,
      title,
      description,
      type
    });
  };

  const closeAlert = () => {
    setAlertState(prev => ({ ...prev, open: false }));
  };

  const openSidePanel = async () => {
    try {
      // Get the current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        // Open the side panel for the current tab
        await chrome.sidePanel.open({ tabId: tab.id });
        // Close the popup
        window.close();
      }
    } catch (error) {
      console.error('Failed to open side panel:', error);
      showAlert('错误', '无法打开 AI Chat 面板', 'error');
    }
  };

  const saveAllTabs = async () => {
    try {
      // Get all tabs in the current window
      const tabs = await chrome.tabs.query({ currentWindow: true });
      
      // 过滤掉插件页、空白页等特殊url
      const filteredTabs = tabs.filter(tab => {
        const url = tab.url || '';
        return (
          url &&
          !/^chrome(-extension)?:\/\//.test(url) &&
          !/^edge(-extension)?:\/\//.test(url) &&
          !/^moz-extension:\/\//.test(url) &&
          !/^about:blank/.test(url) &&
          !/^chrome:\/\//.test(url) &&
          !/^edge:\/\//.test(url) &&
          !/^vivaldi:\/\//.test(url) &&
          !/^brave:\/\//.test(url) &&
          !/^newtab/.test(url)
        );
      });

      // Create session data
      const session = {
        id: Date.now().toString(),
        name: `Session ${new Date().toLocaleString()}`,
        createdAt: new Date().toISOString(),
        tabs: filteredTabs.map(tab => {
          let domain = 'unknown';
          try {
            domain = new URL(tab.url || '').hostname;
          } catch (error) {
            console.warn('Failed to parse URL:', tab.url);
          }
          
          return {
            url: tab.url,
            title: tab.title,
            favIconUrl: tab.favIconUrl,
            domain: domain
          };
        })
      };

      // Get existing sessions
      const result = await chrome.storage.local.get(['tabSessions']);
      const existingSessions = result.tabSessions || [];
      
      // Add new session
      const updatedSessions = [session, ...existingSessions];
      await chrome.storage.local.set({ tabSessions: updatedSessions });

      // Close all tabs except the current one
      const currentTab = await chrome.tabs.query({ active: true, currentWindow: true });
      const tabsToClose = tabs.filter(tab => tab.id !== currentTab[0]?.id);
      
      for (const tab of tabsToClose) {
        if (tab.id) {
          await chrome.tabs.remove(tab.id);
        }
      }

      // Show success message
      console.log('Session saved successfully!');
      showAlert('成功', `已保存 ${filteredTabs.length} 个标签页到会话中`, 'success');
      
      // Close the popup after a short delay
      setTimeout(() => {
        window.close();
      }, 1500);
    } catch (error) {
      console.error('Failed to save tabs:', error);
      showAlert('错误', '保存标签页会话失败', 'error');
    }
  };

  const handleCapturePageContent = async () => {
    try {
      // 1. 抓取页面内容并转换为 Markdown
      const result = await captureCurrentPageContent();
      
      if (result.success && result.data) {
        // 2. 创建 Chat 消息对象
        const chatMessage = createChatMessage(
          result.data.markdown,
          'user',
          'markdown',
          {
            source: 'page_capture',
            url: result.data.pageData.url,
            captureTime: new Date().toLocaleString()
          }
        );

        // 3. 存储 Chat 消息到 storage
        const existingMessages = await chrome.storage.local.get(['chatMessages']);
        const messages = existingMessages.chatMessages || [];
        messages.push(chatMessage);
        await chrome.storage.local.set({ chatMessages: messages });

        // 4. 发送事件通知 sidepanel
        await eventManager.sendEvent('GET_PAGE_MARKDOWN_CONTENT', {
          message: chatMessage,
          pageData: result.data.pageData
        });

        // 5. 打开 sidepanel
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) {
          await chrome.sidePanel.open({ tabId: tab.id });
        }

        // 6. 显示成功提示
        showAlert('成功', '页面内容已抓取并发送到 AI Chat！', 'success');

        // 7. 延迟关闭 popup
        setTimeout(() => {
          window.close();
        }, 1500);

      } else {
        showAlert('错误', result.error || '抓取页面内容失败', 'error');
      }
    } catch (error) {
      console.error('Failed to capture page content:', error);
      showAlert('错误', '抓取页面内容时发生错误', 'error');
    }
  };

  return (
    <ThemeProvider defaultTheme="light" storageKey="browser-ext-theme">
      <div className="min-h-screen bg-background text-foreground p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold">Super Emma</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => chrome.runtime.openOptionsPage()}
              title="Open Settings"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mb-6 space-y-3">
          <Button
            onClick={openSidePanel}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium"
            size="lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Open AI Chat
          </Button>
          
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={saveAllTabs}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium"
              size="lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Save All Tabs
            </Button>
            
            <Button
              onClick={handleCapturePageContent}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium"
              size="lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              抓取页面
            </Button>
          </div>
        </div>

        {/* Emma Animation */}
        <EmmaAnimation />

        {/* Alert Dialog */}
        <AlertDialog open={alertState.open} onOpenChange={closeAlert}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className={alertState.type === 'error' ? 'text-red-600' : 'text-green-600'}>
                {alertState.title}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {alertState.description}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={closeAlert}>
                确定
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ThemeProvider>
  );
}

export default App;
