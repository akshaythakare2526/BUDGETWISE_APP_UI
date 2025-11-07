import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_CONFIG } from '../core/config/constants';
import { userAPI } from './services/api';

export interface TokenContext {
  token: string;
  isGroupContext: boolean;
  groupId?: string;
  groupName?: string;
}

export class TokenManager {
  // Get current context token (personal or group)
  static async getCurrentToken(): Promise<string | null> {
    try {
      // First try to get context token (could be group token)
      const contextToken = await AsyncStorage.getItem(APP_CONFIG.STORAGE_KEYS.CONTEXT_TOKEN);
      if (contextToken) {
        return contextToken;
      }

      // Fallback to personal token
      const userData = await AsyncStorage.getItem(APP_CONFIG.STORAGE_KEYS.USER_DATA);
      if (userData) {
        const parsed = JSON.parse(userData);
        const personalToken = parsed.token || null;
        return personalToken;
      }

      return null;
    } catch (error) {
      console.error('Error getting current token:', error);
      return null;
    }
  }

  // Get current token context info
  static async getTokenContext(): Promise<TokenContext | null> {
    try {
      const currentToken = await this.getCurrentToken();
      if (!currentToken) return null;

      const activeGroup = await AsyncStorage.getItem(APP_CONFIG.STORAGE_KEYS.ACTIVE_GROUP);
      
      if (activeGroup) {
        const group = JSON.parse(activeGroup);
        return {
          token: currentToken,
          isGroupContext: true,
          groupId: group.id,
          groupName: group.groupName,
        };
      } else {
        return {
          token: currentToken,
          isGroupContext: false,
        };
      }
    } catch (error) {
      console.log('❌ Error getting token context:', error);
      return null;
    }
  }

  // Switch to group context (get group-specific token)
  static async switchToGroup(group: any): Promise<boolean> {
    try {
      console.log('🔄 Switching to group context:', group.groupName);

      // Get current personal token
      const userData = await AsyncStorage.getItem(APP_CONFIG.STORAGE_KEYS.USER_DATA);
      if (!userData) {
        throw new Error('No user data found');
      }

      const parsed = JSON.parse(userData);
      const personalToken = parsed.token;

      if (!personalToken) {
        throw new Error('No personal token found');
      }

      // Call switch API to get group-specific token
      const response = await userAPI.switchToGroup(group.id, personalToken);
      
      if (response && response.token) {
        // Store the group-specific token as context token
        await AsyncStorage.setItem(APP_CONFIG.STORAGE_KEYS.CONTEXT_TOKEN, response.token);
        
        // Store active group info
        await AsyncStorage.setItem(APP_CONFIG.STORAGE_KEYS.ACTIVE_GROUP, JSON.stringify(group));
        
        console.log('✅ Successfully switched to group context');
        console.log('🔑 Group token stored, switchToGroup:', response.switchToGroup);
        
        return true;
      } else {
        throw new Error('Invalid response from switch API');
      }
    } catch (error) {
      console.log('❌ Error switching to group:', error);
      return false;
    }
  }

  // Switch back to personal context
  static async switchToPersonal(): Promise<boolean> {
    try {
      console.log('🔄 Switching to personal context');

      // Remove context token (fallback to personal token)
      await AsyncStorage.removeItem(APP_CONFIG.STORAGE_KEYS.CONTEXT_TOKEN);
      
      // Remove active group
      await AsyncStorage.removeItem(APP_CONFIG.STORAGE_KEYS.ACTIVE_GROUP);
      
      console.log('✅ Successfully switched to personal context');
      
      return true;
    } catch (error) {
      console.log('❌ Error switching to personal:', error);
      return false;
    }
  }

  // Clear all tokens (logout)
  static async clearAllTokens(): Promise<void> {
    try {
      await AsyncStorage.removeItem(APP_CONFIG.STORAGE_KEYS.CONTEXT_TOKEN);
      await AsyncStorage.removeItem(APP_CONFIG.STORAGE_KEYS.ACTIVE_GROUP);
      await AsyncStorage.removeItem(APP_CONFIG.STORAGE_KEYS.USER_DATA);
      console.log('✅ All tokens cleared');
    } catch (error) {
      console.log('❌ Error clearing tokens:', error);
    }
  }

  // Debug method to check all stored tokens
  static async debugTokens(): Promise<void> {
    try {
      console.log('🔍 TokenManager Debug - Checking all stored tokens:');
      
      const userData = await AsyncStorage.getItem(APP_CONFIG.STORAGE_KEYS.USER_DATA);
      if (userData) {
        const parsed = JSON.parse(userData);
        console.log('  📄 User Data exists');
        console.log('  👤 User:', parsed.name || parsed.userName || 'Unknown');
        console.log('  🆔 UserId:', parsed.userId || 'MISSING');
        console.log('  � Email:', parsed.email || 'Unknown');
        console.log('  📱 Phone:', parsed.phone || parsed.phoneNumber || 'Unknown');
        console.log('  �🔑 Personal Token (first 20 chars):', parsed.token ? parsed.token.substring(0, 20) + '...' : 'None');
        console.log('  📋 Full User Data Keys:', Object.keys(parsed));
      } else {
        console.log('  ❌ No user data found');
      }

      const contextToken = await AsyncStorage.getItem(APP_CONFIG.STORAGE_KEYS.CONTEXT_TOKEN);
      if (contextToken) {
        console.log('  🏢 Context Token (first 20 chars):', contextToken.substring(0, 20) + '...');
      } else {
        console.log('  💼 No context token (personal mode)');
      }

      const activeGroup = await AsyncStorage.getItem(APP_CONFIG.STORAGE_KEYS.ACTIVE_GROUP);
      if (activeGroup) {
        const group = JSON.parse(activeGroup);
        console.log('  🏢 Active Group:', group.groupName || 'Unknown');
      } else {
        console.log('  👤 No active group (personal mode)');
      }

      const currentToken = await this.getCurrentToken();
      console.log('  🎯 Current Token Result (first 20 chars):', currentToken ? currentToken.substring(0, 20) + '...' : 'None');
      
    } catch (error) {
      console.log('❌ Error in token debug:', error);
    }
  }

  // Debug method to check user data specifically
  static async debugUserData(): Promise<any> {
    try {
      const userData = await AsyncStorage.getItem(APP_CONFIG.STORAGE_KEYS.USER_DATA);
      if (userData) {
        const parsed = JSON.parse(userData);
        console.log('🔍 User Data Debug:');
        console.log('  Full Object:', parsed);
        return parsed;
      } else {
        console.log('❌ No user data found in storage');
        return null;
      }
    } catch (error) {
      console.log('❌ Error reading user data:', error);
      return null;
    }
  }
}
