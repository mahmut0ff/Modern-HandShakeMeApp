import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import Card from './Card';

interface MasterCardProps {
  name: string;
  avatar?: string;
  rating?: number;
  reviewsCount?: number;
  specialization?: string;
  location?: string;
  price?: string;
  verified?: boolean;
  onPress: () => void;
}

export default function MasterCard({
  name,
  avatar,
  rating,
  reviewsCount,
  specialization,
  location,
  price,
  verified = false,
  onPress,
}: MasterCardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: theme.primary + '20' }]}>
                <Ionicons name="person" size={32} color={theme.primary} />
              </View>
            )}
            {verified && (
              <View style={[styles.verifiedBadge, { backgroundColor: theme.success }]}>
                <Ionicons name="checkmark" size={12} color="white" />
              </View>
            )}
          </View>

          <View style={styles.info}>
            <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
              {name}
            </Text>
            {specialization && (
              <Text style={[styles.specialization, { color: theme.textSecondary }]} numberOfLines={1}>
                {specialization}
              </Text>
            )}
            {rating !== undefined && (
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={14} color="#FFB800" />
                <Text style={[styles.rating, { color: theme.text }]}>
                  {rating.toFixed(1)}
                </Text>
                {reviewsCount !== undefined && (
                  <Text style={[styles.reviewsCount, { color: theme.textLight }]}>
                    ({reviewsCount})
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>

        <View style={styles.footer}>
          {location && (
            <View style={styles.locationContainer}>
              <Ionicons name="location-outline" size={14} color={theme.textLight} />
              <Text style={[styles.location, { color: theme.textSecondary }]}>
                {location}
              </Text>
            </View>
          )}
          {price && (
            <Text style={[styles.price, { color: theme.primary }]}>
              {price}
            </Text>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  specialization: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
  },
  reviewsCount: {
    fontSize: 12,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  location: {
    fontSize: 13,
    fontWeight: '500',
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
  },
});
