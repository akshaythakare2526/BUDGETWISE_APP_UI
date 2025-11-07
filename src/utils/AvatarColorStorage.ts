import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Avatar Color Storage Service
 * Manages local storage of user avatar color preferences
 */
export class AvatarColorStorage {
  private static readonly AVATAR_COLOR_KEY = '@budgetwise_avatar_color';
  private static readonly AVATAR_COLORS_KEY = '@budgetwise_avatar_colors_cache';

  /**
   * Save avatar color for current user
   */
  static async saveAvatarColor(userEmail: string, color: string): Promise<void> {
    try {
      const userKey = `${this.AVATAR_COLOR_KEY}_${userEmail}`;
      if (color) {
        await AsyncStorage.setItem(userKey, color);
        console.log('✅ Avatar color saved to local storage:', { userEmail, color });
      } else {
        // Remove custom color to use default
        await AsyncStorage.removeItem(userKey);
        console.log('✅ Avatar color removed from local storage (using default):', { userEmail });
      }
    } catch (error) {
      console.error('❌ Error saving avatar color:', error);
    }
  }

  /**
   * Load avatar color for current user
   */
  static async loadAvatarColor(userEmail: string): Promise<string | null> {
    try {
      const userKey = `${this.AVATAR_COLOR_KEY}_${userEmail}`;
      const color = await AsyncStorage.getItem(userKey);
      console.log('📱 Avatar color loaded from local storage:', { userEmail, color });
      return color;
    } catch (error) {
      console.error('❌ Error loading avatar color:', error);
      return null;
    }
  }

  /**
   * Clear avatar color for current user
   */
  static async clearAvatarColor(userEmail: string): Promise<void> {
    try {
      const userKey = `${this.AVATAR_COLOR_KEY}_${userEmail}`;
      await AsyncStorage.removeItem(userKey);
      console.log('🧹 Avatar color cleared from local storage:', { userEmail });
    } catch (error) {
      console.error('❌ Error clearing avatar color:', error);
    }
  }

  /**
   * Get all avatar colors (for debugging)
   */
  static async getAllAvatarColors(): Promise<Record<string, string>> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const avatarKeys = keys.filter(key => key.startsWith(this.AVATAR_COLOR_KEY));
      const colors: Record<string, string> = {};
      
      for (const key of avatarKeys) {
        const color = await AsyncStorage.getItem(key);
        if (color) {
          const userEmail = key.replace(`${this.AVATAR_COLOR_KEY}_`, '');
          colors[userEmail] = color;
        }
      }
      
      return colors;
    } catch (error) {
      console.error('❌ Error getting all avatar colors:', error);
      return {};
    }
  }

  /**
   * Clear all avatar colors (for logout/cleanup)
   */
  static async clearAllAvatarColors(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const avatarKeys = keys.filter(key => key.startsWith(this.AVATAR_COLOR_KEY));
      await AsyncStorage.multiRemove(avatarKeys);
      console.log('🧹 All avatar colors cleared from local storage');
    } catch (error) {
      console.error('❌ Error clearing all avatar colors:', error);
    }
  }
}
