import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Keys for secure storage
const KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  BIOMETRIC_ENABLED: 'biometric_enabled',
  PIN_HASH: 'pin_hash',
} as const;

// Secure storage options
const STORAGE_OPTIONS: SecureStore.SecureStoreOptions = {
  requireAuthentication: false, // Set to true for biometric protection
  authenticationPrompt: 'Authenticate to access your account',
  keychainService: 'handshakeme_keychain',
};

class SecureStorageService {
  // Token management
  async storeTokens(accessToken: string, refreshToken: string): Promise<void> {
    try {
      await Promise.all([
        SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, accessToken, STORAGE_OPTIONS),
        SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, refreshToken, STORAGE_OPTIONS),
      ]);
    } catch (error) {
      console.error('Failed to store tokens:', error);
      throw new Error('Failed to store authentication tokens');
    }
  }

  async getAccessToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(KEYS.ACCESS_TOKEN, STORAGE_OPTIONS);
    } catch (error) {
      console.error('Failed to get access token:', error);
      return null;
    }
  }

  async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(KEYS.REFRESH_TOKEN, STORAGE_OPTIONS);
    } catch (error) {
      console.error('Failed to get refresh token:', error);
      return null;
    }
  }

  async updateAccessToken(accessToken: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, accessToken, STORAGE_OPTIONS);
    } catch (error) {
      console.error('Failed to update access token:', error);
      throw new Error('Failed to update access token');
    }
  }

  async clearTokens(): Promise<void> {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(KEYS.ACCESS_TOKEN, STORAGE_OPTIONS),
        SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN, STORAGE_OPTIONS),
      ]);
    } catch (error) {
      console.error('Failed to clear tokens:', error);
      // Don't throw error here as we want to clear tokens even if there's an issue
    }
  }

  // User data management
  async storeUserData(userData: any): Promise<void> {
    try {
      await SecureStore.setItemAsync(
        KEYS.USER_DATA, 
        JSON.stringify(userData), 
        STORAGE_OPTIONS
      );
    } catch (error) {
      console.error('Failed to store user data:', error);
      throw new Error('Failed to store user data');
    }
  }

  async getUserData(): Promise<any | null> {
    try {
      const userData = await SecureStore.getItemAsync(KEYS.USER_DATA, STORAGE_OPTIONS);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Failed to get user data:', error);
      return null;
    }
  }

  async clearUserData(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(KEYS.USER_DATA, STORAGE_OPTIONS);
    } catch (error) {
      console.error('Failed to clear user data:', error);
    }
  }

  // Biometric authentication
  async isBiometricEnabled(): Promise<boolean> {
    try {
      const enabled = await SecureStore.getItemAsync(KEYS.BIOMETRIC_ENABLED, STORAGE_OPTIONS);
      return enabled === 'true';
    } catch (error) {
      console.error('Failed to check biometric status:', error);
      return false;
    }
  }

  async setBiometricEnabled(enabled: boolean): Promise<void> {
    try {
      await SecureStore.setItemAsync(
        KEYS.BIOMETRIC_ENABLED, 
        enabled.toString(), 
        STORAGE_OPTIONS
      );
    } catch (error) {
      console.error('Failed to set biometric status:', error);
      throw new Error('Failed to update biometric settings');
    }
  }

  // PIN management
  async storePinHash(pinHash: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(KEYS.PIN_HASH, pinHash, {
        ...STORAGE_OPTIONS,
        requireAuthentication: true, // Always require authentication for PIN
      });
    } catch (error) {
      console.error('Failed to store PIN hash:', error);
      throw new Error('Failed to store PIN');
    }
  }

  async getPinHash(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(KEYS.PIN_HASH, {
        ...STORAGE_OPTIONS,
        requireAuthentication: true,
      });
    } catch (error) {
      console.error('Failed to get PIN hash:', error);
      return null;
    }
  }

  async clearPin(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(KEYS.PIN_HASH, STORAGE_OPTIONS);
    } catch (error) {
      console.error('Failed to clear PIN:', error);
    }
  }

  // Utility methods
  async isAvailable(): Promise<boolean> {
    try {
      return await SecureStore.isAvailableAsync();
    } catch (error) {
      console.error('Failed to check SecureStore availability:', error);
      return false;
    }
  }

  async clearAll(): Promise<void> {
    try {
      await Promise.all([
        this.clearTokens(),
        this.clearUserData(),
        this.clearPin(),
        SecureStore.deleteItemAsync(KEYS.BIOMETRIC_ENABLED, STORAGE_OPTIONS),
      ]);
    } catch (error) {
      console.error('Failed to clear all secure storage:', error);
    }
  }

  // Data encryption utilities
  private async hashPin(pin: string): Promise<string> {
    // Simple hash for demo - in production, use proper crypto library
    const encoder = new TextEncoder();
    const data = encoder.encode(pin + 'handshakeme_salt');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async validatePin(pin: string): Promise<boolean> {
    try {
      const storedHash = await this.getPinHash();
      if (!storedHash) return false;
      
      const inputHash = await this.hashPin(pin);
      return storedHash === inputHash;
    } catch (error) {
      console.error('Failed to validate PIN:', error);
      return false;
    }
  }

  async setPin(pin: string): Promise<void> {
    try {
      const pinHash = await this.hashPin(pin);
      await this.storePinHash(pinHash);
    } catch (error) {
      console.error('Failed to set PIN:', error);
      throw new Error('Failed to set PIN');
    }
  }
}

export const secureStorage = new SecureStorageService();
export default secureStorage;