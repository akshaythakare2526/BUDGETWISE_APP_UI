import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_CONFIG } from '../../core/config/constants';
import CustomPopup, { PopupType } from '../components/CustomPopup';
import ContactMethodsPopup from '../components/ContactMethodsPopup';
import { useTheme } from '../../core/theme/ThemeContext';
import { SettingItem } from '../components/SettingItem';
import ExportModal from '../components/ExportModal';

type SettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function SettingsScreen() {
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [popup, setPopup] = useState<{visible: boolean, message: string, type: PopupType}>(
    { visible: false, message: '', type: 'info' }
  );
  const [supportPopup, setSupportPopup] = useState<{visible: boolean, message: string, type: PopupType, title?: string}>(
    { visible: false, message: '', type: 'confirm' }
  );
  const [ratePopup, setRatePopup] = useState<{visible: boolean, message: string, type: PopupType, title?: string}>(
    { visible: false, message: '', type: 'confirm' }
  );
  const [aboutPopup, setAboutPopup] = useState<{visible: boolean, message: string, type: PopupType, title?: string}>(
    { visible: false, message: '', type: 'info' }
  );
  const [contactMethodPopup, setContactMethodPopup] = useState<{visible: boolean, message: string, type: PopupType, title?: string}>(
    { visible: false, message: '', type: 'info' }
  );
  
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const { theme, isDarkMode, toggleTheme } = useTheme();

  // Load settings from storage
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await AsyncStorage.getItem(APP_CONFIG.STORAGE_KEYS.APP_SETTINGS);
      if (settings) {
        const parsed = JSON.parse(settings);
        setBiometricEnabled(parsed.biometric ?? false);
      }
    } catch (error) {
      console.log('Error loading settings:', error);
    }
  };

  const saveSettings = async (newSettings: any) => {
    try {
      const currentSettings = {
        biometric: biometricEnabled,
        ...newSettings,
      };
      
      await AsyncStorage.setItem(APP_CONFIG.STORAGE_KEYS.APP_SETTINGS, JSON.stringify(currentSettings));
      console.log('Settings saved successfully');
    } catch (error) {
      console.log('Error saving settings:', error);
    }
  };

  const showPopup = (message: string, type: PopupType = 'info') => {
    setPopup({ visible: true, message, type });
  };
  
  const closePopup = () => {
    setPopup(p => ({ ...p, visible: false }));
  };

  const handleBiometricToggle = async (value: boolean) => {
    setBiometricEnabled(value);
    await saveSettings({ biometric: value });
    showPopup(
      value ? 'Biometric authentication enabled' : 'Biometric authentication disabled',
      'success'
    );
  };

  const handleDarkModeToggle = async (value: boolean) => {
    toggleTheme();
    showPopup(
      value ? 'Dark mode enabled' : 'Light mode enabled',
      'success'
    );
  };

  const handleExportData = () => {
    setExportModalVisible(true);
  };

  const handleExportSuccess = (message: string) => {
    showPopup(message, 'success');
  };

  const handleExportError = (message: string) => {
    showPopup(message, 'error');
  };

  const handleImportData = () => {
    showPopup('Import data feature coming soon!', 'info');
  };

  const handleContactSupport = () => {
    setSupportPopup({
      visible: true,
      message: 'Get professional help and support for BudgetWise. Our team is ready to assist you!',
      type: 'confirm',
      title: 'Contact Support'
    });
  };

  const handleShowContactMethods = () => {
    setSupportPopup({ visible: false, message: '', type: 'confirm' });
    // Show contact methods popup with icons
    setContactMethodPopup({
      visible: true,
      message: 'Choose how you would like to contact our support team:',
      type: 'info',
      title: 'Contact Support'
    });
  };

  const handleCloseContactMethods = () => {
    setContactMethodPopup({ visible: false, message: '', type: 'info' });
  };

  const handleSupportEmail = () => {
    setContactMethodPopup({ visible: false, message: '', type: 'info' });
    Linking.openURL('mailto:budgetwise10@gmail.com?subject=BudgetWise Support Request&body=Hi Support Team,%0A%0ADescribe your issue here:%0A%0A----%0AApp Version: 1.0.2%0ADevice: Mobile%0ADate: ' + new Date().toLocaleDateString());
  };

  const handleSupportWhatsApp = () => {
    setContactMethodPopup({ visible: false, message: '', type: 'info' });
    Linking.openURL('https://wa.me/9337713798?text=Hello BudgetWise Support! I need help with the app.');
  };

  const handleRateApp = () => {
    setRatePopup({
      visible: true,
      message: 'Love using BudgetWise? Help us grow by leaving a 5-star review on your app store!',
      type: 'confirm',
      title: 'Rate BudgetWise'
    });
  };

  const handleRateConfirm = () => {
    setRatePopup({ visible: false, message: '', type: 'confirm' });
    
    // Try to open Play Store/App Store
    const playStoreUrl = 'market://details?id=com.budgetwise.app';
    
    Linking.canOpenURL(playStoreUrl).then(supported => {
      if (supported) {
        Linking.openURL(playStoreUrl);
      } else {
        // Fallback to web version
        Linking.openURL('https://play.google.com/store/apps/details?id=com.budgetwise.app');
      }
    }).catch(() => {
      showPopup('Unable to open app store. Please search for "BudgetWise" in your app store.', 'info');
    });
  };

  const handleAbout = () => {
    setAboutPopup({
      visible: true,
      message: '💰 BudgetWise v1.0.2\n\n📊 Smart expense tracking for individuals and groups\n\n✨ Features:\n• Offline-first functionality\n• Professional data export\n• Group expense management\n• Real-time analytics\n• Secure biometric authentication\n\n👨‍💻 Developed by Akshay & Prem\n\n🌟 Thank you for using BudgetWise!',
      type: 'info',
      title: 'About BudgetWise'
    });
  };

  const handlePrivacyPolicy = () => {
    setAboutPopup({ visible: false, message: '', type: 'info' });
    navigation.navigate('PrivacyPolicy' as never);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.secondary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.secondary }]}>Settings</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.secondary }]}>Preferences</Text>
          
          <SettingItem
            icon="finger-print"
            iconColor="#6C63FF"
            title="Biometric Security"
            subtitle="Fingerprint, Face ID & authentication settings"
            onPress={() => navigation.navigate('BiometricSettings')}
          />

          <SettingItem
            icon="moon"
            iconColor="#444444"
            title="Dark Mode"
            subtitle="Switch between light and dark theme"
            showSwitch={true}
            showChevron={false}
            switchValue={isDarkMode}
            onSwitchChange={handleDarkModeToggle}
            switchColor="#444444"
          />
        </View>

        {/* Data Management Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.secondary }]}>Data Management</Text>

          <SettingItem
            icon="download"
            iconColor="#00C897"
            title="Export Data"
            subtitle="Download your data as backup"
            onPress={handleExportData}
          />

          <SettingItem
            icon="cloud-upload"
            iconColor="#FF9500"
            title="Import Data"
            subtitle="Restore data from backup"
            onPress={handleImportData}
          />
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.secondary }]}>Support & Info</Text>


          <SettingItem
            icon="chatbubble"
            iconColor="#4A90E2"
            title="Contact Support"
            subtitle="Get help and report issues"
            onPress={handleContactSupport}
          />

          <SettingItem
            icon="star"
            iconColor="#FF9500"
            title="Rate BudgetWise"
            subtitle="Leave a review on the app store"
            onPress={handleRateApp}
          />

          <SettingItem
            icon="information-circle"
            iconColor="#6C63FF"
            title="About BudgetWise"
            subtitle="Version 1.0.2"
            onPress={handleAbout}
          />
        </View>
      </ScrollView>

      <CustomPopup
        visible={popup.visible}
        message={popup.message}
        type={popup.type}
        onClose={closePopup}
      />

      {/* Support Contact Popup */}
      <CustomPopup
        visible={supportPopup.visible}
        message={supportPopup.message}
        type={supportPopup.type}
        title={supportPopup.title}
        onClose={() => setSupportPopup({ visible: false, message: '', type: 'confirm' })}
        onConfirm={handleShowContactMethods}
        confirmText="Get Support"
      />

      {/* Rate App Popup */}
      <CustomPopup
        visible={ratePopup.visible}
        message={ratePopup.message}
        type={ratePopup.type}
        title={ratePopup.title}
        onClose={() => setRatePopup({ visible: false, message: '', type: 'confirm' })}
        onConfirm={handleRateConfirm}
        confirmText="Rate Now"
      />

      {/* About App Popup */}
      <CustomPopup
        visible={aboutPopup.visible}
        message={aboutPopup.message}
        type={aboutPopup.type}
        title={aboutPopup.title}
        onClose={() => setAboutPopup({ visible: false, message: '', type: 'info' })}
        onConfirm={handlePrivacyPolicy}
        confirmText="Privacy Policy"
      />

      {/* Contact Methods Popup */}
      <ContactMethodsPopup
        visible={contactMethodPopup.visible}
        onClose={handleCloseContactMethods}
        onEmailPress={handleSupportEmail}
        onWhatsAppPress={handleSupportWhatsApp}
        title="Contact Support"
        message="Choose how you would like to contact our support team:"
      />

      <ExportModal
        visible={exportModalVisible}
        onClose={() => setExportModalVisible(false)}
        onSuccess={handleExportSuccess}
        onError={handleExportError}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerRight: {
    width: 40, // Balance the header
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
  },
});
