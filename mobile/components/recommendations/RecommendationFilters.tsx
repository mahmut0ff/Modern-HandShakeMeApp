import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

type FilterType = 'all' | 'excellent' | 'good' | 'fair';

interface RecommendationFiltersProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  counts: {
    all: number;
    excellent: number;
    good: number;
    fair: number;
  };
}

export const RecommendationFilters: React.FC<RecommendationFiltersProps> = ({
  activeFilter,
  onFilterChange,
  counts,
}) => {
  const filters: Array<{
    key: FilterType;
    label: string;
    icon: string;
    color: string;
    bgColor: string;
  }> = [
    {
      key: 'all',
      label: 'Все',
      icon: 'view-list',
      color: '#6B7280',
      bgColor: '#F3F4F6',
    },
    {
      key: 'excellent',
      label: 'Отличные',
      icon: 'star',
      color: '#10B981',
      bgColor: '#D1FAE5',
    },
    {
      key: 'good',
      label: 'Хорошие',
      icon: 'thumb-up',
      color: '#3B82F6',
      bgColor: '#DBEAFE',
    },
    {
      key: 'fair',
      label: 'Средние',
      icon: 'check',
      color: '#F59E0B',
      bgColor: '#FEF3C7',
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filters.map((filter) => {
          const isActive = activeFilter === filter.key;
          const count = counts[filter.key];

          return (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterButton,
                isActive && styles.filterButtonActive,
                isActive && { backgroundColor: filter.bgColor, borderColor: filter.color },
              ]}
              onPress={() => onFilterChange(filter.key)}
            >
              <MaterialIcons
                name={filter.icon as any}
                size={18}
                color={isActive ? filter.color : '#6B7280'}
              />
              <Text
                style={[
                  styles.filterLabel,
                  isActive && { color: filter.color, fontWeight: '600' },
                ]}
              >
                {filter.label}
              </Text>
              <View
                style={[
                  styles.countBadge,
                  isActive && { backgroundColor: filter.color },
                ]}
              >
                <Text
                  style={[
                    styles.countText,
                    isActive && styles.countTextActive,
                  ]}
                >
                  {count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 6,
  },
  filterButtonActive: {
    borderWidth: 1.5,
  },
  filterLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  countBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  countTextActive: {
    color: '#FFF',
  },
});
