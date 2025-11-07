// API Configuration
export const API_CONFIG = {
  // Your server is running on:
  // HTTP: http://0.0.0.0:5091 
  // HTTPS: https://0.0.0.0:7090
  
  // FORCE PRODUCTION API FOR DEVELOPMENT TESTING
  BASE_URL: 'https://budgetwiseapi-001-site1.rtempurl.com', // Always use production API
  
  // Uncomment below to use local development server:
  // BASE_URL: __DEV__ 
  //   ? getDevBaseUrl()  // Dynamic URL based on platform/device
  //   : 'https://budgetwiseapi-001-site1.rtempurl.com', // Production URL
  
  TIMEOUT: 30000, // 30 seconds (increased for better network handling)
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

// Helper function to determine the correct API URL for development
function getDevBaseUrl(): string {
  const Platform = require('react-native').Platform;
  
  // Check if running on Android emulator by checking device brand
  const isAndroidEmulator = Platform.OS === 'android' && 
    (Platform.constants as any)?.Brand === 'generic';
  
  let baseIP: string;
  
  if (isAndroidEmulator) {
    // Android Emulator: 10.0.2.2 maps to localhost on the host machine
    baseIP = '10.0.2.2';
  } else if (Platform.OS === 'ios') {
    // For iOS Simulator: localhost works directly
    baseIP = 'localhost';
  } else {
    // For Physical Device: use your computer's IP address
    // Android/iOS physical devices cannot access localhost - need your computer's IP
    baseIP = '192.168.0.112'; // Your computer's actual IP address
  }
  
  return `http://${baseIP}:5091`;
}

// API Endpoints - Updated to match your actual backend
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/Auth/login',
    REGISTER: '/api/User/AddUser',
    LOGOUT: '/api/Auth/logout',
    REFRESH: '/api/Auth/refresh',
    SWITCH_TO_GROUP: '/api/auth/switchTogroup',
    SEND_EMAIL_VERIFICATION: '/api/Auth/send-email-verification',
    VERIFY_EMAIL: '/api/Auth/verify-email',
    SEND_PASSWORD_RESET: '/api/Auth/send-password-reset',
    RESET_PASSWORD: '/api/Auth/reset-password',
    CHANGE_PASSWORD: '/api/Auth/change-password',
  },
  USER: {
    ADD_USER: '/api/User/AddUser',        // Your existing User endpoint
    PROFILE: '/api/User/profile',
    UPDATE: '/api/User/update',
    UPDATE_USER: '/api/User/UpdateUser',  // Updated to match User controller (capital U)
    UPDATE_USER_ALT: '/api/User/Update',  // Alternative endpoint structure
    ME: '/api/user/me',                   // New endpoint for user details with groups
    UPDATE_USER_GROUPS: '/api/user/UpdateUserGroups', // Endpoint for adding user to group
    REMOVE_USER_GROUP: '/api/user/RemoveUserGroup', // Endpoint for removing user from group
  },
  GROUP: {
    ADD_GROUP: '/api/Group/AddGroup',     // Endpoint for creating new group
    GET_GROUP_USER_COUNT: '/api/Group/GetGroupUserCount', // Endpoint for getting group user count
  },
  EXPENSE: {
    ADD_EXPENSE_RECORD: '/api/ExpenseRecords/AddExpenseRecord',  // Endpoint for adding expense records
    GET_CATEGORIES: '/api/ExpenseCategory/',  // Endpoint for fetching expense categories
    GET_ALL_EXPENSE_RECORDS: '/api/ExpenseRecords/GetAllExpenseRecord',  // Endpoint for fetching all expense records
    GET_ALL_RELATED_EXPENSE_RECORDS: '/api/ExpenseRecords/GetAllRelatedExpenseRecord', // Context-aware endpoint (personal/group)
    UPDATE_EXPENSE_RECORD: '/api/ExpenseRecords/UpdateexpenseRecord',  // Endpoint for updating expense records (POST method)
    DELETE_EXPENSE_RECORD: '/api/ExpenseRecords/DeleteExpenseRecord',  // Endpoint for deleting expense records (DELETE method)
  },
  DEPOSIT: {
    ADD_DEPOSIT: '/api/Deposit/AddDeposit',           // Endpoint for adding deposits
    GET_ALL_RELATED_DEPOSITS: '/api/Deposit/GetAllRelatedDeposit',  // Context-aware endpoint for deposits/credits
    UPDATE_DEPOSIT: '/api/Deposit/UpdateDeposit',     // Endpoint for updating deposits
    DELETE_DEPOSIT: '/api/Deposit/DeleteDeposit',     // Endpoint for deleting deposits
  },
};

// Expense categories mapping
export const EXPENSE_CATEGORIES = {
  'Food & Dining': 1,
  'Transportation': 2,
  'Shopping': 3,
  'Entertainment': 4,
  'Bills & Utilities': 5,
  'Healthcare': 6,
  'Education': 7,
  'Travel': 8,
  'Groceries': 9,
  'Gas': 10,
  'Other': 11,
} as const;

// App Configuration
export const APP_CONFIG = {
  STORAGE_KEYS: {
    USER_DATA: '@budgetwise_user',
    AUTH_TOKEN: '@budgetwise_token',
    REFRESH_TOKEN: '@budgetwise_refresh_token',
    USER_GROUPS: '@budgetwise_user_groups',    // New key for storing user groups
    ACTIVE_GROUP: '@budgetwise_active_group',  // New key for storing selected group
    PERSONAL_EXPENSES: '@budgetwise_personal_expenses',   // Key for personal expenses
    GROUP_EXPENSES_PREFIX: '@budgetwise_group_expenses_', // Prefix for group expenses
    APP_SETTINGS: '@budgetwise_app_settings',  // Key for app settings
    CONTEXT_TOKEN: '@budgetwise_context_token', // Key for storing context-aware token (personal/group)
  },
};

// Network test function to verify connection
export const testNetworkConnection = async (): Promise<boolean> => {
  try {
    const testUrl = `${API_CONFIG.BASE_URL}/api/Health`;
    console.log('🔍 Testing connection to:', testUrl);
    
    const response = await fetch(testUrl, {
      method: 'GET',
    });
    
    console.log('✅ Connection test successful, status:', response.status);
    return response.ok;
  } catch (error) {
    console.log('❌ Connection test failed:', error);
    
    // Test basic connectivity only in development
    if (__DEV__) {
      try {
        const basicUrl = getDevBaseUrl();
        console.log('🔍 Testing basic connectivity to:', basicUrl);
        
        const basicResponse = await fetch(basicUrl, {
          method: 'GET',
        });
        
        console.log('✅ Basic connectivity works, server is reachable');
        return true;
      } catch (basicError) {
        console.log('❌ Basic connectivity failed:', basicError);
        return false;
      }
    }
    
    return false;
  }
};
