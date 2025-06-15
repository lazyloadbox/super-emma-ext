import React, { createContext, useContext, useEffect, useState } from 'react';
import { storageUtil, STORAGE_KEYS } from './storage-util';

type Theme = 'light' | 'dark' | 'system';

interface ThemeProviderContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  actualTheme: 'light' | 'dark';
}

const ThemeProviderContext = createContext<ThemeProviderContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

export function ThemeProvider({
  children,
  defaultTheme = 'light',
  storageKey = 'browser-ext-theme',
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Load theme from storage
    const loadTheme = async () => {
      try {
        const stored = await storageUtil.get<string>(STORAGE_KEYS.THEME);
        if (stored && ['light', 'dark', 'system'].includes(stored)) {
          setTheme(stored as Theme);
        }
      } catch (error) {
        console.warn('Failed to load theme from storage:', error);
      }
    };

    loadTheme();
  }, [storageKey]);

  useEffect(() => {
    // Listen for storage changes
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes[STORAGE_KEYS.THEME]) {
        const newTheme = changes[STORAGE_KEYS.THEME].newValue as Theme;
        if (newTheme && ['light', 'dark', 'system'].includes(newTheme)) {
          setTheme(newTheme);
          console.log('Theme synced from storage:', newTheme);
        }
      }
    };

    // Also listen for custom events within the same page context
    const handleCustomThemeChange = (e: CustomEvent) => {
      const newTheme = e.detail.theme as Theme;
      if (['light', 'dark', 'system'].includes(newTheme)) {
        setTheme(newTheme);
        console.log('Theme synced from custom event:', newTheme);
      }
    };

    // Set up storage listener
    storageUtil.addChangeListener(STORAGE_KEYS.THEME, handleStorageChange);
    window.addEventListener('themeChange', handleCustomThemeChange as EventListener);

    return () => {
      storageUtil.removeChangeListener(STORAGE_KEYS.THEME, handleStorageChange);
      window.removeEventListener('themeChange', handleCustomThemeChange as EventListener);
    };
  }, [storageKey]);

  const handleSetTheme = async (newTheme: Theme) => {
    setTheme(newTheme);
    
    // Save to storage
    try {
      await storageUtil.set(STORAGE_KEYS.THEME, newTheme);
    } catch (error) {
      console.warn('Failed to save theme to storage:', error);
    }

    // Dispatch custom event for same-page synchronization
    window.dispatchEvent(new CustomEvent('themeChange', {
      detail: { theme: newTheme }
    }));

    console.log('Theme changed:', newTheme);
  };

  useEffect(() => {
    const updateActualTheme = () => {
      if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        setActualTheme(systemTheme);
      } else {
        setActualTheme(theme);
      }
    };

    updateActualTheme();

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', updateActualTheme);
      return () => mediaQuery.removeEventListener('change', updateActualTheme);
    }
  }, [theme]);

  useEffect(() => {
    // Apply theme to document
    const root = document.documentElement;
    
    // Remove all theme classes first
    root.classList.remove('light', 'dark');
    
    // Add the current theme class
    root.classList.add(actualTheme);
    
    // Also set data attribute for better CSS targeting
    root.setAttribute('data-theme', actualTheme);
    
    // Set color-scheme for better browser integration
    root.style.colorScheme = actualTheme;
    
    console.log('Theme applied:', actualTheme, 'Classes:', root.classList.toString());
  }, [actualTheme]);

  const value = {
    theme,
    setTheme: handleSetTheme,
    actualTheme,
  };

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
} 