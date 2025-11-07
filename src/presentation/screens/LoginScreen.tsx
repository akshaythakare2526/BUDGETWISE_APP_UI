import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform, StatusBar } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { userAPI } from '../../data/services/api';
import { LoginRequest, LoginResponse } from '../../domain/models/User';
import CustomPopup, { PopupType } from '../components/CustomPopup';
import CustomToast, { ToastType } from '../components/CustomToast';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_CONFIG } from '../../core/config/constants';
import AdaptiveStatusBar from '../components/AdaptiveStatusBar';
import { useTheme } from '../../core/theme/ThemeContext';

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

interface Props {
  navigation: LoginScreenNavigationProp;
}

export default function LoginScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const [username, setUsername] = useState('');  // Changed from email to username
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);  
  const [popup, setPopup] = useState<{visible: boolean, message: string, type: PopupType}>(
    { visible: false, message: '', type: 'info' }
  );
  const [toast, setToast] = useState<{visible: boolean, message: string, type: ToastType}>(
    { visible: false, message: '', type: 'info' }
  );

  const showPopup = (message: string, type: PopupType = 'info') => setPopup({ visible: true, message, type });
  
  const closePopup = () => {
    const currentType = popup.type;
    setPopup(p => ({ ...p, visible: false }));
    // AppNavigator will automatically detect login and switch to MainTabs
    // No manual navigation needed for success popup
  };

  const handleLogin = async () => {
    if (!username || !password) {
      showPopup('Please fill in all fields', 'error');
      return;
    }
    setLoading(true);
    const credentials: LoginRequest = {
      UserName: username.trim(),
      Password: password
    };
    try {
      // Call API service
      const loginResponse: LoginResponse = await userAPI.login(credentials);
      
      // Save user data to AsyncStorage for dashboard
      const userDataToStore = {
        name: loginResponse.name, 
        userName: loginResponse.userName,
        email: loginResponse.email,
        userId: loginResponse.userId,
        phone: loginResponse.phone || '', // Store phone if available
        token: loginResponse.token
      };
      
      await AsyncStorage.setItem(
        APP_CONFIG.STORAGE_KEYS.USER_DATA,
        JSON.stringify(userDataToStore)
      );
      
      // Ensure the data is written before showing success message
      await new Promise(resolve => setTimeout(resolve, 100));

      // Fetch and store user groups immediately after login
      try {
        const userDetails = await userAPI.getUserDetails(loginResponse.token);
        const groups = userDetails.groups?.$values || [];
        
        // Store groups in AsyncStorage
        await AsyncStorage.setItem(
          APP_CONFIG.STORAGE_KEYS.USER_GROUPS,
          JSON.stringify(groups)
        );
        
        // Update user data with phone number if available from userDetails
        if (userDetails.phone || userDetails.phoneNumber) {
          const updatedUserData = {
            ...userDataToStore,
            phone: userDetails.phone || userDetails.phoneNumber || ''
          };
          
          await AsyncStorage.setItem(
            APP_CONFIG.STORAGE_KEYS.USER_DATA,
            JSON.stringify(updatedUserData)
          );
        }
        
        // Ensure the data is written
        await new Promise(resolve => setTimeout(resolve, 50));
      } catch (groupError) {
        console.error('Failed to fetch groups/profile on login:', groupError);
        // Don't fail login if groups fetch fails, just store empty array
        await AsyncStorage.setItem(APP_CONFIG.STORAGE_KEYS.USER_GROUPS, JSON.stringify([]));
        // Ensure the data is written
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      setToast({ visible: true, message: `Welcome back, ${loginResponse.userName}!`, type: 'success' });
      
      // Force navigation to main app after successful login
      setTimeout(() => {
        setToast(t => ({ ...t, visible: false }));
        console.log('🔄 Login successful - user data stored');
        console.log('✅ AppNavigator should automatically detect login and redirect');
        
        // Trigger a manual state check in the AppNavigator by updating the AsyncStorage
        // and then letting the AppNavigator's effect detect the change
        const triggerNavigation = async () => {
          // Force re-read by setting a navigation trigger
          await AsyncStorage.setItem('@budgetwise_navigation_trigger', Date.now().toString());
        };
        triggerNavigation();
      }, 1000);
    } catch (error: any) {
      console.log('Login error:', error);
      let errorMessage = 'Login failed. Please try again.';
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = 'Invalid username or password.';
        } else if (error.response.status === 404) {
          errorMessage = 'User not found. Please check your username or register a new account.';
        } else if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.request) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      showPopup(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.fullContainer, { backgroundColor: theme.colors.background }]}>
      <StatusBar backgroundColor={theme.colors.background} barStyle={theme.isDark ? 'light-content' : 'dark-content'} />
      <AdaptiveStatusBar backgroundColor="#4A90E2" />
      <CustomToast visible={toast.visible} message={toast.message} type={toast.type} />
      <CustomPopup visible={popup.visible} message={popup.message} type={popup.type} onClose={closePopup} />
      <KeyboardAvoidingView 
        style={[styles.container, { backgroundColor: theme.colors.background }]} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          style={styles.scrollContainer} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
      {/* Header Section with Gradient Effect */}
      <View style={[styles.headerSection, { backgroundColor: theme.colors.primary }]}>
        <View style={styles.headerContent}>
          <View style={[styles.iconContainer, { backgroundColor: theme.isDark ? '#87CEEB' : '#87CEEB' }]}>
            <Text style={styles.iconText}>💰</Text>
          </View>
          <Text style={[styles.appName, { color: '#FFFFFF' }]}>BudgetWise</Text>
          <Text style={[styles.tagline, { color: theme.isDark ? '#E6F3FF' : '#E6F3FF' }]}>Smart Financial Management</Text>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.contentSection}>
        <View style={styles.welcomeContainer}>
          <Text style={[styles.title, { color: theme.colors.secondary }]}>Welcome Back!</Text>
          <Text style={[styles.subtitle, { color: theme.colors.text }]}>Sign in to continue your financial journey</Text>
        </View>

        {/* Login Form */}
        <View style={[styles.formContainer, { backgroundColor: theme.colors.card }]}>
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: theme.colors.secondary }]}>Username</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.inputBackground, color: theme.colors.text, borderColor: theme.colors.border }]}
              placeholder="Enter your username"
              placeholderTextColor={theme.colors.placeholder}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              returnKeyType="next"
              blurOnSubmit={false}
              selectionColor={theme.colors.primary}
              underlineColorAndroid="transparent"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: theme.colors.secondary }]}>Password</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.inputBackground, color: theme.colors.text, borderColor: theme.colors.border }]}
              placeholder="Enter your password"
              placeholderTextColor={theme.colors.placeholder}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              selectionColor={theme.colors.primary}
              underlineColorAndroid="transparent"
            />
          </View>
          
          <TouchableOpacity 
            style={[styles.loginButton, loading && styles.buttonDisabled, { backgroundColor: theme.colors.primary }]} 
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Action Links */}
          <View style={styles.linksContainer}>
            <TouchableOpacity onPress={() => navigation.navigate('Register')} activeOpacity={0.7}>
              <Text style={[styles.link, { color: theme.colors.textSecondary }]}>
                Don't have an account? <Text style={[styles.linkHighlight, { color: theme.colors.primary }]}>Register</Text>
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} activeOpacity={0.7}>
              <Text style={[styles.link, { color: theme.colors.textSecondary }]}>
                Forgot your password? <Text style={[styles.linkHighlight, { color: theme.colors.primary }]}>Reset it here</Text>
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.backLink} activeOpacity={0.7}>
              <Text style={[styles.backLinkText, { color: theme.colors.textSecondary }]}>← Back to Home</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  fullContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },  scrollContent: {
    flexGrow: 1,
    paddingBottom: 50,
  },
  headerSection: {
    paddingTop: 60,
    paddingBottom: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
  },  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconText: {
    fontSize: 35,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
  },  tagline: {
    fontSize: 16,
    fontWeight: '500',
  },
  contentSection: {
    flex: 1,
    padding: 30,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },formContainer: {
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10,
    borderTopWidth: 3,
    borderTopColor: '#87CEEB',
  },
  inputContainer: {
    marginBottom: 20,
  },  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },  input: {
    height: 55,
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 18,
    fontSize: 16,
    fontWeight: '500',
    shadowColor: '#B3D9FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },  loginButton: {
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginTop: 10,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    backgroundColor: '#A8C8EC',
    shadowOpacity: 0.1,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  linksContainer: {
    alignItems: 'center',
    marginTop: 25,
  },  link: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 15,
  },
  linkHighlight: {
    fontWeight: 'bold',
  },
  backLink: {
    marginTop: 10,
  },
  backLinkText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
