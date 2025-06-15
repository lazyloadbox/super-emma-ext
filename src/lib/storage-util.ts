/**
 * 统一的Extension Storage工具类
 * 所有storage key都使用统一前缀: "lazyloadbox-emma-ext-"
 */

export type StorageArea = 'local' | 'sync';

export interface StorageChangeListener {
  (changes: { [key: string]: chrome.storage.StorageChange }): void;
}

export class ExtensionStorageUtil {
  private static instance: ExtensionStorageUtil;
  private readonly keyPrefix = 'lazyloadbox-emma-ext-';
  private listeners: Map<string, StorageChangeListener[]> = new Map();

  private constructor() {
    this.initializeStorageListener();
  }

  public static getInstance(): ExtensionStorageUtil {
    if (!ExtensionStorageUtil.instance) {
      ExtensionStorageUtil.instance = new ExtensionStorageUtil();
    }
    return ExtensionStorageUtil.instance;
  }

  /**
   * 生成带前缀的key
   */
  private getKey(key: string): string {
    return `${this.keyPrefix}${key}`;
  }

  /**
   * 移除前缀获取原始key
   */
  private getOriginalKey(prefixedKey: string): string {
    return prefixedKey.replace(this.keyPrefix, '');
  }

  /**
   * 检查是否在extension环境中
   */
  private isExtensionContext(): boolean {
    return typeof chrome !== 'undefined' && !!chrome.storage;
  }

  /**
   * 获取storage区域
   */
  private getStorageArea(area: StorageArea = 'local'): chrome.storage.StorageArea | null {
    if (!this.isExtensionContext()) {
      return null;
    }
    return area === 'sync' ? chrome.storage.sync : chrome.storage.local;
  }

  /**
   * 设置单个值
   */
  public async set(key: string, value: any, area: StorageArea = 'local'): Promise<void> {
    const prefixedKey = this.getKey(key);
    
    if (this.isExtensionContext()) {
      const storageArea = this.getStorageArea(area);
      if (storageArea) {
        await storageArea.set({ [prefixedKey]: value });
        return;
      }
    }
    
    // Fallback to localStorage for development
    localStorage.setItem(prefixedKey, JSON.stringify(value));
  }

  /**
   * 设置多个值
   */
  public async setMultiple(items: Record<string, any>, area: StorageArea = 'local'): Promise<void> {
    const prefixedItems: Record<string, any> = {};
    for (const [key, value] of Object.entries(items)) {
      prefixedItems[this.getKey(key)] = value;
    }

    if (this.isExtensionContext()) {
      const storageArea = this.getStorageArea(area);
      if (storageArea) {
        await storageArea.set(prefixedItems);
        return;
      }
    }

    // Fallback to localStorage for development
    for (const [prefixedKey, value] of Object.entries(prefixedItems)) {
      localStorage.setItem(prefixedKey, JSON.stringify(value));
    }
  }

  /**
   * 获取单个值
   */
  public async get<T = any>(key: string, area: StorageArea = 'local'): Promise<T | null> {
    const prefixedKey = this.getKey(key);

    if (this.isExtensionContext()) {
      const storageArea = this.getStorageArea(area);
      if (storageArea) {
        const result = await storageArea.get([prefixedKey]);
        return result[prefixedKey] ?? null;
      }
    }

    // Fallback to localStorage for development
    const stored = localStorage.getItem(prefixedKey);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return stored as T;
      }
    }
    return null;
  }

  /**
   * 获取多个值
   */
  public async getMultiple<T = Record<string, any>>(keys: string[], area: StorageArea = 'local'): Promise<T> {
    const prefixedKeys = keys.map(key => this.getKey(key));

    if (this.isExtensionContext()) {
      const storageArea = this.getStorageArea(area);
      if (storageArea) {
        const result = await storageArea.get(prefixedKeys);
        // Convert back to original keys
        const originalResult: Record<string, any> = {};
        for (const [prefixedKey, value] of Object.entries(result)) {
          const originalKey = this.getOriginalKey(prefixedKey);
          originalResult[originalKey] = value;
        }
        return originalResult as T;
      }
    }

    // Fallback to localStorage for development
    const result: Record<string, any> = {};
    for (const key of keys) {
      const prefixedKey = this.getKey(key);
      const stored = localStorage.getItem(prefixedKey);
      if (stored) {
        try {
          result[key] = JSON.parse(stored);
        } catch {
          result[key] = stored;
        }
      }
    }
    return result as T;
  }

  /**
   * 获取所有值
   */
  public async getAll<T = Record<string, any>>(area: StorageArea = 'local'): Promise<T> {
    if (this.isExtensionContext()) {
      const storageArea = this.getStorageArea(area);
      if (storageArea) {
        const result = await storageArea.get(null);
        // Filter only our prefixed keys and convert back to original keys
        const filteredResult: Record<string, any> = {};
        for (const [key, value] of Object.entries(result)) {
          if (key.startsWith(this.keyPrefix)) {
            const originalKey = this.getOriginalKey(key);
            filteredResult[originalKey] = value;
          }
        }
        return filteredResult as T;
      }
    }

    // Fallback to localStorage for development
    const result: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.keyPrefix)) {
        const originalKey = this.getOriginalKey(key);
        const stored = localStorage.getItem(key);
        if (stored) {
          try {
            result[originalKey] = JSON.parse(stored);
          } catch {
            result[originalKey] = stored;
          }
        }
      }
    }
    return result as T;
  }

  /**
   * 删除单个值
   */
  public async remove(key: string, area: StorageArea = 'local'): Promise<void> {
    const prefixedKey = this.getKey(key);

    if (this.isExtensionContext()) {
      const storageArea = this.getStorageArea(area);
      if (storageArea) {
        await storageArea.remove([prefixedKey]);
        return;
      }
    }

    // Fallback to localStorage for development
    localStorage.removeItem(prefixedKey);
  }

  /**
   * 删除多个值
   */
  public async removeMultiple(keys: string[], area: StorageArea = 'local'): Promise<void> {
    const prefixedKeys = keys.map(key => this.getKey(key));

    if (this.isExtensionContext()) {
      const storageArea = this.getStorageArea(area);
      if (storageArea) {
        await storageArea.remove(prefixedKeys);
        return;
      }
    }

    // Fallback to localStorage for development
    for (const prefixedKey of prefixedKeys) {
      localStorage.removeItem(prefixedKey);
    }
  }

  /**
   * 清空所有数据
   */
  public async clear(area: StorageArea = 'local'): Promise<void> {
    if (this.isExtensionContext()) {
      const storageArea = this.getStorageArea(area);
      if (storageArea) {
        // Get all keys with our prefix and remove them
        const allData = await storageArea.get(null);
        const keysToRemove = Object.keys(allData).filter(key => key.startsWith(this.keyPrefix));
        if (keysToRemove.length > 0) {
          await storageArea.remove(keysToRemove);
        }
        return;
      }
    }

    // Fallback to localStorage for development
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.keyPrefix)) {
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) {
      localStorage.removeItem(key);
    }
  }

  /**
   * 添加storage变化监听器
   */
  public addChangeListener(key: string, listener: StorageChangeListener): void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, []);
    }
    this.listeners.get(key)!.push(listener);
  }

  /**
   * 移除storage变化监听器
   */
  public removeChangeListener(key: string, listener: StorageChangeListener): void {
    const keyListeners = this.listeners.get(key);
    if (keyListeners) {
      const index = keyListeners.indexOf(listener);
      if (index > -1) {
        keyListeners.splice(index, 1);
      }
      if (keyListeners.length === 0) {
        this.listeners.delete(key);
      }
    }
  }

  /**
   * 初始化storage变化监听器
   */
  private initializeStorageListener(): void {
    if (this.isExtensionContext()) {
      chrome.storage.onChanged.addListener((changes, areaName) => {
        // Filter changes for our prefixed keys
        const filteredChanges: { [key: string]: chrome.storage.StorageChange } = {};
        
        for (const [prefixedKey, change] of Object.entries(changes)) {
          if (prefixedKey.startsWith(this.keyPrefix)) {
            const originalKey = this.getOriginalKey(prefixedKey);
            filteredChanges[originalKey] = change;
            
            // Notify specific key listeners
            const keyListeners = this.listeners.get(originalKey);
            if (keyListeners) {
              for (const listener of keyListeners) {
                try {
                  listener({ [originalKey]: change });
                } catch (error) {
                  console.error('Error in storage change listener:', error);
                }
              }
            }
          }
        }

        // Notify all listeners if there are any changes
        if (Object.keys(filteredChanges).length > 0) {
          const allListeners = this.listeners.get('*');
          if (allListeners) {
            for (const listener of allListeners) {
              try {
                listener(filteredChanges);
              } catch (error) {
                console.error('Error in storage change listener:', error);
              }
            }
          }
        }
      });
    } else {
      // For development environment, listen to storage events
      window.addEventListener('storage', (e) => {
        if (e.key && e.key.startsWith(this.keyPrefix)) {
          const originalKey = this.getOriginalKey(e.key);
          const change: chrome.storage.StorageChange = {
            oldValue: e.oldValue ? JSON.parse(e.oldValue) : undefined,
            newValue: e.newValue ? JSON.parse(e.newValue) : undefined
          };

          // Notify specific key listeners
          const keyListeners = this.listeners.get(originalKey);
          if (keyListeners) {
            for (const listener of keyListeners) {
              try {
                listener({ [originalKey]: change });
              } catch (error) {
                console.error('Error in storage change listener:', error);
              }
            }
          }

          // Notify all listeners
          const allListeners = this.listeners.get('*');
          if (allListeners) {
            for (const listener of allListeners) {
              try {
                listener({ [originalKey]: change });
              } catch (error) {
                console.error('Error in storage change listener:', error);
              }
            }
          }
        }
      });
    }
  }

  /**
   * 获取存储使用情况（仅在extension环境中可用）
   */
  public async getUsage(area: StorageArea = 'local'): Promise<{ bytesInUse: number } | null> {
    if (!this.isExtensionContext()) {
      return null;
    }

    const storageArea = this.getStorageArea(area);
    if (!storageArea || !storageArea.getBytesInUse) {
      return null;
    }

    try {
      // Get all our prefixed keys
      const allData = await storageArea.get(null);
      const ourKeys = Object.keys(allData).filter(key => key.startsWith(this.keyPrefix));
      
      if (ourKeys.length === 0) {
        return { bytesInUse: 0 };
      }

      const bytesInUse = await storageArea.getBytesInUse(ourKeys);
      return { bytesInUse };
    } catch (error) {
      console.error('Error getting storage usage:', error);
      return null;
    }
  }
}

// 导出单例实例
export const storageUtil = ExtensionStorageUtil.getInstance();

// 导出常用的storage key常量
export const STORAGE_KEYS = {
  // 设置相关
  EXTENSION_SETTINGS: 'extension-settings',
  THEME: 'browser-ext-theme',
  
  // 聊天相关
  CHAT_LIST: 'saved-chat-list',
  CHAT_MESSAGES: 'chatMessages',
  
  // 标签页会话相关
  TAB_SESSIONS: 'tabSessions',
  
  // 事件相关
  LAST_ACTION: 'lastAction',
  
  // 页面内容相关
  LATEST_PAGE_MARKDOWN: 'latestPageMarkdown',
  PAGE_MARKDOWN_TIMESTAMP: 'pageMarkdownTimestamp',
} as const; 