
import React, { useEffect, useState } from 'react';
import AppNavigator from './src/presentation/navigation/AppNavigator';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_CONFIG } from './src/core/config/constants';
import { isTokenExpired } from './src/data/TokenExpiryUtils';
import { ThemeProvider } from './src/core/theme/ThemeContext';

// Suppress console errors in production-like experience
if (!__DEV__) {
  console.error = () => {};
  console.warn = () => {};
}

import { View, ActivityIndicator } from 'react-native';



export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkToken = async () => {
      try {
        // Try context token first
        let token = await AsyncStorage.getItem(APP_CONFIG.STORAGE_KEYS.CONTEXT_TOKEN);
        if (!token) {
          // Fallback to personal token in user data
          const userData = await AsyncStorage.getItem(APP_CONFIG.STORAGE_KEYS.USER_DATA);
          if (userData) {
            const parsed = JSON.parse(userData);
            token = parsed.token || null;
          }
        }
        if (token && !isTokenExpired(token)) {
          setIsAuthenticated(true);
        } else {
          // Token is missing or expired, clear all
          await AsyncStorage.removeItem(APP_CONFIG.STORAGE_KEYS.CONTEXT_TOKEN);
          await AsyncStorage.removeItem(APP_CONFIG.STORAGE_KEYS.ACTIVE_GROUP);
          await AsyncStorage.removeItem(APP_CONFIG.STORAGE_KEYS.USER_DATA);
          setIsAuthenticated(false);
        }
      } catch (e) {
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkToken();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <AppNavigator />
    </ThemeProvider>
  );
}
