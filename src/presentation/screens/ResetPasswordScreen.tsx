import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { userAPI } from '../../data/services/api';
import CustomPopup, { PopupType } from '../components/CustomPopup';
import { useTheme } from '../../core/theme/ThemeContext';

type ResetPasswordNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface RouteParams {
  email: string;
  otpCode: string;
}

export default function ResetPasswordScreen() {
  const navigation = useNavigation<ResetPasswordNavigationProp>();
  const route = useRoute();
  const { email, otpCode } = route.params as RouteParams;
  
  // Debug: Log the received parameters
  console.log('🔄 ResetPasswordScreen Params:', {
    email,
    otpCode,
    otpCodeType: typeof otpCode,
    otpCodeLength: otpCode?.length
  });
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState<{visible: boolean, message: string, type: PopupType}>(
    { visible: false, message: '', type: 'info' }
  );

  const { theme } = useTheme();
  const confirmPasswordRef = useRef<TextInput>(null);

  const showPopup = (message: string, type: PopupType = 'info') => {
    setPopup({ visible: true, message, type });
  };

  const closePopup = () => {
    const currentType = popup.type;
    setPopup(p => ({ ...p, visible: false }));
    
    if (currentType === 'success') {
      navigation.navigate('Login');
    }
  };

  const validatePassword = () => {
    if (!newPassword) {
      showPopup('Please enter a new password', 'error');
      return false;
    }
    
    if (newPassword.length < 6) {
      showPopup('Password must be at least 6 characters long', 'error');
      return false;
    }
    
    if (newPassword !== confirmPassword) {
      showPopup('Passwords do not match', 'error');
      return false;
    }
    
    return true;
  };

  const handleResetPassword = async () => {
    if (!validatePassword()) {
      return;
    }

    setLoading(true);
    try {
      console.log('🔐 Reset Password Debug:', {
        email,
        otpCode,
        otpLength: otpCode?.length,
        newPasswordLength: newPassword?.length
      });
      
      await userAPI.resetPassword(email, otpCode, newPassword);
      showPopup('Password reset successfully! You can now login with your new password.', 'success');
    } catch (error: any) {
      console.log('❌ Reset Password Error:', error.response?.data || error.message);
      let errorMessage = 'Failed to reset password. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 400) {
        errorMessage = 'Invalid or expired verification code. Please restart the process.';
      }
      showPopup(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={[styles.fullContainer, { backgroundColor: theme.colors.background }]}>
        <StatusBar backgroundColor={theme.colors.background} barStyle={theme.isDark ? 'light-content' : 'dark-content'} />
        <KeyboardAvoidingView 
          style={[styles.container, { backgroundColor: theme.colors.background }]}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          {/* Header */}
          <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Reset Password</Text>
            <View style={styles.headerRight} />
          </View>

          <ScrollView 
            style={styles.scrollContainer}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Icon */}
            <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '15' }]}>
              <Ionicons name="shield-checkmark" size={60} color={theme.colors.primary} />
            </View>

            {/* Title and Description */}
            <Text style={[styles.title, { color: theme.colors.secondary }]}>
              Create New Password
            </Text>
            
            <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
              Enter your new password below. Make sure it's secure and easy to remember.
            </Text>

            {/* New Password Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
                New Password
              </Text>
              <View style={[styles.inputWrapper, { backgroundColor: theme.colors.card, borderColor: theme.colors.surface }]}>
                <Ionicons name="lock-closed-outline" size={20} color={theme.colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.colors.text }]}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Enter new password"
                  placeholderTextColor={theme.colors.textSecondary}
                  secureTextEntry={!showPassword}
                  editable={!loading}
                  selectionColor={theme.colors.primary}
                  underlineColorAndroid="transparent"
                  autoFocus={true}
                  returnKeyType="next"
                  onSubmitEditing={() => {
                    confirmPasswordRef.current?.focus();
                  }}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name={showPassword ? "eye-outline" : "eye-off-outline"} 
                    size={20} 
                    color={theme.colors.textSecondary} 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
                Confirm Password
              </Text>
              <View style={[styles.inputWrapper, { backgroundColor: theme.colors.card, borderColor: theme.colors.surface }]}>
                <Ionicons name="lock-closed-outline" size={20} color={theme.colors.primary} style={styles.inputIcon} />
                <TextInput
                  ref={confirmPasswordRef}
                  style={[styles.input, { color: theme.colors.text }]}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm new password"
                  placeholderTextColor={theme.colors.textSecondary}
                  secureTextEntry={!showConfirmPassword}
                  editable={!loading}
                  selectionColor={theme.colors.primary}
                  underlineColorAndroid="transparent"
                  returnKeyType="done"
                  onSubmitEditing={handleResetPassword}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} 
                    size={20} 
                    color={theme.colors.textSecondary} 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Reset Password Button */}
            <TouchableOpacity
              style={[
                styles.resetButton,
                { backgroundColor: theme.colors.primary },
                (loading || !newPassword || !confirmPassword) && styles.buttonDisabled
              ]}
              onPress={handleResetPassword}
              disabled={loading || !newPassword || !confirmPassword}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.resetButtonText}>Reset Password</Text>
              )}
            </TouchableOpacity>
          </ScrollView>

          <CustomPopup
            visible={popup.visible}
            message={popup.message}
            type={popup.type}
            onClose={closePopup}
          />
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 30,
    paddingTop: 40,
    paddingBottom: 30,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  eyeButton: {
    padding: 4,
  },
  resetButton: {
    width: '100%',
    height: 55,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
