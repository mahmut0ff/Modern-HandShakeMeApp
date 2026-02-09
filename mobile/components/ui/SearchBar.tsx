import React from 'react';
import { View, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface SearchBarProps extends TextInputProps {
  onSearch?: (text: string) => void;
}

export default function SearchBar({ onSearch, ...props }: SearchBarProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.searchBackground,
          borderColor: theme.border,
        },
      ]}
    >
      <Ionicons name="search" size={20} color={theme.textLight} />
      <TextInput
        style={[styles.input, { color: theme.text }]}
        placeholder="Search for a service..."
        placeholderTextColor={theme.textLight}
        onChangeText={onSearch}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    borderWidth: 1,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
  },
});
