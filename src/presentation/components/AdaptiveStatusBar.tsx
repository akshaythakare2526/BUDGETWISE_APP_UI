import React from 'react';
import { StatusBar, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

interface AdaptiveStatusBarProps {
  backgroundColor?: string;
  barStyle?: 'light-content' | 'dark-content';
  translucent?: boolean;
}

export default function AdaptiveStatusBar({ 
  backgroundColor = '#F0F8FF', 
  barStyle,
  translucent = false 
}: AdaptiveStatusBarProps) {
  
  // Auto-detect bar style based on background color if not specified
  const getBarStyle = (): 'light-content' | 'dark-content' => {
    if (barStyle) return barStyle;
    
    // If background is provided, determine if it's light or dark
    if (backgroundColor) {
      // Convert hex to RGB and calculate luminance
      const hex = backgroundColor.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      
      // Calculate relative luminance
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      
      // If luminance > 0.5, background is light, use dark content
      return luminance > 0.5 ? 'dark-content' : 'light-content';
    }
    
    return 'dark-content'; // Default for light backgrounds
  };

  useFocusEffect(
    React.useCallback(() => {
      const style = getBarStyle();
      
      if (Platform.OS === 'ios') {
        StatusBar.setBarStyle(style, true);
      } else {
        StatusBar.setBarStyle(style, true);
        StatusBar.setBackgroundColor(backgroundColor, true);
        StatusBar.setTranslucent(translucent);
      }
    }, [backgroundColor, barStyle, translucent])
  );

  return (
    <StatusBar
      barStyle={getBarStyle()}
      backgroundColor={backgroundColor}
      translucent={translucent}
    />
  );
}

// Predefined configurations for common screens
export const StatusBarConfigs = {
  lightBackground: {
    backgroundColor: '#F0F8FF',
    barStyle: 'dark-content' as const,
    translucent: false,
  },
  darkBackground: {
    backgroundColor: '#1A1A1A',
    barStyle: 'light-content' as const,
    translucent: false,
  },
  whiteBackground: {
    backgroundColor: '#FFFFFF',
    barStyle: 'dark-content' as const,
    translucent: false,
  },
  transparent: {
    backgroundColor: 'transparent',
    barStyle: 'dark-content' as const,
    translucent: true,
  },
  blue: {
    backgroundColor: '#4A90E2',
    barStyle: 'light-content' as const,
    translucent: false,
  },
};
