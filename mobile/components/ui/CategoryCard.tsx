import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface CategoryCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  selected?: boolean;
}

export default function CategoryCard({ icon, label, onPress, selected = false }: CategoryCardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: selected ? theme.primary + '15' : theme.card,
          borderColor: selected ? theme.primary : theme.border,
        },
        Shadows.sm,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: selected ? theme.primary + '20' : theme.categoryIconBg,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={24}
          color={selected ? theme.primary : theme.icon}
        />
      </View>
      <Text
        style={[
          styles.label,
          {
            color: selected ? theme.primary : theme.text,
          },
        ]}
        numberOfLines={2}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 100,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    marginRight: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});
