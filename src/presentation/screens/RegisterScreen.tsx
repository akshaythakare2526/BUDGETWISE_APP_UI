import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, StatusBar } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { userAPI } from '../../data/services/api';
import { NetworkTestUtils } from '../../utils/networkTest';
import { RegisterRequest, LoginRequest } from '../../domain/models/User';
import CustomPopup, { PopupType } from '../components/CustomPopup';
import { useTheme } from '../../core/theme/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_CONFIG } from '../../core/config/constants';

type RegisterScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Register'>;

interface Props {
  navigation: RegisterScreenNavigationProp;
}

export default function RegisterScreen({ navigation }: Props) {
  const route = useRoute();
  const routeParams = route.params as { 
    email?: string; 
    verified?: boolean;
    name?: string;
    username?: string;
    password?: string;
    confirmPassword?: string;
    phone?: string;
    role?: number;
  } | undefined;
  
  const [name, setName] = useState(routeParams?.name || '');
  const [username, setUsername] = useState(routeParams?.username || '');
  const [email, setEmail] = useState(routeParams?.email || '');
  const [password, setPassword] = useState(routeParams?.password || '');
  const [confirmPassword, setConfirmPassword] = useState(routeParams?.confirmPassword || '');
  const [phone, setPhone] = useState(routeParams?.phone || '');
  const [role, setRole] = useState(routeParams?.role || 0); // Default to User (0)
  const [loading, setLoading] = useState(false);
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [emailVerified, setEmailVerified] = useState(routeParams?.verified || false);
  const [popup, setPopup] = useState<{visible: boolean, message: string, type: PopupType}>(
    { visible: false, message: '', type: 'info' }
  );

  const { theme } = useTheme();

  // Debug network info on component mount
  useEffect(() => {
    NetworkTestUtils.logNetworkDebug();
  }, []);  const showPopup = (message: string, type: PopupType = 'info') => setPopup({ visible: true, message, type });
  
  const closePopup = () => {
    const currentType = popup.type;
    setPopup(p => ({ ...p, visible: false }));
    // Navigate to Login only after closing success popup
    if (currentType === 'success') {
      navigation.navigate('Login');
    }
  };const handleNetworkTest = async () => {
    showPopup('Testing connection... Check console logs for detailed results.', 'info');
    try {
      const isConnected = await NetworkTestUtils.testConnection();
      const message = isConnected 
        ? '✅ Found working endpoint! Server is reachable.' 
        : '❌ Connection test failed. Common issues: Server not running on port 5091, Different network (check WiFi), Firewall blocking connection, API endpoints not configured (all return 404). Check console logs for details.';
      showPopup(message, isConnected ? 'success' : 'error');
    } catch (error) {
      showPopup(`Test failed: ${error}`, 'error');
    }
  };

  const validateForm = () => {
    if (!name.trim()) {
      showPopup('Please enter your full name', 'error');
      return false;
    }
    if (!username.trim()) {
      showPopup('Please enter a username', 'error');
      return false;
    }
    if (!email.trim()) {
      showPopup('Please enter your email', 'error');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showPopup('Please enter a valid email address', 'error');
      return false;
    }
    if (!password) {
      showPopup('Please enter a password', 'error');
      return false;
    }
    if (password.length < 6) {
      showPopup('Password must be at least 6 characters long', 'error');
      return false;
    }
    if (password !== confirmPassword) {
      showPopup('Passwords do not match', 'error');
      return false;
    }
    if (!phone.trim()) {
      showPopup('Please enter your phone number', 'error');
      return false;
    }
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone.replace(/\D/g, ''))) {
      showPopup('Please enter a valid 10-digit phone number', 'error');
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!emailVerified) {
      showPopup('Please verify your email first', 'error');
      return;
    }

    if (!validateForm()) {
      return;
    }
    setLoading(true);
    const registerData: RegisterRequest = {
      Name: name.trim(),
      UserName: username.trim(),
      Email: email.trim().toLowerCase(),
      Password: password,
      Phone: phone.replace(/\D/g, ''),
      Role: role
    };    try {
      const result = await userAPI.register(registerData);
      
      // After successful registration, automatically log the user in
      try {
        const loginCredentials: LoginRequest = {
          UserName: username.trim(),
          Password: password
        };
        
        const loginResponse = await userAPI.login(loginCredentials);
        
        // Save user data to AsyncStorage with authentication token
        const userDataToStore = {
          name: loginResponse.name,
          userName: loginResponse.userName,
          email: loginResponse.email,
          userId: loginResponse.userId,
          phone: loginResponse.phone || phone.replace(/\D/g, ''),
          token: loginResponse.token
        };
        
        await AsyncStorage.setItem(
          APP_CONFIG.STORAGE_KEYS.USER_DATA,
          JSON.stringify(userDataToStore)
        );
        
        // Fetch and store user groups
        try {
          const userDetails = await userAPI.getUserDetails(loginResponse.token);
          const groups = userDetails.groups?.$values || [];
          
          await AsyncStorage.setItem(
            APP_CONFIG.STORAGE_KEYS.USER_GROUPS,
            JSON.stringify(groups)
          );
        } catch (groupError) {
          console.log('Error fetching user groups:', groupError);
        }
        
        showPopup('Account created successfully! You are now logged in.', 'success');
        
        // Navigate to main app after successful registration and login
        setTimeout(() => {
          navigation.reset({
            index: 0,
            routes: [{ name: 'TabNavigator' as never }],
          });
        }, 2000);
        
      } catch (loginError) {
        console.log('Auto-login after registration failed:', loginError);
        showPopup('Account created successfully! Please login with your credentials.', 'success');
        
        // Navigate to login screen
        setTimeout(() => {
          navigation.navigate('Login');
        }, 2000);
      }
    } catch (error: any) {
      let errorMessage = 'Registration failed. Please try again.';
      if (error.response) {
        if (error.response.status === 400) {
          errorMessage = 'Invalid registration data. Please check your inputs.';
        } else if (error.response.status === 404) {
          errorMessage = 'Registration endpoint not found. Please check your backend server configuration.';
        } else if (error.response.status === 409) {
          errorMessage = 'Username or email already exists. Please try different ones.';
        } else if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.request) {
        errorMessage = 'Network error. Please check: Your server is running on port 5091, Both devices are on the same WiFi network, Your computer\'s firewall allows port 5091, Check console logs for detailed error info';
      } else if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
        errorMessage = 'Connection failed. Troubleshooting steps: Ensure your API server is running, Check if you\'re using the correct device type: Android Emulator: Use 10.0.2.2:5091, iOS Simulator: Use localhost:5091, Physical Device: Use 192.168.0.144:5091, Verify both devices are on same network';
      }
      showPopup(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendVerification = async () => {
    if (!email.trim()) {
      showPopup('Please enter your email address', 'error');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      showPopup('Please enter a valid email address', 'error');
      return;
    }

    setVerifyingEmail(true);
    try {
      await userAPI.sendEmailVerification(email.trim());
      // Pass all form data to preserve state
      navigation.navigate('EmailVerification', { 
        email: email.trim(), 
        isPasswordReset: false,
        // Pass all form data to preserve when coming back
        formData: {
          name: name.trim(),
          username: username.trim(),
          password,
          confirmPassword,
          phone: phone.trim(),
          role
        }
      });
    } catch (error: any) {
      let errorMessage = 'Failed to send verification email. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      showPopup(errorMessage, 'error');
    } finally {
      setVerifyingEmail(false);
    }
  };

  // Helper function to check if email format is valid
  const isValidEmailFormat = (emailText: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailText.trim());
  };

  return (
    <View style={[styles.fullContainer, { backgroundColor: theme.colors.background }]}>
      <StatusBar 
        backgroundColor={theme.colors.background} 
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        animated={false}
        translucent={false}
      />
      <CustomPopup visible={popup.visible} message={popup.message} type={popup.type} onClose={closePopup} />
      <KeyboardAvoidingView 
        style={[styles.container, { backgroundColor: theme.colors.background }]} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        enabled={Platform.OS === 'ios'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          style={styles.scrollContainer} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
        {/* Header Section with Gradient Effect */}
        <View style={[styles.headerSection, { backgroundColor: theme.colors.primary }]}>
          <View style={styles.headerContent}>
            <View style={[styles.iconContainer, { backgroundColor: theme.isDark ? '#87CEEB' : '#87CEEB' }]}>
              <Text style={styles.iconText}>📊</Text>
            </View>
            <Text style={[styles.appName, { color: '#FFFFFF' }]}>BudgetWise</Text>
            <Text style={[styles.tagline, { color: theme.isDark ? '#E6F3FF' : '#E6F3FF' }]}>Your Financial Journey Starts Here</Text>
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.contentSection}>
          <View style={styles.welcomeContainer}>
            <Text style={[styles.title, { color: theme.colors.secondary }]}>Create Account</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Join thousands of users managing their finances smartly</Text>
          </View>

          {/* Registration Form */}
          <View style={[styles.formContainer, { backgroundColor: theme.colors.card }]}>
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.colors.secondary }]}>Full Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.colors.inputBackground, color: theme.colors.text, borderColor: theme.colors.border }]}
                placeholder="Enter your full name"
                placeholderTextColor={theme.colors.placeholder}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                returnKeyType="next"
                blurOnSubmit={false}
                selectionColor={theme.colors.primary}
                underlineColorAndroid="transparent"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.colors.secondary }]}>Username</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.colors.inputBackground, color: theme.colors.text, borderColor: theme.colors.border }]}
                placeholder="Choose a username"
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
              <View style={styles.inputLabelContainer}>
                <Text style={[styles.inputLabel, { color: theme.colors.secondary }]}>Email Address</Text>
                {emailVerified && (
                  <Text style={[styles.verifiedBadge, { color: theme.colors.success || '#22c55e' }]}>✓ Verified</Text>
                )}
              </View>
              <View style={styles.emailInputContainer}>
                <TextInput
                  style={[
                    styles.emailInput, 
                    emailVerified && styles.inputVerified, 
                    { 
                      backgroundColor: theme.colors.inputBackground, 
                      color: theme.colors.text, 
                      borderColor: emailVerified ? (theme.colors.success || '#22c55e') : theme.colors.border 
                    }
                  ]}
                  placeholder="Enter your email"
                  placeholderTextColor={theme.colors.placeholder}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (emailVerified) setEmailVerified(false); // Reset verification if email changes
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="next"
                  blurOnSubmit={false}
                  editable={!emailVerified} // Disable editing if verified
                  selectionColor={theme.colors.primary}
                  underlineColorAndroid="transparent"
                />
                {!emailVerified && isValidEmailFormat(email) && (
                  <TouchableOpacity
                    style={[styles.verifyButton, { backgroundColor: theme.colors.primary }]}
                    onPress={handleSendVerification}
                    disabled={verifyingEmail}
                    activeOpacity={0.8}
                  >
                    {verifyingEmail ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.verifyButtonText}>Verify</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.colors.secondary }]}>Phone Number</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.colors.inputBackground, color: theme.colors.text, borderColor: theme.colors.border }]}
                placeholder="Enter your phone number"
                placeholderTextColor={theme.colors.placeholder}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
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
                placeholder="Create a strong password"
                placeholderTextColor={theme.colors.placeholder}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                returnKeyType="next"
                blurOnSubmit={false}
                selectionColor={theme.colors.primary}
                underlineColorAndroid="transparent"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.colors.secondary }]}>Confirm Password</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.colors.inputBackground, color: theme.colors.text, borderColor: theme.colors.border }]}
                placeholder="Confirm your password"
                placeholderTextColor={theme.colors.placeholder}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleRegister}
                selectionColor={theme.colors.primary}
                underlineColorAndroid="transparent"
              />
            </View>
            {/* Network Test Button - Temporarily disabled for debugging */}
            {false ? (
              <TouchableOpacity 
                style={styles.testButton} 
                onPress={handleNetworkTest}
              >
                <Text style={styles.testButtonText}>🔍 Test Network Connection</Text>
              </TouchableOpacity>
            ) : null}
            
            <TouchableOpacity
              style={[styles.registerButton, loading && styles.buttonDisabled, { backgroundColor: theme.colors.primary }]} 
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.registerButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            {/* Action Links */}
            <View style={styles.linksContainer}>
              <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.7}>
                <Text style={[styles.link, { color: theme.colors.textSecondary }]}>
                  Already have an account? <Text style={[styles.linkHighlight, { color: theme.colors.primary }]}>Sign In</Text>
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
    paddingBottom: 100,
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    padding: 25,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
  },  title: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },  formContainer: {
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    borderTopWidth: 3,
    borderTopColor: '#87CEEB',
  },
  inputContainer: {
    marginBottom: 18,
  },  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },  input: {
    height: 50,
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    fontWeight: '500',
    shadowColor: '#B3D9FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },  registerButton: {
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginTop: 15,
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
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  testButton: {
    width: '100%',
    height: 45,
    backgroundColor: '#FF9500',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 10,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  linksContainer: {
    alignItems: 'center',
    marginTop: 20,
  },  link: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 12,
  },
  linkHighlight: {
    fontWeight: 'bold',
  },
  backLink: {
    marginTop: 8,
  },
  backLinkText: {
    fontSize: 14,
    textAlign: 'center',
  },
  inputLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  verifiedBadge: {
    fontSize: 12,
    fontWeight: '600',
  },
  inputVerified: {
    borderWidth: 2,
  },
  emailInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emailInput: {
    flex: 1,
    height: 50,
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    fontWeight: '500',
    shadowColor: '#B3D9FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginRight: 10,
  },
  verifyButton: {
    height: 50,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
