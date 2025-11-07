import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PieChart, LineChart } from 'react-native-chart-kit';
import { useFocusEffect } from '@react-navigation/native';
import { expenseAPI, depositAPI } from '../../data/services/api';
import { TokenManager } from '../../data/TokenManager';
import CustomPopup, { PopupType } from '../components/CustomPopup';
import ContextIndicator from '../components/ContextIndicator';
import { useTheme } from '../../core/theme/ThemeContext';
import { offlineManager } from '../../services/OfflineManager';

const screenWidth = Dimensions.get('window').width;

interface ChartData {
  name: string;
  amount: number;
  color: string;
  legendFontColor: string;
  legendFontSize: number;
}

interface MonthlyData {
  month: string;
  expenses: number;
  deposits: number;
}

export default function ExpenseAnalyticsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [isOnline, setIsOnline] = useState(true);
  const [popup, setPopup] = useState<{visible: boolean, message: string, type: PopupType}>({
    visible: false, message: '', type: 'info'
  });

  const { theme } = useTheme();

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

  // Chart configuration - dynamic based on theme
  const chartConfig = {
    backgroundColor: theme.colors.card,
    backgroundGradientFrom: theme.colors.card,
    backgroundGradientTo: theme.colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
    labelColor: (opacity = 1) => theme.isDark ? `rgba(248, 250, 252, ${opacity})` : `rgba(44, 82, 130, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#4A90E2',
    },
    fillShadowGradient: '#4A90E2',
    fillShadowGradientOpacity: 0.2,
  };

  const fetchData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    
    try {
      console.log('📊 Fetching analytics data via offline manager...');
      const result = await offlineManager.getAnalyticsData();
      
      if (result.success) {
        const expensesList = result.expenses || [];
        const depositsList = result.deposits || [];
        
        setExpenses(expensesList);
        setDeposits(depositsList);

        console.log('✅ Analytics data loaded successfully');
        console.log(`📊 Loaded ${expensesList.length} expenses and ${depositsList.length} deposits`);

        // Debug logging to check the data structure
        if (expensesList.length > 0) {
          console.log('📊 First expense item structure:', Object.keys(expensesList[0]));
          console.log('📊 First expense item data:', expensesList[0]);
        }
        if (depositsList.length > 0) {
          console.log('📊 First deposit item structure:', Object.keys(depositsList[0]));
          console.log('📊 First deposit item data:', depositsList[0]);
        }
      } else {
        console.error('❌ Error loading analytics data:', result.error);
        showPopup(result.error || 'Failed to load analytics data', 'error');
      }

    } catch (error: any) {
      console.error('❌ Error fetching analytics data:', error);
      showPopup('Failed to load analytics data', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Listen for context changes (group/personal switches)
  useEffect(() => {
    const checkForContextChanges = async () => {
      // This will trigger when TokenManager context changes
      const currentToken = await TokenManager.getCurrentToken();
      if (currentToken) {
        fetchData(false);
      }
    };
    
    checkForContextChanges();
  }, []); // Empty dependency array, but the function will be called when needed

  // Refresh data when screen comes into focus (similar to Dashboard)
  useFocusEffect(
    React.useCallback(() => {
      fetchData(false); // Refresh without showing loading spinner
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData(false);
  };

  const showPopup = (message: string, type: PopupType = 'info') => {
    setPopup({ visible: true, message, type });
  };

  const closePopup = () => {
    setPopup(prev => ({ ...prev, visible: false }));
  };

  // Helper function to get category name - updated to match DashboardScreen
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

  // Generate category breakdown pie chart data
  const getCategoryBreakdown = (): ChartData[] => {
    if (!expenses || expenses.length === 0) {
      return [];
    }
    
    const categoryTotals: { [key: string]: number } = {};
    const colors = [
      '#FF6B6B', // Vibrant Red
      '#4ECDC4', // Turquoise
      '#45B7D1', // Sky Blue
      '#96CEB4', // Mint Green
      '#FFEAA7', // Soft Yellow
      '#DDA0DD', // Plum
      '#98D8C8', // Light Sea Green
      '#F7DC6F', // Khaki
      '#BB8FCE', // Light Purple
      '#85C1E9', // Light Blue
      '#F8C471', // Orange
      '#82E0AA', // Light Green
    ];

    expenses.forEach((expense, index) => {
      // Use the correct field name - check multiple possible field names
      const categoryId = expense.expenseCategoryID || expense.categoryId || expense.ExpenseCategoryID || expense.categoryID;
      
      // Debug logging for the first few items
      if (index < 3) {
        console.log('📊 Expense category debug:', {
          expenseCategoryID: expense.expenseCategoryID,
          categoryId: expense.categoryId,
          ExpenseCategoryID: expense.ExpenseCategoryID,
          categoryID: expense.categoryID,
          resolved: categoryId,
          allKeys: Object.keys(expense)
        });
      }
      
      const category = getCategoryName(categoryId);
      categoryTotals[category] = (categoryTotals[category] || 0) + Math.abs(expense.amount);
    });

    console.log('📊 Category totals:', categoryTotals);

    const totalAmount = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);

    return Object.entries(categoryTotals)
      .map(([name, amount], index) => {
        const percentage = totalAmount > 0 ? ((amount / totalAmount) * 100) : 0;
        return {
          name: `${name} ${percentage.toFixed(1)}%`,
          amount,
          color: colors[index % colors.length],
          legendFontColor: '#2C5282',
          legendFontSize: 11,
        };
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8); // Top 8 categories
  };

  // Generate monthly trend data
  const getMonthlyTrend = (): MonthlyData[] => {
    if (!expenses && !deposits) {
      return [];
    }
    
    const monthlyDataMap: { [key: string]: { expenses: number; deposits: number } } = {};

    // Process expenses
    if (expenses && expenses.length > 0) {
      expenses.forEach(expense => {
        // Handle different date formats
        let date: Date;
        if (expense.dateTime) {
          date = new Date(expense.dateTime);
        } else if (expense.date) {
          date = new Date(expense.date);
        } else {
          date = new Date(); // fallback to current date
        }
        
        // Check if date is valid
        if (isNaN(date.getTime())) {
          console.warn('Invalid date found in expense:', expense);
          date = new Date(); // fallback to current date
        }
        
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyDataMap[monthKey]) {
          monthlyDataMap[monthKey] = { expenses: 0, deposits: 0 };
        }
        monthlyDataMap[monthKey].expenses += Math.abs(expense.amount);
      });
    }

    // Process deposits
    if (deposits && deposits.length > 0) {
      deposits.forEach(deposit => {
        // Handle different date formats
        let date: Date;
        if (deposit.dateTime) {
          date = new Date(deposit.dateTime);
        } else if (deposit.date) {
          date = new Date(deposit.date);
        } else {
          date = new Date(); // fallback to current date
        }
        
        // Check if date is valid
        if (isNaN(date.getTime())) {
          console.warn('Invalid date found in deposit:', deposit);
          date = new Date(); // fallback to current date
        }
        
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyDataMap[monthKey]) {
          monthlyDataMap[monthKey] = { expenses: 0, deposits: 0 };
        }
        monthlyDataMap[monthKey].deposits += deposit.amount;
      });
    }

    // Convert to array and sort by date
    return Object.entries(monthlyDataMap)
      .sort(([a], [b]) => a.localeCompare(b)) // Sort by year-month key
      .map(([key, data]) => {
        const [year, month] = key.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return {
          month: date.toLocaleDateString('en-US', { month: 'short' }),
          expenses: data.expenses,
          deposits: data.deposits,
        };
      })
      .slice(-6); // Last 6 months
  };

  // Calculate summary statistics
  const getSummaryStats = () => {
    const totalExpenses = (expenses && expenses.length > 0) ? expenses.reduce((sum, exp) => sum + Math.abs(exp.amount), 0) : 0;
    const totalDeposits = (deposits && deposits.length > 0) ? deposits.reduce((sum, dep) => sum + dep.amount, 0) : 0;
    const netBalance = totalDeposits - totalExpenses;
    const avgExpense = (expenses && expenses.length > 0) ? totalExpenses / expenses.length : 0;

    return { totalExpenses, totalDeposits, netBalance, avgExpense };
  };

  const { totalExpenses, totalDeposits, netBalance, avgExpense } = getSummaryStats();
  const categoryData = getCategoryBreakdown() || [];
  const monthlyData = getMonthlyTrend() || [];

  // Debug logging
  console.log('🔍 Analytics Debug:', {
    hasExpenses: !!(expenses && expenses.length > 0),
    hasDeposits: !!(deposits && deposits.length > 0),
    monthlyDataType: typeof monthlyData,
    monthlyDataLength: monthlyData?.length || 0,
    categoryDataLength: categoryData?.length || 0,
  });

  // --- Always guarantee monthlyData is an array ---
  const safeMonthlyData: MonthlyData[] = Array.isArray(getMonthlyTrend()) ? getMonthlyTrend() : [];


  // --- Custom Bar Chart Data ---
  const customBarLabels = safeMonthlyData.length > 0 ? safeMonthlyData.map(item => item.month || '') : ['No Data'];
  const customBarExpenses = safeMonthlyData.length > 0 ? safeMonthlyData.map(item => item.expenses || 0) : [0];
  const customBarDeposits = safeMonthlyData.length > 0 ? safeMonthlyData.map(item => item.deposits || 0) : [0];

  // Enhanced Single Bar Chart Component
  const CustomBarChart = ({ labels, data, barColor = '#4A90E2', label }: { labels: string[]; data: number[]; barColor?: string; label: string }) => {
    const maxValue = Math.max(...data, 1);
    return (
      <View style={{ marginTop: 8 }}>
        <Text style={styles.chartTitle}>{label}</Text>
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'flex-end', 
          height: 180, 
          backgroundColor: 'rgba(240, 248, 255, 0.3)', 
          borderRadius: 12, 
          paddingHorizontal: 12,
          paddingVertical: 12 
        }}>
          {data.map((value, idx) => (
            <View key={labels[idx] + idx} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
              <View style={{ 
                height: `${Math.max((value / maxValue) * 100, 3)}%`, 
                width: 24, 
                backgroundColor: barColor, 
                borderRadius: 12,
                marginBottom: 8,
                shadowColor: barColor,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 3,
              }} />
              <Text style={{ fontSize: 13, color: '#2C5282', fontWeight: '600', marginBottom: 4 }}>
                {labels[idx]}
              </Text>
              <Text style={{ fontSize: 11, color: barColor, fontWeight: '700' }}>
                ₹{value.toLocaleString()}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Enhanced Combined Bar Chart Component
  const CombinedBarChart = ({ labels, expensesData, depositsData, label }: { labels: string[]; expensesData: number[]; depositsData: number[]; label: string }) => {
    const maxValue = Math.max(...expensesData, ...depositsData, 1);
    return (
      <View style={[styles.enhancedChartContainer, { backgroundColor: theme.colors.card }]}>
        <Text style={[styles.enhancedChartTitle, { color: theme.colors.secondary }]}>{label}</Text>
        
        {/* Legend */}
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FF6B6B' }]} />
            <Text style={[styles.legendLabel, { color: theme.colors.primary }]}>Expenses</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#34C759' }]} />
            <Text style={[styles.legendLabel, { color: theme.colors.primary }]}>Deposits</Text>
          </View>
        </View>

        {/* Chart Area */}
        <View style={[styles.chartArea, { backgroundColor: theme.isDark ? 'rgba(55, 65, 81, 0.3)' : 'rgba(240, 248, 255, 0.3)' }]}>
          {labels.map((monthLabel, idx) => (
            <View key={monthLabel + idx} style={styles.barGroup}>
              {/* Bars Container */}
              <View style={styles.barsContainer}>
                {/* Expenses Bar */}
                <View style={[styles.barWrapper, { marginRight: 3 }]}>
                  <View style={[
                    styles.bar,
                    { 
                      height: `${Math.max((expensesData[idx] / maxValue) * 100, 2)}%`,
                      backgroundColor: '#FF6B6B',
                      shadowColor: '#FF6B6B',
                    }
                  ]} />
                </View>
                
                {/* Deposits Bar */}
                <View style={[styles.barWrapper, { marginLeft: 3 }]}>
                  <View style={[
                    styles.bar,
                    { 
                      height: `${Math.max((depositsData[idx] / maxValue) * 100, 2)}%`,
                      backgroundColor: '#34C759',
                      shadowColor: '#34C759',
                    }
                  ]} />
                </View>
              </View>
              
              {/* Month Label */}
              <Text style={[styles.monthLabel, { color: theme.colors.primary }]}>{monthLabel}</Text>
              
              {/* Values */}
              <View style={styles.valuesContainer}>
                <Text style={[styles.valueText, { color: '#FF6B6B' }]}>
                  ₹{expensesData[idx].toLocaleString()}
                </Text>
                <Text style={[styles.valueText, { color: '#34C759' }]}>
                  ₹{depositsData[idx].toLocaleString()}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Enhanced chart configuration for colorful bar chart
  const barChartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#f8f9fa',
    backgroundGradientFromOpacity: 0.9,
    backgroundGradientTo: '#ffffff',
    backgroundGradientToOpacity: 1,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(44, 82, 130, ${opacity})`,
    strokeWidth: 0,
    barPercentage: 0.8,
    categoryPercentage: 0.9,
    useShadowColorFromDataset: true,
    style: {
      borderRadius: 16,
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      strokeWidth: 1,
      stroke: '#e3f2fd',
    },
    propsForLabels: {
      fontSize: 12,
      fontWeight: '600',
    },
    fillShadowGradient: '#4A90E2',
    fillShadowGradientOpacity: 0.1,
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}> 
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.primary }]}>Loading analytics...</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} tintColor={theme.colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.colors.secondary }]}>Financial Analytics</Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>Track your spending patterns</Text>
        </View>

        {/* Context Indicator */}
        <ContextIndicator />

        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={[styles.summaryCard, { backgroundColor: theme.colors.card }]}>
            <Ionicons name="trending-down" size={24} color="#FF6B6B" />
            <Text style={[styles.summaryValue, { color: theme.colors.secondary }]}>₹{totalExpenses.toFixed(2)}</Text>
            <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Total Expenses</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: theme.colors.card }]}>
            <Ionicons name="trending-up" size={24} color="#00C897" />
            <Text style={[styles.summaryValue, { color: theme.colors.secondary }]}>₹{totalDeposits.toFixed(2)}</Text>
            <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Total Deposits</Text>
          </View>
        </View>

        <View style={styles.summaryContainer}>
          <View style={[styles.summaryCard, { backgroundColor: theme.colors.card }]}>
            <Ionicons name="wallet" size={24} color={netBalance >= 0 ? "#00C897" : "#FF6B6B"} />
            <Text style={[styles.summaryValue, { color: netBalance >= 0 ? "#00C897" : "#FF6B6B" }]}>
              ₹{netBalance.toFixed(2)}
            </Text>
            <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Net Balance</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: theme.colors.card }]}>
            <Ionicons name="calculator" size={24} color="#4A90E2" />
            <Text style={[styles.summaryValue, { color: theme.colors.secondary }]}>₹{avgExpense.toFixed(2)}</Text>
            <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Avg Expense</Text>
          </View>
        </View>

        {/* Enhanced Combined Monthly Expenses & Deposits Chart */}
        {monthlyData.length > 0 && (
          <CombinedBarChart
            labels={customBarLabels}
            expensesData={customBarExpenses}
            depositsData={customBarDeposits}
            label="Monthly Financial Overview"
          />
        )}

        {/* Category Breakdown Pie Chart */}
        {categoryData && Array.isArray(categoryData) && categoryData.length > 0 && (
          <View style={[styles.chartContainer, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.chartTitle, { color: theme.colors.secondary }]}>Expense Categories</Text>
            <PieChart
              data={categoryData}
              width={screenWidth - 40}
              height={240}
              chartConfig={chartConfig}
              accessor="amount"
              backgroundColor="transparent"
              paddingLeft="15"
              style={styles.colorfulChart}
              center={[10, 10]}
              absolute
              hasLegend={true}
            />
          </View>
        )}

        {/* Top Categories List */}
        {categoryData && Array.isArray(categoryData) && categoryData.length > 0 && (
          <View style={[styles.categoriesContainer, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.chartTitle, { color: theme.colors.secondary }]}>Top Spending Categories</Text>
            {categoryData.slice(0, 5).map((item, index) => {
              if (!item || !item.name) return null;
              
              // Extract category name without percentage for the list
              const nameParts = item.name.split(' ');
              const categoryName = nameParts.slice(0, -1).join(' '); // All parts except last (percentage)
              const percentage = nameParts[nameParts.length - 1]; // Last part (percentage)
              const isLastItem = index === categoryData.slice(0, 5).length - 1;
              
              return (
                <View key={item.name + index} style={[
                  styles.categoryItem, 
                  { 
                    backgroundColor: theme.colors.background,
                    marginBottom: isLastItem ? 0 : 12,
                    borderColor: theme.isDark ? 'rgba(74, 144, 226, 0.15)' : 'rgba(74, 144, 226, 0.1)'
                  }
                ]}>
                  <View style={styles.categoryLeft}>
                    <View style={[styles.categoryColor, { backgroundColor: item.color || '#FF6B6B' }]} />
                    <Text style={[styles.categoryName, { color: theme.colors.primary }]}>{categoryName || 'Unknown'}</Text>
                  </View>
                  <View style={styles.categoryRight}>
                    <Text style={[styles.categoryPercentage, { color: theme.colors.secondary }]}>{percentage || '0%'}</Text>
                    <Text style={[styles.categoryAmount, { color: theme.colors.secondary }]}>₹{(item.amount || 0).toFixed(2)}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Empty State */}
        {(!expenses || expenses.length === 0) && (!deposits || deposits.length === 0) && (
          <View style={[styles.emptyState, { backgroundColor: theme.colors.card }]}>
            <Ionicons name="analytics-outline" size={64} color={theme.colors.secondary} />
            <Text style={[styles.emptyStateText, { color: theme.colors.primary }]}>No data to analyze yet</Text>
            <Text style={[styles.emptyStateSubtext, { color: theme.colors.secondary }]}>Add some expenses and deposits to see beautiful charts</Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <CustomPopup
        visible={popup.visible}
        message={popup.message}
        type={popup.type}
        onClose={closePopup}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 16,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(74, 144, 226, 0.08)',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 12,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  chartContainer: {
    borderRadius: 20,
    marginHorizontal: 20,
    marginTop: 24,
    padding: 20,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(74, 144, 226, 0.06)',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  chart: {
    borderRadius: 16,
    alignSelf: 'center',
  },
  colorfulChart: {
    borderRadius: 16,
    alignSelf: 'center',
    marginVertical: 8,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  legendContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  categoriesContainer: {
    borderRadius: 20,
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(74, 144, 226, 0.08)',
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    minWidth: 100,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  categoryPercentage: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 20,
  },
  emptyStateText: {
    fontSize: 20,
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
  // Enhanced Chart Styles
  enhancedChartContainer: {
    borderRadius: 20,
    marginHorizontal: 20,
    marginTop: 24,
    padding: 20,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  enhancedChartTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 32,
  },
  legendDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  legendLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  chartArea: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 200,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  barGroup: {
    flex: 1,
    alignItems: 'center',
    maxWidth: 60,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 140,
    marginBottom: 8,
  },
  barWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  bar: {
    width: 14,
    minHeight: 8,
    borderRadius: 7,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  monthLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  valuesContainer: {
    alignItems: 'center',
    gap: 2,
  },
  valueText: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
});
