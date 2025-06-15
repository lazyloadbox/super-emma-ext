import React, { useState, useEffect } from 'react';
import { Button } from './button';
import { X, Clock, MessageSquare } from 'lucide-react';
import { SavedChatListItem, ChatStorageManager } from '../../lib/chat-storage';

interface LoadChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadChat: (chatKeyId: string) => void;
}

export const LoadChatDialog: React.FC<LoadChatDialogProps> = ({
  isOpen,
  onClose,
  onLoadChat
}) => {
  const [chatList, setChatList] = useState<SavedChatListItem[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const chatStorageManager = ChatStorageManager.getInstance();

  // 加载聊天列表
  useEffect(() => {
    if (isOpen) {
      loadChatList();
    }
  }, [isOpen]);

  const loadChatList = async () => {
    setIsLoading(true);
    setError('');
    try {
      const list = await chatStorageManager.getChatList();
      setChatList(list);
      setSelectedChatId('');
    } catch (err) {
      console.error('Error loading chat list:', err);
      setError('Failed to load chat history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoad = () => {
    if (selectedChatId) {
      onLoadChat(selectedChatId);
      onClose();
    }
  };

  const handleCancel = () => {
    setSelectedChatId('');
    setError('');
    onClose();
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      return 'Invalid Date';
    }
    return d.toLocaleDateString('zh-CN') + ' ' + d.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Load Chat History
          </h3>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">Loading chat history...</span>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <p className="text-red-500 mb-2">{error}</p>
                <Button variant="outline" size="sm" onClick={loadChatList}>
                  Retry
                </Button>
              </div>
            </div>
          ) : chatList.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No saved chat history found</p>
                <p className="text-sm">Start a conversation and save it to see it here</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Select a chat to load ({chatList.length} saved chats):
              </label>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {chatList.map((chat) => (
                  <div
                    key={chat.chatKeyId}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedChatId === chat.chatKeyId
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                    onClick={() => setSelectedChatId(chat.chatKeyId)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {chat.savedChatName}
                        </h4>
                        <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatDate(chat.createdAt)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MessageSquare className="h-3 w-3" />
                            <span>{chat.messageCount} messages</span>
                          </div>
                        </div>
                      </div>
                      <div className="ml-2">
                        <input
                          type="radio"
                          name="selectedChat"
                          checked={selectedChatId === chat.chatKeyId}
                          onChange={() => setSelectedChatId(chat.chatKeyId)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button
            onClick={handleLoad}
            disabled={!selectedChatId || isLoading}
          >
            Load Chat
          </Button>
        </div>
      </div>
    </div>
  );
}; 