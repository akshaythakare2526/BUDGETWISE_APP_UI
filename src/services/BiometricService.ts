import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface BiometricSettings {
  isEnabled: boolean;
  hasSetup: boolean;
}

export class BiometricService {
  private static SETTINGS_KEY = '@budgetwise_biometric_settings';

  // Check if device supports biometric authentication
  static async isAvailable(): Promise<boolean> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      console.log('🔐 Biometric availability:', { hasHardware, isEnrolled });
      return hasHardware && isEnrolled;
    } catch (error) {
      console.log('❌ Error checking biometric availability:', error);
      return false;
    }
  }

  // Get supported authentication types
  static async getSupportedTypes(): Promise<LocalAuthentication.AuthenticationType[]> {
    try {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      console.log('🔐 Supported biometric types:', types);
      return types;
    } catch (error) {
      console.log('❌ Error getting supported types:', error);
      return [];
    }
  }

  // Get biometric settings
  static async getSettings(): Promise<BiometricSettings> {
    try {
      const settingsStr = await AsyncStorage.getItem(this.SETTINGS_KEY);
      if (settingsStr) {
        return JSON.parse(settingsStr);
      }
    } catch (error) {
      console.log('❌ Error loading biometric settings:', error);
    }
    
    return {
      isEnabled: false,
      hasSetup: false
    };
  }

  // Update biometric settings
  static async updateSettings(settings: Partial<BiometricSettings>): Promise<void> {
    try {
      const currentSettings = await this.getSettings();
      const updatedSettings = { ...currentSettings, ...settings };
      await AsyncStorage.setItem(this.SETTINGS_KEY, JSON.stringify(updatedSettings));
      console.log('✅ Biometric settings updated:', updatedSettings);
    } catch (error) {
      console.log('❌ Error updating biometric settings:', error);
    }
  }

  // Authenticate with biometrics
  static async authenticate(): Promise<{ success: boolean; error?: string }> {
    try {
      const isAvailable = await this.isAvailable();
      if (!isAvailable) {
        return {
          success: false,
          error: 'Biometric authentication is not available on this device'
        };
      }

      const supportedTypes = await this.getSupportedTypes();
      let promptMessage = 'Authenticate to access BudgetWise';
      
      if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        promptMessage = 'Use your fingerprint to access BudgetWise';
      } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        promptMessage = 'Use your face to access BudgetWise';
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use Passcode',
        disableDeviceFallback: false,
      });

      if (result.success) {
        console.log('✅ Biometric authentication successful');
        return { success: true };
      } else {
        console.log('❌ Biometric authentication failed');
        return {
          success: false,
          error: 'Authentication failed or was cancelled'
        };
      }
    } catch (error: any) {
      console.log('❌ Biometric authentication error:', error);
      return {
        success: false,
        error: error.message || 'Authentication error'
      };
    }
  }

  // Enable biometric authentication
  static async enableBiometrics(): Promise<{ success: boolean; error?: string }> {
    try {
      const isAvailable = await this.isAvailable();
      if (!isAvailable) {
        return {
          success: false,
          error: 'Biometric authentication is not available'
        };
      }

      // Test authentication first
      const authResult = await this.authenticate();
      if (authResult.success) {
        await this.updateSettings({
          isEnabled: true,
          hasSetup: true
        });
        return { success: true };
      } else {
        return authResult;
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to enable biometrics'
      };
    }
  }

  // Disable biometric authentication
  static async disableBiometrics(): Promise<void> {
    await this.updateSettings({
      isEnabled: false
    });
    console.log('🔐 Biometric authentication disabled');
  }

  // Check if biometric authentication should be performed
  static async shouldAuthenticate(): Promise<boolean> {
    try {
      const settings = await this.getSettings();
      const isAvailable = await this.isAvailable();
      
      return settings.isEnabled && isAvailable;
    } catch (error) {
      console.log('❌ Error checking if should authenticate:', error);
      return false;
    }
  }
}
