import React, { useEffect, useState, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NavigatorScreenParams } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { APP_CONFIG } from '../../core/config/constants';
import SplashScreen from '../screens/SplashScreen';
import AppLoadingScreen from '../screens/AppLoadingScreen';
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import EmailVerificationScreen from '../screens/EmailVerificationScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import DashboardScreen from '../screens/DashboardScreen';
import CreateGroupScreen from '../screens/CreateGroupScreen';
import AddExpenseScreen from '../screens/AddExpenseScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import ViewGroupScreen from '../screens/ViewGroupScreen';
import BiometricSettingsScreen from '../screens/BiometricSettingsScreen';
import BiometricAuthScreen from '../screens/BiometricAuthScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import MainTabNavigator from './MainTabNavigator';
import AdaptiveStatusBar from '../components/AdaptiveStatusBar';
import { BiometricService } from '../../services/BiometricService';
import { TokenRecoveryUtils } from '../../utils/tokenRecovery';

export type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  Register: { 
    email?: string; 
    verified?: boolean;
    name?: string;
    username?: string;
    password?: string;
    confirmPassword?: string;
    phone?: string;
    role?: number;
  } | undefined;
  EmailVerification: { 
    email: string; 
    isPasswordReset?: boolean;
    formData?: {
      name?: string;
      username?: string;
      password?: string;
      confirmPassword?: string;
      phone?: string;
      role?: number;
    };
  };
  ForgotPassword: undefined;
  ResetPassword: { email: string; otpCode: string };
  Dashboard: undefined;
  MainTabs: undefined;
  CreateGroup: undefined;
  AddExpense: undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
  Settings: undefined;
  PrivacyPolicy: undefined;
  BiometricSettings: undefined;
  BiometricAuth: undefined;
  ViewGroup: {
    group: {
      id: string;
      groupName: string;
      groupCode: string;
      description?: string;
      createdAt?: string;
      memberCount?: number;
    };
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const [isLoading, setIsLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [needsBiometricAuth, setNeedsBiometricAuth] = useState(false);
  const [biometricChecked, setBiometricChecked] = useState(false);

  const checkLoginStatus = useCallback(async () => {
    try {
      // Check if user has valid authentication token
      const hasValidToken = await TokenRecoveryUtils.hasValidToken();
      
      if (!hasValidToken) {
        // Check if user has data but missing token
        const { shouldPrompt, userData } = await TokenRecoveryUtils.shouldPromptReLogin();
        
        if (shouldPrompt) {
          console.log('🔑 User data exists but token is missing. Clearing invalid data...');
          await TokenRecoveryUtils.clearInvalidUserData();
          setIsLoggedIn(false);
          setIsLoading(false);
          return false;
        }
      }
      
      const userData = await AsyncStorage.getItem(APP_CONFIG.STORAGE_KEYS.USER_DATA);
      const loggedIn = !!userData && hasValidToken;
      
      // Simulate some loading time for better UX
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check biometric authentication if user is logged in and biometrics not checked yet
      if (loggedIn && !biometricChecked && !needsBiometricAuth) {
        const shouldAuth = await BiometricService.shouldAuthenticate();
        if (shouldAuth) {
          setNeedsBiometricAuth(true);
          setBiometricChecked(true);
          setIsLoggedIn(false); // Temporarily set to false until biometric auth
          setIsLoading(false);
          return false;
        }
        setBiometricChecked(true);
      }
      
      // Always update state to force re-render
      setIsLoggedIn(loggedIn);
      setIsLoading(false);
      
      // Reset biometric states if user is not logged in
      if (!loggedIn) {
        setNeedsBiometricAuth(false);
        setBiometricChecked(false);
      }
      
      return loggedIn;
    } catch (e) {
      console.error('Login check error:', e);
      setIsLoggedIn(false);
      setIsLoading(false);
      return false;
    }
  }, [biometricChecked]);

  const handleBiometricAuthenticated = async () => {
    // Record the current time as last successful authentication
    await AsyncStorage.setItem('@budgetwise_last_auth_time', Date.now().toString());
    setNeedsBiometricAuth(false);
    setIsLoggedIn(true);
  };

  const handleSplashComplete = () => {
    setShowSplash(false);
    checkLoginStatus();
  };

  useEffect(() => {
    // Don't start checking login until splash is complete
    if (showSplash) return;
    
    // Only check once initially, then rely on navigation triggers
    checkLoginStatus();
  }, [checkLoginStatus, showSplash]);

  // Listen for app state changes to recheck login status and biometric auth
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: string) => {
      if (nextAppState === 'active' && isLoggedIn && !needsBiometricAuth) {
        // Only require biometric auth again if the app has been in background for more than 1 minute
        const lastAuthTime = await AsyncStorage.getItem('@budgetwise_last_auth_time');
        const currentTime = Date.now();
        const ONE_MINUTE = 60 * 1000; // 1 minute in milliseconds
        
        if (lastAuthTime) {
          const timeSinceAuth = currentTime - parseInt(lastAuthTime);
          if (timeSinceAuth > ONE_MINUTE) {
            // App has been inactive for more than 1 minute, require biometric auth
            setBiometricChecked(false);
            const shouldAuth = await BiometricService.shouldAuthenticate();
            if (shouldAuth) {
              setNeedsBiometricAuth(true);
              setIsLoggedIn(false); // Require biometric auth again
            }
          }
        } else {
          // No last auth time recorded, require auth
          setBiometricChecked(false);
          const shouldAuth = await BiometricService.shouldAuthenticate();
          if (shouldAuth) {
            setNeedsBiometricAuth(true);
            setIsLoggedIn(false);
          }
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Listen for login/logout triggers from other screens (like LoginScreen, DashboardScreen)
    const checkForNavigationTrigger = setInterval(async () => {
      try {
        const trigger = await AsyncStorage.getItem('@budgetwise_navigation_trigger');
        if (trigger) {
          await AsyncStorage.removeItem('@budgetwise_navigation_trigger');
          console.log('🔄 Navigation trigger detected - rechecking login status');
          checkLoginStatus();
        }
      } catch (e) {
        // Ignore errors
      }
    }, 1000); // Check every 1 second (less aggressive than before)
    
    return () => {
      subscription?.remove();
      clearInterval(checkForNavigationTrigger);
    };
  }, [checkLoginStatus]);

  // Remove the aggressive polling - AppState listener is sufficient

  // Show splash screen first
  if (showSplash) {
    return <SplashScreen onAnimationComplete={handleSplashComplete} />;
  }

  // Show loading screen while checking auth
  if (isLoading) {
    return <AppLoadingScreen message="Initializing BudgetWise..." />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        id={undefined}
        initialRouteName={
          needsBiometricAuth ? 'BiometricAuth' : 
          isLoggedIn ? 'MainTabs' : 'Home'
        }
        screenOptions={{ headerShown: false }}
      >
        {needsBiometricAuth ? (
          // Biometric authentication required
          <Stack.Screen name="BiometricAuth">
            {() => (
              <BiometricAuthScreen 
                onAuthenticated={handleBiometricAuthenticated}
              />
            )}
          </Stack.Screen>
        ) : isLoggedIn ? (
          // Logged in users - only app screens, no auth screens
          <>
            <Stack.Screen name="MainTabs" component={MainTabNavigator} />
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            
            {/* Modal screens */}
            <Stack.Screen 
              name="CreateGroup" 
              component={CreateGroupScreen}
              options={{
                presentation: 'modal',
                headerShown: false,
              }}
            />
            <Stack.Screen 
              name="AddExpense" 
              component={AddExpenseScreen}
              options={{
                presentation: 'modal',
                headerShown: false,
              }}
            />
            <Stack.Screen 
              name="EditProfile" 
              component={EditProfileScreen}
              options={{
                presentation: 'modal',
                headerShown: false,
              }}
            />
            <Stack.Screen 
              name="ChangePassword" 
              component={ChangePasswordScreen}
              options={{
                presentation: 'modal',
                headerShown: false,
              }}
            />
            <Stack.Screen 
              name="Settings" 
              component={SettingsScreen}
              options={{
                presentation: 'modal',
                headerShown: false,
              }}
            />
            <Stack.Screen 
              name="PrivacyPolicy" 
              component={PrivacyPolicyScreen}
              options={{
                presentation: 'modal',
                headerShown: false,
              }}
            />
            <Stack.Screen 
              name="BiometricSettings" 
              component={BiometricSettingsScreen}
              options={{
                presentation: 'modal',
                headerShown: false,
              }}
            />
            <Stack.Screen 
              name="ViewGroup" 
              component={ViewGroupScreen}
              options={{
                presentation: 'modal',
                headerShown: false,
              }}
            />
          </>
        ) : (
          // Not logged in - only auth screens
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="EmailVerification" component={EmailVerificationScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
