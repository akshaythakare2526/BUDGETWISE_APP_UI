import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../core/theme/ThemeContext';
import { userAPI } from '../../data/services/api';
import { TokenManager } from '../../data/TokenManager';
import CustomPopup, { PopupType } from '../components/CustomPopup';

export default function ChangePasswordScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [popup, setPopup] = useState<{visible: boolean, message: string, type: PopupType}>(
    { visible: false, message: '', type: 'info' }
  );

  const showPopup = (message: string, type: PopupType = 'info') => {
    setPopup({ visible: true, message, type });
  };
  
  const closePopup = () => {
    const currentType = popup.type;
    setPopup(p => ({ ...p, visible: false }));
    // Navigate back only after closing success popup
    if (currentType === 'success') {
      navigation.goBack();
    }
  };

  const validateForm = () => {
    if (!currentPassword.trim()) {
      showPopup('Please enter your current password', 'error');
      return false;
    }
    
    if (!newPassword.trim()) {
      showPopup('Please enter a new password', 'error');
      return false;
    }
    
    if (newPassword.length < 6) {
      showPopup('New password must be at least 6 characters long', 'error');
      return false;
    }
    
    if (newPassword !== confirmPassword) {
      showPopup('New passwords do not match', 'error');
      return false;
    }
    
    if (currentPassword === newPassword) {
      showPopup('New password must be different from current password', 'error');
      return false;
    }
    
    return true;
  };

  const handleChangePassword = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const token = await TokenManager.getCurrentToken();
      
      if (!token) {
        showPopup('User session expired. Please login again.', 'error');
        return;
      }

      await userAPI.changePassword(currentPassword, newPassword, token);
      
      showPopup('Password changed successfully!', 'success');
      
      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
    } catch (error: any) {
      let errorMessage = 'Failed to change password. Please try again.';
      
      if (error.response?.status === 400) {
        errorMessage = error.response?.data?.message || 'Invalid current password or new password format.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Current password is incorrect.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Session expired. Please login again.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showPopup(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (currentPassword || newPassword || confirmPassword) {
      showPopup(
        'Are you sure you want to discard your changes?',
        'confirm'
      );
    } else {
      navigation.goBack();
    }
  };

  const handleConfirmDiscard = () => {
    setPopup(p => ({ ...p, visible: false }));
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.colors.background }]}>
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: theme.colors.card }]} 
            onPress={handleCancel}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.secondary }]}>Change Password</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Icon */}
        <View style={styles.iconContainer}>
          <View style={[styles.iconWrapper, { backgroundColor: theme.colors.primary + '15' }]}>
            <Ionicons name="lock-closed" size={48} color={theme.colors.primary} />
          </View>
        </View>

        {/* Title and Description */}
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: theme.colors.secondary }]}>
            Secure Your Account
          </Text>
          <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
            Create a strong new password to keep your account safe and secure.
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Current Password */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Current Password</Text>
            <View style={[styles.inputContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.surface }]}>
              <Ionicons name="lock-closed-outline" size={20} color={theme.colors.primary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.colors.text }]}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Enter your current password"
                placeholderTextColor={theme.colors.textSecondary}
                secureTextEntry={!showCurrentPassword}
                autoCapitalize="none"
                returnKeyType="next"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                <Ionicons 
                  name={showCurrentPassword ? "eye-off" : "eye"} 
                  size={20} 
                  color={theme.colors.textSecondary} 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* New Password */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>New Password</Text>
            <View style={[styles.inputContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.surface }]}>
              <Ionicons name="key-outline" size={20} color={theme.colors.primary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.colors.text }]}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter your new password"
                placeholderTextColor={theme.colors.textSecondary}
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
                returnKeyType="next"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowNewPassword(!showNewPassword)}
              >
                <Ionicons 
                  name={showNewPassword ? "eye-off" : "eye"} 
                  size={20} 
                  color={theme.colors.textSecondary} 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm New Password */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Confirm New Password</Text>
            <View style={[styles.inputContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.surface }]}>
              <Ionicons name="checkmark-circle-outline" size={20} color={theme.colors.primary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.colors.text }]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm your new password"
                placeholderTextColor={theme.colors.textSecondary}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={handleChangePassword}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons 
                  name={showConfirmPassword ? "eye-off" : "eye"} 
                  size={20} 
                  color={theme.colors.textSecondary} 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Password Requirements */}
          <View style={[styles.requirementsContainer, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.requirementsTitle, { color: theme.colors.secondary }]}>
              Password Requirements:
            </Text>
            <View style={styles.requirement}>
              <Ionicons 
                name={newPassword.length >= 6 ? "checkmark-circle" : "ellipse-outline"} 
                size={16} 
                color={newPassword.length >= 6 ? theme.colors.success : theme.colors.textSecondary} 
              />
              <Text style={[styles.requirementText, { 
                color: newPassword.length >= 6 ? theme.colors.success : theme.colors.textSecondary 
              }]}>
                At least 6 characters
              </Text>
            </View>
            <View style={styles.requirement}>
              <Ionicons 
                name={newPassword !== currentPassword && newPassword.length > 0 ? "checkmark-circle" : "ellipse-outline"} 
                size={16} 
                color={newPassword !== currentPassword && newPassword.length > 0 ? theme.colors.success : theme.colors.textSecondary} 
              />
              <Text style={[styles.requirementText, { 
                color: newPassword !== currentPassword && newPassword.length > 0 ? theme.colors.success : theme.colors.textSecondary 
              }]}>
                Different from current password
              </Text>
            </View>
            <View style={styles.requirement}>
              <Ionicons 
                name={newPassword === confirmPassword && newPassword.length > 0 ? "checkmark-circle" : "ellipse-outline"} 
                size={16} 
                color={newPassword === confirmPassword && newPassword.length > 0 ? theme.colors.success : theme.colors.textSecondary} 
              />
              <Text style={[styles.requirementText, { 
                color: newPassword === confirmPassword && newPassword.length > 0 ? theme.colors.success : theme.colors.textSecondary 
              }]}>
                Passwords match
              </Text>
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              onPress={handleCancel}
              disabled={loading}
            >
              <Text style={[styles.cancelButtonText, { color: theme.colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.changeButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleChangePassword}
              disabled={loading || !currentPassword || !newPassword || !confirmPassword}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.changeButtonText}>Change Password</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <CustomPopup
        visible={popup.visible}
        message={popup.message}
        type={popup.type}
        onClose={popup.type === 'confirm' ? undefined : closePopup}
        onConfirm={popup.type === 'confirm' ? handleConfirmDiscard : undefined}
        confirmText="Discard"
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
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
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSpacer: {
    width: 40,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
  requirementsContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  requirementsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  requirement: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  requirementText: {
    marginLeft: 8,
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  changeButton: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  changeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
