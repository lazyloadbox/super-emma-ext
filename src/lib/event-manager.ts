import { ActionType, ActionEvent } from './types';

/**
 * 事件管理器 - 处理浏览器插件的事件通信
 */
export class EventManager {
  private static instance: EventManager;
  private listeners: Map<ActionType, ((event: ActionEvent) => void)[]> = new Map();

  private constructor() {
    this.initializeRuntimeListener();
  }

  public static getInstance(): EventManager {
    if (!EventManager.instance) {
      EventManager.instance = new EventManager();
    }
    return EventManager.instance;
  }

  /**
   * 初始化 runtime 消息监听器
   */
  private initializeRuntimeListener() {
    if (chrome?.runtime?.onMessage) {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type && message.actionType) {
          const event: ActionEvent = {
            type: message.actionType,
            data: message.data,
            timestamp: message.timestamp || Date.now()
          };
          this.handleEvent(event);
        }
        return true;
      });
    }
  }

  /**
   * 发送事件到其他组件
   */
  public async sendEvent(type: ActionType, data?: any): Promise<void> {
    const event: ActionEvent = {
      type,
      data,
      timestamp: Date.now()
    };

    // 存储最后一个事件到 storage
    await chrome.storage.local.set({ lastAction: event });

    // 发送 runtime 消息
    try {
      await chrome.runtime.sendMessage({
        type: 'ACTION_EVENT',
        actionType: type,
        data,
        timestamp: event.timestamp
      });
    } catch (error) {
      console.warn('Failed to send runtime message:', error);
    }

    // 触发本地监听器
    this.handleEvent(event);
  }

  /**
   * 监听特定类型的事件
   */
  public addEventListener(type: ActionType, callback: (event: ActionEvent) => void): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type)!.push(callback);
  }

  /**
   * 移除事件监听器
   */
  public removeEventListener(type: ActionType, callback: (event: ActionEvent) => void): void {
    const listeners = this.listeners.get(type);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * 处理事件
   */
  private handleEvent(event: ActionEvent): void {
    const listeners = this.listeners.get(event.type);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error(`Error in event listener for ${event.type}:`, error);
        }
      });
    }
  }

  /**
   * 监听 storage 变化
   */
  public initializeStorageListener(): void {
    if (chrome?.storage?.onChanged) {
      chrome.storage.onChanged.addListener((changes) => {
        if (changes.lastAction && changes.lastAction.newValue) {
          const event = changes.lastAction.newValue as ActionEvent;
          this.handleEvent(event);
        }
      });
    }
  }
}

// 导出单例实例
export const eventManager = EventManager.getInstance(); 