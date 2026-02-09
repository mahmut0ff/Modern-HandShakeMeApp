import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { Colors, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
}: ButtonProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      ...styles.button,
      ...styles[`button_${size}`],
    };

    if (variant === 'primary') {
      return {
        ...baseStyle,
        backgroundColor: theme.primary,
        ...Shadows.md,
      };
    }

    if (variant === 'secondary') {
      return {
        ...baseStyle,
        backgroundColor: theme.surface,
      };
    }

    if (variant === 'outline') {
      return {
        ...baseStyle,
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: theme.primary,
      };
    }

    return baseStyle;
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      ...styles.text,
      ...styles[`text_${size}`],
    };

    if (variant === 'primary') {
      return {
        ...baseStyle,
        color: theme.onPrimary,
      };
    }

    if (variant === 'secondary') {
      return {
        ...baseStyle,
        color: theme.text,
      };
    }

    if (variant === 'outline') {
      return {
        ...baseStyle,
        color: theme.primary,
      };
    }

    return baseStyle;
  };

  return (
    <TouchableOpacity
      style={[
        getButtonStyle(),
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? theme.onPrimary : theme.primary} />
      ) : (
        <>
          {icon}
          <Text style={[getTextStyle(), textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    gap: 8,
  },
  button_small: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    height: 36,
  },
  button_medium: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    height: 48,
  },
  button_large: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    height: 56,
  },
  text: {
    fontWeight: '600',
  },
  text_small: {
    fontSize: 14,
  },
  text_medium: {
    fontSize: 16,
  },
  text_large: {
    fontSize: 18,
  },
  disabled: {
    opacity: 0.5,
  },
});
