import { offlineManager } from '../services/OfflineManager';

// Simple test script to demonstrate offline functionality
export async function testOfflineFeatures() {
  console.log('🧪 Testing Offline Features...\n');

  // 1. Test network status
  console.log('1. Network Status:', offlineManager.getNetworkStatus() ? 'ONLINE' : 'OFFLINE');

  // 2. Test creating an expense offline
  console.log('\n2. Creating test expense...');
  const expenseResult = await offlineManager.createExpense({
    amount: 25.50,
    description: 'Test expense for lunch',
    expenseCategoryID: 1,
    Tittle: 'Lunch Expense'
  });
  console.log('Expense creation result:', expenseResult);

  // 3. Test creating a deposit offline
  console.log('\n3. Creating test deposit...');
  const depositResult = await offlineManager.createDeposit({
    amount: 100.00,
    description: 'Test deposit from salary',
    tittle: 'Salary Deposit'
  });
  console.log('Deposit creation result:', depositResult);

  // 4. Test getting sync status
  console.log('\n4. Getting sync status...');
  const syncStatus = await offlineManager.getSyncStatus();
  console.log('Sync Status:', syncStatus);

  // 5. Test getting all transactions
  console.log('\n5. Getting all transactions...');
  const transactions = await offlineManager.getAllTransactions();
  console.log('Transactions loaded:', {
    expenses: transactions.expenses.length,
    deposits: transactions.deposits.length
  });

  // 6. Test sync (if online)
  if (offlineManager.getNetworkStatus()) {
    console.log('\n6. Testing sync...');
    const syncResult = await offlineManager.syncWithServer();
    console.log('Sync result:', syncResult);
  } else {
    console.log('\n6. Device is offline, skipping sync test');
  }

  console.log('\n✅ Offline feature testing completed!');
  return {
    expenseResult,
    depositResult,
    syncStatus,
    transactions
  };
}

// Export for use in components
export { offlineManager };
