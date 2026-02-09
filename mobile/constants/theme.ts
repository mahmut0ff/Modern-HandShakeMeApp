/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0F5F5C';
const tintColorDark = '#1A7A76';

export const Colors = {
  light: {
    text: '#1A1A1A',
    background: '#FFFFFF',
    tint: tintColorLight,
    icon: '#6B7280',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: tintColorLight,
    primary: tintColorLight,
    primaryLight: '#1A7A76',
    secondary: '#5856D6',
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    card: '#FFFFFF',
    surface: '#F5F5F5',
    border: '#E5E7EB',
    notification: '#FF3B30',
    onPrimary: '#FFFFFF',
    textSecondary: '#6B7280',
    textLight: '#9CA3AF',
    searchBackground: '#FFFFFF',
    categoryIconBg: '#F3F4F6',
    headerBackground: '#0F5F5C',
  },
  dark: {
    text: '#F9FAFB',
    background: '#0F1419',
    tint: tintColorDark,
    icon: '#9CA3AF',
    tabIconDefault: '#6B7280',
    tabIconSelected: tintColorDark,
    primary: tintColorDark,
    primaryLight: '#2A8A86',
    secondary: '#5E5CE6',
    success: '#32D74B',
    warning: '#FF9F0A',
    error: '#FF453A',
    card: '#1F2937',
    surface: '#1A1F26',
    border: '#374151',
    notification: '#FF453A',
    onPrimary: '#FFFFFF',
    textSecondary: '#D1D5DB',
    textLight: '#9CA3AF',
    searchBackground: '#1F2937',
    categoryIconBg: '#374151',
    headerBackground: '#1A7A76',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

export const Typography = {
  headerTitle: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  headerLocation: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  body: {
    fontSize: 14,
    fontWeight: '400' as const,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
  },
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
