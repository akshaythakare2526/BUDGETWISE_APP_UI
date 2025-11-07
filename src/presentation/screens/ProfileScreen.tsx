import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Modal, TextInput, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_CONFIG } from '../../core/config/constants';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import CustomPopup from '../components/CustomPopup';
import Avatar from '../components/Avatar';
import { userAPI, groupAPI } from '../../data/services/api';
import { TokenManager } from '../../data/TokenManager';
import ContextIndicator from '../components/ContextIndicator';
import { AvatarColorStorage } from '../../utils/AvatarColorStorage';
import { useTheme } from '../../core/theme/ThemeContext';

type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ProfileScreen() {
  const [user, setUser] = useState({ name: '', email: '' });
  const [avatarColor, setAvatarColor] = useState<string>('');
  const [logoutPopup, setLogoutPopup] = useState(false);
  const [groupExpanded, setGroupExpanded] = useState(false);
  const [userGroups, setUserGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeGroup, setActiveGroup] = useState<any>(null); // null means "Personal"
  const [joinGroupModal, setJoinGroupModal] = useState(false);
  const [groupCode, setGroupCode] = useState('');
  const [groupPassword, setGroupPassword] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const groupPasswordInputRef = useRef<TextInput>(null);
  const { theme } = useTheme();

  useEffect(() => {
    fetchUser();
  }, []);

  // Function to load active group from storage
  const loadActiveGroup = async () => {
    try {
      const activeGroupData = await AsyncStorage.getItem(APP_CONFIG.STORAGE_KEYS.ACTIVE_GROUP);
      if (activeGroupData) {
        const group = JSON.parse(activeGroupData);
        setActiveGroup(group);
        console.log('✅ Active group loaded:', group);
      } else {
        setActiveGroup(null); // Personal mode
        console.log('ℹ️ No active group, using Personal mode');
      }
    } catch (error) {
      console.log('❌ Error loading active group:', error);
      setActiveGroup(null);
    }
  };

  // Function to set active group with token switching
  const setActiveGroupAndSave = async (group: any) => {
    try {
      if (group) {
        // Switch to group context and get group-specific token
        const success = await TokenManager.switchToGroup(group);
        if (success) {
          setActiveGroup(group);
          console.log('✅ Active group set with token context:', group.groupName);
          // Navigate back to Dashboard tab in the tab navigator
          navigation.goBack();
        } else {
          throw new Error('Failed to switch to group context');
        }
      } else {
        // Switch back to personal context
        const success = await TokenManager.switchToPersonal();
        if (success) {
          setActiveGroup(null);
          console.log('✅ Switched to Personal mode');
          // Navigate back to Dashboard tab in the tab navigator
          navigation.goBack();
        } else {
          throw new Error('Failed to switch to personal context');
        }
      }
    } catch (error) {
      console.log('❌ Error setting active group:', error);
      Alert.alert('Error', 'Failed to switch context. Please try again.');
    }
  };

  // Function to load groups from cache
  const loadGroupsFromCache = async () => {
    try {
      const cachedGroups = await AsyncStorage.getItem(APP_CONFIG.STORAGE_KEYS.USER_GROUPS);
      if (cachedGroups) {
        const groups = JSON.parse(cachedGroups);
        setUserGroups(groups);
        console.log('✅ Groups loaded from cache:', groups);
      } else {
        setUserGroups([]);
        console.log('ℹ️ No cached groups found');
      }
    } catch (error) {
      console.log('❌ Error loading groups from cache:', error);
      setUserGroups([]);
    }
  };

  // Function to refresh groups from API (when needed)
  const refreshGroupsFromAPI = async () => {
    setLoading(true);
    try {
      const userData = await AsyncStorage.getItem(APP_CONFIG.STORAGE_KEYS.USER_DATA);
      if (userData) {
        const parsed = JSON.parse(userData);
        const token = parsed.token;
        
        if (token) {
          console.log('� Refreshing groups from API...');
          const userDetails = await userAPI.getUserDetails(token);
          const groups = userDetails.groups?.$values || [];
          
          // Update cache
          await AsyncStorage.setItem(APP_CONFIG.STORAGE_KEYS.USER_GROUPS, JSON.stringify(groups));
          setUserGroups(groups);
          console.log('✅ Groups refreshed and cached:', groups);
        }
      }
    } catch (error) {
      console.log('❌ Error refreshing groups:', error);
      // Keep existing cached groups on error
    } finally {
      setLoading(false);
    }
  };

  // Load groups and active group when component mounts
  useEffect(() => {
    loadGroupsFromCache();
    loadActiveGroup();
  }, []);

  // Refresh groups and active group when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadGroupsFromCache();
      loadActiveGroup();
      // Refresh user data when coming back from edit profile
      fetchUser();
    }, [])
  );

  const fetchUser = async () => {
    try {
      const userData = await AsyncStorage.getItem(APP_CONFIG.STORAGE_KEYS.USER_DATA);
      if (userData) {
        const parsed = JSON.parse(userData);
        const userEmail = parsed.email || '';
        
        setUser({
          name: parsed.name || parsed.userName || 'User',
          email: userEmail,
        });

        // Load avatar color from local storage
        if (userEmail) {
          const savedAvatarColor = await AvatarColorStorage.loadAvatarColor(userEmail);
          setAvatarColor(savedAvatarColor || '');
          console.log('Profile - Avatar color loaded:', savedAvatarColor);
        }
      }
    } catch (error) {
      console.log('Error fetching user:', error);
    }
  };

  // Load groups when group section is expanded (from cache, no API call)
  useEffect(() => {
    if (groupExpanded && userGroups.length === 0) {
      loadGroupsFromCache();
    }
  }, [groupExpanded]);

  const handleLogout = async () => {
    setLogoutPopup(false);
    console.log('🚪 Starting logout process...');
    
    try {
      // Get current token (could be personal or group token)
      const currentToken = await TokenManager.getCurrentToken();
      if (currentToken) {
        await userAPI.logout(currentToken);
        console.log('✅ Logout API call successful');
      }
    } catch (e) {
      console.log('⚠️ Logout API error (continuing anyway):', e);
    }
    
    // Clear all tokens and data using TokenManager
    await TokenManager.clearAllTokens();
    await AsyncStorage.removeItem(APP_CONFIG.STORAGE_KEYS.USER_GROUPS);
    await AsyncStorage.removeItem(APP_CONFIG.STORAGE_KEYS.APP_SETTINGS);
    
    // Clear avatar colors for all users (optional - could keep for faster re-login)
    await AvatarColorStorage.clearAllAvatarColors();
    
    // Set navigation trigger to force AppNavigator to detect logout
    await AsyncStorage.setItem('@budgetwise_navigation_trigger', Date.now().toString());
    
    console.log('🧹 All data cleared from storage');
    console.log('🔄 AppNavigator will detect logout and switch to auth screens');
  };

  const closeJoinGroupModal = () => {
    setJoinGroupModal(false);
    setGroupCode('');
    setGroupPassword('');
  };
  const handleJoinGroup = async () => {
    setJoinLoading(true);
    try {
      // Basic validation
      if (!groupCode.trim()) {
        return Alert.alert('Validation Error', 'Group code is required');
      }
      
      // Get user token
      const userData = await AsyncStorage.getItem(APP_CONFIG.STORAGE_KEYS.USER_DATA);
      if (!userData) {
        return Alert.alert('Error', 'User not logged in');
      }
      
      const parsed = JSON.parse(userData);
      const token = parsed.token;
      
      if (!token) {
        return Alert.alert('Error', 'Authentication token not found');
      }
      
      // Join group API call using addUserToGroup
      const groupData = {
        groupCode: groupCode.trim(),
        Password: groupPassword.trim() || null
      };
      const response = await groupAPI.addUserToGroup(groupData, token);
      console.log('✅ Joined group:', response);
      
      // Refresh groups to get updated list
      await refreshGroupsFromAPI();
      
      // Close modal and clear form
      closeJoinGroupModal();
      
      Alert.alert('Success', 'You have joined the group successfully');
    } catch (error: any) {
      console.log('❌ Error joining group:', error);
      let errorMessage = 'Failed to join the group. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      Alert.alert('Error', errorMessage);
    } finally {
      setJoinLoading(false);
    }
  };

  const handleRemoveFromGroup = async (group: any) => {
    Alert.alert(
      'Remove from Group',
      `Are you sure you want to leave "${group.groupName}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              // Get user data
              const userData = await AsyncStorage.getItem(APP_CONFIG.STORAGE_KEYS.USER_DATA);
              if (!userData) {
                return Alert.alert('Error', 'User not logged in');
              }
              
              const parsed = JSON.parse(userData);
              const token = parsed.token;
              const userId = parsed.userId;
              
              if (!token || !userId) {
                return Alert.alert('Error', 'User authentication data not found');
              }
              
              // Call remove API
              await groupAPI.removeUserFromGroup(userId, group.id, token);
              console.log('✅ Removed from group:', group.groupName);
              
              // If the removed group was active, switch to Personal
              if (activeGroup && activeGroup.id === group.id) {
                await setActiveGroupAndSave(null);
              }
              
              // Refresh groups
              await refreshGroupsFromAPI();
              
              Alert.alert('Success', `You have been removed from "${group.groupName}"`);
            } catch (error: any) {
              console.log('❌ Error removing from group:', error);
              let errorMessage = 'Failed to remove from group. Please try again.';
              if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
              } else if (error.message) {
                errorMessage = error.message;
              }
              Alert.alert('Error', errorMessage);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={styles.scrollContent}>
      <Text style={[styles.profileTitle, { color: theme.colors.secondary }]}>Profile</Text>
      
      {/* Context Indicator */}
      <ContextIndicator />
      
      <TouchableOpacity 
        style={styles.avatarContainer}
        activeOpacity={0.8}
        onPress={() => {
          // Could potentially open avatar change modal in future
          console.log('Avatar tapped - could implement photo change functionality');
        }}
      >
        <Avatar 
          name={user.name} 
          size={100}
          fontSize={36}
          borderWidth={3}
          borderColor="#E6F3FF"
          {...(avatarColor && { backgroundColor: avatarColor })}
        />
      </TouchableOpacity>
      <Text style={[styles.name, { color: theme.colors.secondary }]}>{user.name}</Text>
      <Text style={[styles.email, { color: theme.colors.textSecondary }]}>{user.email}</Text>
      <View style={styles.menuList}>
        <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.colors.card }]} onPress={() => navigation.navigate('EditProfile' as never)}>
          <View style={[styles.menuIcon, { backgroundColor: '#6C63FF' }]}>  
            <Ionicons name="person-outline" size={22} color="#fff" />
          </View>
          <Text style={[styles.menuText, { color: theme.colors.primary }]}>Edit Profile</Text>
          <Ionicons name="chevron-forward" size={22} color={theme.colors.textSecondary} style={styles.menuArrow} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.colors.card }]} onPress={() => setGroupExpanded(!groupExpanded)}>
          <View style={[styles.menuIcon, { backgroundColor: '#FF9500' }]}>  
            <Ionicons name="people-outline" size={22} color="#fff" />
          </View>
          <Text style={[styles.menuText, { color: theme.colors.primary }]}>Group</Text>
          <Ionicons 
            name={groupExpanded ? "chevron-down" : "chevron-forward"} 
            size={22} 
            color={theme.colors.textSecondary} 
            style={styles.menuArrow} 
          />
        </TouchableOpacity>
        {groupExpanded && (
          <View style={styles.groupContent}>
            <View style={[styles.groupDemo, { backgroundColor: theme.colors.card }]}> 
              <View style={styles.groupHeader}>
                <Text style={[styles.groupTitle, { color: theme.colors.primary }]}>Active Group</Text>
                <TouchableOpacity 
                  style={styles.refreshButton} 
                  onPress={refreshGroupsFromAPI}
                  disabled={loading}
                >
                  <Ionicons 
                    name="refresh" 
                    size={20} 
                    color={loading ? "#B0B0B0" : "#FF9500"} 
                  />
                </TouchableOpacity>
              </View>

              {/* Current Active Group Display */}
              <View style={[styles.activeGroupContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.primary }]}> 
                <Text style={[styles.activeGroupLabel, { color: theme.colors.primary }]}>Currently Active:</Text>
                <TouchableOpacity 
                  style={[styles.groupItem, styles.activeGroupItem]}
                  onPress={() => activeGroup && navigation.getParent()?.navigate('ViewGroup', { group: activeGroup })}
                  activeOpacity={activeGroup ? 0.7 : 1}
                  disabled={!activeGroup}
                >
                  {activeGroup ? (
                    <Avatar 
                      name={activeGroup.groupName} 
                      size={40}
                      fontSize={16}
                      backgroundColor="#FF9500"
                    />
                  ) : (
                    <View style={[styles.groupAvatar, styles.personalAvatar]}>
                      <Ionicons name="person" size={20} color="#4A90E2" />
                    </View>
                  )}
                  <View style={styles.groupInfo}>
                    <Text style={[styles.groupName, { color: theme.colors.primary }]}> 
                      {activeGroup ? activeGroup.groupName : "Personal"}
                    </Text>
                    <Text style={[styles.groupMembers, { color: theme.colors.textSecondary }]}> 
                      {activeGroup 
                        ? `Code: ${activeGroup.groupCode}` 
                        : "Your individual expenses"
                      }
                    </Text>
                  </View>
                  <View style={styles.activeIndicator}>
                    <Ionicons name="checkmark-circle" size={24} color="#00C897" />
                    {activeGroup && (
                      <Ionicons name="chevron-forward" size={20} color="#00C897" style={{ marginLeft: 8 }} />
                    )}
                  </View>
                </TouchableOpacity>
              </View>

              {/* Group Selection */}
              <Text style={[styles.selectionTitle, { color: theme.colors.secondary }]}>Switch to:</Text>
              
              {/* Personal Option */}
              {activeGroup && (
                <View style={[styles.groupItem, { backgroundColor: theme.colors.background }]}> 
                  <View style={[styles.groupAvatar, styles.personalAvatar]}>
                    <Ionicons name="person" size={20} color="#4A90E2" />
                  </View>
                  <View style={styles.groupInfo}>
                    <Text style={[styles.groupName, { color: theme.colors.primary }]}>Personal</Text>
                    <Text style={[styles.groupMembers, { color: theme.colors.textSecondary }]}>Your individual expenses</Text>
                  </View>
                    <TouchableOpacity 
                      style={[styles.selectButton, { backgroundColor: theme.colors.primary }]}
                      onPress={() => setActiveGroupAndSave(null)}
                    >
                      <Text style={[styles.selectButtonText, { color: theme.colors.card }]}>Select</Text>
                    </TouchableOpacity>
                </View>
              )}

              {/* Available Groups */}
              {loading ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Loading groups...</Text>
                </View>
              ) : userGroups.length > 0 ? (
                userGroups
                  .filter((group: any) => !activeGroup || group.id !== activeGroup.id)
                  .map((group: any, index: number) => (
                    <TouchableOpacity
                      key={group.id || index} 
                      style={[styles.groupItem, { backgroundColor: theme.colors.background }]}
                      onPress={() => navigation.getParent()?.navigate('ViewGroup', { group })}
                      activeOpacity={0.7}
                    >
                      <Avatar 
                        name={group.groupName || `Group ${index + 1}`} 
                        size={40}
                        fontSize={16}
                        backgroundColor="#FF9500"
                      />
                      <View style={styles.groupInfo}>
                        <Text style={[styles.groupName, { color: theme.colors.primary }]}> 
                          {group.groupName || `Group ${index + 1}`}
                        </Text>
                        <Text style={[styles.groupMembers, { color: theme.colors.textSecondary }]}> 
                          Code: {group.groupCode || 'N/A'}
                        </Text>
                        {group.description && (
                          <Text style={[styles.groupDescription, { color: theme.colors.textSecondary }]}> 
                            {group.description}
                          </Text>
                        )}
                      </View>
                      <View style={styles.groupButtonsContainer}>
                        <TouchableOpacity 
                          style={[styles.selectButton, { backgroundColor: theme.colors.primary }]}
                          onPress={(e) => {
                            e.stopPropagation();
                            setActiveGroupAndSave(group);
                          }}
                        >
                          <Text style={[styles.selectButtonText, { color: theme.colors.card }]}>Select</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.viewButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.primary }]}
                          onPress={(e) => {
                            e.stopPropagation();
                            navigation.getParent()?.navigate('ViewGroup', { group });
                          }}
                        >
                          <Text style={[styles.viewButtonText, { color: theme.colors.primary }]}>View</Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  ))
              ) : (
                <View style={styles.noGroupsContainer}>
                  <Ionicons name="people-outline" size={40} color="#B0B0B0" />
                  <Text style={styles.noGroupsText}>No groups found</Text>
                  <Text style={styles.noGroupsSubtext}>Create a group to get started</Text>
                </View>
              )}

              <View style={styles.groupActions}>
                <TouchableOpacity style={styles.createGroupButton} onPress={() => navigation.navigate('CreateGroup' as never)}>
                  <Ionicons name="add-circle" size={20} color="#FF9500" />
                  <Text style={styles.createGroupText}>Create New Group</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.joinGroupButton} onPress={() => setJoinGroupModal(true)}>
                  <Ionicons name="enter-outline" size={20} color="#4A90E2" />
                  <Text style={styles.joinGroupText}>Join Group</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.colors.card }]} onPress={() => navigation.navigate('Settings' as never)}>
          <View style={[styles.menuIcon, { backgroundColor: '#00C897' }]}>  
            <Ionicons name="settings-outline" size={22} color="#fff" />
          </View>
          <Text style={[styles.menuText, { color: theme.colors.primary }]}>Settings</Text>
          <Ionicons name="chevron-forward" size={22} color={theme.colors.textSecondary} style={styles.menuArrow} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.colors.card }]} onPress={() => navigation.navigate('PrivacyPolicy' as never)}>
          <View style={[styles.menuIcon, { backgroundColor: '#444444' }]}>  
            <FontAwesome name="lock" size={20} color="#fff" />
          </View>
          <Text style={[styles.menuText, { color: theme.colors.primary }]}>Privacy Policy</Text>
          <Ionicons name="chevron-forward" size={22} color={theme.colors.textSecondary} style={styles.menuArrow} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.colors.card }]} onPress={() => setLogoutPopup(true)}>
          <View style={[styles.menuIcon, { backgroundColor: '#FF4C5E' }]}>  
            <MaterialIcons name="power-settings-new" size={22} color="#fff" />
          </View>
          <Text style={[styles.menuText, { color: '#FF4C5E' }]}>Logout</Text>
          <Ionicons name="chevron-forward" size={22} color={theme.colors.textSecondary} style={styles.menuArrow} />
        </TouchableOpacity>
      </View>

      
      {/* Join Group Modal */}
      <Modal
        visible={joinGroupModal}
        transparent={true}
        animationType="fade"
        onRequestClose={closeJoinGroupModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.joinModalCard, { backgroundColor: theme.colors.card }]}>
            <View style={styles.joinModalHeader}>
              <Ionicons name="enter-outline" size={32} color={theme.colors.primary} style={{marginBottom: 8}} />
              <Text style={[styles.joinModalTitle, { color: theme.colors.secondary }]}>Join Existing Group</Text>
              <Text style={[styles.joinModalSubtitle, { color: theme.colors.textSecondary }]}>Enter the group code and password to join a group</Text>
            </View>
            <View style={styles.modalInputContainer}>
              <Text style={[styles.modalInputLabel, { color: theme.colors.textSecondary }]}>Group Code</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: theme.colors.surface, color: theme.colors.text, borderColor: theme.colors.background }]}
                placeholder="Enter group code"
                placeholderTextColor={theme.colors.textSecondary}
                value={groupCode}
                onChangeText={setGroupCode}
                autoCapitalize="none"
                returnKeyType="next"
                onSubmitEditing={() => groupPasswordInputRef.current?.focus()}
              />
            </View>
            <View style={styles.modalInputContainer}>
              <Text style={[styles.modalInputLabel, { color: theme.colors.textSecondary }]}>Password </Text>
              <TextInput
                ref={groupPasswordInputRef}
                style={[styles.modalInput, { backgroundColor: theme.colors.surface, color: theme.colors.text, borderColor: theme.colors.background }]}
                placeholder="Enter password"
                placeholderTextColor={theme.colors.textSecondary}
                value={groupPassword}
                onChangeText={setGroupPassword}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleJoinGroup}
              />
            </View>
            <View style={styles.joinModalButtons}>
              <TouchableOpacity
                style={[styles.joinModalButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleJoinGroup}
                disabled={joinLoading}
              >
                {joinLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.joinModalButtonText}>Join Group</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.joinModalButton, { backgroundColor: theme.colors.textSecondary }]}
                onPress={closeJoinGroupModal}
                disabled={joinLoading}
              >
                <Text style={styles.joinModalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <CustomPopup
        visible={logoutPopup}
        message="Are you sure you want to logout?"
        type="confirm"
        onClose={() => setLogoutPopup(false)}
        onConfirm={handleLogout}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F8FF', // Light blue background
  },
  scrollContent: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 30,
  },
  profileTitle: {
    color: '#2C5282', // Dark blue text
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 18,
  },
  avatarContainer: {
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    color: '#2C5282',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 6,
  },
  email: {
    color: '#4A90E2',
    fontSize: 15,
    marginBottom: 24,
    marginTop: 2,
  },
  menuList: {
    width: '90%',
    marginTop: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', // White card
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 14,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  menuIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuText: {
    color: '#2C5282',
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  menuArrow: {
    marginLeft: 8,
  },
  groupContent: {
    marginBottom: 14,
  },
  groupDemo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  groupTitle: {
    color: '#2C5282',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  refreshButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#FFF5E6',
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16, // Add horizontal padding so items don't touch borders
    borderBottomWidth: 1,
    borderBottomColor: '#F0F8FF',
    borderRadius: 16, // Make group list items more circular
    marginBottom: 8,
  },
  groupAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF5E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    color: '#2C5282',
    fontSize: 16,
    fontWeight: '600',
  },
  groupMembers: {
    color: '#4A90E2',
    fontSize: 14,
    marginTop: 2,
  },
  groupDescription: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 2,
    fontStyle: 'italic',
  },
  groupAction: {
    backgroundColor: '#FF9500',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  groupActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  activeGroupContainer: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#00C897',
  },
  activeGroupLabel: {
    color: '#00C897',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  activeGroupItem: {
    borderBottomWidth: 0,
    paddingVertical: 8,
  },
  personalAvatar: {
    backgroundColor: '#E6F3FF',
  },
  activeIndicator: {
    marginLeft: 8,
  },
  selectionTitle: {
    color: '#2C5282',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8,
  },
  selectButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  selectButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  groupButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  removeButton: {
    backgroundColor: '#FFE6E6',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginLeft: 4,
  },
  viewButton: {
    backgroundColor: '#E6F3FF',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginLeft: 4,
  },
  viewButtonText: {
    color: '#4A90E2',
    fontSize: 14,
    fontWeight: '500',
  },
  createGroupButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    paddingVertical: 12,
    paddingHorizontal: 10,
    backgroundColor: '#FFF5E6',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF9500',
  },
  createGroupText: {
    color: '#FF9500',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingText: {
    color: '#4A90E2',
    fontSize: 16,
  },
  noGroupsContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  noGroupsText: {
    color: '#2C5282',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  noGroupsSubtext: {
    color: '#4A90E2',
    fontSize: 14,
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  modalTitle: {
    color: '#2C5282',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modalInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  groupActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  joinGroupButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
    paddingVertical: 12,
    backgroundColor: '#E6F3FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4A90E2',
  },
  joinGroupText: {
    color: '#4A90E2',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  joinModalCard: {
    width: '90%',
    borderRadius: 20,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
    alignItems: 'stretch',
  },
  joinModalHeader: {
    alignItems: 'center',
    marginBottom: 18,
  },
  joinModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  joinModalSubtitle: {
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'center',
  },
  modalInputContainer: {
    marginBottom: 16,
  },
  modalInputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  joinModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
  },
  joinModalButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 14,
    marginHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinModalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
