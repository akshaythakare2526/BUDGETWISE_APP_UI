import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../core/theme/ThemeContext';
import { exportService, ExportOptions } from '../../services/ExportService';

const { height: screenHeight } = Dimensions.get('window');

interface ExportModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export default function ExportModal({ visible, onClose, onSuccess, onError }: ExportModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'json'>('csv');
  const [selectedRange, setSelectedRange] = useState<'all' | 'last30' | 'last90' | 'last365'>('all');
  const [includeExpenses, setIncludeExpenses] = useState(true);
  const [includeDeposits, setIncludeDeposits] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const { theme } = useTheme();

  const formatOptions = [
    { value: 'csv', label: 'CSV (Excel)', icon: 'document-text', description: 'Best for spreadsheets' },
    { value: 'json', label: 'JSON', icon: 'code-slash', description: 'Technical format' },
  ];

  const rangeOptions = [
    { value: 'all', label: 'All Time', description: 'All your data' },
    { value: 'last30', label: 'Last 30 Days', description: 'Recent month' },
    { value: 'last90', label: 'Last 3 Months', description: 'Recent quarter' },
    { value: 'last365', label: 'Last Year', description: 'Recent year' },
  ];

  const handleExport = async () => {
    if (!includeExpenses && !includeDeposits) {
      Alert.alert('Selection Required', 'Please select at least expenses or deposits to export.');
      return;
    }

    setIsExporting(true);
    try {
      const options: ExportOptions = {
        format: selectedFormat,
        dateRange: selectedRange,
        includeExpenses,
        includeDeposits,
      };

      const result = await exportService.exportData(options);
      
      if (result.success && result.filePath) {
        // Automatically trigger download/share immediately
        const shareResult = await exportService.shareFile(result.filePath);
        if (shareResult.success) {
          onSuccess('Data exported and download started successfully!');
          onClose();
        } else {
          onError(shareResult.error || 'Failed to download file');
        }
      } else {
        onError(result.error || 'Export failed');
      }
    } catch (error) {
      onError('Unexpected error during export');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: theme.colors.card }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.secondary }]}>Export Data</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Scrollable Content */}
          <ScrollView 
            style={styles.scrollContent} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContainer}
          >
            {/* Format Selection */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.secondary }]}>Export Format</Text>
              {formatOptions.map((format) => (
                <TouchableOpacity
                  key={format.value}
                  style={[
                    styles.optionItem,
                    { backgroundColor: theme.colors.surface },
                    selectedFormat === format.value && { borderColor: theme.colors.primary, borderWidth: 2 }
                  ]}
                  onPress={() => setSelectedFormat(format.value as 'csv' | 'json')}
                >
                  <View style={styles.optionLeft}>
                    <Ionicons 
                      name={format.icon as any} 
                      size={24} 
                      color={selectedFormat === format.value ? theme.colors.primary : theme.colors.textSecondary} 
                    />
                    <View style={styles.optionText}>
                      <Text style={[styles.optionTitle, { color: theme.colors.text }]}>{format.label}</Text>
                      <Text style={[styles.optionDescription, { color: theme.colors.textSecondary }]}>
                        {format.description}
                      </Text>
                    </View>
                  </View>
                  {selectedFormat === format.value && (
                    <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Date Range Selection */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.secondary }]}>Date Range</Text>
              {rangeOptions.map((range) => (
                <TouchableOpacity
                  key={range.value}
                  style={[
                    styles.optionItem,
                    { backgroundColor: theme.colors.surface },
                    selectedRange === range.value && { borderColor: theme.colors.primary, borderWidth: 2 }
                  ]}
                  onPress={() => setSelectedRange(range.value as any)}
                >
                  <View style={styles.optionLeft}>
                    <Ionicons 
                      name="calendar" 
                      size={20} 
                      color={selectedRange === range.value ? theme.colors.primary : theme.colors.textSecondary} 
                    />
                    <View style={styles.optionText}>
                      <Text style={[styles.optionTitle, { color: theme.colors.text }]}>{range.label}</Text>
                      <Text style={[styles.optionDescription, { color: theme.colors.textSecondary }]}>
                        {range.description}
                      </Text>
                    </View>
                  </View>
                  {selectedRange === range.value && (
                    <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Data Type Selection */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.secondary }]}>Include Data</Text>
              
              <TouchableOpacity
                style={[styles.checkboxItem, { backgroundColor: theme.colors.surface }]}
                onPress={() => setIncludeExpenses(!includeExpenses)}
              >
                <Ionicons
                  name={includeExpenses ? "checkbox" : "square-outline"}
                  size={24}
                  color={includeExpenses ? theme.colors.primary : theme.colors.textSecondary}
                />
                <Text style={[styles.checkboxText, { color: theme.colors.text }]}>Expenses</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.checkboxItem, { backgroundColor: theme.colors.surface }]}
                onPress={() => setIncludeDeposits(!includeDeposits)}
              >
                <Ionicons
                  name={includeDeposits ? "checkbox" : "square-outline"}
                  size={24}
                  color={includeDeposits ? theme.colors.primary : theme.colors.textSecondary}
                />
                <Text style={[styles.checkboxText, { color: theme.colors.text }]}>Deposits</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Fixed Export Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.exportButton,
                { backgroundColor: theme.colors.primary },
                isExporting && { opacity: 0.7 }
              ]}
              onPress={handleExport}
              disabled={isExporting}
            >
              {isExporting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="download" size={20} color="#fff" />
                  <Text style={styles.exportButtonText}>Download Export</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 20,
    padding: 24,
    maxHeight: screenHeight * 0.9, // 90% of screen height
    minHeight: 400,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContainer: {
    paddingBottom: 10,
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'transparent',
    minHeight: 50,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionText: {
    marginLeft: 12,
    flex: 1,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  optionDescription: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 6,
    minHeight: 48,
  },
  checkboxText: {
    fontSize: 16,
    marginLeft: 12,
    fontWeight: '500',
  },
  buttonContainer: {
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    marginTop: 10,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
