import { MessageProps } from '../components/chat/message';

export interface SavedChatListItem {
  chatKeyId: string;
  savedChatName: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
}

export interface SavedChatData {
  messages: MessageProps[];
  createdAt: Date;
  updatedAt: Date;
}

export class ChatStorageManager {
  private static instance: ChatStorageManager;
  private readonly CHAT_LIST_KEY = 'saved-chat-list';

  static getInstance(): ChatStorageManager {
    if (!ChatStorageManager.instance) {
      ChatStorageManager.instance = new ChatStorageManager();
    }
    return ChatStorageManager.instance;
  }

  // 生成唯一的聊天ID
  private generateChatKeyId(): string {
    return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 生成默认聊天名称
  generateDefaultChatName(messages: MessageProps[]): string {
    const now = new Date();
    const dateStr = now.toLocaleDateString('zh-CN');
    const timeStr = now.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    // 如果有消息，尝试从第一条用户消息生成名称
    const firstUserMessage = messages.find(msg => msg.role === 'user');
    if (firstUserMessage && firstUserMessage.content) {
      const preview = firstUserMessage.content.slice(0, 20);
      return `${preview}... - ${dateStr} ${timeStr}`;
    }
    
    return `Chat Session - ${dateStr} ${timeStr}`;
  }

  // 保存聊天会话
  async saveChat(name: string, messages: MessageProps[]): Promise<string> {
    try {
      const chatKeyId = this.generateChatKeyId();
      const now = new Date();
      
      // 保存聊天数据
      const chatData: SavedChatData = {
        messages,
        createdAt: now,
        updatedAt: now
      };

      if (chrome?.storage?.local) {
        // 浏览器扩展环境
        await chrome.storage.local.set({ [chatKeyId]: chatData });
      } else {
        // 开发环境或其他环境
        localStorage.setItem(chatKeyId, JSON.stringify(chatData));
      }

      // 更新聊天列表
      await this.updateChatList(chatKeyId, name, now, messages.length);

      return chatKeyId;
    } catch (error) {
      console.error('Error saving chat:', error);
      throw new Error('Failed to save chat session');
    }
  }

  // 更新聊天列表
  private async updateChatList(chatKeyId: string, savedChatName: string, timestamp: Date, messageCount: number): Promise<void> {
    try {
      const chatListItem: SavedChatListItem = {
        chatKeyId,
        savedChatName,
        createdAt: timestamp,
        updatedAt: timestamp,
        messageCount
      };

      let chatList: SavedChatListItem[] = [];
      
      if (chrome?.storage?.local) {
        // 浏览器扩展环境
        const result = await chrome.storage.local.get([this.CHAT_LIST_KEY]);
        chatList = result[this.CHAT_LIST_KEY] || [];
      } else {
        // 开发环境
        const stored = localStorage.getItem(this.CHAT_LIST_KEY);
        chatList = stored ? JSON.parse(stored) : [];
      }

      // 添加新聊天到列表开头
      chatList.unshift(chatListItem);

      // 限制保存的聊天数量（可选）
      const MAX_SAVED_CHATS = 100;
      if (chatList.length > MAX_SAVED_CHATS) {
        const removedChats = chatList.splice(MAX_SAVED_CHATS);
        // 删除超出限制的聊天数据
        for (const chat of removedChats) {
          await this.deleteChat(chat.chatKeyId);
        }
      }

      if (chrome?.storage?.local) {
        await chrome.storage.local.set({ [this.CHAT_LIST_KEY]: chatList });
      } else {
        localStorage.setItem(this.CHAT_LIST_KEY, JSON.stringify(chatList));
      }
    } catch (error) {
      console.error('Error updating chat list:', error);
      throw error;
    }
  }

  // 获取聊天列表
  async getChatList(): Promise<SavedChatListItem[]> {
    try {
      if (chrome?.storage?.local) {
        const result = await chrome.storage.local.get([this.CHAT_LIST_KEY]);
        return result[this.CHAT_LIST_KEY] || [];
      } else {
        const stored = localStorage.getItem(this.CHAT_LIST_KEY);
        return stored ? JSON.parse(stored) : [];
      }
    } catch (error) {
      console.error('Error getting chat list:', error);
      return [];
    }
  }

  // 获取特定聊天数据
  async getChatData(chatKeyId: string): Promise<SavedChatData | null> {
    try {
      if (chrome?.storage?.local) {
        const result = await chrome.storage.local.get([chatKeyId]);
        return result[chatKeyId] || null;
      } else {
        const stored = localStorage.getItem(chatKeyId);
        return stored ? JSON.parse(stored) : null;
      }
    } catch (error) {
      console.error('Error getting chat data:', error);
      return null;
    }
  }

  // 加载聊天消息（通过chatKeyId）
  async loadChatMessages(chatKeyId: string): Promise<MessageProps[] | null> {
    try {
      const chatData = await this.getChatData(chatKeyId);
      return chatData ? chatData.messages : null;
    } catch (error) {
      console.error('Error loading chat messages:', error);
      return null;
    }
  }

  // 删除聊天
  async deleteChat(chatKeyId: string): Promise<void> {
    try {
      // 删除聊天数据
      if (chrome?.storage?.local) {
        await chrome.storage.local.remove([chatKeyId]);
      } else {
        localStorage.removeItem(chatKeyId);
      }

      // 从聊天列表中移除
      let chatList: SavedChatListItem[] = [];
      
      if (chrome?.storage?.local) {
        const result = await chrome.storage.local.get([this.CHAT_LIST_KEY]);
        chatList = result[this.CHAT_LIST_KEY] || [];
      } else {
        const stored = localStorage.getItem(this.CHAT_LIST_KEY);
        chatList = stored ? JSON.parse(stored) : [];
      }

      chatList = chatList.filter(chat => chat.chatKeyId !== chatKeyId);

      if (chrome?.storage?.local) {
        await chrome.storage.local.set({ [this.CHAT_LIST_KEY]: chatList });
      } else {
        localStorage.setItem(this.CHAT_LIST_KEY, JSON.stringify(chatList));
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
      throw error;
    }
  }

  // 重命名聊天
  async renameChat(chatKeyId: string, newName: string): Promise<void> {
    try {
      // 更新聊天数据的时间戳
      const chatData = await this.getChatData(chatKeyId);
      if (!chatData) {
        throw new Error('Chat not found');
      }

      chatData.updatedAt = new Date();

      if (chrome?.storage?.local) {
        await chrome.storage.local.set({ [chatKeyId]: chatData });
      } else {
        localStorage.setItem(chatKeyId, JSON.stringify(chatData));
      }

      // 更新聊天列表中的名称
      let chatList: SavedChatListItem[] = [];
      
      if (chrome?.storage?.local) {
        const result = await chrome.storage.local.get([this.CHAT_LIST_KEY]);
        chatList = result[this.CHAT_LIST_KEY] || [];
      } else {
        const stored = localStorage.getItem(this.CHAT_LIST_KEY);
        chatList = stored ? JSON.parse(stored) : [];
      }

      const chatIndex = chatList.findIndex(c => c.chatKeyId === chatKeyId);
      if (chatIndex !== -1) {
        chatList[chatIndex].savedChatName = newName;
        chatList[chatIndex].updatedAt = chatData.updatedAt;

        if (chrome?.storage?.local) {
          await chrome.storage.local.set({ [this.CHAT_LIST_KEY]: chatList });
        } else {
          localStorage.setItem(this.CHAT_LIST_KEY, JSON.stringify(chatList));
        }
      }
    } catch (error) {
      console.error('Error renaming chat:', error);
      throw error;
    }
  }

  // 获取聊天统计信息
  async getChatStats(): Promise<{ totalChats: number; totalMessages: number }> {
    try {
      const chatList = await this.getChatList();
      const totalChats = chatList.length;
      const totalMessages = chatList.reduce((sum, chat) => sum + chat.messageCount, 0);
      
      return { totalChats, totalMessages };
    } catch (error) {
      console.error('Error getting chat stats:', error);
      return { totalChats: 0, totalMessages: 0 };
    }
  }
} 