import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BiometricService } from '../../services/BiometricService';
import AdaptiveStatusBar from '../components/AdaptiveStatusBar';
import CustomPopup from '../components/CustomPopup';
import { useTheme } from '../../core/theme/ThemeContext';

interface Props {
  onAuthenticated: () => void;
}

export default function BiometricAuthScreen({ onAuthenticated }: Props) {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [supportedTypes, setSupportedTypes] = useState<string[]>([]);
  const { theme } = useTheme();
  
  // Popup states
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showRetryPopup, setShowRetryPopup] = useState(false);
  const [retryMessage, setRetryMessage] = useState('');

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  // Handle case where biometrics are not available - call onAuthenticated after render
  useEffect(() => {
    if (isAvailable === false) {
      // Biometrics not available, skip authentication
      onAuthenticated();
    }
  }, [isAvailable, onAuthenticated]);

  const checkBiometricAvailability = async () => {
    try {
      const available = await BiometricService.isAvailable();
      const types = await BiometricService.getSupportedTypes();
      
      setIsAvailable(available);
      setSupportedTypes(types.map(type => type.toString()));
      
      console.log('🔐 Biometric check:', { available, types });
    } catch (error) {
      console.log('❌ Error checking biometric availability:', error);
      setIsAvailable(false);
    }
  };

  const handleBiometricAuth = async () => {
    if (isAuthenticating) return;

    setIsAuthenticating(true);
    try {
      const result = await BiometricService.authenticate();
      
      if (result.success) {
        onAuthenticated();
      } else {
        setRetryMessage(result.error || 'Authentication is required to access BudgetWise. Please try again.');
        setShowRetryPopup(true);
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'Authentication is required to access BudgetWise. Please try again.');
      setShowErrorPopup(true);
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Handle popup actions
  const handleRetryAuth = () => {
    setShowRetryPopup(false);
    setShowErrorPopup(false);
    // Small delay to allow popup to close smoothly
    setTimeout(() => {
      handleBiometricAuth();
    }, 300);
  };

  const handleCloseErrorPopup = () => {
    setShowErrorPopup(false);
  };

  const handleCloseRetryPopup = () => {
    setShowRetryPopup(false);
  };

  const getBiometricIcon = () => {
    if (supportedTypes.includes('1')) { // FINGERPRINT
      return 'finger-print';
    } else if (supportedTypes.includes('2')) { // FACIAL_RECOGNITION
      return 'scan';
    } else if (supportedTypes.includes('3')) { // IRIS
      return 'eye';
    }
    return 'lock-closed';
  };

  const getBiometricText = () => {
    if (supportedTypes.includes('1')) {
      return 'Use your fingerprint to access BudgetWise';
    } else if (supportedTypes.includes('2')) {
      return 'Use your face to access BudgetWise';
    } else if (supportedTypes.includes('3')) {
      return 'Use your iris to access BudgetWise';
    }
    return 'Use biometric authentication to access BudgetWise';
  };

  if (isAvailable === null) {
    // Still checking biometric availability - show loading
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <AdaptiveStatusBar backgroundColor={theme.colors.background} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.primary }]}>Checking biometric availability...</Text>
        </View>
      </View>
    );
  }

  if (isAvailable === false) {
    // Show loading while we handle the non-available case in useEffect
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <AdaptiveStatusBar backgroundColor={theme.colors.background} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.primary }]}>Setting up authentication...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <AdaptiveStatusBar backgroundColor={theme.colors.background} />
      
      {/* App Logo */}
      <View style={styles.logoContainer}>
        <View style={[styles.logoCircle, { backgroundColor: theme.colors.primary }]}>
          <Ionicons name="wallet" size={40} color="#FFFFFF" />
        </View>
        <Text style={[styles.appName, { color: theme.colors.secondary }]}>BudgetWise</Text>
        <Text style={[styles.appTagline, { color: theme.colors.textSecondary }]}>Secure Budget Management</Text>
      </View>

      {/* Biometric Section */}
      <View style={styles.biometricContainer}>
        <View style={[styles.biometricIconContainer, { backgroundColor: theme.colors.surface }]}>
          <Ionicons 
            name={getBiometricIcon()} 
            size={80} 
            color={theme.colors.primary} 
          />
        </View>
        
        <Text style={[styles.biometricTitle, { color: theme.colors.secondary }]}>Secure Authentication</Text>
        <Text style={[styles.biometricDescription, { color: theme.colors.textSecondary }]}>
          {getBiometricText()}
        </Text>
        {/* Authentication Button */}
        <TouchableOpacity
          style={[
            styles.authButton, 
            { backgroundColor: theme.colors.primary },
            isAuthenticating && [styles.authButtonDisabled, { backgroundColor: theme.colors.textSecondary }]
          ]}
          onPress={handleBiometricAuth}
          disabled={isAuthenticating}
        >
          {isAuthenticating ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Ionicons name={getBiometricIcon()} size={24} color="#FFFFFF" />
          )}
          <Text style={styles.authButtonText}>
            {isAuthenticating ? 'Authenticating...' : 'Authenticate'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Security Note */}
      <View style={[styles.securityNote, { backgroundColor: theme.colors.surface }]}>
        <Ionicons name="shield-checkmark" size={16} color="#3ED598" />
        <Text style={[styles.securityText, { color: theme.colors.textSecondary }]}>
          Biometric authentication is required for enhanced security
        </Text>
      </View>

      {/* Custom Popups */}
      <CustomPopup
        visible={showErrorPopup}
        type="biometric-error"
        title="Authentication Error"
        message={errorMessage}
        onClose={handleCloseErrorPopup}
        onRetry={handleRetryAuth}
      />

      <CustomPopup
        visible={showRetryPopup}
        type="biometric-retry"
        title="Authentication Failed"
        message={retryMessage}
        onClose={handleCloseRetryPopup}
        onRetry={handleRetryAuth}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  appTagline: {
    fontSize: 16,
  },
  biometricContainer: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 300,
  },
  biometricIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  biometricTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  biometricDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  securityRequirement: {
    fontSize: 14,
    color: '#FF7A7A',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 24,
  },
  authButton: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 16,
  },
  authButtonDisabled: {
    // Background color now handled inline with theme
  },
  authButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 40,
  },
  securityText: {
    fontSize: 14,
    marginLeft: 8,
    textAlign: 'center',
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
});
