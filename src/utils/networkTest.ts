import { Platform } from 'react-native';

// Network testing utility
export const NetworkTestUtils = {  // Test if the API server is reachable
  testConnection: async (baseUrl?: string): Promise<boolean> => {
    const baseIP = baseUrl || (
      (Platform.OS === 'android' && (Platform.constants as any)?.Brand === 'generic')
        ? 'http://10.0.2.2:5091'  // Android Emulator
        : Platform.OS === 'ios' 
          ? 'http://localhost:5091'  // iOS Simulator
          : 'http://192.168.0.144:5091'  // Physical Device
    );    // Test different possible endpoints that might exist on your server
    const testEndpoints = [
      `${baseIP}/api/Auth/login`,        // Your working Auth login endpoint
      `${baseIP}/api/Auth/register`,     // New Auth register endpoint
      `${baseIP}/api/User/AddUser`,      // Your existing User endpoint
      `${baseIP}/api/Auth`,              // Auth controller base
      `${baseIP}/api`,                   // Just the API base
      `${baseIP}/`,                      // Root endpoint
    ];

    for (const url of testEndpoints) {
      try {
        console.log(`🔍 Testing connection to: ${url}`);
        
        // Use AbortController for timeout instead of fetch timeout option
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        console.log(`📡 Response from ${url}:`, {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
        });
        
        // For API endpoints, we expect either:
        // - 405 Method Not Allowed (correct endpoint, wrong method)
        // - 200 OK (if endpoint accepts GET)
        // - 400 Bad Request (endpoint exists but needs data)
        if (response.status === 405 || response.status === 200 || response.status === 400) {
          console.log(`✅ Found working endpoint: ${url}`);
          return true;
        }
        
        // 404 means endpoint doesn't exist, continue to next
        if (response.status === 404) {
          console.log(`❌ Endpoint not found: ${url}`);
          continue;
        }
        
      } catch (error: any) {
        console.log(`❌ Connection failed to: ${url}`, {
          name: error.name,
          message: error.message,
          code: error.code,
        });
        
        // If it's a network error (not timeout), all endpoints will likely fail
        if (error.name === 'TypeError' && error.message.includes('Network request failed')) {
          console.log('🚨 Network connection failed - server may be unreachable');
          return false;
        }
      }
    }
    
    console.log('❌ No working endpoints found');
    return false;
  },

  // Get current network info
  getNetworkInfo: () => {
    return {
      platform: Platform.OS,
      isEmulator: (Platform.constants as any)?.Brand === 'generic',
      constants: Platform.constants,
    };
  },
  // Log detailed network debugging info
  logNetworkDebug: () => {
    const info = NetworkTestUtils.getNetworkInfo();
    const Platform = require('react-native').Platform;
    
    let correctUrl = '';
    let deviceType = '';
    
    if (Platform.OS === 'android' && (Platform.constants as any)?.Brand === 'generic') {
      correctUrl = 'http://10.0.2.2:5091/api';
      deviceType = 'Android Emulator';
    } else if (Platform.OS === 'ios') {
      correctUrl = 'http://localhost:5091/api';
      deviceType = 'iOS Simulator';
    } else {
      correctUrl = 'http://192.168.0.144:5091/api';
      deviceType = 'Physical Device';
    }
    
    console.log('📱 Network Debug Info:', {
      platform: info.platform,
      isEmulator: info.isEmulator,
      device_type: deviceType,
      correct_url_for_this_device: correctUrl,
      server_info: {
        runs_on_computer: 'localhost:5091',
        http_port: 5091,
        https_port: 7090,
        binding: '0.0.0.0 (accepts all connections)',
      },
      note: 'Physical devices cannot access localhost directly - use computer IP address'
    });
  }
};
