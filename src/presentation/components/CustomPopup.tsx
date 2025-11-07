import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../core/theme/ThemeContext';

export type PopupType = 'success' | 'error' | 'info' | 'confirm' | 'biometric-error' | 'biometric-retry' | 'warning';

interface Props {
  visible: boolean;
  message: string;
  type?: PopupType;
  onClose: () => void;
  onConfirm?: () => void; // For confirmation dialogs
  onRetry?: () => void; // For retry dialogs
  title?: string; // Custom title
  confirmText?: string; // Custom confirm button text
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function CustomPopup({ visible, message, type = 'info', onClose, onConfirm, onRetry, title, confirmText }: Props) {
  const { theme } = useTheme();
  
  let backgroundColor = '#4A90E2'; // default blue
  let iconName: keyof typeof Ionicons.glyphMap = 'information-circle';
  let defaultTitle = 'Info';

  if (type === 'success') {
    backgroundColor = '#3ED598';
    iconName = 'checkmark-circle';
    defaultTitle = 'Success';
  } else if (type === 'error') {
    backgroundColor = '#FF7A7A';
    iconName = 'close-circle';
    defaultTitle = 'Error';
  } else if (type === 'confirm') {
    backgroundColor = '#FF6B35';
    iconName = 'help-circle';
    defaultTitle = 'Confirm';
  } else if (type === 'biometric-error') {
    backgroundColor = '#FF7A7A';
    iconName = 'finger-print';
    defaultTitle = 'Authentication Failed';
  } else if (type === 'biometric-retry') {
    backgroundColor = '#FF6B35';
    iconName = 'refresh-circle';
    defaultTitle = 'Retry Authentication';
  } else if (type === 'warning') {
    backgroundColor = '#FFB84D';
    iconName = 'warning';
    defaultTitle = 'Warning';
  }

  const finalTitle = title || defaultTitle;
  const isConfirmation = type === 'confirm';
  const isBiometricRetry = type === 'biometric-retry';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.popup, { borderColor: backgroundColor, backgroundColor: theme.colors.card }]}>
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: backgroundColor + '15' }]}>
            <Ionicons name={iconName} size={screenWidth < 350 ? 36 : 48} color={backgroundColor} />
          </View>
          
          {/* Title */}
          <Text style={[styles.title, { color: backgroundColor }]}>
            {finalTitle}
          </Text>
          
          {/* Message */}
          <Text style={[styles.message, { color: theme.colors.text }]}>{message}</Text>
          
          {/* Buttons */}
          {isConfirmation ? (
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]} 
                onPress={onClose}
                accessible={true}
                accessibilityLabel="Cancel"
                accessibilityRole="button"
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, { backgroundColor }, { flex: 1 }]} 
                onPress={onConfirm}
                accessible={true}
                accessibilityLabel={confirmText || 'Confirm'}
                accessibilityRole="button"
              >
                <Text style={styles.buttonText}>{confirmText || 'Confirm'}</Text>
              </TouchableOpacity>
            </View>
          ) : isBiometricRetry ? (
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.button, { backgroundColor }, { flex: 1 }]} 
                onPress={onRetry}
                accessible={true}
                accessibilityLabel="Retry authentication"
                accessibilityRole="button"
              >
                <Text style={styles.buttonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={[styles.button, { backgroundColor }]} 
              onPress={onClose}
              accessible={true}
              accessibilityLabel="OK"
              accessibilityRole="button"
            >
              <Text style={styles.buttonText}>OK</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(44,82,130,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20, // Add padding to ensure popup doesn't touch screen edges
  },
  popup: {
    width: Math.min(screenWidth * 0.85, 320), // Responsive width: 85% of screen or max 320px
    maxWidth: screenWidth - 40, // Ensure minimum margins on all sides
    backgroundColor: '#F8FCFF',
    borderRadius: 20,
    borderWidth: 2,
    padding: screenWidth < 350 ? 24 : 32, // Smaller padding on smaller screens
    alignItems: 'center',
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 15,
    // Ensure popup fits on screen
    maxHeight: screenHeight * 0.8,
  },
  iconContainer: {
    width: screenWidth < 350 ? 60 : 80, // Smaller icon container on smaller screens
    height: screenWidth < 350 ? 60 : 80,
    borderRadius: screenWidth < 350 ? 30 : 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: Math.min(screenWidth * 0.06, 24), // Responsive font size
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    lineHeight: Math.min(screenWidth * 0.07, 28), // Responsive line height
    flexShrink: 1, // Allow text to shrink if needed
  },
  message: {
    fontSize: Math.min(screenWidth * 0.04, 16), // Responsive font size
    color: '#2C5282',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: Math.min(screenWidth * 0.055, 22), // Responsive line height
    paddingHorizontal: 4,
    flexShrink: 1, // Allow text to shrink if needed
  },
  button: {
    minWidth: Math.max(screenWidth * 0.25, 100), // Responsive minimum width
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    minHeight: 44, // Ensure minimum touch target size for accessibility
  },
  buttonContainer: {
    flexDirection: screenWidth < 300 ? 'column' : 'row', // Stack vertically on very small screens
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
    gap: 16,
  },
  cancelButton: {
    backgroundColor: '#E6F3FF',
    borderWidth: 2,
    borderColor: '#4A90E2',
    flex: screenWidth < 300 ? 0 : 1, // Don't flex on very small screens
  },
  cancelButtonText: {
    color: '#4A90E2',
    fontWeight: 'bold',
    fontSize: Math.min(screenWidth * 0.04, 16), // Responsive font size
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: Math.min(screenWidth * 0.04, 16), // Responsive font size
  },
});
