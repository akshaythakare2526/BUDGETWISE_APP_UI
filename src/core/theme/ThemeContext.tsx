import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';

export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    card: string;
    text: string;
    textSecondary: string;
    border: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    disabled: string;
    placeholder: string;
    shadow: string;
    inputBackground: string;
  };
  isDark: boolean;
}

export const lightTheme: Theme = {
  colors: {
    primary: '#4A90E2',
    secondary: '#2C5282',
    background: '#F0F8FF',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    text: '#2C5282',
    textSecondary: '#4A90E2',
    border: '#E5E7EB',
    success: '#00C897',
    warning: '#FF9500',
    error: '#FF4C5E',
    info: '#4A90E2',
    disabled: '#9CA3AF',
    placeholder: '#9CA3AF',
    shadow: '#4A90E2',
    inputBackground: '#F8FCFF',
  },
  isDark: false,
};

export const darkTheme: Theme = {
  colors: {
    primary: '#5BA3F5',
    secondary: '#7DD3FC',
    background: '#0F172A',
    surface: '#1E293B',
    card: '#334155',
    text: '#F8FAFC',
    textSecondary: '#CBD5E1',
    border: '#475569',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    disabled: '#64748B',
    placeholder: '#64748B',
    shadow: '#000000',
    inputBackground: '#1E293B',
  },
  isDark: true,
};

interface ThemeContextType {
  theme: Theme;
  isDarkMode: boolean;
  toggleTheme: () => void;
  setDarkMode: (enabled: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('@budgetwise_dark_mode');
      if (savedTheme !== null) {
        setIsDarkMode(JSON.parse(savedTheme));
      }
    } catch (error) {
      console.log('Error loading theme preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveThemePreference = async (darkMode: boolean) => {
    try {
      await AsyncStorage.setItem('@budgetwise_dark_mode', JSON.stringify(darkMode));
    } catch (error) {
      console.log('Error saving theme preference:', error);
    }
  };

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    saveThemePreference(newMode);
  };

  const setDarkMode = (enabled: boolean) => {
    setIsDarkMode(enabled);
    saveThemePreference(enabled);
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  if (isLoading) {
    return null; // or a loading spinner
  }

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme, setDarkMode }}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
