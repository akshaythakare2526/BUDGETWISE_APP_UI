import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_CONFIG } from '../../core/config/constants';
import { groupAPI, userAPI } from '../../data/services/api';
import { TokenManager } from '../../data/TokenManager';
import CustomPopup, { PopupType } from '../components/CustomPopup';
import { useTheme } from '../../core/theme/ThemeContext';

export default function CreateGroupScreen() {
  const [groupName, setGroupName] = useState('');
  const [groupCode, setGroupCode] = useState('');
  const [description, setDescription] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState<{visible: boolean, message: string, type: PopupType}>(
    { visible: false, message: '', type: 'info' }
  );
  
  const navigation = useNavigation();
  const { theme } = useTheme();

  const showPopup = (message: string, type: PopupType = 'info') => setPopup({ visible: true, message, type });
  
  const closePopup = () => {
    const currentType = popup.type;
    setPopup(p => ({ ...p, visible: false }));
    // Navigate back only after closing success popup
    if (currentType === 'success') {
      navigation.goBack();
    }
  };

  const validateForm = () => {
    if (!groupName.trim()) {
      showPopup('Please enter a group name', 'error');
      return false;
    }
    if (!groupCode.trim()) {
      showPopup('Please enter a group code', 'error');
      return false;
    }
    if (!description.trim()) {
      showPopup('Please enter a description', 'error');
      return false;
    }
    if (!password.trim()) {
      showPopup('Please enter a password', 'error');
      return false;
    }
    if (password.length < 6) {
      showPopup('Password must be at least 6 characters long', 'error');
      return false;
    }
    return true;
  };

  const handleCreateGroup = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Get current token using TokenManager
      const token = await TokenManager.getCurrentToken();
      if (!token) {
        showPopup('User session expired. Please login again.', 'error');
        return;
      }

      // Get user data for userId
      const userData = await AsyncStorage.getItem(APP_CONFIG.STORAGE_KEYS.USER_DATA);
      if (!userData) {
        showPopup('User session expired. Please login again.', 'error');
        return;
      }

      const parsed = JSON.parse(userData);
      const userId = parsed.userId;

      // Step 1: Create the group
      const groupData = {
        GroupName: groupName.trim(),
        GroupCode: groupCode.trim(),
        Description: description.trim(),
        password: password
      };

      console.log('🏗️ Creating group:', groupData);
      await groupAPI.createGroup(groupData, token);
      console.log('✅ Group created successfully');

      // Step 2: Add user to the group
      const userGroupData = {
        groupCode: groupCode.trim(),
        Password: password
      };

      console.log('👤 Adding user to group:', userGroupData);
      await groupAPI.addUserToGroup(userGroupData, token);
      console.log('✅ User added to group successfully');

      // Step 3: Refresh user groups cache
      try {
        const userDetails = await userAPI.getUserDetails(token);
        const groups = userDetails.groups?.$values || [];
        await AsyncStorage.setItem(APP_CONFIG.STORAGE_KEYS.USER_GROUPS, JSON.stringify(groups));
        console.log('✅ Groups cache updated');
      } catch (cacheError) {
        console.log('⚠️ Failed to update groups cache:', cacheError);
      }

      showPopup('Group created successfully! You have been added to the group.', 'success');

    } catch (error: any) {
      console.log('❌ Error creating group:', error);
      let errorMessage = 'Failed to create group. Please try again.';
      
      if (error.response) {
        if (error.response.status === 400) {
          errorMessage = 'Invalid group data. Please check your inputs.';
        } else if (error.response.status === 409) {
          errorMessage = 'Group code already exists. Please choose a different code.';
        } else if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.request) {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      showPopup(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <CustomPopup visible={popup.visible} message={popup.message} type={popup.type} onClose={closePopup} />
      <KeyboardAvoidingView 
        style={[styles.container, { backgroundColor: theme.colors.background }]} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.scrollContainer} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={[styles.header, { backgroundColor: theme.colors.background }]}>
            <TouchableOpacity style={[styles.backButton, { backgroundColor: theme.colors.card }]} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.colors.secondary }]}>Create Group</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Form Container */}
          <View style={[styles.formContainer, { backgroundColor: theme.colors.card }]}>
            <View style={[styles.iconContainer, { backgroundColor: theme.colors.surface, borderColor: '#FF9500' }]}>
              <Ionicons name="people" size={40} color="#FF9500" />
            </View>
            
            <Text style={[styles.title, { color: theme.colors.secondary }]}>Create New Group</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Set up a group to manage shared expenses</Text>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Group Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.colors.surface, color: theme.colors.text, borderColor: theme.colors.background }]}
                placeholder="Enter group name"
                placeholderTextColor={theme.colors.textSecondary}
                value={groupName}
                onChangeText={setGroupName}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Group Code</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.colors.surface, color: theme.colors.text, borderColor: theme.colors.background }]}
                placeholder="Enter unique group code"
                placeholderTextColor={theme.colors.textSecondary}
                value={groupCode}
                onChangeText={setGroupCode}
                autoCapitalize="none"
                returnKeyType="next"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: theme.colors.surface, color: theme.colors.text, borderColor: theme.colors.background }]}
                placeholder="Describe the purpose of this group"
                placeholderTextColor={theme.colors.textSecondary}
                value={description}
                onChangeText={setDescription}
                multiline={true}
                numberOfLines={3}
                returnKeyType="next"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Password</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.colors.surface, color: theme.colors.text, borderColor: theme.colors.background }]}
                placeholder="Set a password for the group"
                placeholderTextColor={theme.colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleCreateGroup}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.createButton, 
                { backgroundColor: '#FF9500' },
                loading && [styles.buttonDisabled, { backgroundColor: '#FFB366' }]
              ]} 
              onPress={handleCreateGroup}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="add-circle" size={20} color="#fff" style={styles.buttonIcon} />
                  <Text style={styles.createButtonText}>Create Group</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  formContainer: {
    flex: 1,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 25,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 20,
    borderWidth: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  createButton: {
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginTop: 20,
    flexDirection: 'row',
    shadowColor: '#FF9500',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    shadowOpacity: 0.1,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonIcon: {
    marginRight: 8,
  },
});
