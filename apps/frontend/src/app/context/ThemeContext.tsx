import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { ThemeName, themes, applyTheme } from './themes';

interface ThemeContextType {
  currentTheme: ThemeName;
  setTheme: (theme: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [currentTheme, setCurrentThemeState] = useState<ThemeName>('apple-light');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load theme from localStorage on mount
    const savedTheme = localStorage.getItem('smartsite-theme') as ThemeName | null;
    
    // Validate savedTheme exists in themes, otherwise use default
    const theme = (savedTheme && themes[savedTheme]) ? savedTheme : 'apple-light';
    
    setCurrentThemeState(theme);
    const themeData = themes[theme];
    if (themeData) {
      applyTheme(themeData);
    }
    
    setIsLoaded(true);
  }, []);

  const setTheme = (theme: ThemeName) => {
    if (themes[theme]) {
      setCurrentThemeState(theme);
      applyTheme(themes[theme]);
      localStorage.setItem('smartsite-theme', theme);
      window.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme } }));
    }
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme }}>
      {isLoaded && children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
