import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Modal } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_CONFIG } from '../../core/config/constants';
import { userAPI, groupAPI } from '../../data/services/api';
import { TokenManager } from '../../data/TokenManager';
import { useTheme } from '../../core/theme/ThemeContext';

type ViewGroupScreenRouteProp = RouteProp<{
  ViewGroup: {
    group: {
      id: string;
      groupName: string;
      groupCode: string;
      description?: string;
      createdAt?: string;
      memberCount?: number;
      password?: string;
    };
  };
}, 'ViewGroup'>;

export default function ViewGroupScreen() {
  const navigation = useNavigation();
  const route = useRoute<ViewGroupScreenRouteProp>();
  const { group } = route.params;
  const { theme } = useTheme();
  
  const [loading, setLoading] = useState(false);
  const [groupDetails, setGroupDetails] = useState(group);
  const [members, setMembers] = useState<any[]>([]);
  const [userCount, setUserCount] = useState<number>(Number(group.memberCount) || 0);
  const [userCountMessage, setUserCountMessage] = useState<string>('');
  const [isActiveGroup, setIsActiveGroup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Popup states
  const [confirmationPopup, setConfirmationPopup] = useState(false);
  const [successPopup, setSuccessPopup] = useState(false);
  const [errorPopup, setErrorPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState<string>('');

  useEffect(() => {
    loadGroupDetails();
    checkIfActiveGroup();
    fetchGroupUserCount();
  }, []);

  const checkIfActiveGroup = async () => {
    try {
      const activeGroupData = await AsyncStorage.getItem(APP_CONFIG.STORAGE_KEYS.ACTIVE_GROUP);
      if (activeGroupData) {
        const activeGroup = JSON.parse(activeGroupData);
        setIsActiveGroup(activeGroup.id === group.id);
      }
    } catch (error) {
      console.log('Error checking active group:', error);
    }
  };

  const loadGroupDetails = async () => {
    setLoading(true);
    try {
      const userData = await AsyncStorage.getItem(APP_CONFIG.STORAGE_KEYS.USER_DATA);
      if (userData) {
        const parsed = JSON.parse(userData);
        const token = parsed.token;
        
        if (token) {
          // You can add API call here to get more detailed group info if available
          // For now, we'll use the passed group data
          console.log('✅ Group details loaded:', groupDetails);
        }
      }
    } catch (error) {
      console.log('❌ Error loading group details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupUserCount = async () => {
    try {
      const userData = await AsyncStorage.getItem(APP_CONFIG.STORAGE_KEYS.USER_DATA);
      if (userData) {
        const parsed = JSON.parse(userData);
        const token = parsed.token;
        
        if (token) {
          console.log('🔄 Fetching group user count for group:', groupDetails.id);
          const response = await groupAPI.getGroupUserCount(groupDetails.id, token);
          
          if (response) {
            setUserCount(Number(response.userCount) || 0);
            setUserCountMessage(String(response.message || ''));
            console.log('✅ Group user count loaded:', response);
          }
        }
      }
    } catch (error: any) {
      console.log('❌ Error fetching group user count:', error);
      // Keep the original member count from props if API fails
      setUserCount(Number(groupDetails.memberCount) || 0);
      setUserCountMessage(`Group has ${Number(groupDetails.memberCount) || 0} member(s)`);
    }
  };

  const handleRemoveFromGroup = async () => {
    setConfirmationPopup(true);
  };

  const handleSwitchToGroup = async () => {
    setLoading(true);
    try {
      // Switch to group context and get group-specific token
      const success = await TokenManager.switchToGroup(groupDetails);
      if (success) {
        setIsActiveGroup(true);
        console.log('✅ Active group switched to:', groupDetails.groupName);
        
        // Show success message
        setPopupMessage(`Successfully switched to "${groupDetails.groupName}"`);
        setSuccessPopup(true);
        
        // Refresh user count after switching
        fetchGroupUserCount();
      } else {
        throw new Error('Failed to switch to group context');
      }
    } catch (error: any) {
      console.log('❌ Error switching group:', error);
      let errorMessage = 'Failed to switch to group. Please try again.';
      if (error.message) {
        errorMessage = error.message;
      }
      setPopupMessage(errorMessage);
      setErrorPopup(true);
    } finally {
      setLoading(false);
    }
  };

  const confirmLeaveGroup = async () => {
    setConfirmationPopup(false);
    setLoading(true);
    
    try {
      // Get user data
      const userData = await AsyncStorage.getItem(APP_CONFIG.STORAGE_KEYS.USER_DATA);
      if (!userData) {
        setPopupMessage('User not logged in');
        setErrorPopup(true);
        return;
      }
      
      const parsed = JSON.parse(userData);
      const token = parsed.token;
      const userId = parsed.userId;
      
      if (!token || !userId) {
        setPopupMessage('User authentication data not found');
        setErrorPopup(true);
        return;
      }
      
      // Call remove API
      await groupAPI.removeUserFromGroup(userId, groupDetails.id, token);
      console.log('✅ Removed from group:', groupDetails.groupName);
      
      // If this was the active group, switch to Personal
      if (isActiveGroup) {
        const success = await TokenManager.switchToPersonal();
        if (success) {
          await AsyncStorage.removeItem(APP_CONFIG.STORAGE_KEYS.ACTIVE_GROUP);
        }
      }
      
      // Remove group from cached groups
      const cachedGroups = await AsyncStorage.getItem(APP_CONFIG.STORAGE_KEYS.USER_GROUPS);
      if (cachedGroups) {
        const groups = JSON.parse(cachedGroups);
        const updatedGroups = groups.filter((g: any) => g.id !== groupDetails.id);
        await AsyncStorage.setItem(APP_CONFIG.STORAGE_KEYS.USER_GROUPS, JSON.stringify(updatedGroups));
      }
      
      setPopupMessage(`You have successfully left "${groupDetails.groupName}"`);
      setSuccessPopup(true);
      
    } catch (error: any) {
      console.log('❌ Error removing from group:', error);
      let errorMessage = 'Failed to leave group. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      setPopupMessage(errorMessage);
      setErrorPopup(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setSuccessPopup(false);
    // Only navigate back if this was a "leave group" action
    // For group switching, we stay on the page
    if (popupMessage.includes('left') || popupMessage.includes('removed')) {
      navigation.goBack();
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.background }]}>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: theme.colors.card }]} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.primary }]}>Group Details</Text>
        <TouchableOpacity 
          style={[styles.refreshButton, { backgroundColor: theme.colors.card }]} 
          onPress={fetchGroupUserCount}
          disabled={loading}
        >
          <Ionicons name="refresh" size={20} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Group Card */}
        <View style={[styles.groupCard, { backgroundColor: theme.colors.card }]}>
          <View style={styles.groupHeader}>
            <View style={styles.groupIcon}>
              <Ionicons name="people" size={32} color="#FF9500" />
            </View>
            {isActiveGroup && (
              <View style={styles.activeGroupBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#00C897" />
                <Text style={styles.activeGroupText}>Active</Text>
              </View>
            )}
          </View>
          
          <Text style={[styles.groupName, { color: theme.colors.primary }]}>{String(groupDetails.groupName || '')}</Text>
          <Text style={[styles.groupCode, { color: theme.colors.secondary }]}>Code: {String(groupDetails.groupCode || '')}</Text>
          
          {groupDetails.description && (
            <Text style={[styles.groupDescription, { color: theme.colors.textSecondary }]}>{String(groupDetails.description)}</Text>
          )}
        </View>

        {/* Group Information */}
        <View style={styles.infoSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>Group Information</Text>
          
          <View style={[styles.infoItem, { backgroundColor: theme.colors.card }]}>
            <View style={[styles.infoIcon, { backgroundColor: theme.colors.surface }]}>
              <Ionicons name="calendar-outline" size={20} color={theme.colors.secondary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: theme.colors.secondary }]}>Created Date</Text>
              <Text style={[styles.infoValue, { color: theme.colors.primary }]}>{String(formatDate(groupDetails.createdAt))}</Text>
            </View>
          </View>

          <View style={[styles.infoItem, { backgroundColor: theme.colors.card }]}>
            <View style={[styles.infoIcon, { backgroundColor: theme.colors.surface }]}>
              <Ionicons name="key-outline" size={20} color={theme.colors.secondary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: theme.colors.secondary }]}>Group Code</Text>
              <Text style={[styles.infoValue, { color: theme.colors.primary }]}>{String(groupDetails.groupCode || '')}</Text>
            </View>
          </View>

          <View style={[styles.infoItem, { backgroundColor: theme.colors.card }]}>
            <View style={[styles.infoIcon, { backgroundColor: theme.colors.surface }]}>
              <Ionicons name="lock-closed-outline" size={20} color={theme.colors.secondary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: theme.colors.secondary }]}>Password</Text>
              <View style={styles.passwordContainer}>
                <Text style={[styles.infoValue, { color: theme.colors.primary }]}>
                  {String(groupDetails.password 
                    ? (showPassword ? groupDetails.password : '••••••••')
                    : 'No password set'
                  )}
                </Text>
                {groupDetails.password && (
                  <TouchableOpacity
                    style={styles.passwordToggle}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color={theme.colors.secondary}
                    />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          <View style={[styles.infoItem, { backgroundColor: theme.colors.card }]}>
            <View style={[styles.infoIcon, { backgroundColor: theme.colors.surface }]}>
              <Ionicons name="people-outline" size={20} color={theme.colors.secondary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: theme.colors.secondary }]}>Members</Text>
              <Text style={[styles.infoValue, { color: theme.colors.primary }]}>{String(userCount)}</Text>
              {userCountMessage && typeof userCountMessage === 'string' && userCountMessage.trim() !== '' && (
                <Text style={[styles.infoSubtext, { color: theme.colors.textSecondary }]}>{String(userCountMessage)}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Status Section */}
        <View style={styles.statusSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>Status</Text>
          <View style={[styles.statusCard, { backgroundColor: theme.colors.card }]}>
            <View style={styles.statusIcon}>
              <Ionicons 
                name={isActiveGroup ? "checkmark-circle" : "radio-button-off"} 
                size={24} 
                color={isActiveGroup ? "#00C897" : "#B0B0B0"} 
              />
            </View>
            <View style={styles.statusContent}>
              <Text style={[styles.statusLabel, { color: theme.colors.primary }]}>
                {isActiveGroup ? 'Currently Active Group' : 'Inactive Group'}
              </Text>
              <Text style={[styles.statusDescription, { color: theme.colors.textSecondary }]}>
                {isActiveGroup 
                  ? 'This is your active group. All expenses will be recorded here.'
                  : 'Switch to this group to record expenses for this group.'
                }
              </Text>
            </View>
            {!isActiveGroup && (
              <TouchableOpacity
                style={[styles.switchButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.secondary }]}
                onPress={handleSwitchToGroup}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={theme.colors.secondary} size="small" />
                ) : (
                  <>
                    <Ionicons name="swap-horizontal" size={16} color={theme.colors.secondary} />
                    <Text style={[styles.switchButtonText, { color: theme.colors.secondary }]}>Switch</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Actions Section */}
        <View style={styles.actionsSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>Actions</Text>
          
          <TouchableOpacity
            style={styles.dangerButton}
            onPress={handleRemoveFromGroup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons name="exit-outline" size={20} color="#FFFFFF" />
                <Text style={styles.dangerButtonText}>Leave Group</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Confirmation Popup */}
      <Modal
        visible={confirmationPopup}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setConfirmationPopup(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.confirmationModal, { backgroundColor: theme.colors.card }]}>
            <View style={styles.confirmationHeader}>
              <View style={styles.warningIconContainer}>
                <Ionicons name="warning" size={40} color="#FF4C5E" />
              </View>
              <Text style={[styles.confirmationTitle, { color: theme.colors.primary }]}>Leave Group?</Text>
            </View>
            
            <Text style={[styles.confirmationMessage, { color: theme.colors.secondary }]}>
              Are you sure you want to leave "{String(groupDetails.groupName || '')}"?
            </Text>
            
            <Text style={[styles.confirmationWarning, { color: theme.colors.textSecondary }]}>
              This action cannot be undone and you'll need to be re-invited to join again.
            </Text>
            
            <View style={styles.confirmationButtons}>
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                onPress={() => setConfirmationPopup(false)}
              >
                <Text style={[styles.cancelButtonText, { color: theme.colors.secondary }]}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={confirmLeaveGroup}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.confirmButtonText}>Leave Group</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Success Popup */}
      <Modal
        visible={successPopup}
        transparent={true}
        animationType="fade"
        onRequestClose={handleSuccessClose}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.successModal, { backgroundColor: theme.colors.card }]}>
            <View style={styles.successHeader}>
              <View style={styles.successIconContainer}>
                <Ionicons name="checkmark-circle" size={60} color="#00C897" />
              </View>
              <Text style={styles.successTitle}>Success!</Text>
            </View>
            
            <Text style={[styles.successMessage, { color: theme.colors.secondary }]}>
              {String(popupMessage || '')}
            </Text>
            
            <TouchableOpacity
              style={styles.successButton}
              onPress={handleSuccessClose}
            >
              <Text style={styles.successButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Error Popup */}
      <Modal
        visible={errorPopup}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setErrorPopup(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.errorModal, { backgroundColor: theme.colors.card }]}>
            <View style={styles.errorHeader}>
              <View style={styles.errorIconContainer}>
                <Ionicons name="close-circle" size={60} color="#FF4C5E" />
              </View>
              <Text style={styles.errorTitle}>Error</Text>
            </View>
            
            <Text style={[styles.errorMessage, { color: theme.colors.secondary }]}>
              {String(popupMessage || '')}
            </Text>
            
            <TouchableOpacity
              style={styles.errorButton}
              onPress={() => setErrorPopup(false)}
            >
              <Text style={styles.errorButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F8FF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#F0F8FF',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    opacity: 0.9,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C5282',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  groupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  groupIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF5E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeGroupBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#00C897',
  },
  activeGroupText: {
    color: '#00C897',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  groupName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C5282',
    marginBottom: 8,
  },
  groupCode: {
    fontSize: 16,
    color: '#4A90E2',
    fontWeight: '500',
    marginBottom: 12,
  },
  groupDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  infoSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C5282',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E6F3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#4A90E2',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C5282',
  },
  infoSubtext: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    fontStyle: 'italic',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  passwordToggle: {
    padding: 4,
    marginLeft: 8,
  },
  statusSection: {
    marginBottom: 24,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statusIcon: {
    marginRight: 16,
  },
  statusContent: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C5282',
    marginBottom: 4,
  },
  statusDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 18,
  },
  switchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F3FF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#4A90E2',
  },
  switchButtonText: {
    color: '#4A90E2',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  actionsSection: {
    marginBottom: 40,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF4C5E',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    shadowColor: '#FF4C5E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  dangerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  
  // Confirmation Modal Styles
  confirmationModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  confirmationHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  warningIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  confirmationTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2C5282',
    textAlign: 'center',
  },
  confirmationMessage: {
    fontSize: 16,
    color: '#4A90E2',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 12,
  },
  confirmationWarning: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 30,
    fontStyle: 'italic',
  },
  confirmationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cancelButtonText: {
    color: '#4A90E2',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#FF4C5E',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#FF4C5E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // Success Modal Styles
  successModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  successHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  successIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00C897',
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: '#4A90E2',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  successButton: {
    backgroundColor: '#00C897',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#00C897',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  successButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // Error Modal Styles
  errorModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  errorHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  errorIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FF4C5E',
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#4A90E2',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  errorButton: {
    backgroundColor: '#FF4C5E',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#FF4C5E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  errorButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
