import { AccessibilityInfo, Platform } from 'react-native';

/**
 * Accessibility utilities for better app accessibility
 */

export interface AccessibilityProps {
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?:
  | 'none'
  | 'button'
  | 'link'
  | 'search'
  | 'image'
  | 'keyboardkey'
  | 'text'
  | 'adjustable'
  | 'imagebutton'
  | 'header'
  | 'summary'
  | 'alert'
  | 'checkbox'
  | 'combobox'
  | 'menu'
  | 'menubar'
  | 'menuitem'
  | 'progressbar'
  | 'radio'
  | 'radiogroup'
  | 'scrollbar'
  | 'spinbutton'
  | 'switch'
  | 'tab'
  | 'tablist'
  | 'timer'
  | 'toolbar'
  | 'list';
  accessibilityState?: {
    disabled?: boolean;
    selected?: boolean;
    checked?: boolean | 'mixed';
    busy?: boolean;
    expanded?: boolean;
  };
  accessibilityValue?: {
    min?: number;
    max?: number;
    now?: number;
    text?: string;
  };
  accessible?: boolean;
  importantForAccessibility?: 'auto' | 'yes' | 'no' | 'no-hide-descendants';
  accessibilityLevel?: number;
}

/**
 * Check if screen reader is enabled
 */
export const isScreenReaderEnabled = async (): Promise<boolean> => {
  try {
    return await AccessibilityInfo.isScreenReaderEnabled();
  } catch (error) {
    console.warn('Failed to check screen reader status:', error);
    return false;
  }
};

/**
 * Check if reduce motion is enabled
 */
export const isReduceMotionEnabled = async (): Promise<boolean> => {
  try {
    return await AccessibilityInfo.isReduceMotionEnabled();
  } catch (error) {
    console.warn('Failed to check reduce motion status:', error);
    return false;
  }
};

/**
 * Announce message to screen reader
 */
export const announceForAccessibility = (message: string): void => {
  if (Platform.OS === 'ios') {
    AccessibilityInfo.announceForAccessibility(message);
  } else {
    // Android equivalent
    AccessibilityInfo.announceForAccessibilityWithOptions?.(message, {
      queue: false,
    });
  }
};

/**
 * Set accessibility focus to element
 */
export const setAccessibilityFocus = (reactTag: number): void => {
  AccessibilityInfo.setAccessibilityFocus(reactTag);
};

/**
 * Generate accessibility props for buttons
 */
export const getButtonAccessibility = (
  label: string,
  hint?: string,
  disabled?: boolean
): AccessibilityProps => ({
  accessibilityRole: 'button',
  accessibilityLabel: label,
  accessibilityHint: hint,
  accessibilityState: { disabled: disabled || false },
  accessible: true,
});

/**
 * Generate accessibility props for text inputs
 */
export const getTextInputAccessibility = (
  label: string,
  value?: string,
  placeholder?: string,
  required?: boolean,
  error?: string
): AccessibilityProps => {
  let hint = placeholder;
  if (required) {
    hint = hint ? `${hint}. Обязательное поле` : 'Обязательное поле';
  }
  if (error) {
    hint = hint ? `${hint}. Ошибка: ${error}` : `Ошибка: ${error}`;
  }

  return {
    accessibilityRole: 'none', // Let TextInput handle its own role
    accessibilityLabel: label,
    accessibilityHint: hint,
    accessibilityValue: value ? { text: value } : undefined,
    accessible: true,
  };
};

/**
 * Generate accessibility props for images
 */
export const getImageAccessibility = (
  description: string,
  decorative: boolean = false
): AccessibilityProps => {
  if (decorative) {
    return {
      accessible: false,
      importantForAccessibility: 'no',
    };
  }

  return {
    accessibilityRole: 'image',
    accessibilityLabel: description,
    accessible: true,
  };
};

/**
 * Generate accessibility props for headers
 */
export const getHeaderAccessibility = (
  text: string,
  level: number = 1
): AccessibilityProps => ({
  accessibilityRole: 'header',
  accessibilityLabel: text,
  accessibilityLevel: level,
  accessible: true,
});

/**
 * Generate accessibility props for lists
 */
export const getListAccessibility = (
  itemCount: number,
  currentIndex?: number
): AccessibilityProps => {
  const label = `Список из ${itemCount} элементов`;
  const hint = currentIndex !== undefined
    ? `Элемент ${currentIndex + 1} из ${itemCount}`
    : undefined;

  return {
    accessibilityRole: 'list',
    accessibilityLabel: label,
    accessibilityHint: hint,
    accessible: true,
  };
};

/**
 * Generate accessibility props for tabs
 */
export const getTabAccessibility = (
  label: string,
  selected: boolean,
  index: number,
  totalTabs: number
): AccessibilityProps => ({
  accessibilityRole: 'tab',
  accessibilityLabel: label,
  accessibilityHint: `Вкладка ${index + 1} из ${totalTabs}`,
  accessibilityState: { selected },
  accessible: true,
});

/**
 * Generate accessibility props for switches/toggles
 */
export const getSwitchAccessibility = (
  label: string,
  value: boolean,
  hint?: string
): AccessibilityProps => ({
  accessibilityRole: 'switch',
  accessibilityLabel: label,
  accessibilityHint: hint,
  accessibilityState: { checked: value },
  accessible: true,
});

/**
 * Generate accessibility props for progress indicators
 */
export const getProgressAccessibility = (
  label: string,
  current: number,
  max: number,
  min: number = 0
): AccessibilityProps => ({
  accessibilityRole: 'progressbar',
  accessibilityLabel: label,
  accessibilityValue: {
    min,
    max,
    now: current,
    text: `${Math.round((current / max) * 100)}%`,
  },
  accessible: true,
});

/**
 * Generate accessibility props for alerts
 */
export const getAlertAccessibility = (
  message: string,
  type: 'info' | 'warning' | 'error' | 'success' = 'info'
): AccessibilityProps => {
  const typeLabels = {
    info: 'Информация',
    warning: 'Предупреждение',
    error: 'Ошибка',
    success: 'Успех',
  };

  return {
    accessibilityRole: 'alert',
    accessibilityLabel: `${typeLabels[type]}: ${message}`,
    accessible: true,
    importantForAccessibility: 'yes',
  };
};

/**
 * Accessibility hook for managing focus and announcements
 */
export class AccessibilityManager {
  private static instance: AccessibilityManager;
  private screenReaderEnabled: boolean = false;
  private reduceMotionEnabled: boolean = false;

  private constructor() {
    this.initialize();
  }

  static getInstance(): AccessibilityManager {
    if (!AccessibilityManager.instance) {
      AccessibilityManager.instance = new AccessibilityManager();
    }
    return AccessibilityManager.instance;
  }

  private async initialize() {
    try {
      this.screenReaderEnabled = await isScreenReaderEnabled();
      this.reduceMotionEnabled = await isReduceMotionEnabled();

      // Listen for changes
      AccessibilityInfo.addEventListener('screenReaderChanged', (enabled) => {
        this.screenReaderEnabled = enabled;
      });

      AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
        this.reduceMotionEnabled = enabled;
      });
    } catch (error) {
      console.warn('Failed to initialize accessibility manager:', error);
    }
  }

  isScreenReaderEnabled(): boolean {
    return this.screenReaderEnabled;
  }

  isReduceMotionEnabled(): boolean {
    return this.reduceMotionEnabled;
  }

  announce(message: string): void {
    if (this.screenReaderEnabled) {
      announceForAccessibility(message);
    }
  }

  announcePageChange(pageName: string): void {
    this.announce(`Открыта страница ${pageName}`);
  }

  announceError(error: string): void {
    this.announce(`Ошибка: ${error}`);
  }

  announceSuccess(message: string): void {
    this.announce(`Успешно: ${message}`);
  }

  announceLoading(isLoading: boolean): void {
    if (isLoading) {
      this.announce('Загрузка');
    } else {
      this.announce('Загрузка завершена');
    }
  }
}

export const accessibilityManager = AccessibilityManager.getInstance();