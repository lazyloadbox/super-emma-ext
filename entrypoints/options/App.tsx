import React, { useState, useEffect } from 'react';
import { ThemeProvider } from '../../src/lib/theme-provider';
import { Card, CardContent, CardHeader, CardTitle } from '../../src/components/ui/card';
import { Button } from '../../src/components/ui/button';
import { ThemeToggle } from '../../src/components/ui/theme-toggle';
import { Settings, Info, Palette, Bot, CheckCircle, Zap, Star, Shield, Cpu, Archive, MessageCircle } from 'lucide-react';
import { cn } from '../../src/lib/utils';
import { SettingsManager, ExtensionSettings, AIProviderConfig } from '../../src/lib/settings';
import { TabSessionsFeature, ChatFeature } from '../../src/features';
import { ToastProvider } from '../../src/components/ui/toast';
import { LMStudioClient } from '../../src/lib/lm-studio-client';
import { OllamaClient } from '../../src/lib/ollama-client';
import { AIProviderCard } from '../../src/components/ai-provider-card';
import { AddProviderDialog } from '../../src/components/add-provider-dialog';

type TabType = 'main' | 'settings' | 'features';
type FeatureTabType = 'ai-models' | 'performance' | 'security' | 'advanced' | 'tab-sessions' | 'chat';

const tabs = [
  { id: 'main' as TabType, label: 'Overview', icon: Info },
  { id: 'features' as TabType, label: 'Features', icon: Zap },
  { id: 'settings' as TabType, label: 'Settings', icon: Settings },
];

const featureTabs = [
  { id: 'chat' as FeatureTabType, label: 'Chat with Emma', icon: MessageCircle },


  { id: 'tab-sessions' as FeatureTabType, label: 'Saved Tab Sessions', icon: Archive },

];

function MainTab() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Super Emma - AI Chat Extension
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              A powerful AI chat extension that integrates with LM Studio for local AI model interactions.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">🤖 Local AI Models</h3>
                <p className="text-sm text-muted-foreground">
                  Connect to LM Studio and chat with your favorite local AI models.
                </p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">💭 Thinking Process</h3>
                <p className="text-sm text-muted-foreground">
                  View AI reasoning and thought processes for better understanding.
                </p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">🎨 Theme Support</h3>
                <p className="text-sm text-muted-foreground">
                  Beautiful light and dark themes with system preference support.
                </p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">⚡ Real-time Streaming</h3>
                <p className="text-sm text-muted-foreground">
                  Experience real-time AI responses with streaming support.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Quick Start</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">1</div>
              <div>
                <h4 className="font-medium">Install and Run LM Studio</h4>
                <p className="text-sm text-muted-foreground">Download LM Studio and start the local server</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">2</div>
              <div>
                <h4 className="font-medium">Configure Server URL</h4>
                <p className="text-sm text-muted-foreground">Set your LM Studio server URL in the Settings tab</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">3</div>
              <div>
                <h4 className="font-medium">Start Chatting</h4>
                <p className="text-sm text-muted-foreground">Open the side panel and start your AI conversation</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function FeaturesTab() {
  const [activeFeatureTab, setActiveFeatureTab] = useState<FeatureTabType>('chat');

  const renderFeatureContent = () => {
    switch (activeFeatureTab) {
      case 'chat':
        return <ChatFeature />;
      case 'tab-sessions':
        return <TabSessionsFeature />;
      default:
        return <ChatFeature />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Mobile Navigation - Horizontal Tabs */}
      <div className="lg:hidden">
        <div className="flex space-x-1 bg-muted p-1 rounded-lg overflow-x-auto">
          {featureTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFeatureTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0",
                  activeFeatureTab === tab.id
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex gap-6 h-full">
        {/* Vertical Navigation */}
        <div className="w-64 flex-shrink-0">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-lg">Feature Categories</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <nav className="space-y-1">
                {featureTabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveFeatureTab(tab.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium transition-colors rounded-none",
                        activeFeatureTab === tab.id
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Feature Content */}
        <div className="flex-1 min-w-0">
          {renderFeatureContent()}
        </div>
      </div>

      {/* Mobile Content */}
      <div className="lg:hidden">
        {renderFeatureContent()}
      </div>
    </div>
  );
}

function SettingsTab() {
  const [settings, setSettings] = useState<ExtensionSettings>({
    providers: {},
    theme: 'system',
  });
  const [showAddDialog, setShowAddDialog] = useState(false);
  const settingsManager = SettingsManager.getInstance();

  useEffect(() => {
    const loadSettings = async () => {
      const loadedSettings = await settingsManager.loadSettings();
      setSettings(loadedSettings);
    };
    loadSettings();

    // 监听存储变化，确保设置同步
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes['extension-settings']) {
        const newSettings = changes['extension-settings'].newValue;
        if (newSettings) {
          setSettings(newSettings);
          console.log('Settings synced from storage:', newSettings);
        }
      }
    };

    // 添加存储变化监听器
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.onChanged.addListener(handleStorageChange);
    }

    // 清理监听器
    return () => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.onChanged.removeListener(handleStorageChange);
      }
    };
  }, [settingsManager]);

  const handleProviderUpdate = async (id: string, updates: Partial<AIProviderConfig>) => {
    try {
      // 确保更新包含所有必要字段
      const updatedProvider = {
        ...settings.providers[id],
        ...updates,
        // 确保必要字段存在
        name: updates.name || settings.providers[id]?.name || '',
        url: updates.url || settings.providers[id]?.url || '',
        selectedModels: updates.selectedModels || settings.providers[id]?.selectedModels || [],
        apiKey: updates.apiKey !== undefined ? updates.apiKey : settings.providers[id]?.apiKey,
      };

      await settingsManager.updateProvider(id, updatedProvider);
      
      // 重新加载设置以确保同步
      const updatedSettings = await settingsManager.loadSettings();
      setSettings(updatedSettings);
      
      console.log('Provider updated:', id, updatedProvider);
    } catch (error) {
      console.error('Failed to update provider:', error);
      alert('Failed to update provider. Please try again.');
    }
  };

  const handleProviderDelete = async (id: string) => {
    try {
      await settingsManager.deleteProvider(id);
      const updatedSettings = await settingsManager.loadSettings();
      setSettings(updatedSettings);
      console.log('Provider deleted:', id);
    } catch (error) {
      console.error('Failed to delete provider:', error);
      alert('Failed to delete provider. Please try again.');
    }
  };

  const handleAddProvider = async (provider: Omit<AIProviderConfig, 'id'>) => {
    try {
      // 确保新 provider 包含所有必要字段
      const newProvider = {
        ...provider,
        name: provider.name || 'Unnamed Provider',
        url: provider.url || '',
        selectedModels: provider.selectedModels || [],
        apiKey: provider.apiKey || undefined,
      };

      const providerId = await settingsManager.addProvider(newProvider);
      const updatedSettings = await settingsManager.loadSettings();
      setSettings(updatedSettings);
      console.log('Provider added:', providerId, newProvider);
    } catch (error) {
      console.error('Failed to add provider:', error);
      alert('Failed to add provider. Please try again.');
    }
  };

  const handleSaveSettings = async () => {
    try {
      console.log('Attempting to save settings:', settings);
      
      // 验证设置数据完整性
      const validatedSettings = {
        ...settings,
        providers: Object.fromEntries(
          Object.entries(settings.providers).map(([id, provider]) => [
            id,
            {
              ...provider,
              name: provider.name || 'Unnamed Provider',
              url: provider.url || '',
              selectedModels: provider.selectedModels || [],
              apiKey: provider.apiKey || undefined,
            }
          ])
        )
      };

      await settingsManager.saveSettings(validatedSettings);
      
      // 重新加载设置以验证保存成功
      const savedSettings = await settingsManager.loadSettings();
      setSettings(savedSettings);
      
      console.log('Settings saved successfully:', savedSettings);
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings. Please try again.');
    }
  };

  const handleTestProvider = async (provider: Partial<AIProviderConfig>): Promise<{ success: boolean; models?: string[] }> => {
    try {
      if (provider.type === 'lmstudio') {
        const client = new LMStudioClient();
        client.setBaseUrl(provider.url || '');
        const success = await client.testConnection();
        if (success) {
          const models = await client.getModels();
          return { success: true, models };
        }
        return { success: false };
      } else if (provider.type === 'ollama') {
        const client = new OllamaClient();
        client.setBaseUrl(provider.url || '');
        const success = await client.testConnection();
        if (success) {
          const models = await client.getModels();
          return { success: true, models };
        }
        return { success: false };
      } else if (provider.type === 'openai-like') {
        const { OpenAILikeClient } = await import('../../src/lib/openai-like-client');
        const client = new OpenAILikeClient({
          baseUrl: provider.url || '',
          apiKey: provider.apiKey || '',
        });
        const success = await client.testConnection();
        if (success) {
          const models = await client.getModels();
          return { success: true, models };
        }
        return { success: false };
      }
      return { success: false };
    } catch (error) {
      console.error('Provider test failed:', error);
      return { success: false };
    }
  };

  return (
    <div className="space-y-6">
      {/* Theme Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Theme Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium">Theme Mode</h3>
              <p className="text-sm text-muted-foreground">
                Choose your preferred theme or follow system settings
              </p>
            </div>
            <ThemeToggle />
          </div>
        </CardContent>
      </Card>

      {/* AI Provider Configuration */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Bot className="h-5 w-5" />
              AI Provider Configuration
            </h2>
            <p className="text-sm text-muted-foreground">
              Configure your AI model providers and their settings
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleSaveSettings}
              variant="default"
              className="flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Save Settings
            </Button>
            <Button
              onClick={() => setShowAddDialog(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Bot className="h-4 w-4" />
              Add Custom Provider
            </Button>
          </div>
        </div>

        {/* Provider Cards */}
        <div className="space-y-4">
          {Object.values(settings.providers).map((provider, index) => (
            <AIProviderCard
              key={provider.id}
              provider={provider}
              onUpdate={(updates) => handleProviderUpdate(provider.id, updates)}
              onDelete={provider.isCustom ? () => handleProviderDelete(provider.id) : undefined}
              onTest={handleTestProvider}
              defaultOpen={index === 0}
            />
          ))}
        </div>

        {Object.keys(settings.providers).length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No AI Providers Configured</h3>
              <p className="text-muted-foreground mb-4">
                Add your first AI provider to start using the chat features
              </p>
              <Button onClick={() => setShowAddDialog(true)}>
                Add Provider
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Provider Dialog */}
      <AddProviderDialog
        isOpen={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onAdd={handleAddProvider}
        onTest={handleTestProvider}
      />
    </div>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('main');

  return (
    <ThemeProvider defaultTheme="light" storageKey="browser-ext-theme">
      <ToastProvider>
        <div className="min-h-screen w-full bg-background">
        <div className="w-full max-w-none mx-auto p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Super Emma</h1>
              <p className="text-muted-foreground">Configure your AI chat extension settings</p>
            </div>
            <ThemeToggle />
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-1 mb-6 bg-muted p-1 rounded-lg w-fit">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors",
                    activeTab === tab.id
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="min-h-[500px] w-full">
            {activeTab === 'main' && <MainTab />}
            {activeTab === 'features' && <FeaturesTab />}
            {activeTab === 'settings' && <SettingsTab />}
          </div>
        </div>
      </div>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App; 