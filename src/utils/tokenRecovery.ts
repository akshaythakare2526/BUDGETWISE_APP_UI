import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_CONFIG } from '../core/config/constants';
import { TokenManager } from '../data/TokenManager';

export class TokenRecoveryUtils {
  /**
   * Check if current user has a valid authentication token
   */
  static async hasValidToken(): Promise<boolean> {
    try {
      const token = await TokenManager.getCurrentToken();
      return token !== null && token.length > 0;
    } catch (error) {
      console.error('Error checking token validity:', error);
      return false;
    }
  }

  /**
   * Check if user data exists but token is missing
   */
  static async hasUserDataWithoutToken(): Promise<boolean> {
    try {
      const userData = await AsyncStorage.getItem(APP_CONFIG.STORAGE_KEYS.USER_DATA);
      if (!userData) return false;

      const parsed = JSON.parse(userData);
      const hasUserInfo = parsed.name && parsed.email && parsed.userId;
      const hasToken = parsed.token && parsed.token.length > 0;

      return hasUserInfo && !hasToken;
    } catch (error) {
      console.error('Error checking user data:', error);
      return false;
    }
  }

  /**
   * Prompt user to re-login if they have user data but no valid token
   */
  static async shouldPromptReLogin(): Promise<{
    shouldPrompt: boolean;
    userData?: any;
  }> {
    try {
      const hasToken = await this.hasValidToken();
      if (hasToken) {
        return { shouldPrompt: false };
      }

      const hasUserData = await this.hasUserDataWithoutToken();
      if (hasUserData) {
        const userData = await AsyncStorage.getItem(APP_CONFIG.STORAGE_KEYS.USER_DATA);
        return {
          shouldPrompt: true,
          userData: userData ? JSON.parse(userData) : null
        };
      }

      return { shouldPrompt: false };
    } catch (error) {
      console.error('Error checking re-login requirement:', error);
      return { shouldPrompt: false };
    }
  }

  /**
   * Clear invalid user data to force fresh login
   */
  static async clearInvalidUserData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        APP_CONFIG.STORAGE_KEYS.USER_DATA,
        APP_CONFIG.STORAGE_KEYS.CONTEXT_TOKEN,
        APP_CONFIG.STORAGE_KEYS.USER_GROUPS,
        APP_CONFIG.STORAGE_KEYS.ACTIVE_GROUP
      ]);
      console.log('🧹 Cleared invalid user data');
    } catch (error) {
      console.error('Error clearing user data:', error);
    }
  }
}
