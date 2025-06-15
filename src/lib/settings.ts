import { storageUtil, STORAGE_KEYS } from './storage-util';

export type AIProvider = 'lmstudio' | 'ollama' | 'custom';

export interface AIProviderConfig {
  id: string;
  name: string;
  type: 'lmstudio' | 'ollama' | 'openai-like';
  url: string;
  apiKey?: string;
  selectedModels: string[];
  isCustom?: boolean;
  enabled: boolean;
}

export interface ExtensionSettings {
  providers: Record<string, AIProviderConfig>;
  theme: 'light' | 'dark' | 'system';
}

export const defaultProviders: Record<string, AIProviderConfig> = {
  'lmstudio': {
    id: 'lmstudio',
    name: 'LM Studio',
    type: 'lmstudio',
    url: 'http://192.168.1.148:12345',
    selectedModels: [],
    enabled: false,
    isCustom: true, // Allow deletion
  },
  'ollama': {
    id: 'ollama',
    name: 'Ollama',
    type: 'ollama',
    url: 'http://localhost:11434',
    selectedModels: [],
    enabled: false,
    isCustom: true, // Allow deletion
  },
};

export const defaultSettings: ExtensionSettings = {
  providers: { ...defaultProviders },
  theme: 'system',
};

export class SettingsManager {
  private static instance: SettingsManager;
  private settings: ExtensionSettings = { ...defaultSettings };

  private constructor() {
    this.loadSettings();
  }

  public static getInstance(): SettingsManager {
    if (!SettingsManager.instance) {
      SettingsManager.instance = new SettingsManager();
    }
    return SettingsManager.instance;
  }

  public async loadSettings(): Promise<ExtensionSettings> {
    try {
      const loadedSettings = await storageUtil.get<ExtensionSettings>(STORAGE_KEYS.EXTENSION_SETTINGS);
      if (loadedSettings) {
        // Check if this is old format and migrate
        if ('aiProvider' in loadedSettings || 'lmStudioUrl' in loadedSettings) {
          this.settings = this.migrateOldSettings(loadedSettings);
          // Save the migrated settings
          await this.saveSettings(this.settings);
        } else {
          this.settings = { ...defaultSettings, ...loadedSettings };
          // Ensure default providers exist
          this.settings.providers = { ...defaultProviders, ...this.settings.providers };
        }
      }
    } catch (error) {
      console.warn('Failed to load settings:', error);
      this.settings = { ...defaultSettings };
    }
    return this.settings;
  }

  private migrateOldSettings(oldSettings: any): ExtensionSettings {
    console.log('Migrating old settings format to new format');
    
    const newSettings: ExtensionSettings = {
      providers: { ...defaultProviders },
      theme: oldSettings.theme || 'system',
    };

    // Update LM Studio provider if it was configured
    if (oldSettings.lmStudioUrl) {
      newSettings.providers['lmstudio'] = {
        ...newSettings.providers['lmstudio'],
        url: oldSettings.lmStudioUrl,
        selectedModels: oldSettings.selectedLmStudioModels || [],
      };
    }

    // Update Ollama provider if it was configured
    if (oldSettings.ollamaUrl) {
      newSettings.providers['ollama'] = {
        ...newSettings.providers['ollama'],
        url: oldSettings.ollamaUrl,
        selectedModels: oldSettings.selectedOllamaModels || [],
      };
    }

    return newSettings;
  }

  public async saveSettings(newSettings: Partial<ExtensionSettings>): Promise<void>;
  public async saveSettings(newSettings: ExtensionSettings): Promise<void>;
  public async saveSettings(newSettings: Partial<ExtensionSettings> | ExtensionSettings): Promise<void> {
    // If it's a complete settings object, replace entirely; otherwise merge
    if ('providers' in newSettings && 'theme' in newSettings) {
      // Complete settings object
      this.settings = newSettings as ExtensionSettings;
    } else {
      // Partial settings object
      this.settings = { ...this.settings, ...newSettings };
    }
    
    try {
      await storageUtil.set(STORAGE_KEYS.EXTENSION_SETTINGS, this.settings);
      console.log('Settings saved:', this.settings);
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  }

  public getSettings(): ExtensionSettings {
    return { ...this.settings };
  }

  public getSetting<K extends keyof ExtensionSettings>(key: K): ExtensionSettings[K] {
    return this.settings[key];
  }

  public async addProvider(provider: Omit<AIProviderConfig, 'id'>): Promise<string> {
    const id = `custom-${Date.now()}`;
    const newProvider: AIProviderConfig = {
      ...provider,
      id,
      isCustom: true,
    };
    
    const updatedSettings = {
      ...this.settings,
      providers: {
        ...this.settings.providers,
        [id]: newProvider,
      },
    };
    
    await this.saveSettings(updatedSettings);
    return id;
  }

  public async updateProvider(id: string, updates: Partial<AIProviderConfig>): Promise<void> {
    if (!this.settings.providers[id]) {
      throw new Error(`Provider ${id} not found`);
    }
    
    // 确保更新包含所有必要字段
    const updatedProvider = { 
      ...this.settings.providers[id], 
      ...updates 
    };
    
    // 确保必要字段存在
    if (!updatedProvider.name) updatedProvider.name = this.settings.providers[id].name;
    if (!updatedProvider.url) updatedProvider.url = this.settings.providers[id].url;
    if (!updatedProvider.selectedModels) updatedProvider.selectedModels = this.settings.providers[id].selectedModels;
    
    const updatedSettings = {
      ...this.settings,
      providers: {
        ...this.settings.providers,
        [id]: updatedProvider,
      },
    };
    
    await this.saveSettings(updatedSettings);
  }

  public async deleteProvider(id: string): Promise<void> {
    if (!this.settings.providers[id]) {
      throw new Error(`Provider ${id} not found`);
    }
    
    const { [id]: removed, ...remainingProviders } = this.settings.providers;
    const updatedSettings = {
      ...this.settings,
      providers: remainingProviders,
    };
    
    await this.saveSettings(updatedSettings);
  }

  public async resetSettings(): Promise<void> {
    await this.saveSettings(defaultSettings);
  }
} 