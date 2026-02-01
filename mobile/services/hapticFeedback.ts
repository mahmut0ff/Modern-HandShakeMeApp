import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Haptic Feedback Service
 * Provides consistent haptic feedback across the app
 */

export type HapticFeedbackType =
  | 'light'
  | 'medium'
  | 'heavy'
  | 'success'
  | 'warning'
  | 'error'
  | 'selection'
  | 'impactLight'
  | 'impactMedium'
  | 'impactHeavy'
  | 'notificationSuccess'
  | 'notificationWarning'
  | 'notificationError';

export interface HapticSettings {
  enabled: boolean;
  intensity: 'light' | 'medium' | 'strong';
}

class HapticFeedbackService {
  private static instance: HapticFeedbackService;
  private settings: HapticSettings = {
    enabled: true,
    intensity: 'medium',
  };

  private constructor() {
    this.loadSettings();
  }

  static getInstance(): HapticFeedbackService {
    if (!HapticFeedbackService.instance) {
      HapticFeedbackService.instance = new HapticFeedbackService();
    }
    return HapticFeedbackService.instance;
  }

  /**
   * Load haptic settings from storage
   */
  private async loadSettings(): Promise<void> {
    try {
      // In a real implementation, load from AsyncStorage
      // For now, use defaults
      this.settings = {
        enabled: true,
        intensity: 'medium',
      };
    } catch (error) {
      console.error('Failed to load haptic settings:', error);
    }
  }

  /**
   * Update haptic settings
   */
  async updateSettings(settings: Partial<HapticSettings>): Promise<void> {
    try {
      this.settings = { ...this.settings, ...settings };
      // In a real implementation, save to AsyncStorage
      console.log('Haptic settings updated:', this.settings);
    } catch (error) {
      console.error('Failed to update haptic settings:', error);
    }
  }

  /**
   * Check if haptics are supported on the device
   */
  isSupported(): boolean {
    return Platform.OS === 'ios' || Platform.OS === 'android';
  }

  /**
   * Trigger haptic feedback
   */
  async trigger(type: HapticFeedbackType): Promise<void> {
    if (!this.settings.enabled || !this.isSupported()) {
      return;
    }

    try {
      switch (type) {
        case 'light':
        case 'impactLight':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;

        case 'medium':
        case 'impactMedium':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;

        case 'heavy':
        case 'impactHeavy':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;

        case 'success':
        case 'notificationSuccess':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;

        case 'warning':
        case 'notificationWarning':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;

        case 'error':
        case 'notificationError':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;

        case 'selection':
          await Haptics.selectionAsync();
          break;

        default:
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (error) {
      console.error('Haptic feedback error:', error);
    }
  }

  /**
   * Convenience methods for common interactions
   */

  // Button interactions
  async buttonPress(): Promise<void> {
    await this.trigger('impactLight');
  }

  async buttonLongPress(): Promise<void> {
    await this.trigger('impactMedium');
  }

  // Navigation
  async tabSwitch(): Promise<void> {
    await this.trigger('selection');
  }

  async pageTransition(): Promise<void> {
    await this.trigger('impactLight');
  }

  // Form interactions
  async textInputFocus(): Promise<void> {
    await this.trigger('selection');
  }

  async textInputError(): Promise<void> {
    await this.trigger('notificationError');
  }

  async formSubmitSuccess(): Promise<void> {
    await this.trigger('notificationSuccess');
  }

  async formSubmitError(): Promise<void> {
    await this.trigger('notificationError');
  }

  // List interactions
  async listItemSelect(): Promise<void> {
    await this.trigger('selection');
  }

  async listItemDelete(): Promise<void> {
    await this.trigger('impactMedium');
  }

  async pullToRefresh(): Promise<void> {
    await this.trigger('impactLight');
  }

  // Toggle interactions
  async toggleOn(): Promise<void> {
    await this.trigger('impactMedium');
  }

  async toggleOff(): Promise<void> {
    await this.trigger('impactLight');
  }

  // Slider interactions
  async sliderChange(): Promise<void> {
    await this.trigger('selection');
  }

  // Picker interactions
  async pickerChange(): Promise<void> {
    await this.trigger('selection');
  }

  // Modal interactions
  async modalOpen(): Promise<void> {
    await this.trigger('impactLight');
  }

  async modalClose(): Promise<void> {
    await this.trigger('impactLight');
  }

  // Alert interactions
  async alertShow(): Promise<void> {
    await this.trigger('notificationWarning');
  }

  // Success/Error feedback
  async success(): Promise<void> {
    await this.trigger('notificationSuccess');
  }

  async error(): Promise<void> {
    await this.trigger('notificationError');
  }

  async warning(): Promise<void> {
    await this.trigger('notificationWarning');
  }

  // Loading states
  async loadingStart(): Promise<void> {
    await this.trigger('impactLight');
  }

  async loadingComplete(): Promise<void> {
    await this.trigger('impactLight');
  }

  // Swipe gestures
  async swipeAction(): Promise<void> {
    await this.trigger('impactMedium');
  }

  // Long press actions
  async longPressStart(): Promise<void> {
    await this.trigger('impactMedium');
  }

  // Drag and drop
  async dragStart(): Promise<void> {
    await this.trigger('impactMedium');
  }

  async dragEnd(): Promise<void> {
    await this.trigger('impactLight');
  }

  // Photo/Camera
  async photoCapture(): Promise<void> {
    await this.trigger('impactHeavy');
  }

  async photoSelect(): Promise<void> {
    await this.trigger('impactLight');
  }

  // Biometric authentication
  async biometricSuccess(): Promise<void> {
    await this.trigger('notificationSuccess');
  }

  async biometricError(): Promise<void> {
    await this.trigger('notificationError');
  }

  // Custom pattern for complex interactions
  async customPattern(pattern: HapticFeedbackType[], delays: number[] = []): Promise<void> {
    for (let i = 0; i < pattern.length; i++) {
      await this.trigger(pattern[i]);

      if (i < pattern.length - 1 && delays[i]) {
        await new Promise(resolve => setTimeout(resolve, delays[i]));
      }
    }
  }

  /**
   * Get current settings
   */
  getSettings(): HapticSettings {
    return { ...this.settings };
  }

  /**
   * Enable/disable haptics
   */
  async setEnabled(enabled: boolean): Promise<void> {
    await this.updateSettings({ enabled });
  }

  /**
   * Set haptic intensity
   */
  async setIntensity(intensity: HapticSettings['intensity']): Promise<void> {
    await this.updateSettings({ intensity });
  }
}

export const hapticFeedback = HapticFeedbackService.getInstance();

// React hook for haptic feedback
import { useCallback } from 'react';

export const useHapticFeedback = () => {
  const trigger = useCallback(async (type: HapticFeedbackType) => {
    await hapticFeedback.trigger(type);
  }, []);

  return {
    trigger,
    buttonPress: hapticFeedback.buttonPress.bind(hapticFeedback),
    success: hapticFeedback.success.bind(hapticFeedback),
    error: hapticFeedback.error.bind(hapticFeedback),
    warning: hapticFeedback.warning.bind(hapticFeedback),
    selection: hapticFeedback.listItemSelect.bind(hapticFeedback),
    textInputFocus: hapticFeedback.textInputFocus.bind(hapticFeedback),
    textInputError: hapticFeedback.textInputError.bind(hapticFeedback),
    impact: {
      light: () => hapticFeedback.trigger('impactLight'),
      medium: () => hapticFeedback.trigger('impactMedium'),
      heavy: () => hapticFeedback.trigger('impactHeavy'),
    },
  };
};