import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import { AIProviderConfig } from '../../lib/settings';

interface ModelSelectorProps {
  lmStudioModels: string[];
  ollamaModels: string[];
  customModels: { [providerId: string]: string[] };
  enabledProviders: AIProviderConfig[];
  selectedModel: string;
  onModelChange: (model: string) => void;
  disabled?: boolean;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  lmStudioModels,
  ollamaModels,
  customModels,
  enabledProviders,
  selectedModel,
  onModelChange,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get all available models from all providers
  const allCustomModels = Object.values(customModels).flat();
  const allModels = [...lmStudioModels, ...ollamaModels, ...allCustomModels];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (model: string) => {
    onModelChange(model);
    setIsOpen(false);
  };

  const displayText = selectedModel || (allModels.length === 0 ? 'No models available' : 'Select a model');

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "w-full flex items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors",
          "text-foreground hover:bg-accent hover:text-accent-foreground",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          isOpen && "ring-1 ring-ring"
        )}
      >
        <span className={cn(
          "truncate",
          !selectedModel && allModels.length > 0 && "text-muted-foreground"
        )}>
          {displayText}
        </span>
        <ChevronDown className={cn(
          "h-4 w-4 text-muted-foreground transition-transform",
          isOpen && "rotate-180"
        )} />
      </button>

      {isOpen && !disabled && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-auto rounded-md border border-input bg-white dark:bg-gray-800 shadow-lg">
          {allModels.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              No models available
            </div>
          ) : (
            <>
              {lmStudioModels.length > 0 && (
                <>
                  <div className="px-3 py-1 text-xs font-medium text-muted-foreground bg-muted">
                    LM Studio
                  </div>
                  {lmStudioModels.map((model: string) => (
                    <button
                      key={`lmstudio-${model}`}
                      type="button"
                      onClick={() => handleSelect(model)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 text-sm transition-colors",
                        "hover:bg-accent hover:text-accent-foreground",
                        "focus-visible:outline-none focus-visible:bg-accent focus-visible:text-accent-foreground",
                        selectedModel === model && "bg-accent text-accent-foreground"
                      )}
                    >
                      <span className="truncate">{model}</span>
                      {selectedModel === model && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </button>
                  ))}
                </>
              )}
              
              {ollamaModels.length > 0 && (
                <>
                  {lmStudioModels.length > 0 && <div className="border-t border-border" />}
                  <div className="px-3 py-1 text-xs font-medium text-muted-foreground bg-muted">
                    Ollama
                  </div>
                  {ollamaModels.map((model: string) => (
                    <button
                      key={`ollama-${model}`}
                      type="button"
                      onClick={() => handleSelect(model)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 text-sm transition-colors",
                        "hover:bg-accent hover:text-accent-foreground",
                        "focus-visible:outline-none focus-visible:bg-accent focus-visible:text-accent-foreground",
                        selectedModel === model && "bg-accent text-accent-foreground"
                      )}
                    >
                      <span className="truncate">{model}</span>
                      {selectedModel === model && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </button>
                  ))}
                </>
              )}

              {/* Custom Providers */}
              {enabledProviders
                .filter(provider => provider.type === 'openai-like' && customModels[provider.id]?.length > 0)
                .map((provider, index) => (
                  <React.Fragment key={provider.id}>
                    {(lmStudioModels.length > 0 || ollamaModels.length > 0 || index > 0) && 
                      <div className="border-t border-border" />
                    }
                    <div className="px-3 py-1 text-xs font-medium text-muted-foreground bg-muted">
                      {provider.name}
                    </div>
                    {customModels[provider.id].map((model: string) => (
                      <button
                        key={`${provider.id}-${model}`}
                        type="button"
                        onClick={() => handleSelect(model)}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2 text-sm transition-colors",
                          "hover:bg-accent hover:text-accent-foreground",
                          "focus-visible:outline-none focus-visible:bg-accent focus-visible:text-accent-foreground",
                          selectedModel === model && "bg-accent text-accent-foreground"
                        )}
                      >
                        <span className="truncate">{model}</span>
                        {selectedModel === model && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </button>
                    ))}
                  </React.Fragment>
                ))
              }
            </>
          )}
        </div>
      )}
    </div>
  );
}; 