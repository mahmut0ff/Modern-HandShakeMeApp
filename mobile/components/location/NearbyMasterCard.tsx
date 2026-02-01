import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface Master {
  id: string;
  name: string;
  avatar?: string;
  rating: number;
  reviewCount: number;
  services: string[];
  address: string;
  distance: number;
  isOnline: boolean;
  responseTime: number;
  pricing: {
    minPrice: number;
    maxPrice: number;
    currency: string;
  };
}

interface NearbyMasterCardProps {
  master: Master;
  onPress: () => void;
}

export const NearbyMasterCard: React.FC<NearbyMasterCardProps> = ({ master, onPress }) => {
  const formatDistance = (km: number): string => {
    if (km < 1) {
      return `${Math.round(km * 1000)} м`;
    }
    return `${km.toFixed(1)} км`;
  };

  const formatResponseTime = (minutes: number): string => {
    if (minutes < 60) {
      return `~${minutes} мин`;
    }
    const hours = Math.floor(minutes / 60);
    return `~${hours} ч`;
  };

  const formatPrice = (min: number, max: number, currency: string): string => {
    if (min === max) {
      return `${min} ${currency}`;
    }
    return `${min}-${max} ${currency}`;
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {master.avatar ? (
            <Image source={{ uri: master.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <MaterialIcons name="person" size={32} color="#9CA3AF" />
            </View>
          )}
          {master.isOnline && <View style={styles.onlineBadge} />}
        </View>

        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {master.name}
          </Text>

          <View style={styles.ratingRow}>
            <MaterialIcons name="star" size={16} color="#F59E0B" />
            <Text style={styles.rating}>{master.rating}</Text>
            <Text style={styles.reviewCount}>({master.reviewCount})</Text>
          </View>

          <View style={styles.distanceRow}>
            <MaterialIcons name="near-me" size={14} color="#6B7280" />
            <Text style={styles.distance}>{formatDistance(master.distance)}</Text>
            <Text style={styles.separator}>•</Text>
            <MaterialIcons name="schedule" size={14} color="#6B7280" />
            <Text style={styles.responseTime}>{formatResponseTime(master.responseTime)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.services}>
        {master.services.slice(0, 3).map((service, index) => (
          <View key={index} style={styles.serviceTag}>
            <Text style={styles.serviceText} numberOfLines={1}>
              {service}
            </Text>
          </View>
        ))}
        {master.services.length > 3 && (
          <View style={styles.serviceTag}>
            <Text style={styles.serviceText}>+{master.services.length - 3}</Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <View style={styles.addressContainer}>
          <MaterialIcons name="location-on" size={14} color="#6B7280" />
          <Text style={styles.address} numberOfLines={1}>
            {master.address}
          </Text>
        </View>

        <View style={styles.priceContainer}>
          <Text style={styles.price}>
            {formatPrice(master.pricing.minPrice, master.pricing.maxPrice, master.pricing.currency)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  info: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  rating: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distance: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 4,
  },
  separator: {
    fontSize: 13,
    color: '#D1D5DB',
    marginHorizontal: 6,
  },
  responseTime: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 4,
  },
  services: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 6,
  },
  serviceTag: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    maxWidth: 120,
  },
  serviceText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  addressContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  address: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 4,
  },
  priceContainer: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  price: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
});
