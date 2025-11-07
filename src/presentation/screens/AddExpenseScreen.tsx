import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_CONFIG } from '../../core/config/constants';
import CustomPopup, { PopupType } from '../components/CustomPopup';
import { expenseAPI, depositAPI } from '../../data/services/api';
import AdaptiveStatusBar from '../components/AdaptiveStatusBar';
import NetworkStatusBar from '../components/NetworkStatusBar';
import { useTheme } from '../../core/theme/ThemeContext';
import { offlineManager } from '../../services/OfflineManager';

export default function AddExpenseScreen() {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [type, setType] = useState<'expense' | 'credit'>('expense'); // expense or credit
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categories, setCategories] = useState<Array<{id: number, name: string}>>([]);
  const [categoriesError, setCategoriesError] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [popup, setPopup] = useState<{visible: boolean, message: string, type: PopupType}>(
    { visible: false, message: '', type: 'info' }
  );
  
  const navigation = useNavigation();
  const { theme } = useTheme();

  const showPopup = (message: string, type: PopupType = 'info') => setPopup({ visible: true, message, type });
  
  const closePopup = () => {
    const currentType = popup.type;
    setPopup(p => ({ ...p, visible: false }));
    // Navigate back only after closing success popup
    if (currentType === 'success') {
      navigation.goBack();
    }
  };

  // Network status monitoring
  useEffect(() => {
    // Subscribe to network status changes
    const unsubscribe = offlineManager.onNetworkStatusChange((online) => {
      setIsOnline(online);
    });

    // Get initial network status
    setIsOnline(offlineManager.getNetworkStatus());

    return unsubscribe;
  }, []);

  const validateForm = () => {
    if (!title.trim()) {
      showPopup('Please enter a title', 'error');
      return false;
    }
    if (!amount.trim() || isNaN(Number(amount)) || Number(amount) <= 0) {
      showPopup('Please enter a valid amount', 'error');
      return false;
    }
    // Category is only required for expenses, not deposits
    if (type === 'expense' && !categoryId && !category.trim()) {
      showPopup('Please select a category', 'error');
      return false;
    }
    return true;
  };

  const handleSaveExpense = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (type === 'expense') {
        // Handle expense creation using offline manager
        const selectedCategoryId = categoryId || (categories.find(cat => cat.name === category)?.id) || 1;
        
        console.log('🏷️ Selected category ID:', selectedCategoryId, 'for category:', category);
        console.log('💰 Adding expense with amount:', amount);
        
        const expenseAmount = Math.abs(Number(amount));
        
        const expenseData = {
          amount: expenseAmount,
          description: description.trim() || title.trim(),
          expenseCategoryID: selectedCategoryId,
          Tittle: title.trim(), // Note: API uses "Tittle" (with double t)
        };

        console.log('💰 Creating expense via offline manager:', expenseData);
        const result = await offlineManager.createExpense(expenseData);
        
        if (result.success) {
          showPopup(`Expense "${title}" added successfully!`, 'success');
        } else {
          showPopup(result.error || 'Failed to save expense', 'error');
        }

      } else {
        // Handle deposit creation using offline manager
        console.log('💰 Adding deposit with amount:', amount);
        const depositAmount = Math.abs(Number(amount));
        
        const depositData = {
          amount: depositAmount,
          description: description.trim() || title.trim(),
          tittle: title.trim(), // Note: API uses "tittle" (lowercase)
        };

        console.log('💰 Creating deposit via offline manager:', depositData);
        const result = await offlineManager.createDeposit(depositData);
        
        if (result.success) {
          showPopup(`Deposit "${title}" added successfully!`, 'success');
        } else {
          showPopup(result.error || 'Failed to save deposit', 'error');
        }
      }

    } catch (error: any) {
      console.log('❌ Error saving:', error);
      
      let errorMessage = 'Failed to save. Please try again.';
      if (error.response) {
        errorMessage = `API Error: ${error.response.data?.message || error.response.statusText}`;
      } else if (error.request) {
        errorMessage = 'Network error. Saved offline for later sync.';
      }
      
      showPopup(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Load categories from API
  const loadCategories = async () => {
    setCategoriesLoading(true);
    setCategoriesError(false);
    try {
      console.log('🔍 Loading categories via offline manager...');
      const result = await offlineManager.getCategories();
      
      if (result.success && result.data) {
        console.log('✅ Categories loaded:', result.data);
        setCategories(result.data);
        
        if (result.data.length > 0) {
          console.log('✅ Categories set successfully, count:', result.data.length);
        } else {
          console.log('⚠️ No categories received from offline manager');
        }
      } else {
        console.log('❌ Failed to load categories:', result.error);
        setCategoriesError(true);
        // Empty categories will trigger fallback UI
        setCategories([]);
      }
    } catch (error) {
      console.log('❌ Error loading categories:', error);
      setCategoriesError(true);
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  // Load categories when component mounts or when type changes to expense
  useEffect(() => {
    if (type === 'expense') {
      loadCategories();
    }
  }, [type]);

  return (
    <>
      <AdaptiveStatusBar backgroundColor={theme.colors.background} />
      <CustomPopup visible={popup.visible} message={popup.message} type={popup.type} onClose={closePopup} />
      
      <KeyboardAvoidingView 
        style={[styles.container, { backgroundColor: theme.colors.background }]} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.scrollContainer} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={[styles.header, { backgroundColor: theme.colors.background }]}>
            <TouchableOpacity style={[styles.backButton, { backgroundColor: theme.colors.card }]} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.colors.secondary }]}>
              {type === 'expense' ? 'Add Expense' : 'Add Deposit'}
            </Text>
            <View style={styles.placeholder} />
          </View>

          {/* Type Selector - Only Expense for now */}
          <View style={[styles.typeSelector, { backgroundColor: theme.colors.card }]}>
            <TouchableOpacity 
              style={[styles.typeButton, type === 'expense' && [styles.typeButtonActive, { backgroundColor: theme.colors.primary }]]}
              onPress={() => setType('expense')}
            >
              <Ionicons 
                name="remove-circle" 
                size={20} 
                color={type === 'expense' ? '#fff' : '#FF4C5E'} 
              />
              <Text style={[styles.typeButtonText, { color: theme.colors.primary }, type === 'expense' && styles.typeButtonTextActive]}>
                Expense
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.typeButton, type === 'credit' && [styles.typeButtonActive, { backgroundColor: theme.colors.primary }]]}
              onPress={() => setType('credit')}
            >
              <Ionicons 
                name="add-circle" 
                size={20} 
                color={type === 'credit' ? '#fff' : '#00C897'} 
              />
              <Text style={[styles.typeButtonText, { color: theme.colors.primary }, type === 'credit' && styles.typeButtonTextActive]}>
                Deposit
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Container */}
          <View style={[styles.formContainer, { backgroundColor: theme.colors.card }]}>
            <View style={[styles.iconContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.primary }]}>
              <Ionicons 
                name={type === 'expense' ? "remove-circle" : "add-circle"} 
                size={40} 
                color={type === 'expense' ? "#FF4C5E" : "#00C897"} 
              />
            </View>
            
            <Text style={[styles.title, { color: theme.colors.secondary }]}>
              {type === 'expense' ? 'Record Expense' : 'Record Deposit'}
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              {type === 'expense' 
                ? 'Track your spending and manage your budget'
                : 'Track your income and deposits'
              }
            </Text>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Title *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.colors.surface, color: theme.colors.text, borderColor: theme.colors.background }]}
                placeholder={type === 'expense' ? "e.g. Lunch at restaurant" : "e.g. Salary payment"}
                placeholderTextColor={theme.colors.textSecondary}
                value={title}
                onChangeText={setTitle}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Amount *</Text>
              <View style={[styles.amountContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.background }]}>
                <Text style={[styles.currencySymbol, { color: theme.colors.textSecondary }]}>₹</Text>
                <TextInput
                  style={[styles.amountInput, { color: theme.colors.text }]}
                  placeholder="0.00"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  returnKeyType="next"
                />
              </View>
            </View>

            {type === 'expense' && (
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
                  Category * {categories.length > 0 && `(${categories.length} available)`}
                </Text>
                {categoriesLoading ? (
                  <View style={[styles.loadingContainer, { backgroundColor: theme.colors.surface }]}>
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                    <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading categories...</Text>
                  </View>
                ) : categoriesError ? (
                  <View style={[styles.errorContainer, { backgroundColor: theme.colors.surface }]}>
                    <Text style={[styles.errorText, { color: theme.colors.error || '#FF4C5E' }]}>Failed to load categories</Text>
                    <TouchableOpacity style={[styles.retryButton, { backgroundColor: theme.colors.background }]} onPress={loadCategories}>
                      <Ionicons name="refresh" size={16} color={theme.colors.primary} />
                      <Text style={[styles.retryText, { color: theme.colors.primary }]}>Retry</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                    {categories.map((cat) => (
                      <TouchableOpacity
                        key={cat.id}
                        style={[
                          styles.categoryChip, 
                          { backgroundColor: theme.colors.surface, borderColor: theme.colors.background },
                          categoryId === cat.id && [styles.categoryChipActive, { backgroundColor: theme.colors.primary }]
                        ]}
                        onPress={() => {
                          setCategory(cat.name);
                          setCategoryId(cat.id);
                        }}
                      >
                        <Text style={[
                          styles.categoryChipText, 
                          { color: theme.colors.text },
                          categoryId === cat.id && [styles.categoryChipTextActive, { color: '#fff' }]
                        ]}>
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: theme.colors.surface, color: theme.colors.text, borderColor: theme.colors.background }]}
                placeholder={type === 'expense' ? "Add notes or details (optional)" : "Add deposit details (optional)"}
                placeholderTextColor={theme.colors.textSecondary}
                value={description}
                onChangeText={setDescription}
                multiline={true}
                numberOfLines={3}
                returnKeyType="done"
                onSubmitEditing={handleSaveExpense}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.saveButton, 
                { backgroundColor: theme.colors.primary },
                loading && [styles.buttonDisabled, { backgroundColor: theme.colors.textSecondary }],
                type === 'credit' && styles.creditButton
              ]} 
              onPress={handleSaveExpense}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons 
                    name={type === 'expense' ? "remove-circle" : "add-circle"} 
                    size={20} 
                    color="#fff" 
                    style={styles.buttonIcon} 
                  />
                  <Text style={styles.saveButtonText}>
                    Save {type === 'expense' ? 'Expense' : 'Credit'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F8FF',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#F0F8FF',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C5282',
  },
  placeholder: {
    width: 40,
  },
  typeSelector: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  typeButtonActive: {
    backgroundColor: '#4A90E2',
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C5282',
    marginLeft: 8,
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  formContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0F8FF',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#4A90E2',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    paddingLeft: 16,
  },
  amountInput: {
    flex: 1,
    height: 50,
    paddingHorizontal: 8,
    fontSize: 16,
    color: '#2C5282',
  },
  categoryScroll: {
    marginBottom: 10,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFB5B5',
  },
  errorText: {
    fontSize: 14,
    flex: 1,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  retryText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '500',
  },
  categoryChip: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  categoryChipActive: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  saveButton: {
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginTop: 20,
    flexDirection: 'row',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  creditButton: {
    backgroundColor: '#00C897',
    shadowColor: '#00C897',
  },
  buttonDisabled: {
    shadowOpacity: 0.1,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonIcon: {
    marginRight: 8,
  },
});
