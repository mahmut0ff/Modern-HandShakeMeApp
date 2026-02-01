import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useKyrgyzstanRegion } from '../../services/kyrgyzstanRegionalService';

interface RegionalPricingDisplayProps {
  basePrice: number;
  showBreakdown?: boolean;
  showRegionalAdjustment?: boolean;
  onInfoPress?: () => void;
}

export const RegionalPricingDisplay: React.FC<RegionalPricingDisplayProps> = ({
  basePrice,
  showBreakdown = false,
  showRegionalAdjustment = true,
  onInfoPress,
}) => {
  const { settings, formatPrice } = useKyrgyzstanRegion();

  const getRegionalMultiplier = () => {
    const multipliers: Record<string, number> = {
      bishkek: 1.0,
      osh: 0.8,
      jalal_abad: 0.7,
      karakol: 0.9,
      naryn: 0.6,
      talas: 0.65,
      batken: 0.65,
      other: 0.6,
    };
    return multipliers[settings?.region || 'other'] || 1.0;
  };

  const multiplier = getRegionalMultiplier();
  const adjustedPrice = basePrice * multiplier;
  const discount = basePrice - adjustedPrice;

  const getRegionName = () => {
    const names: Record<string, string> = {
      bishkek: 'Бишкек',
      osh: 'Ош',
      jalal_abad: 'Джалал-Абад',
      karakol: 'Каракол',
      naryn: 'Нарын',
      talas: 'Талас',
      batken: 'Баткен',
      other: 'Другой регион',
    };
    return names[settings?.region || 'other'];
  };

  return (
    <View style={styles.container}>
      {/* Main Price */}
      <View style={styles.mainPriceContainer}>
        <Text style={styles.mainPrice}>{formatPrice(adjustedPrice)}</Text>
        {showRegionalAdjustment && multiplier !== 1.0 && (
          <View style={styles.discountBadge}>
            <MaterialIcons name="local-offer" size={14} color="#10B981" />
            <Text style={styles.discountText}>-{Math.round((1 - multiplier) * 100)}%</Text>
          </View>
        )}
      </View>

      {/* Regional Info */}
      {showRegionalAdjustment && multiplier !== 1.0 && (
        <View style={styles.regionalInfo}>
          <MaterialIcons name="location-on" size={16} color="#6B7280" />
          <Text style={styles.regionalText}>
            Цена для региона: {getRegionName()}
          </Text>
          {onInfoPress && (
            <TouchableOpacity onPress={onInfoPress} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <MaterialIcons name="info-outline" size={16} color="#3B82F6" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Price Breakdown */}
      {showBreakdown && (
        <View style={styles.breakdown}>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Базовая цена:</Text>
            <Text style={styles.breakdownValue}>{formatPrice(basePrice)}</Text>
          </View>

          {multiplier !== 1.0 && (
            <>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Региональная скидка:</Text>
                <Text style={[styles.breakdownValue, styles.discountValue]}>
                  -{formatPrice(discount)}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabelBold}>Итого:</Text>
                <Text style={styles.breakdownValueBold}>{formatPrice(adjustedPrice)}</Text>
              </View>
            </>
          )}
        </View>
      )}

      {/* Info Card */}
      {showRegionalAdjustment && multiplier < 1.0 && (
        <View style={styles.infoCard}>
          <MaterialIcons name="celebration" size={20} color="#10B981" />
          <Text style={styles.infoText}>
            Специальная цена для вашего региона! Экономия {formatPrice(discount)}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
  },
  mainPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  mainPrice: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  discountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  discountText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#059669',
  },
  regionalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  regionalText: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
  },
  breakdown: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  breakdownLabelBold: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  breakdownValueBold: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  discountValue: {
    color: '#10B981',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#D1FAE5',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 12,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#059669',
    lineHeight: 18,
  },
});
