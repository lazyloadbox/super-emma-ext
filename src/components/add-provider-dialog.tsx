import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { AIProviderConfig } from '../lib/settings';
import { Plus, X, CheckCircle, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface AddProviderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (provider: Omit<AIProviderConfig, 'id'>) => Promise<void>;
  onTest?: (config: Partial<AIProviderConfig>) => Promise<{ success: boolean; models?: string[] }>;
}

export function AddProviderDialog({ isOpen, onClose, onAdd, onTest }: AddProviderDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'openai-like' as const,
    url: '',
    apiKey: '',
  });
  
  const [isAdding, setIsAdding] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'openai-like',
      url: '',
      apiKey: '',
    });
    setErrors({});
    setTestStatus('idle');
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Provider name is required';
    }
    
    if (!formData.url.trim()) {
      newErrors.url = 'Server URL is required';
    } else {
      try {
        new URL(formData.url);
      } catch {
        newErrors.url = 'Please enter a valid URL';
      }
    }
    
    if (formData.type === 'openai-like' && !formData.apiKey.trim()) {
      newErrors.apiKey = 'API key is required for OpenAI-like providers';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleTest = async () => {
    if (!validateForm() || !onTest) return;
    
    setIsTesting(true);
    setTestStatus('idle');
    
    try {
      const testConfig = {
        ...formData,
        selectedModels: [],
        enabled: true,
      };
      
      const result = await onTest(testConfig);
      setTestStatus(result.success ? 'success' : 'error');
    } catch (error) {
      console.error('Test failed:', error);
      setTestStatus('error');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsAdding(true);
    
    try {
      const newProvider: Omit<AIProviderConfig, 'id'> = {
        name: formData.name.trim(),
        type: formData.type,
        url: formData.url.trim(),
        apiKey: formData.apiKey.trim() || undefined,
        selectedModels: [],
        enabled: true,
      };
      
      await onAdd(newProvider);
      resetForm();
      onClose();
    } catch (error) {
      console.error('Failed to add provider:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const updateFormData = <K extends keyof typeof formData>(
    key: K,
    value: typeof formData[K]
  ) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: '' }));
    }
  };



  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add Custom AI Provider
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                resetForm();
                onClose();
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <div>
                <label htmlFor="provider-name" className="block text-sm font-medium mb-2">
                  Provider Name *
                </label>
                <Input
                  id="provider-name"
                  value={formData.name}
                  onChange={(e) => updateFormData('name', e.target.value)}
                  placeholder="My Custom Provider"
                  className={cn(errors.name && "border-red-500")}
                />
                {errors.name && (
                  <p className="text-xs text-red-600 mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label htmlFor="provider-type" className="block text-sm font-medium mb-2">
                  Provider Type
                </label>
                <select
                  id="provider-type"
                  value={formData.type}
                  onChange={(e) => updateFormData('type', e.target.value as 'openai-like')}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                >
                  <option value="openai-like">OpenAI-like API</option>
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  Currently supports OpenAI-compatible APIs
                </p>
              </div>

              <div>
                <label htmlFor="provider-url" className="block text-sm font-medium mb-2">
                  Server URL *
                </label>
                <div className="flex gap-2">
                  <Input
                    id="provider-url"
                    type="url"
                    value={formData.url}
                    onChange={(e) => updateFormData('url', e.target.value)}
                    placeholder="https://api.openai.com/v1"
                    className={cn("flex-1", errors.url && "border-red-500")}
                  />
                  <Button
                    type="button"
                    onClick={handleTest}
                    disabled={isTesting || !formData.url || !formData.name}
                    variant="outline"
                    size="sm"
                    className={cn(
                      testStatus === 'success' && 'border-green-500 text-green-600',
                      testStatus === 'error' && 'border-red-500 text-red-600'
                    )}
                  >
                    {isTesting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Test'
                    )}
                  </Button>
                </div>
                {errors.url && (
                  <p className="text-xs text-red-600 mt-1">{errors.url}</p>
                )}
                {testStatus === 'success' && (
                  <p className="text-xs text-green-600 mt-1">✓ Connection successful</p>
                )}
                {testStatus === 'error' && (
                  <p className="text-xs text-red-600 mt-1">✗ Connection failed</p>
                )}
              </div>

              <div>
                <label htmlFor="provider-apikey" className="block text-sm font-medium mb-2">
                  API Key *
                </label>
                <Input
                  id="provider-apikey"
                  type="password"
                  value={formData.apiKey}
                  onChange={(e) => updateFormData('apiKey', e.target.value)}
                  placeholder="sk-..."
                  className={cn(errors.apiKey && "border-red-500")}
                />
                {errors.apiKey && (
                  <p className="text-xs text-red-600 mt-1">{errors.apiKey}</p>
                )}
              </div>
            </div>



            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetForm();
                  onClose();
                }}
              >
                Cancel
              </Button>
              
              <Button
                type="submit"
                disabled={isAdding}
                className="flex items-center gap-2"
              >
                {isAdding ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {isAdding ? 'Adding...' : 'Add Provider'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 