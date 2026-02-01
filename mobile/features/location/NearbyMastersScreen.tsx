import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useGetNearbyMastersQuery } from '../../services/yandexMapsApi';
import { MasterMapView } from '../../components/location/MasterMapView';
import { NearbyMasterCard } from '../../components/location/NearbyMasterCard';
import { DistanceFilter } from '../../components/location/DistanceFilter';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';

type ViewMode = 'list' | 'map';
type SortBy = 'distance' | 'rating' | 'price' | 'response_time';

export const NearbyMastersScreen: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [radius, setRadius] = useState(5); // km
  const [sortBy, setSortBy] = useState<SortBy>('distance');
  const [serviceCategory, setServiceCategory] = useState<string | undefined>();
  const [refreshing, setRefreshing] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Get nearby masters
  const {
    data: mastersData,
    isLoading,
    error,
    refetch,
  } = useGetNearbyMastersQuery(
    {
      coordinates: location!,
      radius,
      serviceCategory,
      sortBy,
      limit: 50,
    },
    {
      skip: !location,
    }
  );

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Необходимо разрешение на доступ к геолокации');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
      setLocationError(null);
    } catch (err: any) {
      setLocationError('Не удалось определить местоположение');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await getCurrentLocation();
    await refetch();
    setRefreshing(false);
  };

  const handleMasterPress = (masterId: string) => {
    // Navigate to master profile
    console.log('Navigate to master:', masterId);
  };

  const handleFilterChange = (newRadius: number) => {
    setRadius(newRadius);
  };

  const handleSortChange = (newSort: SortBy) => {
    setSortBy(newSort);
  };

  if (!location && !locationError) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Определение местоположения...</Text>
      </View>
    );
  }

  if (locationError) {
    return (
      <View style={styles.centerContainer}>
        <MaterialIcons name="location-off" size={64} color="#EF4444" />
        <Text style={styles.errorTitle}>{locationError}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={getCurrentLocation}>
          <Text style={styles.retryButtonText}>Повторить</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Мастера рядом</Text>
          <View style={styles.viewModeToggle}>
            <TouchableOpacity
              style={[styles.viewModeButton, viewMode === 'list' && styles.viewModeButtonActive]}
              onPress={() => setViewMode('list')}
            >
              <MaterialIcons
                name="view-list"
                size={20}
                color={viewMode === 'list' ? '#3B82F6' : '#6B7280'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewModeButton, viewMode === 'map' && styles.viewModeButtonActive]}
              onPress={() => setViewMode('map')}
            >
              <MaterialIcons
                name="map"
                size={20}
                color={viewMode === 'map' ? '#3B82F6' : '#6B7280'}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filtersContainer}>
          <DistanceFilter
            value={radius}
            onChange={handleFilterChange}
            options={[1, 3, 5, 10, 20, 50]}
          />
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortContainer}>
            <TouchableOpacity
              style={[styles.sortButton, sortBy === 'distance' && styles.sortButtonActive]}
              onPress={() => handleSortChange('distance')}
            >
              <MaterialIcons name="near-me" size={16} color={sortBy === 'distance' ? '#FFF' : '#6B7280'} />
              <Text style={[styles.sortButtonText, sortBy === 'distance' && styles.sortButtonTextActive]}>
                Расстояние
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sortButton, sortBy === 'rating' && styles.sortButtonActive]}
              onPress={() => handleSortChange('rating')}
            >
              <MaterialIcons name="star" size={16} color={sortBy === 'rating' ? '#FFF' : '#6B7280'} />
              <Text style={[styles.sortButtonText, sortBy === 'rating' && styles.sortButtonTextActive]}>
                Рейтинг
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sortButton, sortBy === 'price' && styles.sortButtonActive]}
              onPress={() => handleSortChange('price')}
            >
              <MaterialIcons name="attach-money" size={16} color={sortBy === 'price' ? '#FFF' : '#6B7280'} />
              <Text style={[styles.sortButtonText, sortBy === 'price' && styles.sortButtonTextActive]}>
                Цена
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sortButton, sortBy === 'response_time' && styles.sortButtonActive]}
              onPress={() => handleSortChange('response_time')}
            >
              <MaterialIcons name="schedule" size={16} color={sortBy === 'response_time' ? '#FFF' : '#6B7280'} />
              <Text style={[styles.sortButtonText, sortBy === 'response_time' && styles.sortButtonTextActive]}>
                Отклик
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Results count */}
        {mastersData && (
          <Text style={styles.resultsCount}>
            Найдено {mastersData.totalCount} мастеров в радиусе {radius} км
          </Text>
        )}
      </View>

      {/* Content */}
      {isLoading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorMessage message="Не удалось загрузить список мастеров" />
      ) : viewMode === 'map' ? (
        <MasterMapView
          masters={mastersData?.masters || []}
          userLocation={location!}
          radius={radius}
          onMasterPress={handleMasterPress}
        />
      ) : (
        <ScrollView
          style={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        >
          {mastersData?.masters.map((master) => (
            <NearbyMasterCard
              key={master.id}
              master={master}
              onPress={() => handleMasterPress(master.id)}
            />
          ))}

          {mastersData?.masters.length === 0 && (
            <View style={styles.emptyState}>
              <MaterialIcons name="person-search" size={64} color="#D1D5DB" />
              <Text style={styles.emptyStateText}>Мастера не найдены</Text>
              <Text style={styles.emptyStateSubtext}>
                Попробуйте увеличить радиус поиска
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#FFF',
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  viewModeToggle: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 2,
  },
  viewModeButton: {
    padding: 8,
    borderRadius: 6,
  },
  viewModeButtonActive: {
    backgroundColor: '#FFF',
  },
  filtersContainer: {
    marginBottom: 12,
  },
  sortContainer: {
    marginTop: 12,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    gap: 4,
  },
  sortButtonActive: {
    backgroundColor: '#3B82F6',
  },
  sortButtonText: {
    fontSize: 14,
    color: '#6B7280',
  },
  sortButtonTextActive: {
    color: '#FFF',
  },
  resultsCount: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  listContainer: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
});
