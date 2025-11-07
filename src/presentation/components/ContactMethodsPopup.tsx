import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../core/theme/ThemeContext';

interface Props {
  visible: boolean;
  onClose: () => void;
  onEmailPress: () => void;
  onWhatsAppPress: () => void;
  title?: string;
  message?: string;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function ContactMethodsPopup({ 
  visible, 
  onClose, 
  onEmailPress, 
  onWhatsAppPress, 
  title = 'Contact Support',
  message = 'Choose how you would like to contact our support team:'
}: Props) {
  const { theme } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.popup, { backgroundColor: theme.colors.card }]}>
          {/* Header Icon */}
          <View style={[styles.iconContainer, { backgroundColor: '#4A90E2' + '15' }]}>
            <Ionicons name="chatbubble-ellipses" size={screenWidth < 350 ? 36 : 48} color="#4A90E2" />
          </View>
          
          {/* Title */}
          <Text style={[styles.title, { color: '#4A90E2' }]}>
            {title}
          </Text>
          
          {/* Message */}
          <Text style={[styles.message, { color: theme.colors.text }]}>
            {message}
          </Text>
          
          {/* Contact Method Buttons */}
          <View style={styles.methodsContainer}>
            {/* WhatsApp Button */}
            <TouchableOpacity 
              style={[styles.methodButton, { backgroundColor: '#25D366' + '15', borderColor: '#25D366' }]} 
              onPress={onWhatsAppPress}
              accessible={true}
              accessibilityLabel="Contact support via WhatsApp"
              accessibilityRole="button"
            >
              <View style={[styles.methodIcon, { backgroundColor: '#25D366' }]}>
                <Ionicons name="logo-whatsapp" size={screenWidth < 350 ? 24 : 32} color="#fff" />
              </View>
              <Text style={[styles.methodTitle, { color: '#25D366' }]}>WhatsApp</Text>
              <Text style={[styles.methodSubtitle, { color: theme.colors.textSecondary }]}>
                Instant chat support
              </Text>
            </TouchableOpacity>

            {/* Email Button */}
            <TouchableOpacity 
              style={[styles.methodButton, { backgroundColor: '#4A90E2' + '15', borderColor: '#4A90E2' }]} 
              onPress={onEmailPress}
              accessible={true}
              accessibilityLabel="Contact support via Email"
              accessibilityRole="button"
            >
              <View style={[styles.methodIcon, { backgroundColor: '#4A90E2' }]}>
                <Ionicons name="mail" size={screenWidth < 350 ? 24 : 32} color="#fff" />
              </View>
              <Text style={[styles.methodTitle, { color: '#4A90E2' }]}>Email</Text>
              <Text style={[styles.methodSubtitle, { color: theme.colors.textSecondary }]}>
                Detailed support
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Close Button */}
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={onClose}
            accessible={true}
            accessibilityLabel="Close popup"
            accessibilityRole="button"
          >
            <Text style={[styles.closeButtonText, { color: theme.colors.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
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
    width: Math.min(screenWidth * 0.9, 380), // Responsive width: 90% of screen or max 380px
    maxWidth: screenWidth - 40, // Ensure minimum margins on all sides
    backgroundColor: '#F8FCFF',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#4A90E2',
    padding: screenWidth < 350 ? 16 : 24, // Smaller padding on smaller screens
    alignItems: 'center',
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 15,
    // Ensure popup fits on screen
    maxHeight: screenHeight * 0.85,
  },
  iconContainer: {
    width: screenWidth < 350 ? 60 : 80, // Smaller icon on smaller screens
    height: screenWidth < 350 ? 60 : 80,
    borderRadius: screenWidth < 350 ? 30 : 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: Math.min(screenWidth * 0.06, 24), // Responsive font size
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    lineHeight: Math.min(screenWidth * 0.07, 28), // Responsive line height
    flexShrink: 1, // Allow text to shrink if needed
  },
  message: {
    fontSize: Math.min(screenWidth * 0.04, 16), // Responsive font size
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: Math.min(screenWidth * 0.055, 22), // Responsive line height
    paddingHorizontal: 4,
    flexShrink: 1, // Allow text to shrink if needed
  },
  methodsContainer: {
    flexDirection: screenWidth < 350 ? 'column' : 'row', // Stack vertically on very small screens
    gap: 16,
    marginBottom: 24,
    width: '100%',
  },
  methodButton: {
    flex: screenWidth < 350 ? 0 : 1, // Don't flex on small screens when stacked
    borderRadius: 16,
    borderWidth: 2,
    padding: screenWidth < 350 ? 12 : 16, // Smaller padding on smaller screens
    alignItems: 'center',
    minHeight: screenWidth < 350 ? 100 : 120, // Smaller height on smaller screens
    justifyContent: 'center',
    width: screenWidth < 350 ? '100%' : undefined, // Full width when stacked
  },
  methodIcon: {
    width: screenWidth < 350 ? 44 : 56, // Smaller icon on smaller screens
    height: screenWidth < 350 ? 44 : 56,
    borderRadius: screenWidth < 350 ? 22 : 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  methodTitle: {
    fontSize: Math.min(screenWidth * 0.04, 16), // Responsive font size
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
    flexShrink: 1,
  },
  methodSubtitle: {
    fontSize: Math.min(screenWidth * 0.03, 12), // Responsive font size
    textAlign: 'center',
    opacity: 0.8,
    flexShrink: 1,
  },
  closeButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    minHeight: 44, // Ensure minimum touch target size for accessibility
  },
  closeButtonText: {
    fontSize: Math.min(screenWidth * 0.04, 16), // Responsive font size
    fontWeight: '500',
  },
});
