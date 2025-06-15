import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from './ui/collapsible';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { AIProviderConfig } from '../lib/settings';
import { Bot, Settings, Trash2, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { LMStudioClient } from '../lib/lm-studio-client';
import { OllamaClient } from '../lib/ollama-client';

interface AIProviderCardProps {
  provider: AIProviderConfig;
  onUpdate: (updates: Partial<AIProviderConfig>) => Promise<void>;
  onDelete?: () => Promise<void>;
  onTest?: (provider: AIProviderConfig) => Promise<{ success: boolean; models?: string[] }>;
  defaultOpen?: boolean;
}

export function AIProviderCard({ 
  provider, 
  onUpdate, 
  onDelete, 
  onTest,
  defaultOpen = false 
}: AIProviderCardProps) {
  const [localConfig, setLocalConfig] = useState<AIProviderConfig>(provider);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [isModelSelectionMode, setIsModelSelectionMode] = useState(false);
  const [modelFilter, setModelFilter] = useState('');
  const [tempSelectedModels, setTempSelectedModels] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    setLocalConfig(provider);
    setHasChanges(false);
    setTempSelectedModels(provider.selectedModels);
  }, [provider]);

  useEffect(() => {
    const hasConfigChanges = JSON.stringify(localConfig) !== JSON.stringify(provider);
    setHasChanges(hasConfigChanges);
  }, [localConfig, provider]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    
    try {
      await onUpdate(localConfig);
      setSaveSuccess(true);
      setHasChanges(false);
      setIsModelSelectionMode(false);
      setModelFilter('');
      // Close card after successful save
      setTimeout(() => {
        setSaveSuccess(false);
        setIsOpen(false);
      }, 1500);
    } catch (error) {
      console.error('Failed to save provider:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setLocalConfig(provider);
    setTempSelectedModels(provider.selectedModels);
    setHasChanges(false);
    setIsModelSelectionMode(false);
    setModelFilter('');
    // Close card after cancel
    setIsOpen(false);
  };

  const handleModelSelectionToggle = async () => {
    if (isModelSelectionMode) {
      // Save selected models
      updateLocalConfig('selectedModels', tempSelectedModels);
      setIsModelSelectionMode(false);
      setModelFilter('');
    } else {
      // Enter selection mode and discover models automatically
      setTempSelectedModels(localConfig.selectedModels);
      setIsModelSelectionMode(true);
      
      // Always discover models when entering selection mode to show all available options
      if (onTest) {
        await handleTest();
      }
    }
  };

  const toggleTempModel = (model: string, checked: boolean) => {
    if (checked) {
      setTempSelectedModels(prev => [...prev, model]);
    } else {
      setTempSelectedModels(prev => prev.filter(m => m !== model));
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (onDelete) {
      await onDelete();
      setShowDeleteConfirm(false);
    }
  };

  const handleTest = async () => {
    if (!onTest) return;
    
    setIsTesting(true);
    setTestStatus('idle');
    
    try {
      const result = await onTest(localConfig);
      if (result.success) {
        setTestStatus('success');
        if (result.models) {
          setAvailableModels(result.models);
        }
      } else {
        setTestStatus('error');
        setAvailableModels([]);
      }
    } catch (error) {
      console.error('Test failed:', error);
      setTestStatus('error');
      setAvailableModels([]);
    } finally {
      setIsTesting(false);
    }
  };

  // Load available models on component mount if provider has models
  useEffect(() => {
    if (localConfig.selectedModels.length > 0 && availableModels.length === 0) {
      setAvailableModels(localConfig.selectedModels);
    }
  }, [localConfig.selectedModels]);

  const updateLocalConfig = <K extends keyof AIProviderConfig>(
    key: K,
    value: AIProviderConfig[K]
  ) => {
    setLocalConfig(prev => ({ ...prev, [key]: value }));
  };

  const toggleModel = (model: string, checked: boolean) => {
    const updatedModels = checked 
      ? [...localConfig.selectedModels, model]
      : localConfig.selectedModels.filter(m => m !== model);
    
    updateLocalConfig('selectedModels', updatedModels);
  };

  const getProviderIcon = () => {
    switch (provider.type) {
      case 'lmstudio':
        return '🤖';
      case 'ollama':
        return '🦙';
      case 'openai-like':
        return '⚡';
      default:
        return '🔧';
    }
  };

  const getStatusColor = () => {
    if (testStatus === 'success') return 'text-green-600';
    if (testStatus === 'error') return 'text-red-600';
    return 'text-muted-foreground';
  };

  const getStatusIcon = () => {
    if (isTesting) return <Loader2 className="h-4 w-4 animate-spin" />;
    if (testStatus === 'success') return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (testStatus === 'error') return <AlertCircle className="h-4 w-4 text-red-600" />;
    return <Settings className="h-4 w-4" />;
  };

  return (
    <Card className={cn("transition-all", localConfig.enabled ? "" : "opacity-60")}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-3">
          <div className="flex items-center">
            <div className="flex items-center gap-3 flex-1">
              <span className="text-2xl">{getProviderIcon()}</span>
              <div className="flex-1 text-left">
                <h3 className="font-semibold">{localConfig.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {localConfig.type} • {localConfig.url}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon()}
              </div>
            </div>
            <div className="flex items-center gap-3 ml-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={localConfig.enabled}
                  onCheckedChange={(checked) => updateLocalConfig('enabled', checked)}
                  id={`${provider.id}-enabled-switch`}
                />
                <span className="text-xs text-muted-foreground min-w-[60px]">
                  {localConfig.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <CollapsibleTrigger className="hover:bg-muted/50 rounded p-1">
                <span className="sr-only">Toggle provider details</span>
              </CollapsibleTrigger>
            </div>
          </div>
        </CardHeader>
        
        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* Basic Configuration */}
            <div className="space-y-4">

              <div>
                <label htmlFor={`${provider.id}-name`} className="block text-sm font-medium mb-2">
                  Provider Name
                </label>
                <Input
                  id={`${provider.id}-name`}
                  value={localConfig.name}
                  onChange={(e) => updateLocalConfig('name', e.target.value)}
                  placeholder="Enter provider name"
                />
              </div>

              <div>
                <label htmlFor={`${provider.id}-url`} className="block text-sm font-medium mb-2">
                  Server URL
                </label>
                <div className="flex gap-2">
                  <Input
                    id={`${provider.id}-url`}
                    type="url"
                    value={localConfig.url}
                    onChange={(e) => updateLocalConfig('url', e.target.value)}
                    placeholder="http://localhost:11434"
                    className="flex-1"
                  />
                  <Button
                    onClick={handleTest}
                    disabled={isTesting || !localConfig.url}
                    variant="outline"
                    size="sm"
                    className={cn(
                      testStatus === 'success' && 'border-green-500 text-green-600',
                      testStatus === 'error' && 'border-red-500 text-red-600'
                    )}
                  >
                    {isTesting ? 'Testing...' : 'Test'}
                  </Button>
                </div>
                {testStatus === 'success' && (
                  <p className="text-xs text-green-600 mt-1">✓ Connection successful</p>
                )}
                {testStatus === 'error' && (
                  <p className="text-xs text-red-600 mt-1">✗ Connection failed</p>
                )}
              </div>

              {/* API Key for OpenAI-like providers */}
              {localConfig.type === 'openai-like' && (
                <div>
                  <label htmlFor={`${provider.id}-apikey`} className="block text-sm font-medium mb-2">
                    API Key
                  </label>
                  <Input
                    id={`${provider.id}-apikey`}
                    type="password"
                    value={localConfig.apiKey || ''}
                    onChange={(e) => updateLocalConfig('apiKey', e.target.value)}
                    placeholder="Enter your API key"
                  />
                </div>
              )}

              {/* Model Management Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Model Management</h4>
                  <Button
                    onClick={handleModelSelectionToggle}
                    disabled={isTesting || !localConfig.url}
                    variant={isModelSelectionMode ? "default" : "outline"}
                    size="sm"
                  >
                    {isTesting ? 'Discovering...' : isModelSelectionMode ? 'Save Selected Models' : 'Select Models'}
                  </Button>
                </div>
                
                {testStatus === 'success' && (
                  <p className="text-xs text-green-600">✓ {availableModels.length} models found</p>
                )}
                {testStatus === 'error' && (
                  <p className="text-xs text-red-600">✗ Failed to discover models</p>
                )}

                {availableModels.length > 0 && (
                  <div>
                    {isModelSelectionMode ? (
                      <div className="space-y-3">
                        <div>
                          <label htmlFor={`${provider.id}-model-filter`} className="block text-sm font-medium mb-2">
                            Filter Models
                          </label>
                          <Input
                            id={`${provider.id}-model-filter`}
                            type="text"
                            value={modelFilter}
                            onChange={(e) => setModelFilter(e.target.value)}
                            placeholder="Search models..."
                            className="w-full"
                          />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">
                            Select models to use in chat interface:
                          </p>
                          <div className="max-h-60 overflow-y-auto space-y-2 border rounded-md p-3 bg-muted/30">
                            {availableModels
                              .filter(model => model.toLowerCase().includes(modelFilter.toLowerCase()))
                              .map((model) => (
                                <label key={model} className="flex items-center gap-2 cursor-pointer hover:bg-background/50 p-1 rounded">
                                  <input
                                    type="checkbox"
                                    checked={tempSelectedModels.includes(model)}
                                    onChange={(e) => toggleTempModel(model, e.target.checked)}
                                    className="rounded border-input"
                                  />
                                  <span className="text-sm flex-1">{model}</span>
                                  {tempSelectedModels.includes(model) && (
                                    <CheckCircle className="h-3 w-3 text-green-600" />
                                  )}
                                </label>
                              ))}
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            {tempSelectedModels.length} of {availableModels.length} models selected
                            {modelFilter && ` (${availableModels.filter(model => model.toLowerCase().includes(modelFilter.toLowerCase())).length} shown)`}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Currently selected models:
                        </p>
                        {localConfig.selectedModels.length > 0 ? (
                          <div className="max-h-40 overflow-y-auto space-y-1 border rounded-md p-3 bg-muted/30">
                            {localConfig.selectedModels.map((model) => (
                              <div key={model} className="flex items-center gap-2 p-1">
                                <CheckCircle className="h-3 w-3 text-green-600" />
                                <span className="text-sm">{model}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-3 text-muted-foreground border rounded-md bg-muted/30">
                            <p className="text-sm">No models selected</p>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {localConfig.selectedModels.length} of {availableModels.length} models selected
                        </p>
                      </div>
                    )}
                  </div>
                )}
                
                {availableModels.length === 0 && !isTesting && (
                  <div className="text-center py-4 text-muted-foreground">
                    <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Click "Discover Models" to find available models</p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-2">
                {saveSuccess && (
                  <span className="text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    Saved successfully
                  </span>
                )}
                {isModelSelectionMode && (
                  <span className="text-sm text-blue-600 flex items-center gap-1">
                    <Settings className="h-4 w-4" />
                    Model selection mode
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {onDelete && !isModelSelectionMode && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteClick}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                )}
                
                {hasChanges && (
                  <Button
                    onClick={handleCancel}
                    disabled={isSaving}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                )}
                
                <Button
                  onClick={handleSave}
                  disabled={isSaving || (!hasChanges && !isModelSelectionMode)}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete AI Provider</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{localConfig.name}"? This action cannot be undone and will remove all configurations for this provider.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Provider
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
} 