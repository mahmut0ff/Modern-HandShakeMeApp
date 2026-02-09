import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface ScreenContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  withPadding?: boolean;
}

export default function ScreenContainer({ children, style, withPadding = true }: ScreenContainerProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.background },
        withPadding && styles.withPadding,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  withPadding: {
    padding: 16,
  },
});
