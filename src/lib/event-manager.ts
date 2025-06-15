import { ActionType, ActionEvent } from './types';
import { storageUtil, STORAGE_KEYS } from './storage-util';

/**
 * Event Manager - Handles event communication for browser extension
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
   * Initialize runtime message listener
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
   * Send event to other components
   */
  public async sendEvent(type: ActionType, data?: any): Promise<void> {
    const event: ActionEvent = {
      type,
      data,
      timestamp: Date.now()
    };

    // Store last event to storage
    await storageUtil.set(STORAGE_KEYS.LAST_ACTION, event);

    // Send runtime message
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

    // Trigger local listeners
    this.handleEvent(event);
  }

  /**
   * Listen for specific type of events
   */
  public addEventListener(type: ActionType, callback: (event: ActionEvent) => void): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type)!.push(callback);
  }

  /**
   * Remove event listener
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
   * Handle events
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
   * Listen for storage changes
   */
  public initializeStorageListener(): void {
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes[STORAGE_KEYS.LAST_ACTION] && changes[STORAGE_KEYS.LAST_ACTION].newValue) {
        const event = changes[STORAGE_KEYS.LAST_ACTION].newValue as ActionEvent;
        this.handleEvent(event);
      }
    };

    storageUtil.addChangeListener(STORAGE_KEYS.LAST_ACTION, handleStorageChange);
  }
}

// Export singleton instance
export const eventManager = EventManager.getInstance(); 