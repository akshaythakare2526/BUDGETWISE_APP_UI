import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_CONFIG } from '../../core/config/constants';
import { userAPI } from '../../data/services/api';
import { TokenManager } from '../../data/TokenManager';
import CustomPopup, { PopupType } from '../components/CustomPopup';
import Avatar from '../components/Avatar';
import { AvatarColorStorage } from '../../utils/AvatarColorStorage';
import { useTheme } from '../../core/theme/ThemeContext';
import { RootStackParamList } from '../navigation/AppNavigator';

type EditProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'EditProfile'>;

export default function EditProfileScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [originalName, setOriginalName] = useState('');
  const { theme } = useTheme();
  const [originalEmail, setOriginalEmail] = useState('');
  const [originalPhone, setOriginalPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [popup, setPopup] = useState<{visible: boolean, message: string, type: PopupType}>(
    { visible: false, message: '', type: 'info' }
  );
  const [avatarColor, setAvatarColor] = useState<string>('');
  const [originalAvatarColor, setOriginalAvatarColor] = useState<string>('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [tempAvatarColor, setTempAvatarColor] = useState<string>('');
  
  const navigation = useNavigation<EditProfileScreenNavigationProp>();

  // Predefined avatar colors
  const avatarColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
    '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43',
    '#10AC84', '#EE5A24', '#0984E3', '#A29BFE', '#FD79A8',
    '#6C5CE7', '#A4B0BE', '#2F3542', '#FF3838', '#FF6348',
    '#1DD1A1', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff'
  ];

  // Load user data on component mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userData = await AsyncStorage.getItem(APP_CONFIG.STORAGE_KEYS.USER_DATA);
        if (userData) {
          const parsed = JSON.parse(userData);
          
          const userName = parsed.name || parsed.userName || '';
          const userEmail = parsed.email || '';
          const userPhone = parsed.phone || parsed.phoneNumber || '';
          
          console.log('EditProfile - Loading user data:', { userName, userEmail, userPhone });
          
          setName(userName);
          setEmail(userEmail);
          setPhone(userPhone);
          setOriginalName(userName);
          setOriginalEmail(userEmail);
          setOriginalPhone(userPhone);

          // Load avatar color from local storage
          if (userEmail) {
            const savedAvatarColor = await AvatarColorStorage.loadAvatarColor(userEmail);
            setAvatarColor(savedAvatarColor || '');
            setOriginalAvatarColor(savedAvatarColor || '');
          }
        } else {
          showPopup('No user data found. Please login again.', 'error');
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        showPopup('Error loading profile data', 'error');
      } finally {
        setInitialLoading(false);
      }
    };
    
    loadUserData();
  }, []);

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
    if (!name.trim()) {
      showPopup('Please enter your name', 'error');
      return false;
    }
    
    if (!email.trim()) {
      showPopup('Please enter your email', 'error');
      return false;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      showPopup('Please enter a valid email address', 'error');
      return false;
    }
    
    // Phone number validation (optional but if provided should be valid)
    if (phone.trim() && !/^\+?[\d\s\-\(\)]+$/.test(phone.trim())) {
      showPopup('Please enter a valid phone number', 'error');
      return false;
    }
    
    return true;
  };

  const hasChanges = () => {
    return name.trim() !== originalName || 
           email.trim() !== originalEmail || 
           phone.trim() !== originalPhone ||
           avatarColor !== originalAvatarColor;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    if (!hasChanges()) {
      showPopup('No changes to save', 'info');
      return;
    }
    
    setLoading(true);
    try {
      // Get current token and user data
      const token = await TokenManager.getCurrentToken();
      const userData = await AsyncStorage.getItem(APP_CONFIG.STORAGE_KEYS.USER_DATA);
      
      if (!token || !userData) {
        showPopup('User session expired. Please login again.', 'error');
        return;
      }

      const user = JSON.parse(userData);
      
      const userId = user.userId || user.id || user.UserId;

      if (!userId) {
        showPopup('User ID not found. Please login again.', 'error');
        return;
      }

      // Create updated user data (without avatarColor for database)
      const updatedUserData = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
      };

      // Call the specific UpdateUser API endpoint using the userAPI service
      const result = await userAPI.updateUser(userId, updatedUserData, token);

      // Save avatar color to local storage
      await AvatarColorStorage.saveAvatarColor(email.trim(), avatarColor);

      // Update stored user data (without avatarColor since it's stored separately)
      const updatedUser = {
        ...user,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
      };

      await AsyncStorage.setItem(APP_CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));

      // Update original values to reflect current state
      setOriginalName(name.trim());
      setOriginalEmail(email.trim());
      setOriginalPhone(phone.trim());
      setOriginalAvatarColor(avatarColor);

      showPopup('Profile updated successfully!', 'success');

    } catch (error: any) {
      let errorMessage = 'Failed to update profile. Please try again.';
      
      if (error.response?.status === 405) {
        errorMessage = 'Update method not supported by server. Please contact support.';
      } else if (error.response?.status === 404) {
        errorMessage = 'User not found. Please login again.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Session expired. Please login again.';
      } else if (error.response?.status === 400) {
        errorMessage = error.response?.data?.message || 'Invalid data provided.';
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

  const handleColorSelect = (color: string) => {
    setTempAvatarColor(color);
  };

  const openColorPicker = () => {
    setTempAvatarColor(avatarColor); // Initialize with current color
    setShowColorPicker(true);
  };

  const closeColorPicker = () => {
    setShowColorPicker(false);
    setTempAvatarColor('');
  };

  const confirmColorSelection = () => {
    setAvatarColor(tempAvatarColor);
    setShowColorPicker(false);
    setTempAvatarColor('');
  };

  const renderColorItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[styles.colorItem, { backgroundColor: item }]}
      onPress={() => handleColorSelect(item)}
      activeOpacity={0.8}
    >
      {tempAvatarColor === item && (
        <Ionicons name="checkmark" size={20} color="#FFFFFF" />
      )}
    </TouchableOpacity>
  );

  const handleCancel = () => {
    if (hasChanges()) {
      Alert.alert(
        'Discard Changes',
        'You have unsaved changes. Are you sure you want to go back?',
        [
          { text: 'Stay', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  if (initialLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.primary }]}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.colors.background }]}>
          <TouchableOpacity style={[styles.backButton, { backgroundColor: theme.colors.card }]} onPress={handleCancel}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.secondary }]}>Edit Profile</Text>
          <TouchableOpacity 
            style={[styles.saveButton, { backgroundColor: theme.colors.card, opacity: hasChanges() ? 1 : 0.5 }]}
            onPress={handleSave}
            disabled={!hasChanges() || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <Text style={[styles.saveButtonText, { color: theme.colors.primary }]}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Profile Image */}
        <View style={styles.profileImageContainer}>
          <View style={styles.avatarContainer}>
            <Avatar 
              name={name || 'User'} 
              size={120}
              fontSize={42}
              borderWidth={4}
              borderColor={theme.colors.surface}
              {...(avatarColor && { backgroundColor: avatarColor })}
            />
          </View>
          <TouchableOpacity 
            style={[styles.changePhotoButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.surface }]}
            onPress={openColorPicker}
          >
            <Ionicons name="color-palette" size={20} color={theme.colors.primary} />
            <Text style={[styles.changePhotoText, { color: theme.colors.primary }]}>Change Avatar Color</Text>
          </TouchableOpacity>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Full Name</Text>
            <View style={[styles.inputContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.surface }]}>
              <Ionicons name="person-outline" size={20} color={theme.colors.primary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.colors.text }]}
                value={name}
                onChangeText={setName}
                placeholder="Enter your full name"
                placeholderTextColor={theme.colors.textSecondary}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Email Address</Text>
            <View style={[styles.inputContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.surface }]}>
              <Ionicons name="mail-outline" size={20} color={theme.colors.primary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.colors.text }]}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email address"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Phone Number</Text>
            <View style={[styles.inputContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.surface }]}>
              <Ionicons name="call-outline" size={20} color={theme.colors.primary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.colors.text }]}
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter your phone number"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Additional Profile Options */}
          <View style={styles.additionalOptions}>
            <TouchableOpacity 
              style={[styles.optionItem, { backgroundColor: theme.colors.card, borderColor: theme.colors.surface }]}
              onPress={() => navigation.navigate('ChangePassword')}
              activeOpacity={0.7}
            >
              <View style={[styles.optionIcon, { backgroundColor: theme.colors.surface }]}>
                <Ionicons name="lock-closed-outline" size={20} color="#FF9500" />
              </View>
              <Text style={[styles.optionText, { color: theme.colors.text }]}>Change Password</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.optionItem, { backgroundColor: theme.colors.card, borderColor: theme.colors.surface }]}
              activeOpacity={0.7}
            >
              <View style={[styles.optionIcon, { backgroundColor: theme.colors.surface }]}>
                <Ionicons name="shield-outline" size={20} color="#6C63FF" />
              </View>
              <Text style={[styles.optionText, { color: theme.colors.text }]}>Privacy Settings</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Color Picker Modal */}
        <Modal
          visible={showColorPicker}
          transparent={true}
          animationType="slide"
          onRequestClose={closeColorPicker}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.colorPickerModal, { backgroundColor: theme.colors.card }]}>
              <View style={styles.colorPickerHeader}>
                <Text style={[styles.colorPickerTitle, { color: theme.colors.secondary }]}>Choose Avatar Color</Text>
                <TouchableOpacity onPress={closeColorPicker} style={styles.modalCloseButton}>
                  <Ionicons name="close" size={24} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>
              
              <View style={[styles.currentColorPreview, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.previewLabel, { color: theme.colors.primary }]}>Preview:</Text>
                <Avatar 
                  name={name || 'User'} 
                  size={60}
                  fontSize={22}
                  {...(tempAvatarColor && { backgroundColor: tempAvatarColor })}
                  borderWidth={2}
                  borderColor={theme.colors.background}
                />
              </View>

              <Text style={[styles.colorPickerSubtitle, { color: theme.colors.primary }]}>Select a color for your avatar background:</Text>
              
              <FlatList
                data={avatarColors}
                renderItem={renderColorItem}
                keyExtractor={(item, index) => `color-${index}`}
                numColumns={5}
                contentContainerStyle={styles.colorGrid}
                columnWrapperStyle={styles.colorRow}
                showsVerticalScrollIndicator={false}
              />
              
              <View style={styles.colorPickerButtons}>
                <TouchableOpacity 
                  style={[styles.colorPickerButton, styles.resetButton, { backgroundColor: theme.colors.textSecondary }]}
                  onPress={() => setTempAvatarColor('')}
                >
                  <Text style={styles.resetButtonText}>Use Default</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.colorPickerButton, styles.confirmButton, { backgroundColor: theme.colors.primary }]}
                  onPress={confirmColorSelection}
                >
                  <Text style={styles.confirmButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>

      <CustomPopup
        visible={popup.visible}
        message={popup.message}
        type={popup.type}
        onClose={closePopup}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
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
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveButtonText: {
    fontWeight: '600',
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  changePhotoText: {
    marginLeft: 8,
    fontWeight: '500',
  },
  form: {
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 24,
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
  additionalOptions: {
    marginTop: 32,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  // Color Picker Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  colorPickerModal: {
    width: '92%',
    maxWidth: 380,
    borderRadius: 20,
    padding: 20,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  colorPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  colorPickerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalCloseButton: {
    padding: 4,
  },
  currentColorPreview: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    width: '100%',
  },
  previewLabel: {
    fontSize: 14,
    marginBottom: 12,
    fontWeight: '500',
  },
  colorPickerSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  colorGrid: {
    paddingBottom: 20,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  colorRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 0,
  },
  colorItem: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
    marginHorizontal: 2,
    borderWidth: 3,
    borderColor: '#E6F3FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  colorPickerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  colorPickerButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginHorizontal: 8,
    alignItems: 'center',
  },
  resetButton: {
    // Removed hardcoded backgroundColor - now using theme
  },
  confirmButton: {
    // Removed hardcoded backgroundColor - now using theme
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  // Legacy modal styles (kept for compatibility)
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C5282',
    marginBottom: 16,
  },
  colorList: {
    paddingBottom: 16,
  },
  closeButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#4A90E2',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
});
