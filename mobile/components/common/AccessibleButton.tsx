import React from 'react';
import { TouchableOpacity, Text, View, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getButtonAccessibility } from '../../utils/accessibility';
import { useHapticFeedback } from '../../services/hapticFeedback';
import { useThemeContext } from '../../hooks/useTheme';

export interface AccessibleButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  accessibilityLabel,
  accessibilityHint,
  style,
  textStyle,
  testID,
}) => {
  const { theme } = useThemeContext();
  const { buttonPress } = useHapticFeedback();

  const handlePress = async () => {
    if (disabled || loading) return;

    await buttonPress();
    onPress();
  };

  // Get variant styles
  const getVariantStyles = () => {
    const baseStyles = {
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyles,
          backgroundColor: disabled ? theme.colors.textMuted : theme.colors.primary,
          borderColor: disabled ? theme.colors.textMuted : theme.colors.primary,
        };
      case 'secondary':
        return {
          ...baseStyles,
          backgroundColor: disabled ? theme.colors.divider : theme.colors.surface,
          borderColor: disabled ? theme.colors.border : theme.colors.border,
        };
      case 'outline':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
          borderColor: disabled ? theme.colors.border : theme.colors.primary,
        };
      case 'ghost':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
          borderColor: 'transparent',
        };
      case 'danger':
        return {
          ...baseStyles,
          backgroundColor: disabled ? theme.colors.textMuted : theme.colors.error,
          borderColor: disabled ? theme.colors.textMuted : theme.colors.error,
        };
      default:
        return baseStyles;
    }
  };

  // Get text color
  const getTextColor = () => {
    if (disabled) return theme.colors.textMuted;

    switch (variant) {
      case 'primary':
      case 'danger':
        return '#FFFFFF';
      case 'secondary':
        return theme.colors.text;
      case 'outline':
        return theme.colors.primary;
      case 'ghost':
        return theme.colors.primary;
      default:
        return theme.colors.text;
    }
  };

  // Get size styles
  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.sm,
          minHeight: 36,
        };
      case 'md':
        return {
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.md,
          minHeight: 44,
        };
      case 'lg':
        return {
          paddingHorizontal: theme.spacing.xl,
          paddingVertical: theme.spacing.lg,
          minHeight: 52,
        };
      default:
        return {
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.md,
          minHeight: 44,
        };
    }
  };

  // Get text size
  const getTextSize = () => {
    switch (size) {
      case 'sm':
        return theme.typography.fontSizes.sm;
      case 'md':
        return theme.typography.fontSizes.md;
      case 'lg':
        return theme.typography.fontSizes.lg;
      default:
        return theme.typography.fontSizes.md;
    }
  };

  // Get icon size
  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 16;
      case 'md':
        return 20;
      case 'lg':
        return 24;
      default:
        return 20;
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();
  const textColor = getTextColor();
  const textSize = getTextSize();
  const iconSize = getIconSize();

  const buttonStyles: ViewStyle = {
    ...variantStyles,
    ...sizeStyles,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: disabled ? 0.6 : 1,
    width: fullWidth ? '100%' : undefined,
    ...style,
  };

  const buttonTextStyles: TextStyle = {
    color: textColor,
    fontSize: textSize,
    fontWeight: theme.typography.fontWeights.semibold as any,
    textAlign: 'center',
    ...textStyle,
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <ActivityIndicator
            size="small"
            color={textColor}
            style={{ marginRight: theme.spacing.sm }}
          />
          <Text style={buttonTextStyles}>Загрузка...</Text>
        </View>
      );
    }

    const textElement = <Text style={buttonTextStyles}>{title}</Text>;

    if (!icon) {
      return textElement;
    }

    const iconElement = (
      <Ionicons
        name={icon}
        size={iconSize}
        color={textColor}
        style={{
          marginRight: iconPosition === 'left' ? theme.spacing.sm : 0,
          marginLeft: iconPosition === 'right' ? theme.spacing.sm : 0,
        }}
      />
    );

    return (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {iconPosition === 'left' && iconElement}
        {textElement}
        {iconPosition === 'right' && iconElement}
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      testID={testID}
      {...getButtonAccessibility(
        accessibilityLabel || title,
        accessibilityHint,
        disabled || loading
      ) as any}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};