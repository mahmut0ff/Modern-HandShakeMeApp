import React, { useState, useRef } from 'react';
import {
  TextInput,
  View,
  Text,
  TouchableOpacity,
  TextInputProps,
  ViewStyle,
  TextStyle,
  NativeSyntheticEvent,
  TextInputFocusEventData
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getTextInputAccessibility } from '../../utils/accessibility';
import { useHapticFeedback } from '../../services/hapticFeedback';
import { useThemeContext } from '../../hooks/useTheme';

export interface AccessibleTextInputProps extends Omit<TextInputProps, 'style'> {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  errorStyle?: TextStyle;
  hintStyle?: TextStyle;
  showPasswordToggle?: boolean;
}

export const AccessibleTextInput: React.FC<AccessibleTextInputProps> = ({
  label,
  error,
  hint,
  required = false,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  inputStyle,
  labelStyle,
  errorStyle,
  hintStyle,
  showPasswordToggle = false,
  secureTextEntry,
  onFocus,
  onBlur,
  ...textInputProps
}) => {
  const { theme } = useThemeContext();
  const { textInputFocus, textInputError } = useHapticFeedback();
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const handleFocus = async (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setIsFocused(true);
    await textInputFocus();
    onFocus?.(e);
  };

  const handleBlur = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const focusInput = () => {
    inputRef.current?.focus();
  };

  // Get border color based on state
  const getBorderColor = () => {
    if (error) return theme.colors.error;
    if (isFocused) return theme.colors.primary;
    return theme.colors.border;
  };

  // Get label color based on state
  const getLabelColor = () => {
    if (error) return theme.colors.error;
    if (isFocused) return theme.colors.primary;
    return theme.colors.textSecondary;
  };

  const containerStyles: ViewStyle = {
    marginBottom: theme.spacing.md,
    ...containerStyle,
  };

  const labelStyles: TextStyle = {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.medium as any,
    color: getLabelColor(),
    marginBottom: theme.spacing.xs,
    ...labelStyle,
  };

  const inputContainerStyles: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: getBorderColor(),
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    minHeight: 48,
  };

  const textInputStyles: TextStyle = {
    flex: 1,
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.text,
    paddingVertical: theme.spacing.sm,
    ...inputStyle,
  };

  const errorStyles: TextStyle = {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.error,
    marginTop: theme.spacing.xs,
    ...errorStyle,
  };

  const hintStyles: TextStyle = {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs,
    ...hintStyle,
  };

  const iconColor = error
    ? theme.colors.error
    : isFocused
      ? theme.colors.primary
      : theme.colors.textMuted;

  // Determine if we should show password toggle
  const shouldShowPasswordToggle = showPasswordToggle && (secureTextEntry !== undefined);
  const actualSecureTextEntry = shouldShowPasswordToggle
    ? secureTextEntry && !isPasswordVisible
    : secureTextEntry;

  // Determine right icon
  const actualRightIcon = shouldShowPasswordToggle
    ? (isPasswordVisible ? 'eye-off' : 'eye')
    : rightIcon;

  const actualOnRightIconPress = shouldShowPasswordToggle
    ? togglePasswordVisibility
    : onRightIconPress;

  return (
    <View style={containerStyles}>
      {/* Label */}
      <TouchableOpacity onPress={focusInput} activeOpacity={1}>
        <Text style={labelStyles}>
          {label}
          {required && <Text style={{ color: theme.colors.error }}> *</Text>}
        </Text>
      </TouchableOpacity>

      {/* Input Container */}
      <View style={inputContainerStyles}>
        {/* Left Icon */}
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={20}
            color={iconColor}
            style={{ marginRight: theme.spacing.sm }}
          />
        )}

        {/* Text Input */}
        <TextInput
          ref={inputRef}
          style={textInputStyles}
          placeholderTextColor={theme.colors.textMuted}
          secureTextEntry={actualSecureTextEntry}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...(getTextInputAccessibility(
            label,
            textInputProps.value,
            textInputProps.placeholder,
            required,
            error
          ) as any)}
          {...textInputProps}
        />

        {/* Right Icon */}
        {actualRightIcon && (
          <TouchableOpacity
            onPress={actualOnRightIconPress}
            style={{ padding: theme.spacing.xs }}
            {...(shouldShowPasswordToggle && {
              accessibilityRole: 'button',
              accessibilityLabel: isPasswordVisible ? 'Скрыть пароль' : 'Показать пароль',
              accessibilityHint: 'Нажмите, чтобы переключить видимость пароля',
            })}
          >
            <Ionicons
              name={actualRightIcon}
              size={20}
              color={iconColor}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Error Message */}
      {error && (
        <Text
          style={errorStyles}
          accessibilityRole="none"
          accessibilityLiveRegion="polite"
        >
          {error}
        </Text>
      )}

      {/* Hint */}
      {hint && !error && (
        <Text style={hintStyles}>
          {hint}
        </Text>
      )}
    </View>
  );
};