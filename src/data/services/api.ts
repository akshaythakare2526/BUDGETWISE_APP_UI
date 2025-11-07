import axios, { AxiosInstance, AxiosError } from 'axios';
import { API_CONFIG, API_ENDPOINTS } from '../../core/config/constants';
import { User, RegisterRequest, LoginRequest, LoginResponse } from '../../domain/models/User';
import { Platform } from 'react-native';

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: API_CONFIG.HEADERS,
});

// Add request/response interceptors for debugging
apiClient.interceptors.request.use(
  (config) => {
    console.log('🚀 API Request:', {
      method: config.method?.toUpperCase(),
      url: `${config.baseURL}${config.url}`,
      data: config.data,
      platform: Platform.OS,
    });
    return config;
  },  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },(error: AxiosError) => {
    return Promise.reject(error);
  }
);

// User API service
export const userAPI = {
  // Register a new user - Updated to use User controller
  register: async (userData: RegisterRequest): Promise<User> => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, userData);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },  // Login user
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
      return response.data;
    } catch (error) {
      throw error;
    }
  },


  // Send email verification OTP
  sendEmailVerification: async (email: string): Promise<any> => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.SEND_EMAIL_VERIFICATION, { email });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Verify email with OTP
  verifyEmail: async (email: string, otpCode: string): Promise<any> => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.VERIFY_EMAIL, { email, otpCode });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Send password reset OTP
  sendPasswordReset: async (email: string): Promise<any> => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.SEND_PASSWORD_RESET, { email });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Reset password with OTP
  resetPassword: async (email: string, otpCode: string, newPassword: string): Promise<any> => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, { email, otpCode, newPassword });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Change password for authenticated user
  changePassword: async (currentPassword: string, newPassword: string, token: string): Promise<any> => {
    try {
      const response = await apiClient.post(
        API_ENDPOINTS.AUTH.CHANGE_PASSWORD,
        { currentPassword, newPassword },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get user profile (if needed later)
  getProfile: async (token: string): Promise<User> => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.USER.PROFILE, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update user profile (if needed later)
  updateProfile: async (userData: Partial<User>, token: string): Promise<User> => {
    try {
      const response = await apiClient.put(API_ENDPOINTS.USER.UPDATE, userData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update user profile with specific UpdateUser endpoint
  updateUser: async (userId: string, userData: { name: string; email: string; phone: string }, token: string): Promise<any> => {
    const methods = [
      // Method 1: POST with userId in path (try this first as it's most common)
      () => apiClient.post(`${API_ENDPOINTS.USER.UPDATE_USER}/${userId}`, userData, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      // Method 2: POST with userId in body
      () => apiClient.post(API_ENDPOINTS.USER.UPDATE_USER, { ...userData, userId }, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      // Method 3: PUT with userId in path
      () => apiClient.put(`${API_ENDPOINTS.USER.UPDATE_USER}/${userId}`, userData, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      // Method 4: PUT with userId in body
      () => apiClient.put(API_ENDPOINTS.USER.UPDATE_USER, { ...userData, userId }, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      // Method 5: POST with different endpoint pattern
      () => apiClient.post(`/api/User/Update/${userId}`, userData, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      // Method 6: PATCH with userId in path
      () => apiClient.patch(`${API_ENDPOINTS.USER.UPDATE_USER}/${userId}`, userData, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ];

    for (let i = 0; i < methods.length; i++) {
      try {
        console.log(`Trying method ${i + 1} for user update...`);
        const response = await methods[i]();
        console.log(`✅ Method ${i + 1} succeeded!`);
        return response.data;
      } catch (error: any) {
        console.log(`❌ Method ${i + 1} failed with status:`, error.response?.status);
        if ((error.response?.status === 405 || error.response?.status === 404) && i < methods.length - 1) {
          console.log(`Trying next method...`);
          continue;
        }
        // If it's the last method or not a 405/404 error, throw it
        throw error;
      }
    }
  },

  // Logout user
  logout: async (token: string): Promise<any> => {
    try {
      const response = await apiClient.post(
        API_ENDPOINTS.AUTH.LOGOUT,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Switch to group context (get group-specific token)
  switchToGroup: async (groupId: string, currentToken: string): Promise<any> => {
    try {
      const response = await apiClient.post(
        `${API_ENDPOINTS.AUTH.SWITCH_TO_GROUP}/${groupId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Switch back to personal context (use original personal token)
  switchToPersonal: async (): Promise<any> => {
    // This function will restore the original personal token from storage
    // No API call needed, just token management
    return Promise.resolve({ success: true });
  },

  // Get user details with groups
  getUserDetails: async (token: string): Promise<any> => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.USER.ME, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Group API service
export const groupAPI = {
  // Create a new group
  createGroup: async (groupData: any, token: string): Promise<any> => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.GROUP.ADD_GROUP, groupData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Add user to group (used for joining existing groups)
  addUserToGroup: async (groupData: any, token: string): Promise<any> => {
    try {
      const response = await apiClient.post(`${API_ENDPOINTS.USER.UPDATE_USER_GROUPS}`, groupData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Remove user from group
  removeUserFromGroup: async (userId: string, groupId: string, token: string): Promise<any> => {
    try {
      const response = await apiClient.post(`${API_ENDPOINTS.USER.REMOVE_USER_GROUP}/${userId}/${groupId}`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get group user count
  getGroupUserCount: async (groupId: string, token: string): Promise<any> => {
    try {
      const response = await apiClient.get(`${API_ENDPOINTS.GROUP.GET_GROUP_USER_COUNT}/${groupId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Expense API service
export const expenseAPI = {
  // Get expense categories
  getExpenseCategories: async (token: string): Promise<any> => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.EXPENSE.GET_CATEGORIES, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get all expense records
  getAllExpenseRecords: async (token: string): Promise<any> => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.EXPENSE.GET_ALL_EXPENSE_RECORDS, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Add expense record
  addExpenseRecord: async (expenseData: any, token: string): Promise<any> => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.EXPENSE.ADD_EXPENSE_RECORD, expenseData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get all expense records (context-aware: personal or group)
  getAllRelatedExpenseRecords: async (token: string): Promise<any> => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.EXPENSE.GET_ALL_RELATED_EXPENSE_RECORDS, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update expense record - Using POST method to match controller pattern
  updateExpense: async (expenseId: number, expenseData: any, token: string): Promise<any> => {
    try {
      console.log(`🔄 Updating expense ${expenseId} with data:`, expenseData);
      const response = await apiClient.post(`${API_ENDPOINTS.EXPENSE.UPDATE_EXPENSE_RECORD}/${expenseId}`, expenseData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(`✅ Successfully updated expense ${expenseId}`);
      return response.data;
    } catch (error: any) {
      console.error(`❌ Failed to update expense ${expenseId}:`, error?.response?.data || error?.message);
      throw error;
    }
  },

  // Delete expense record
  deleteExpense: async (expenseId: number, token: string): Promise<any> => {
    try {
      console.log(`🗑️ Deleting expense ${expenseId}`);
      const response = await apiClient.delete(`${API_ENDPOINTS.EXPENSE.DELETE_EXPENSE_RECORD}/${expenseId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(`✅ Successfully deleted expense ${expenseId}`);
      return response.data;
    } catch (error: any) {
      console.error(`❌ Failed to delete expense ${expenseId}:`, error?.response?.data || error?.message);
      throw error;
    }
  },
};

// Deposit API service
export const depositAPI = {
  // Add a new deposit
  addDeposit: async (depositData: { amount: number; description: string; tittle: string }, token: string): Promise<any> => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.DEPOSIT.ADD_DEPOSIT, depositData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get all related deposits (context-aware: personal or group)
  getAllRelatedDeposits: async (token: string): Promise<any> => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.DEPOSIT.GET_ALL_RELATED_DEPOSITS, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update deposit - Using POST method to match DepositController pattern
  updateDeposit: async (depositId: number, depositData: any, token: string): Promise<any> => {
    try {
      console.log(`🔄 Updating deposit ${depositId} with data:`, depositData);
      const response = await apiClient.post(`${API_ENDPOINTS.DEPOSIT.UPDATE_DEPOSIT}/${depositId}`, depositData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(`✅ Successfully updated deposit ${depositId}`);
      return response.data;
    } catch (error: any) {
      console.error(`❌ Failed to update deposit ${depositId}:`, error?.response?.data || error?.message);
      throw error;
    }
  },

  // Delete deposit
  deleteDeposit: async (depositId: number, token: string): Promise<any> => {
    try {
      console.log(`🗑️ Deleting deposit ${depositId}`);
      const response = await apiClient.delete(`${API_ENDPOINTS.DEPOSIT.DELETE_DEPOSIT}/${depositId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(`✅ Successfully deleted deposit ${depositId}`);
      return response.data;
    } catch (error: any) {
      console.error(`❌ Failed to delete deposit ${depositId}:`, error?.response?.data || error?.message);
      throw error;
    }
  },
};

// Export the axios instance for more advanced usage if needed
export { apiClient };
