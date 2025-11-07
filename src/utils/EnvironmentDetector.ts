import Constants from 'expo-constants';

/**
 * Environment Detection Utility
 * Helps determine the current runtime environment
 */
export class EnvironmentDetector {
  /**
   * Check if running in Expo Go
   */
  static isExpoGo(): boolean {
    return Constants.appOwnership === 'expo';
  }

  /**
   * Check if running in development build
   */
  static isDevelopmentBuild(): boolean {
    return Constants.appOwnership !== 'expo';
  }

  /**
   * Get current environment info
   */
  static getEnvironmentInfo() {
    return {
      isExpoGo: this.isExpoGo(),
      isDevelopmentBuild: this.isDevelopmentBuild(),
      appOwnership: Constants.appOwnership,
      expoVersion: Constants.expoVersion,
      platform: Constants.platform,
    };
  }

  /**
   * Log environment information
   */
  static logEnvironment() {
    const info = this.getEnvironmentInfo();
    console.log('🌍 Environment Info:', info);
    
    if (info.isExpoGo) {
      console.log('📱 Running in Expo Go - Some features may be limited');
    } else {
      console.log('🚀 Running in Development/Standalone Build - Full features available');
    }
  }
}
