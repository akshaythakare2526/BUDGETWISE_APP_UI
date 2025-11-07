import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { APP_CONFIG } from '../core/config/constants';
import { expenseAPI, depositAPI } from '../data/services/api';
import { TokenManager } from '../data/TokenManager';

// Types for offline operations
export interface OfflineTransaction {
  id: string;
  type: 'expense' | 'deposit';
  operation: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  synced: boolean;
  retry_count: number;
}

export interface OfflineData {
  expenses: any[];
  deposits: any[];
  lastSync: number;
  pendingOperations: OfflineTransaction[];
}

export class OfflineManager {
  private static instance: OfflineManager;
  private isOnline: boolean = false;
  private syncInProgress: boolean = false;
  private listeners: Array<(isOnline: boolean) => void> = [];
  private syncListeners: Array<(progress: SyncProgress) => void> = [];

  // Storage keys for offline data
  private static readonly OFFLINE_DATA_KEY = '@budgetwise_offline_data';
  private static readonly PENDING_OPERATIONS_KEY = '@budgetwise_pending_operations';
  private static readonly LAST_SYNC_KEY = '@budgetwise_last_sync';
  private static readonly CATEGORIES_KEY = '@budgetwise_categories';
  private static readonly ANALYTICS_KEY = '@budgetwise_analytics';

  private constructor() {
    this.initializeNetworkListener();
  }

  static getInstance(): OfflineManager {
    if (!OfflineManager.instance) {
      OfflineManager.instance = new OfflineManager();
    }
    return OfflineManager.instance;
  }

  // Network connectivity management
  private initializeNetworkListener() {
    NetInfo.addEventListener((state: NetInfoState) => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected ?? false;
      
      console.log(`🌐 Network status changed: ${this.isOnline ? 'ONLINE' : 'OFFLINE'}`);
      
      // Notify listeners
      this.listeners.forEach(listener => listener(this.isOnline));
      
      // Auto-sync when coming back online
      if (!wasOnline && this.isOnline) {
        console.log('🔄 Auto-syncing after reconnection...');
        this.syncWithServer();
      }
    });
  }

  // Subscribe to network status changes
  onNetworkStatusChange(listener: (isOnline: boolean) => void) {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Subscribe to sync progress
  onSyncProgress(listener: (progress: SyncProgress) => void) {
    this.syncListeners.push(listener);
    
    return () => {
      this.syncListeners = this.syncListeners.filter(l => l !== listener);
    };
  }

  // Get current network status
  getNetworkStatus(): boolean {
    return this.isOnline;
  }

  // Check if sync is in progress
  isSyncing(): boolean {
    return this.syncInProgress;
  }

  // ============ OFFLINE DATA MANAGEMENT ============

  // Save data to offline storage
  async saveOfflineData(expenses: any[], deposits: any[]): Promise<void> {
    try {
      const offlineData: OfflineData = {
        expenses,
        deposits,
        lastSync: Date.now(),
        pendingOperations: await this.getPendingOperations()
      };

      await AsyncStorage.setItem(OfflineManager.OFFLINE_DATA_KEY, JSON.stringify(offlineData));
      await AsyncStorage.setItem(OfflineManager.LAST_SYNC_KEY, Date.now().toString());
      
      console.log('✅ Offline data saved:', {
        expenses: expenses.length,
        deposits: deposits.length
      });
    } catch (error) {
      console.error('❌ Error saving offline data:', error);
    }
  }

  // Load data from offline storage
  async loadOfflineData(): Promise<OfflineData | null> {
    try {
      const data = await AsyncStorage.getItem(OfflineManager.OFFLINE_DATA_KEY);
      if (data) {
        const offlineData: OfflineData = JSON.parse(data);
        console.log('📱 Loaded offline data:', {
          expenses: offlineData.expenses?.length || 0,
          deposits: offlineData.deposits?.length || 0,
          pendingOperations: offlineData.pendingOperations?.length || 0
        });
        return offlineData;
      }
      return null;
    } catch (error) {
      console.error('❌ Error loading offline data:', error);
      return null;
    }
  }

  // ============ PENDING OPERATIONS MANAGEMENT ============

  // Add pending operation
  async addPendingOperation(
    type: 'expense' | 'deposit',
    operation: 'create' | 'update' | 'delete',
    data: any
  ): Promise<string> {
    try {
      const operationId = `${type}_${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const pendingOperation: OfflineTransaction = {
        id: operationId,
        type,
        operation,
        data,
        timestamp: Date.now(),
        synced: false,
        retry_count: 0
      };

      const existingOperations = await this.getPendingOperations();
      existingOperations.push(pendingOperation);
      
      await AsyncStorage.setItem(
        OfflineManager.PENDING_OPERATIONS_KEY,
        JSON.stringify(existingOperations)
      );

      console.log('📝 Added pending operation:', {
        id: operationId,
        type,
        operation
      });

      return operationId;
    } catch (error) {
      console.error('❌ Error adding pending operation:', error);
      throw error;
    }
  }

  // Get pending operations
  async getPendingOperations(): Promise<OfflineTransaction[]> {
    try {
      const data = await AsyncStorage.getItem(OfflineManager.PENDING_OPERATIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('❌ Error getting pending operations:', error);
      return [];
    }
  }

  // Remove synced operation
  async removePendingOperation(operationId: string): Promise<void> {
    try {
      const operations = await this.getPendingOperations();
      const updatedOperations = operations.filter(op => op.id !== operationId);
      
      await AsyncStorage.setItem(
        OfflineManager.PENDING_OPERATIONS_KEY,
        JSON.stringify(updatedOperations)
      );
      
      console.log('✅ Removed synced operation:', operationId);
    } catch (error) {
      console.error('❌ Error removing pending operation:', error);
    }
  }

  // ============ SYNC FUNCTIONALITY ============

  // Main sync function
  async syncWithServer(): Promise<SyncResult> {
    if (this.syncInProgress) {
      console.log('⏳ Sync already in progress');
      return { success: false, message: 'Sync already in progress' };
    }

    if (!this.isOnline) {
      console.log('📴 Cannot sync - device is offline');
      return { success: false, message: 'Device is offline' };
    }

    // Check for authentication token first
    const token = await TokenManager.getCurrentToken();
    if (!token) {
      console.log('⚠️ No authentication token available for sync');
      return { success: false, message: 'No authentication token available' };
    }

    this.syncInProgress = true;
    console.log('🔄 Starting sync with server...');

    try {
      const pendingOperations = await this.getPendingOperations();
      const syncProgress: SyncProgress = {
        total: pendingOperations.length,
        completed: 0,
        failed: 0,
        message: 'Starting sync...'
      };

      this.notifySyncProgress(syncProgress);

      // Process pending operations
      let completedCount = 0;
      let failedCount = 0;

      for (const operation of pendingOperations) {
        try {
          syncProgress.message = `Syncing ${operation.type} ${operation.operation}...`;
          this.notifySyncProgress(syncProgress);

          await this.processPendingOperation(operation, token);
          await this.removePendingOperation(operation.id);
          completedCount++;
          
          syncProgress.completed = completedCount;
          this.notifySyncProgress(syncProgress);
          
        } catch (error) {
          console.error(`❌ Failed to sync operation ${operation.id}:`, error);
          failedCount++;
          syncProgress.failed = failedCount;
          
          // Increment retry count
          operation.retry_count++;
          if (operation.retry_count >= 3) {
            console.log(`⚠️ Max retries reached for operation ${operation.id}, removing`);
            await this.removePendingOperation(operation.id);
          }
        }
      }

      // Fetch latest data from server and update offline cache
      syncProgress.message = 'Fetching latest data...';
      this.notifySyncProgress(syncProgress);

      const [expensesResponse, depositsResponse] = await Promise.all([
        expenseAPI.getAllRelatedExpenseRecords(token),
        depositAPI.getAllRelatedDeposits(token)
      ]);

      const expenses = expensesResponse?.$values || expensesResponse || [];
      const deposits = depositsResponse?.$values || depositsResponse || [];

      await this.saveOfflineData(expenses, deposits);

      syncProgress.message = 'Sync completed successfully';
      this.notifySyncProgress(syncProgress);

      console.log('✅ Sync completed successfully:', {
        completed: completedCount,
        failed: failedCount,
        refreshedData: { expenses: expenses.length, deposits: deposits.length }
      });

      return {
        success: true,
        message: `Sync completed. ${completedCount} operations synced, ${failedCount} failed.`
      };

    } catch (error) {
      console.error('❌ Sync failed:', error);
      return {
        success: false,
        message: `Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    } finally {
      this.syncInProgress = false;
    }
  }

  // Process individual pending operation
  private async processPendingOperation(
    operation: OfflineTransaction,
    token: string
  ): Promise<void> {
    const { type, operation: op, data } = operation;

    switch (type) {
      case 'expense':
        switch (op) {
          case 'create':
            await expenseAPI.addExpenseRecord(data, token);
            break;
          case 'update':
            await expenseAPI.updateExpense(data.id, data, token);
            break;
          case 'delete':
            await expenseAPI.deleteExpense(data.id, token);
            break;
        }
        break;

      case 'deposit':
        switch (op) {
          case 'create':
            await depositAPI.addDeposit(data, token);
            break;
          case 'update':
            await depositAPI.updateDeposit(data.id, data, token);
            break;
          case 'delete':
            await depositAPI.deleteDeposit(data.id, token);
            break;
        }
        break;
    }
  }

  // Notify sync progress listeners
  private notifySyncProgress(progress: SyncProgress) {
    this.syncListeners.forEach(listener => listener(progress));
  }

  // ============ DATA OPERATIONS (OFFLINE-FIRST) ============

  // Create expense (offline-first)
  async createExpense(expenseData: any): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      // Generate temporary ID for offline usage
      const tempId = `temp_expense_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const enhancedData = {
        ...expenseData,
        tempId,
        createdAt: new Date().toISOString(),
        isOffline: !this.isOnline
      };

      if (this.isOnline) {
        try {
          // Try to create online first
          const token = await TokenManager.getCurrentToken();
          if (token) {
            const response = await expenseAPI.addExpenseRecord(enhancedData, token);
            console.log('✅ Expense created online:', response);
            return { success: true, id: response.id || tempId };
          }
        } catch (error) {
          console.log('⚠️ Online creation failed, falling back to offline mode');
        }
      }

      // Add to pending operations for sync
      await this.addPendingOperation('expense', 'create', enhancedData);
      
      // Update offline cache
      const offlineData = await this.loadOfflineData();
      if (offlineData) {
        offlineData.expenses.unshift(enhancedData);
        await this.saveOfflineData(offlineData.expenses, offlineData.deposits);
      }

      console.log('📱 Expense saved offline:', tempId);
      return { success: true, id: tempId };

    } catch (error) {
      console.error('❌ Error creating expense:', error);
      return { success: false, error: 'Failed to create expense' };
    }
  }

  // Create deposit (offline-first)
  async createDeposit(depositData: any): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const tempId = `temp_deposit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const enhancedData = {
        ...depositData,
        tempId,
        createdAt: new Date().toISOString(),
        isOffline: !this.isOnline
      };

      if (this.isOnline) {
        try {
          const token = await TokenManager.getCurrentToken();
          if (token) {
            const response = await depositAPI.addDeposit(enhancedData, token);
            console.log('✅ Deposit created online:', response);
            return { success: true, id: response.id || tempId };
          }
        } catch (error) {
          console.log('⚠️ Online creation failed, falling back to offline mode');
        }
      }

      await this.addPendingOperation('deposit', 'create', enhancedData);
      
      const offlineData = await this.loadOfflineData();
      if (offlineData) {
        offlineData.deposits.unshift(enhancedData);
        await this.saveOfflineData(offlineData.expenses, offlineData.deposits);
      }

      console.log('📱 Deposit saved offline:', tempId);
      return { success: true, id: tempId };

    } catch (error) {
      console.error('❌ Error creating deposit:', error);
      return { success: false, error: 'Failed to create deposit' };
    }
  }

  // Update transaction (offline-first)
  async updateTransaction(
    type: 'expense' | 'deposit',
    id: string | number,
    updateData: any
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const enhancedData = {
        ...updateData,
        id,
        updatedAt: new Date().toISOString(),
        isOffline: !this.isOnline
      };

      if (this.isOnline && typeof id === 'number') {
        try {
          const token = await TokenManager.getCurrentToken();
          if (token) {
            if (type === 'expense') {
              await expenseAPI.updateExpense(id, enhancedData, token);
            } else {
              await depositAPI.updateDeposit(id, enhancedData, token);
            }
            console.log(`✅ ${type} updated online:`, id);
            return { success: true };
          }
        } catch (error) {
          console.log('⚠️ Online update failed, falling back to offline mode');
        }
      }

      // Add to pending operations
      await this.addPendingOperation(type, 'update', enhancedData);
      
      // Update offline cache
      const offlineData = await this.loadOfflineData();
      if (offlineData) {
        const dataArray = type === 'expense' ? offlineData.expenses : offlineData.deposits;
        const index = dataArray.findIndex((item: any) => 
          item.id === id || item.tempId === id
        );
        
        if (index !== -1) {
          dataArray[index] = { ...dataArray[index], ...enhancedData };
          await this.saveOfflineData(offlineData.expenses, offlineData.deposits);
        }
      }

      console.log(`📱 ${type} updated offline:`, id);
      return { success: true };

    } catch (error) {
      console.error(`❌ Error updating ${type}:`, error);
      return { success: false, error: `Failed to update ${type}` };
    }
  }

  // Delete transaction (offline-first)
  async deleteTransaction(
    type: 'expense' | 'deposit',
    id: string | number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (this.isOnline && typeof id === 'number') {
        try {
          const token = await TokenManager.getCurrentToken();
          if (token) {
            if (type === 'expense') {
              await expenseAPI.deleteExpense(id, token);
            } else {
              await depositAPI.deleteDeposit(id, token);
            }
            console.log(`✅ ${type} deleted online:`, id);
            return { success: true };
          }
        } catch (error) {
          console.log('⚠️ Online deletion failed, falling back to offline mode');
        }
      }

      // Add to pending operations
      await this.addPendingOperation(type, 'delete', { id });
      
      // Mark as deleted in offline cache
      const offlineData = await this.loadOfflineData();
      if (offlineData) {
        const dataArray = type === 'expense' ? offlineData.expenses : offlineData.deposits;
        const index = dataArray.findIndex((item: any) => 
          item.id === id || item.tempId === id
        );
        
        if (index !== -1) {
          // Mark as deleted instead of removing (for sync purposes)
          dataArray[index] = { ...dataArray[index], deleted: true, deletedAt: new Date().toISOString() };
          await this.saveOfflineData(offlineData.expenses, offlineData.deposits);
        }
      }

      console.log(`📱 ${type} marked for deletion offline:`, id);
      return { success: true };

    } catch (error) {
      console.error(`❌ Error deleting ${type}:`, error);
      return { success: false, error: `Failed to delete ${type}` };
    }
  }

  // Get all transactions (from offline cache or server)
  async getAllTransactions(): Promise<{ expenses: any[]; deposits: any[] }> {
    try {
      if (this.isOnline) {
        try {
          const token = await TokenManager.getCurrentToken();
          if (token) {
            console.log('🔄 Fetching transactions using online API...');
            const [expensesResponse, depositsResponse] = await Promise.all([
              expenseAPI.getAllRelatedExpenseRecords(token),
              depositAPI.getAllRelatedDeposits(token)
            ]);

            const expenses = expensesResponse?.$values || expensesResponse || [];
            const deposits = depositsResponse?.$values || depositsResponse || [];

            // Merge with offline data and save
            const offlineData = await this.loadOfflineData();
            const mergedExpenses = this.mergeOnlineOfflineData(expenses, offlineData?.expenses || []);
            const mergedDeposits = this.mergeOnlineOfflineData(deposits, offlineData?.deposits || []);

            await this.saveOfflineData(mergedExpenses, mergedDeposits);

            return { 
              expenses: mergedExpenses.filter(e => !e.deleted), 
              deposits: mergedDeposits.filter(d => !d.deleted) 
            };
          } else {
            console.log('⚠️ No authentication token available, using offline data only');
          }
        } catch (error) {
          console.log('⚠️ Online fetch failed, using offline data:', error);
        }
      }

      // Use offline data
      console.log('🔄 Fetching transactions using offline manager...');
      const offlineData = await this.loadOfflineData();
      return {
        expenses: (offlineData?.expenses || []).filter(e => !e.deleted),
        deposits: (offlineData?.deposits || []).filter(d => !d.deleted)
      };

    } catch (error) {
      console.error('❌ Error getting transactions:', error);
      return { expenses: [], deposits: [] };
    }
  }

  // Merge online and offline data intelligently
  private mergeOnlineOfflineData(onlineData: any[], offlineData: any[]): any[] {
    const merged = [...onlineData];
    
    // Add offline-only items (items with tempId)
    offlineData.forEach(offlineItem => {
      if (offlineItem.tempId && !merged.find(item => item.id === offlineItem.id)) {
        merged.push(offlineItem);
      }
    });

    return merged;
  }

  // Clear all offline data
  async clearOfflineData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        OfflineManager.OFFLINE_DATA_KEY,
        OfflineManager.PENDING_OPERATIONS_KEY,
        OfflineManager.LAST_SYNC_KEY
      ]);
      console.log('🧹 All offline data cleared');
    } catch (error) {
      console.error('❌ Error clearing offline data:', error);
    }
  }

  // Get sync status information
  async getSyncStatus(): Promise<SyncStatus> {
    try {
      const pendingOperations = await this.getPendingOperations();
      const lastSyncStr = await AsyncStorage.getItem(OfflineManager.LAST_SYNC_KEY);
      const lastSync = lastSyncStr ? parseInt(lastSyncStr) : 0;

      return {
        isOnline: this.isOnline,
        isSyncing: this.syncInProgress,
        pendingOperations: pendingOperations.length,
        lastSync: lastSync,
        lastSyncFormatted: lastSync ? new Date(lastSync).toLocaleString() : 'Never'
      };
    } catch (error) {
      console.error('❌ Error getting sync status:', error);
      return {
        isOnline: this.isOnline,
        isSyncing: this.syncInProgress,
        pendingOperations: 0,
        lastSync: 0,
        lastSyncFormatted: 'Error'
      };
    }
  }

  // ============ CATEGORIES MANAGEMENT ============

  // Get categories with offline support
  async getCategories(): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      if (this.isOnline) {
        // Try to fetch from server when online
        try {
          const token = await TokenManager.getCurrentToken();
          if (token) {
            console.log('🏷️ Fetching categories from API...');
            const categoriesData = await expenseAPI.getExpenseCategories(token);
            
            // Handle the API response structure with $values
            let categoryList = [];
            if (categoriesData && categoriesData.$values) {
              categoryList = categoriesData.$values.map((cat: any) => ({
                id: cat.expenseCategoryID,
                name: cat.expenseCategoryName
              }));
            } else if (Array.isArray(categoriesData)) {
              categoryList = categoriesData;
            } else {
              categoryList = categoriesData.data || [];
            }

            // Save to offline storage for future use
            await AsyncStorage.setItem(OfflineManager.CATEGORIES_KEY, JSON.stringify(categoryList));
            console.log('✅ Categories cached offline:', categoryList.length);
            
            return { success: true, data: categoryList };
          }
        } catch (error) {
          console.log('❌ Error fetching categories from API, falling back to offline:', error);
          // Fall through to offline data
        }
      }

      // Use offline data (either when offline or when API fails)
      console.log('📱 Loading categories from offline storage...');
      const cachedCategories = await AsyncStorage.getItem(OfflineManager.CATEGORIES_KEY);
      
      if (cachedCategories) {
        const categoryList = JSON.parse(cachedCategories);
        console.log('✅ Categories loaded from offline storage:', categoryList.length);
        return { success: true, data: categoryList };
      }

      // Fallback to hardcoded categories if no cached data
      const fallbackCategories = [
        { id: 1, name: 'Food' },
        { id: 2, name: 'Hospital' },
        { id: 3, name: 'Investment' },
        { id: 4, name: 'Rent' },
        { id: 5, name: 'Bill' },
        { id: 6, name: 'Education' },
        { id: 7, name: 'Transport' },
        { id: 8, name: 'Entertainment' },
        { id: 9, name: 'Utilities' },
        { id: 10, name: 'Grocery' },
        { id: 11, name: 'Travel' },
        { id: 12, name: 'Insurance' },
        { id: 13, name: 'Shopping' },
        { id: 14, name: 'Loan' },
        { id: 15, name: 'Miscellaneous' },
        { id: 16, name: 'creditCardBill' },
      ];

      // Save fallback categories for future offline use
      await AsyncStorage.setItem(OfflineManager.CATEGORIES_KEY, JSON.stringify(fallbackCategories));
      console.log('💾 Using fallback categories and caching them offline');
      
      return { success: true, data: fallbackCategories };

    } catch (error) {
      console.error('❌ Error getting categories:', error);
      return { success: false, error: 'Failed to load categories' };
    }
  }

  // ============ ANALYTICS DATA MANAGEMENT ============

  // Get analytics data with offline support
  async getAnalyticsData(): Promise<{ success: boolean; expenses?: any[]; deposits?: any[]; error?: string }> {
    try {
      if (this.isOnline) {
        // Try to fetch from server when online
        try {
          const token = await TokenManager.getCurrentToken();
          if (token) {
            console.log('📊 Fetching analytics data from API...');
            const [expensesResponse, depositsResponse] = await Promise.all([
              expenseAPI.getAllRelatedExpenseRecords(token),
              depositAPI.getAllRelatedDeposits(token)
            ]);

            // Handle expenses data
            let expensesList = [];
            if (expensesResponse && expensesResponse.$values) {
              expensesList = expensesResponse.$values;
            } else if (Array.isArray(expensesResponse)) {
              expensesList = expensesResponse;
            }

            // Handle deposits data
            let depositsList = [];
            if (depositsResponse && depositsResponse.$values) {
              depositsList = depositsResponse.$values;
            } else if (Array.isArray(depositsResponse)) {
              depositsList = depositsResponse;
            }

            // Save to offline storage for future use
            const analyticsData = { expenses: expensesList, deposits: depositsList, timestamp: Date.now() };
            await AsyncStorage.setItem(OfflineManager.ANALYTICS_KEY, JSON.stringify(analyticsData));
            console.log('✅ Analytics data cached offline');
            
            return { success: true, expenses: expensesList, deposits: depositsList };
          } else {
            console.log('⚠️ No authentication token available for analytics, using offline data');
          }
        } catch (error) {
          console.log('❌ Error fetching analytics from API, falling back to offline:', error);
          // Fall through to offline data
        }
      }

      // Use offline data (either when offline or when API fails)
      console.log('📱 Loading analytics data from offline storage...');
      const cachedAnalytics = await AsyncStorage.getItem(OfflineManager.ANALYTICS_KEY);
      
      if (cachedAnalytics) {
        const analyticsData = JSON.parse(cachedAnalytics);
        console.log('✅ Analytics data loaded from offline storage');
        return { 
          success: true, 
          expenses: analyticsData.expenses || [], 
          deposits: analyticsData.deposits || [] 
        };
      }

      // If no cached data, use the regular offline transaction data
      const offlineData = await this.getAllTransactions();
      console.log('📊 Using offline transaction data for analytics');
      
      return { 
        success: true, 
        expenses: offlineData.expenses || [], 
        deposits: offlineData.deposits || [] 
      };

    } catch (error) {
      console.error('❌ Error getting analytics data:', error);
      return { success: false, error: 'Failed to load analytics data' };
    }
  }

  // Clear cached analytics data (useful for refresh)
  async clearAnalyticsCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(OfflineManager.ANALYTICS_KEY);
      console.log('🗑️ Analytics cache cleared');
    } catch (error) {
      console.error('❌ Error clearing analytics cache:', error);
    }
  }

  // Clear cached categories (useful for refresh)
  async clearCategoriesCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(OfflineManager.CATEGORIES_KEY);
      console.log('🗑️ Categories cache cleared');
    } catch (error) {
      console.error('❌ Error clearing categories cache:', error);
    }
  }
}

// Type definitions
export interface SyncResult {
  success: boolean;
  message: string;
}

export interface SyncProgress {
  total: number;
  completed: number;
  failed: number;
  message: string;
}

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingOperations: number;
  lastSync: number;
  lastSyncFormatted: string;
}

// Export singleton instance
export const offlineManager = OfflineManager.getInstance();
