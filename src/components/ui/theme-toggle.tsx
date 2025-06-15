import React, { useState, useRef, useEffect } from 'react';
import { Moon, Sun, Monitor, ChevronDown } from 'lucide-react';
import { useTheme } from '../../lib/theme-provider';
import { cn } from '../../lib/utils';

export function ThemeToggle() {
  const { theme, setTheme, actualTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const themes = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark', icon: Moon, label: 'Dark' },
    { value: 'system', icon: Monitor, label: 'System' },
  ] as const;

  const currentTheme = themes.find(t => t.value === theme) || themes[2];
  const CurrentIcon = currentTheme.icon;

  const handleThemeSelect = (newTheme: typeof theme) => {
    setTheme(newTheme);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-center gap-1 px-3 py-2 rounded-md transition-colors",
          "hover:bg-muted hover:text-foreground",
          "border border-input bg-background text-foreground shadow-sm",
          isOpen && "ring-1 ring-ring"
        )}
        title={`Current theme: ${currentTheme.label} (${actualTheme})`}
      >
        <CurrentIcon className="h-4 w-4" />
        <ChevronDown className={cn(
          "h-3 w-3 transition-transform",
          isOpen && "rotate-180"
        )} />
      </button>

      {isOpen && (
        <div className={cn(
          "absolute top-full right-0 z-50 mt-1 w-32 rounded-md",
          "border border-input bg-popover text-popover-foreground shadow-lg",
          "backdrop-blur-sm supports-[backdrop-filter]:bg-popover/95"
        )}>
          {themes.map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              onClick={() => handleThemeSelect(value)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                "focus-visible:outline-none focus-visible:bg-accent focus-visible:text-accent-foreground",
                "first:rounded-t-md last:rounded-b-md",
                theme === value && "bg-accent text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
              {theme === value && (
                <div className="ml-auto w-2 h-2 rounded-full bg-primary" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
} 