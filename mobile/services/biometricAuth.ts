import * as LocalAuthentication from 'expo-local-authentication';
import { secureStore, secureRetrieve, secureDelete } from '../utils/security';

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
  biometricType?: LocalAuthentication.AuthenticationType[];
}

export interface BiometricCapabilities {
  isAvailable: boolean;
  supportedTypes: LocalAuthentication.AuthenticationType[];
  isEnrolled: boolean;
}

class BiometricAuthService {
  private static instance: BiometricAuthService;
  private isInitialized = false;
  private capabilities: BiometricCapabilities | null = null;

  private constructor() {}

  static getInstance(): BiometricAuthService {
    if (!BiometricAuthService.instance) {
      BiometricAuthService.instance = new BiometricAuthService();
    }
    return BiometricAuthService.instance;
  }

  /**
   * Initialize biometric authentication
   */
  async initialize(): Promise<BiometricCapabilities> {
    try {
      const isAvailable = await LocalAuthentication.hasHardwareAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      this.capabilities = {
        isAvailable,
        supportedTypes,
        isEnrolled,
      };

      this.isInitialized = true;
      return this.capabilities;
    } catch (error) {
      console.error('Failed to initialize biometric auth:', error);
      this.capabilities = {
        isAvailable: false,
        supportedTypes: [],
        isEnrolled: false,
      };
      return this.capabilities;
    }
  }

  /**
   * Get biometric capabilities
   */
  async getCapabilities(): Promise<BiometricCapabilities> {
    if (!this.isInitialized || !this.capabilities) {
      return await this.initialize();
    }
    return this.capabilities;
  }

  /**
   * Check if biometric authentication is available and enrolled
   */
  async isAvailable(): Promise<boolean> {
    const capabilities = await this.getCapabilities();
    return capabilities.isAvailable && capabilities.isEnrolled;
  }

  /**
   * Get supported biometric types as user-friendly strings
   */
  getSupportedTypesText(types: LocalAuthentication.AuthenticationType[]): string[] {
    const typeMap = {
      [LocalAuthentication.AuthenticationType.FINGERPRINT]: 'Отпечаток пальца',
      [LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION]: 'Распознавание лица',
      [LocalAuthentication.AuthenticationType.IRIS]: 'Сканирование радужки',
    };

    return types.map(type => typeMap[type]).filter(Boolean);
  }

  /**
   * Authenticate user with biometrics
   */
  async authenticate(
    promptMessage: string = 'Подтвердите свою личность',
    cancelLabel: string = 'Отмена',
    fallbackLabel: string = 'Использовать пароль'
  ): Promise<BiometricAuthResult> {
    try {
      const capabilities = await this.getCapabilities();
      
      if (!capabilities.isAvailable) {
        return {
          success: false,
          error: 'Биометрическая аутентификация недоступна на этом устройстве',
        };
      }

      if (!capabilities.isEnrolled) {
        return {
          success: false,
          error: 'Биометрические данные не настроены. Пожалуйста, настройте их в настройках устройства.',
        };
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel,
        fallbackLabel,
        disableDeviceFallback: false,
      });

      if (result.success) {
        return {
          success: true,
          biometricType: capabilities.supportedTypes,
        };
      } else {
        let errorMessage = 'Аутентификация не удалась';
        
        if (result.error === 'user_cancel') {
          errorMessage = 'Аутентификация отменена пользователем';
        } else if (result.error === 'system_cancel') {
          errorMessage = 'Аутентификация отменена системой';
        } else if (result.error === 'lockout') {
          errorMessage = 'Слишком много неудачных попыток. Попробуйте позже.';
        } else if (result.error === 'lockout_permanent') {
          errorMessage = 'Биометрическая аутентификация заблокирована. Используйте пароль устройства.';
        } else if (result.error === 'not_available') {
          errorMessage = 'Биометрическая аутентификация недоступна';
        } else if (result.error === 'not_enrolled') {
          errorMessage = 'Биометрические данные не настроены';
        }

        return {
          success: false,
          error: errorMessage,
        };
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return {
        success: false,
        error: 'Произошла ошибка при биометрической аутентификации',
      };
    }
  }

  /**
   * Enable biometric login for the app
   */
  async enableBiometricLogin(userId: string): Promise<boolean> {
    try {
      const authResult = await this.authenticate(
        'Подтвердите включение биометрического входа',
        'Отмена',
        'Использовать пароль'
      );

      if (authResult.success) {
        await secureStore('biometric_enabled', 'true');
        await secureStore('biometric_user_id', userId);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to enable biometric login:', error);
      return false;
    }
  }

  /**
   * Disable biometric login
   */
  async disableBiometricLogin(): Promise<void> {
    try {
      await secureDelete('biometric_enabled');
      await secureDelete('biometric_user_id');
    } catch (error) {
      console.error('Failed to disable biometric login:', error);
    }
  }

  /**
   * Check if biometric login is enabled
   */
  async isBiometricLoginEnabled(): Promise<boolean> {
    try {
      const enabled = await secureRetrieve('biometric_enabled');
      return enabled === 'true';
    } catch (error) {
      console.error('Failed to check biometric login status:', error);
      return false;
    }
  }

  /**
   * Get user ID for biometric login
   */
  async getBiometricUserId(): Promise<string | null> {
    try {
      return await secureRetrieve('biometric_user_id');
    } catch (error) {
      console.error('Failed to get biometric user ID:', error);
      return null;
    }
  }

  /**
   * Authenticate for biometric login
   */
  async authenticateForLogin(): Promise<{ success: boolean; userId?: string; error?: string }> {
    try {
      const isEnabled = await this.isBiometricLoginEnabled();
      if (!isEnabled) {
        return {
          success: false,
          error: 'Биометрический вход не включен',
        };
      }

      const userId = await this.getBiometricUserId();
      if (!userId) {
        return {
          success: false,
          error: 'Пользователь для биометрического входа не найден',
        };
      }

      const authResult = await this.authenticate(
        'Войдите в HandShakeMe',
        'Отмена',
        'Использовать пароль'
      );

      if (authResult.success) {
        return {
          success: true,
          userId,
        };
      } else {
        return {
          success: false,
          error: authResult.error,
        };
      }
    } catch (error) {
      console.error('Biometric login authentication failed:', error);
      return {
        success: false,
        error: 'Произошла ошибка при биометрическом входе',
      };
    }
  }

  /**
   * Authenticate for sensitive operations
   */
  async authenticateForSensitiveOperation(
    operationName: string
  ): Promise<BiometricAuthResult> {
    return await this.authenticate(
      `Подтвердите ${operationName}`,
      'Отмена',
      'Использовать пароль'
    );
  }
}

export const biometricAuthService = BiometricAuthService.getInstance();