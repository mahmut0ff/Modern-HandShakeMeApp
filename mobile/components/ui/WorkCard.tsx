import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import Card from './Card';

interface WorkCardProps {
  title: string;
  description?: string;
  price?: string;
  location?: string;
  date?: string;
  status?: string;
  urgent?: boolean;
  applicationsCount?: number;
  onPress: () => void;
}

export default function WorkCard({
  title,
  description,
  price,
  location,
  date,
  status,
  urgent = false,
  applicationsCount,
  onPress,
}: WorkCardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const getStatusColor = () => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'pending':
        return theme.warning;
      case 'in_progress':
        return theme.primary;
      case 'completed':
        return theme.success;
      default:
        return theme.textSecondary;
    }
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
              {title}
            </Text>
            {urgent && (
              <View style={[styles.urgentBadge, { backgroundColor: theme.error + '15' }]}>
                <Ionicons name="flash" size={12} color={theme.error} />
                <Text style={[styles.urgentText, { color: theme.error }]}>Urgent</Text>
              </View>
            )}
          </View>
          {status && (
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + '15' }]}>
              <Text style={[styles.statusText, { color: getStatusColor() }]}>
                {status}
              </Text>
            </View>
          )}
        </View>

        {description && (
          <Text style={[styles.description, { color: theme.textSecondary }]} numberOfLines={2}>
            {description}
          </Text>
        )}

        <View style={styles.footer}>
          <View style={styles.infoRow}>
            {location && (
              <View style={styles.infoItem}>
                <Ionicons name="location-outline" size={16} color={theme.textLight} />
                <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                  {location}
                </Text>
              </View>
            )}
            {date && (
              <View style={styles.infoItem}>
                <Ionicons name="time-outline" size={16} color={theme.textLight} />
                <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                  {date}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.bottomRow}>
            {price && (
              <Text style={[styles.price, { color: theme.primary }]}>
                {price}
              </Text>
            )}
            {applicationsCount !== undefined && (
              <View style={[styles.applicationsBadge, { backgroundColor: theme.primary + '15' }]}>
                <Ionicons name="people" size={14} color={theme.primary} />
                <Text style={[styles.applicationsText, { color: theme.primary }]}>
                  {applicationsCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
    marginTop: 4,
  },
  urgentText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 13,
    fontWeight: '500',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
  },
  applicationsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  applicationsText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
