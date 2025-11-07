import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../core/theme/ThemeContext';

export default function PrivacyPolicyScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.secondary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.secondary }]}>Privacy Policy</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={[styles.content, { backgroundColor: theme.colors.card }]}>
          {/* Last Updated */}
          <View style={styles.updateInfo}>
            <Text style={[styles.lastUpdated, { color: theme.colors.textSecondary }]}>
              Last updated: August 7, 2025
            </Text>
          </View>

          {/* Introduction */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.secondary }]}>Introduction</Text>
            <Text style={[styles.sectionText, { color: theme.colors.text }]}>
              BudgetWise is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application. Please read this privacy policy carefully.
            </Text>
          </View>

          {/* Information We Collect */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.secondary }]}>Information We Collect</Text>
            
            <Text style={[styles.subTitle, { color: theme.colors.primary }]}>Personal Information</Text>
            <Text style={[styles.sectionText, { color: theme.colors.text }]}>
              • Name and username{'\n'}
              • Email address{'\n'}
              • Phone number{'\n'}
              • Financial data (expenses, income, budgets){'\n'}
              • Group membership information
            </Text>

            <Text style={[styles.subTitle, { color: theme.colors.primary }]}>Device Information</Text>
            <Text style={[styles.sectionText, { color: theme.colors.text }]}>
              • Device type and operating system{'\n'}
              • App usage statistics{'\n'}
              • Crash reports and performance data{'\n'}
              • Biometric authentication data (stored locally only)
            </Text>
          </View>

          {/* How We Use Your Information */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.secondary }]}>How We Use Your Information</Text>
            <Text style={[styles.sectionText, { color: theme.colors.text }]}>
              We use the information we collect to:{'\n\n'}
              • Provide and maintain our expense tracking services{'\n'}
              • Process your financial transactions and group activities{'\n'}
              • Send you important updates about your account{'\n'}
              • Improve our app's functionality and user experience{'\n'}
              • Provide customer support{'\n'}
              • Ensure the security of your account and data
            </Text>
          </View>

          {/* Data Security */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.secondary }]}>Data Security</Text>
            <Text style={[styles.sectionText, { color: theme.colors.text }]}>
              We implement industry-standard security measures to protect your personal information:{'\n\n'}
              • End-to-end encryption for sensitive financial data{'\n'}
              • Secure authentication with biometric options{'\n'}
              • Regular security audits and updates{'\n'}
              • Limited access to personal data by authorized personnel only{'\n'}
              • Secure data storage with backup and recovery systems
            </Text>
          </View>

          {/* Data Sharing */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.secondary }]}>Data Sharing</Text>
            <Text style={[styles.sectionText, { color: theme.colors.text }]}>
              We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:{'\n\n'}
              • With group members when you join expense sharing groups{'\n'}
              • With service providers who assist in app functionality{'\n'}
              • When required by law or to protect our legal rights{'\n'}
              • In case of business transfer or merger (with prior notice)
            </Text>
          </View>

          {/* Group Features */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.secondary }]}>Group Features & Data Sharing</Text>
            <Text style={[styles.sectionText, { color: theme.colors.text }]}>
              When you join or create groups in BudgetWise:{'\n\n'}
              • Your name and expense data become visible to group members{'\n'}
              • Group expenses and transactions are shared among all members{'\n'}
              • Group administrators may have additional access to group data{'\n'}
              • You can leave groups at any time to stop data sharing
            </Text>
          </View>

          {/* Your Rights */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.secondary }]}>Your Rights</Text>
            <Text style={[styles.sectionText, { color: theme.colors.text }]}>
              You have the right to:{'\n\n'}
              • Access your personal data{'\n'}
              • Update or correct your information{'\n'}
              • Delete your account and associated data{'\n'}
              • Export your data{'\n'}
              • Withdraw consent for data processing{'\n'}
              • Lodge a complaint with data protection authorities
            </Text>
          </View>

          {/* Data Retention */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.secondary }]}>Data Retention</Text>
            <Text style={[styles.sectionText, { color: theme.colors.text }]}>
              We retain your personal information for as long as necessary to provide our services and comply with legal obligations. You may request deletion of your account and data at any time through the app settings.
            </Text>
          </View>

          {/* Children's Privacy */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.secondary }]}>Children's Privacy</Text>
            <Text style={[styles.sectionText, { color: theme.colors.text }]}>
              BudgetWise is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you become aware that a child has provided us with personal information, please contact us immediately.
            </Text>
          </View>

          {/* Changes to Privacy Policy */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.secondary }]}>Changes to This Privacy Policy</Text>
            <Text style={[styles.sectionText, { color: theme.colors.text }]}>
              We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting the new Privacy Policy in the app and updating the "Last updated" date. Your continued use of the app after changes constitutes acceptance of the updated policy.
            </Text>
          </View>

          {/* Contact Information */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.secondary }]}>Contact Us</Text>
            <Text style={[styles.sectionText, { color: theme.colors.text }]}>
              If you have any questions about this Privacy Policy or our data practices, please contact us:{'\n\n'}
              • Email: privacy@budgetwise.com{'\n'}
              • WhatsApp: +91 9337713798{'\n'}
              • In-app support: Settings → Contact Support
            </Text>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
              BudgetWise v1.0.2{'\n'}
              Developed by Akshay & Prem
            </Text>
          </View>
        </View>
      </ScrollView>
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
    width: 40,
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    margin: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  updateInfo: {
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(116, 162, 223, 0.2)',
  },
  lastUpdated: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  subTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'justify',
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(116, 162, 223, 0.2)',
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
