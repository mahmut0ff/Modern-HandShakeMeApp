import { useState, useEffect, useCallback } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface Theme {
  mode: ThemeMode;
  isDark: boolean;
  colors: {
    // Background colors
    background: string;
    surface: string;
    card: string;
    
    // Text colors
    text: string;
    textSecondary: string;
    textMuted: string;
    
    // Primary colors
    primary: string;
    primaryLight: string;
    primaryDark: string;
    
    // Status colors
    success: string;
    warning: string;
    error: string;
    info: string;
    
    // Border and divider colors
    border: string;
    divider: string;
    
    // Interactive colors
    ripple: string;
    overlay: string;
    
    // Shadow colors
    shadow: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    full: number;
  };
  typography: {
    fontSizes: {
      xs: number;
      sm: number;
      md: number;
      lg: number;
      xl: number;
      xxl: number;
    };
    fontWeights: {
      normal: string;
      medium: string;
      semibold: string;
      bold: string;
    };
    lineHeights: {
      tight: number;
      normal: number;
      relaxed: number;
    };
  };
}

const lightTheme: Theme = {
  mode: 'light',
  isDark: false,
  colors: {
    background: '#F8F7FC',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    
    text: '#1F2937',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    
    primary: '#0165FB',
    primaryLight: '#3B82F6',
    primaryDark: '#1E40AF',
    
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    
    border: '#E5E7EB',
    divider: '#F3F4F6',
    
    ripple: 'rgba(1, 101, 251, 0.1)',
    overlay: 'rgba(0, 0, 0, 0.5)',
    
    shadow: '#000000',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  typography: {
    fontSizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
    },
    fontWeights: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeights: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.8,
    },
  },
};

const darkTheme: Theme = {
  ...lightTheme,
  mode: 'dark',
  isDark: true,
  colors: {
    background: '#0F172A',
    surface: '#1E293B',
    card: '#334155',
    
    text: '#F8FAFC',
    textSecondary: '#CBD5E1',
    textMuted: '#94A3B8',
    
    primary: '#3B82F6',
    primaryLight: '#60A5FA',
    primaryDark: '#2563EB',
    
    success: '#22C55E',
    warning: '#EAB308',
    error: '#F87171',
    info: '#60A5FA',
    
    border: '#475569',
    divider: '#334155',
    
    ripple: 'rgba(59, 130, 246, 0.2)',
    overlay: 'rgba(0, 0, 0, 0.7)',
    
    shadow: '#000000',
  },
};

const THEME_STORAGE_KEY = 'app_theme_mode';

export const useTheme = () => {
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const [systemColorScheme, setSystemColorScheme] = useState<ColorSchemeName>(
    Appearance.getColorScheme()
  );

  // Calculate current theme based on mode and system preference
  const currentTheme: Theme = (() => {
    if (themeMode === 'system') {
      return systemColorScheme === 'dark' ? darkTheme : lightTheme;
    }
    return themeMode === 'dark' ? darkTheme : lightTheme;
  })();

  // Load saved theme mode from storage
  useEffect(() => {
    const loadThemeMode = async () => {
      try {
        const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
          setThemeMode(savedMode as ThemeMode);
        }
      } catch (error) {
        console.error('Failed to load theme mode:', error);
      }
    };

    loadThemeMode();
  }, []);

  // Listen for system color scheme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemColorScheme(colorScheme);
    });

    return () => subscription?.remove();
  }, []);

  // Change theme mode
  const changeThemeMode = useCallback(async (mode: ThemeMode) => {
    try {
      setThemeMode(mode);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.error('Failed to save theme mode:', error);
    }
  }, []);

  // Toggle between light and dark (ignoring system)
  const toggleTheme = useCallback(() => {
    const newMode = currentTheme.isDark ? 'light' : 'dark';
    changeThemeMode(newMode);
  }, [currentTheme.isDark, changeThemeMode]);

  // Get theme-aware styles
  const getThemedStyles = useCallback((stylesFn: (theme: Theme) => any) => {
    return stylesFn(currentTheme);
  }, [currentTheme]);

  return {
    theme: currentTheme,
    themeMode,
    systemColorScheme,
    changeThemeMode,
    toggleTheme,
    getThemedStyles,
    isDark: currentTheme.isDark,
    isLight: !currentTheme.isDark,
  };
};

// Theme context for providing theme throughout the app
import React, { createContext, useContext, ReactNode } from 'react';

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  systemColorScheme: ColorSchemeName;
  changeThemeMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => void;
  getThemedStyles: (stylesFn: (theme: Theme) => any) => any;
  isDark: boolean;
  isLight: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const themeValue = useTheme();

  return (
    <ThemeContext.Provider value={themeValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeContext = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
};

// Utility functions for theme-aware styling
export const createThemedStyles = (stylesFn: (theme: Theme) => any) => {
  return (theme: Theme) => stylesFn(theme);
};

// Common theme-aware color utilities
export const getThemedColor = (theme: Theme, colorKey: keyof Theme['colors']) => {
  return theme.colors[colorKey];
};

export const getContrastColor = (theme: Theme, backgroundColor: string) => {
  // Simple contrast calculation - in production, use a proper contrast library
  return theme.isDark ? theme.colors.text : theme.colors.background;
};

// Animation duration based on system preferences
export const getAnimationDuration = (baseMs: number = 300) => {
  // In a real implementation, you would check for reduced motion preference
  return baseMs;
};