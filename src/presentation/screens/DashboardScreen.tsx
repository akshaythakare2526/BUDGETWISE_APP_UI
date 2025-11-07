import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, FlatList, ActivityIndicator, RefreshControl, TextInput } from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import CustomPopup, { PopupType } from '../components/CustomPopup';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_CONFIG } from '../../core/config/constants';
import { useFocusEffect } from '@react-navigation/native';
import { expenseAPI, userAPI, depositAPI } from '../../data/services/api';
import { TokenManager } from '../../data/TokenManager';
import ContextIndicator from '../components/ContextIndicator';
import AdaptiveStatusBar from '../components/AdaptiveStatusBar';
import NetworkStatusBar from '../components/NetworkStatusBar';
import { useTheme } from '../../core/theme/ThemeContext';
import { offlineManager } from '../../services/OfflineManager';

type DashboardScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;

interface Props {
  navigation: DashboardScreenNavigationProp;
}

const demoBalance = {
  total: 484.0,
  income: 2379.0,
  expense: 1895.0,
};

const demoTransactions = [
  {
    id: 'demo_1_health',
    category: 'Health',
    icon: 'heart',
    iconColor: '#FF4C5E',
    bgColor: '#2D2D2D',
    amount: -25,
    desc: 'checkup fee',
    date: '11 Dec',
    type: 'expense',
  },
  {
    id: 'demo_2_income',
    category: 'Income',
    icon: 'attach-money',
    iconColor: '#3ED598',
    bgColor: '#2D2D2D',
    amount: 60,
    desc: 'Gift from Family',
    date: '10 Dec',
    type: 'income',
  },
  {
    id: 'demo_3_clothing',
    category: 'Clothing',
    icon: 'tshirt',
    iconColor: '#A259FF',
    bgColor: '#2D2D2D',
    amount: -20,
    desc: 'Winter Clothing',
    date: '10 Dec',
    type: 'expense',
  },
  {
    id: 'demo_4_income2',
    category: 'Income',
    icon: 'attach-money',
    iconColor: '#3ED598',
    bgColor: '#2D2D2D',
    amount: 90,
    desc: 'Cashback from Credit Card',
    date: '9 Dec',
    type: 'income',
  },
  {
    id: 'demo_5_dining',
    category: 'Dining',
    icon: 'restaurant',
    iconColor: '#FF7363',
    bgColor: '#2D2D2D',
    amount: -30,
    desc: 'Had dinner at hotel',
    date: '9 Dec',
    type: 'expense',
  },
];

export default function DashboardScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const [logoutPopup, setLogoutPopup] = useState({ visible: false });
  const [userName, setUserName] = useState<string>('');
  const [expenses, setExpenses] = useState<any[]>([]);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [balance, setBalance] = useState({
    total: 0,
    income: 0,
    expense: 0,
  });

  // Network error state
  const [networkError, setNetworkError] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // Network status monitoring
  useEffect(() => {
    // Subscribe to network status changes
    const unsubscribe = offlineManager.onNetworkStatusChange((online) => {
      setIsOnline(online);
      if (online) {
        setNetworkError(false);
      }
    });

    // Get initial network status
    setIsOnline(offlineManager.getNetworkStatus());

    return unsubscribe;
  }, []);
  
  // Search functionality state
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [filteredExpenses, setFilteredExpenses] = useState<any[]>([]);

  // Key counter for ensuring unique keys
  const keyCounterRef = React.useRef(0);

  // Function to generate guaranteed unique keys
  const generateUniqueKey = (item: any, index: number): string => {
    keyCounterRef.current += 1;
    
    // Try to use existing ID first
    if (item.id && typeof item.id === 'string' && item.id.length > 0) {
      return item.id;
    }
    
    // Create a compound key with multiple components for absolute uniqueness
    const timestamp = Date.now();
    const randomComponent = Math.random().toString(36).substr(2, 9);
    const counterComponent = keyCounterRef.current;
    const typeComponent = item.type || 'transaction';
    
    return `${typeComponent}_${index}_${timestamp}_${counterComponent}_${randomComponent}`;
  };

  // Function to fetch both expenses and deposits using offline manager
  const fetchTransactions = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    
    // Reset key counter for new data fetch
    keyCounterRef.current = 0;
    
    try {
      console.log('🔄 Fetching transactions using offline manager...');
      
      const { expenses: expenseList, deposits: depositList } = await offlineManager.getAllTransactions();
      
      console.log('✅ Offline manager data loaded:', {
        expenses: expenseList.length,
        deposits: depositList.length
      });
      
      // Transform expenses data to dashboard format
      const transformedExpenses = expenseList.map((expense: any, index: number) => {
        // Convert all amounts to negative for display (expenses)
        const displayAmount = -Math.abs(expense.amount);
        
        // Create unique ID with enhanced fallback to ensure no duplicates
        let uniqueId;
        if (expense.expenseId) {
          uniqueId = `expense_${expense.expenseId}`;
        } else if (expense.id) {
          uniqueId = `expense_id_${expense.id}`;
        } else {
          // Create a completely unique ID when no database ID exists
          const timestamp = Date.now();
          const randomPart = Math.random().toString(36).substr(2, 9);
          uniqueId = `expense_generated_${index}_${timestamp}_${randomPart}`;
        }
        
        return {
          id: uniqueId,
          category: getCategoryName(expense.expenseCategoryID),
          icon: getCategoryIcon(expense.expenseCategoryID),
          iconColor: '#FF7A7A', // All expenses are red
          bgColor: '#2D2D2D',
          amount: displayAmount, // Always negative
          desc: expense.description || 'No description',
          date: formatDate(expense.createdAt),
          type: 'expense',
          originalData: expense, // Keep original data for reference
        };
      });
      
      // Transform deposits data to dashboard format
      const transformedDeposits = depositList.map((deposit: any, index: number) => {
        // Keep deposits as positive amounts (income)
        const displayAmount = Math.abs(deposit.amount);
        
        // Create unique ID with enhanced fallback to ensure no duplicates
        let uniqueId;
        if (deposit.depositId) {
          uniqueId = `deposit_${deposit.depositId}`;
        } else if (deposit.id) {
          uniqueId = `deposit_id_${deposit.id}`;
        } else {
          // Create a completely unique ID when no database ID exists
          const timestamp = Date.now();
          const randomPart = Math.random().toString(36).substr(2, 9);
          uniqueId = `deposit_generated_${index}_${timestamp}_${randomPart}`;
        }
        
        return {
          id: uniqueId,
          category: 'Income', // Generic category for deposits
          icon: 'trending-up',
          iconColor: '#3ED598', // Green for income/deposits
          bgColor: '#2D2D2D',
          amount: displayAmount, // Always positive
          desc: deposit.description || 'Deposit/Income',
          date: formatDate(deposit.createdAt),
          type: 'deposit',
          originalData: deposit, // Keep original data for reference
        };
      });
      
      // Combine and sort transactions by date (newest first)
      const allTransactions = [...transformedExpenses, ...transformedDeposits].sort((a, b) => {
        return new Date(b.originalData.createdAt).getTime() - new Date(a.originalData.createdAt).getTime();
      });

      // Debug: Check for duplicate IDs
      const ids = allTransactions.map(t => t.id);
      const uniqueIds = new Set(ids);
      if (ids.length !== uniqueIds.size) {
        console.warn('⚠️ Duplicate transaction IDs detected:', {
          totalTransactions: ids.length,
          uniqueIds: uniqueIds.size,
          duplicates: ids.filter((id, index) => ids.indexOf(id) !== index)
        });
      } else {
        console.log('✅ All transaction IDs are unique:', ids.length, 'transactions');
      }
      
      setExpenses(transformedExpenses);
      setDeposits(transformedDeposits);
      setAllTransactions(allTransactions);
      
      // Calculate balance with both expenses and deposits
      const totalExpense = transformedExpenses
        .reduce((sum: number, exp: any) => sum + Math.abs(exp.amount), 0);
      
      const totalIncome = transformedDeposits
        .reduce((sum: number, dep: any) => sum + Math.abs(dep.amount), 0);
      
      setBalance({
        total: totalIncome - totalExpense,
        income: totalIncome,
        expense: totalExpense,
      });
      
      // Clear network error state on successful fetch
      setNetworkError(false);
      
      console.log('✅ Dashboard data updated with expenses and deposits');
    } catch (error: any) {
      console.log('❌ Error fetching transactions:', error);

      // Check if it's a 401 error specifically
      if (error.response?.status === 401) {
        console.log('🔒 Authentication failed - token may be expired');
        console.log('💡 Running token diagnostics...');
        // Debug token information
        await TokenManager.debugTokens();
        // Optional: Clear invalid tokens and redirect to login
        // await TokenManager.clearAllTokens();
        // navigation.navigate('Login');
      }

      // Show network error instead of demo data
      setNetworkError(true);
      setExpenses([]);
      setDeposits([]);
      setAllTransactions([]);
      setBalance({ total: 0, income: 0, expense: 0 });
    } finally {
      if (showLoading) setLoading(false);
      setRefreshing(false);
    }
  };

  // Helper function to get category name based on ID
  const getCategoryName = (categoryId: number): string => {
    const categoryMap: { [key: number]: string } = {
      1: 'Food',
      2: 'Hospital',
      3: 'Investment',
      4: 'Rent',
      5: 'Bill',
      6: 'Education',
      7: 'Transport',
      8: 'Entertainment',
      9: 'Utilities',
      10: 'Grocery',
      11: 'Travel',
      12: 'Insurance',
      13: 'Shopping',
      14: 'Loan',
      15: 'Miscellaneous',
      16: 'Credit Card',
    };
    return categoryMap[categoryId] || 'Other';
  };

  // Helper function to get category icon based on ID
  const getCategoryIcon = (categoryId: number): string => {
    const iconMap: { [key: number]: string } = {
      1: 'restaurant',
      2: 'medical',
      3: 'trending-up',
      4: 'home',
      5: 'receipt',
      6: 'school',
      7: 'car',
      8: 'game-controller',
      9: 'flash',
      10: 'basket',
      11: 'airplane',
      12: 'shield',
      13: 'bag',
      14: 'card',
      15: 'ellipsis-horizontal',
      16: 'card',
    };
    return iconMap[categoryId] || 'help';
  };

  // Helper function to format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    return `${day} ${month}`;
  };

  // Function to handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchTransactions(false);
  };

  // Enhanced search functionality
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setFilteredExpenses(allTransactions);
      return;
    }
    
    const lowercaseQuery = query.toLowerCase();
    const filtered = allTransactions.filter(transaction => {
      // Search in category name
      const categoryMatch = transaction.category.toLowerCase().includes(lowercaseQuery);
      
      // Search in description/transaction name
      const descMatch = transaction.desc.toLowerCase().includes(lowercaseQuery);
      
      // Search in title if it exists
      const titleMatch = transaction.title ? transaction.title.toLowerCase().includes(lowercaseQuery) : false;
      
      // Search in amount (both numeric value and formatted string)
      const amountMatch = Math.abs(transaction.amount).toString().includes(lowercaseQuery) ||
                          `₹${Math.abs(transaction.amount).toFixed(2)}`.includes(lowercaseQuery) ||
                          Math.abs(transaction.amount).toFixed(2).includes(lowercaseQuery);
      
      // Search in date
      const dateMatch = transaction.date.toLowerCase().includes(lowercaseQuery);
      
      // Search in transaction ID if needed
      const idMatch = transaction.id.toString().includes(lowercaseQuery);
      
      // Search by transaction type (expense/deposit)
      const typeMatch = transaction.type && transaction.type.toLowerCase().includes(lowercaseQuery);
      
      return categoryMatch || descMatch || titleMatch || amountMatch || dateMatch || idMatch || typeMatch;
    });
    
    setFilteredExpenses(filtered);
  };

  const toggleSearch = () => {
    setShowSearch(!showSearch);
    if (showSearch) {
      // Clear search when hiding search bar
      setSearchQuery('');
      setFilteredExpenses(allTransactions);
    }
  };

  React.useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await AsyncStorage.getItem(APP_CONFIG.STORAGE_KEYS.USER_DATA);
        if (userData) {
          const user = JSON.parse(userData);
          setUserName(user.name || user.userName || 'User');
        } else {
          setUserName('User');
        }
      } catch (e) {
        setUserName('User');
      }
    };
    
    fetchUserData();
    fetchTransactions(); // Fetch expenses and deposits on component mount
  }, []);

  // Update filtered expenses when allTransactions change
  useEffect(() => {
    if (searchQuery.trim()) {
      handleSearch(searchQuery);
    } else {
      setFilteredExpenses(allTransactions);
    }
  }, [allTransactions]);

  // Refresh expenses when screen comes into focus (e.g., after adding an expense)
  useFocusEffect(
    React.useCallback(() => {
      fetchTransactions(false); // Refresh without showing loading spinner
    }, [])
  );

  // Prevent back navigation to Login/Register
  // useFocusEffect(
  //   React.useCallback(() => {
  //     navigation.reset({
  //       index: 0,
  //       routes: [{ name: 'MainTabs' }],
  //     });
  //   }, [navigation])
  // );

  const showLogoutConfirmation = () => {
    setLogoutPopup({ visible: true });
  };

  const handleLogout = async () => {
    setLogoutPopup({ visible: false });
    console.log('🚪 Starting logout process...');
    
    try {
      // Get current token (could be personal or group token)
      const currentToken = await TokenManager.getCurrentToken();
      if (currentToken) {
        await userAPI.logout(currentToken);
        console.log('✅ Logout API call successful');
      }
    } catch (e) {
      console.log('⚠️ Logout API error (continuing anyway):', e);
    }
    
    // Clear all tokens and data using TokenManager
    await TokenManager.clearAllTokens();
    await AsyncStorage.removeItem(APP_CONFIG.STORAGE_KEYS.USER_GROUPS);
    await AsyncStorage.removeItem(APP_CONFIG.STORAGE_KEYS.APP_SETTINGS);
    
    // Set navigation trigger to force AppNavigator to detect logout
    await AsyncStorage.setItem('@budgetwise_navigation_trigger', Date.now().toString());
    
    console.log('🧹 All data cleared from storage');
    console.log('🔄 AppNavigator will detect logout and switch to auth screens');
  };

  const handleLogoutCancel = () => {
    setLogoutPopup({ visible: false });
  };

  const renderTransaction = ({ item }) => {
    // Dynamic icon rendering based on item.icon
    const renderIcon = () => {
      const iconProps = { size: 22, color: item.iconColor };
      
      switch (item.icon) {
        case 'restaurant': return <MaterialIcons name="restaurant" {...iconProps} />;
        case 'medical': return <MaterialIcons name="local-hospital" {...iconProps} />;
        case 'trending-up': return <MaterialIcons name="trending-up" {...iconProps} />;
        case 'home': return <Ionicons name="home" {...iconProps} />;
        case 'receipt': return <Ionicons name="receipt" {...iconProps} />;
        case 'school': return <Ionicons name="school" {...iconProps} />;
        case 'car': return <Ionicons name="car" {...iconProps} />;
        case 'game-controller': return <Ionicons name="game-controller" {...iconProps} />;
        case 'flash': return <Ionicons name="flash" {...iconProps} />;
        case 'basket': return <Ionicons name="basket" {...iconProps} />;
        case 'airplane': return <Ionicons name="airplane" {...iconProps} />;
        case 'shield': return <Ionicons name="shield" {...iconProps} />;
        case 'bag': return <Ionicons name="bag" {...iconProps} />;
        case 'card': return <Ionicons name="card" {...iconProps} />;
        case 'ellipsis-horizontal': return <Ionicons name="ellipsis-horizontal" {...iconProps} />;
        // Legacy icon support
        case 'heart': return <Ionicons name="heart" {...iconProps} />;
        case 'attach-money': return <MaterialIcons name="attach-money" {...iconProps} />;
        case 'tshirt': return <FontAwesome5 name="tshirt" size={20} color={item.iconColor} />;
        default: return <Ionicons name="help" {...iconProps} />;
      }
    };

    return (
      <View style={[styles.transactionItem, { backgroundColor: theme.colors.card }]}>  
        <View style={[styles.iconCircle, { backgroundColor: item.iconColor + '22' }]}>  
          {renderIcon()}
        </View>
        <View style={styles.transactionDetails}>
          <Text style={[styles.transactionCategory, { backgroundColor: item.iconColor }]}>{item.category}</Text>
          <Text style={[styles.transactionDesc, { color: theme.colors.textSecondary }]}>{item.desc}</Text>
        </View>
        <View style={styles.transactionMeta}>
          <Text style={[styles.transactionAmount, { color: item.amount > 0 ? '#3ED598' : '#FF7A7A' }]}>
            {item.amount > 0 ? '+' : '-'}₹{Math.abs(item.amount).toFixed(2)}
          </Text>
          <Text style={[styles.transactionDate, { color: theme.colors.textSecondary }]}>{item.date}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <AdaptiveStatusBar backgroundColor={theme.colors.background} />
      
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.helloText, { color: theme.colors.textSecondary }]}>Hello,</Text>
            <Text style={[styles.userName, { color: theme.colors.text }]}>{userName}</Text>
          </View>
          <TouchableOpacity style={styles.searchIcon} onPress={toggleSearch}>
            <Ionicons name={showSearch ? "close" : "search"} size={24} color={theme.colors.disabled} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        {showSearch && (
          <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface }]}>
            <Ionicons name="search" size={20} color={theme.colors.disabled} style={{ marginRight: 10 }} />
            <TextInput
              value={searchQuery}
              onChangeText={handleSearch}
              placeholder="Search transactions by category, description, or amount"
              placeholderTextColor={theme.colors.placeholder}
              style={[styles.searchInput, { color: theme.colors.text }]}
              autoFocus={showSearch}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => {
                setSearchQuery('');
                handleSearch('');
              }} style={styles.closeSearch}>
                <Ionicons name="close-circle" size={20} color="#B0B0B0" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Context Indicator */}
        <ContextIndicator />

        {/* Loading Indicator */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading expenses...</Text>
          </View>
        )}

        {/* Balance Card */}
        <View style={[styles.balanceCard, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.balanceLabel, { color: theme.colors.textSecondary }]}>Total Balance</Text>
          <Text style={[styles.balanceValue, { color: theme.colors.secondary }]}>₹ {balance.total.toFixed(2)}</Text>
          <View style={styles.balanceRow}>
            <View style={styles.balanceCol}>
              <Ionicons name="arrow-down" size={18} color="#3ED598" />
              <Text style={[styles.incomeLabel, { color: theme.colors.textSecondary }]}>Income</Text>
              <Text style={styles.incomeValue}>₹{balance.income.toFixed(2)}</Text>
            </View>
            <View style={styles.balanceCol}>
              <Ionicons name="arrow-up" size={18} color="#FF7A7A" />
              <Text style={[styles.expenseLabel, { color: theme.colors.textSecondary }]}>Expense</Text>
              <Text style={styles.expenseValue}>₹{balance.expense.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Recent Transactions */}
        <Text style={[styles.recentTitle, { color: theme.colors.secondary }]}>Recent Transactions</Text>
        {networkError ? (
          <View style={styles.emptyState}>
            <Ionicons name="cloud-offline" size={48} color="#FF7A7A" />
            <Text style={[styles.emptyStateText, { color: theme.colors.secondary }]}>Network Issue</Text>
            <Text style={[styles.emptyStateSubtext, { color: theme.colors.textSecondary }]}>Unable to connect to server. Please check your internet connection and try again.</Text>
          </View>
        ) : filteredExpenses.length === 0 && !loading ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={48} color="#B0B0B0" />
            <Text style={[styles.emptyStateText, { color: theme.colors.secondary }]}>
              {searchQuery.trim() ? "No matching transactions found" : "No transactions yet"}
            </Text>
            <Text style={[styles.emptyStateSubtext, { color: theme.colors.textSecondary }]}>
              {searchQuery.trim() ? "Try adjusting your search terms" : "Tap the + button to add your first transaction"}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredExpenses}
            renderItem={renderTransaction}
            keyExtractor={(item, index) => generateUniqueKey(item, index)}
            style={{ flexGrow: 0 }}
            contentContainerStyle={{ paddingBottom: 80 }}
            showsVerticalScrollIndicator={false}
            scrollEnabled={false} // Disable internal scrolling since we have outer ScrollView
          />
        )}
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: theme.colors.primary, shadowColor: theme.colors.primary }]}
        onPress={() => navigation.navigate('AddExpense')}
      >
        <Ionicons name="add" size={32} color={theme.isDark ? '#222' : '#fff'} />
      </TouchableOpacity>
      <CustomPopup 
        visible={logoutPopup.visible}
        title="Logout Confirmation"
        message="Are you sure you want to logout? You'll need to sign in again to access your budget data."
        type="confirm"
        confirmText="Logout"
        onClose={handleLogoutCancel}
        onConfirm={handleLogout}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 0,
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 18,
  },
  helloText: {
    fontSize: 15,
    fontWeight: '400',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 2,
  },
  searchIcon: {
    backgroundColor: '#E6F3FF', // Keep this light blue for now
    borderRadius: 20,
    padding: 8,
  },
  balanceCard: {
    borderRadius: 20,
    marginHorizontal: 18,
    padding: 22,
    marginBottom: 18,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  balanceLabel: {
    fontSize: 15,
    marginBottom: 6,
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  balanceCol: {
    alignItems: 'center',
    flex: 1,
  },
  incomeLabel: {
    fontSize: 13,
    marginTop: 2,
  },
  incomeValue: {
    color: '#3ED598',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 2,
  },
  expenseLabel: {
    fontSize: 13,
    marginTop: 2,
  },
  expenseValue: {
    color: '#FF7A7A',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 2,
  },
  recentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 24,
    marginBottom: 10,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    marginHorizontal: 18,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionCategory: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  transactionDesc: {
    fontSize: 13,
    marginTop: 2,
  },
  transactionMeta: {
    alignItems: 'flex-end',
    minWidth: 70,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  transactionDate: {
    fontSize: 12,
    marginTop: 2,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    backgroundColor: '#4A90E2', // Keep blue FAB
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  searchContainer: {
    borderRadius: 10,
    marginHorizontal: 18,
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  closeSearch: {
    padding: 8,
  },
});
