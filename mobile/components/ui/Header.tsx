import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  location?: string;
  showBack?: boolean;
  onBackPress?: () => void;
  rightAction?: React.ReactNode;
  variant?: 'default' | 'colored';
  style?: ViewStyle;
}

export default function Header({
  title,
  subtitle,
  location,
  showBack = false,
  onBackPress,
  rightAction,
  variant = 'default',
  style,
}: HeaderProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const isColored = variant === 'colored';
  const backgroundColor = isColored ? theme.headerBackground || theme.primary : theme.card;
  const textColor = isColored ? theme.onPrimary : theme.text;
  const subtitleColor = isColored ? theme.onPrimary + '99' : theme.textSecondary;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor },
        isColored && styles.coloredContainer,
        style,
      ]}
    >
      <View style={styles.content}>
        {showBack && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBackPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color={textColor} />
          </TouchableOpacity>
        )}

        <View style={styles.textContainer}>
          {subtitle && (
            <Text style={[styles.subtitle, { color: subtitleColor }]}>
              {subtitle}
            </Text>
          )}
          {title && (
            <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
              {title}
            </Text>
          )}
          {location && (
            <View style={styles.locationContainer}>
              <Ionicons name="location-outline" size={14} color={subtitleColor} />
              <Text style={[styles.location, { color: subtitleColor }]}>
                {location}
              </Text>
            </View>
          )}
        </View>

        {rightAction && (
          <View style={styles.rightAction}>
            {rightAction}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  coloredContainer: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  location: {
    fontSize: 13,
    fontWeight: '500',
  },
  rightAction: {
    marginLeft: 12,
  },
});
