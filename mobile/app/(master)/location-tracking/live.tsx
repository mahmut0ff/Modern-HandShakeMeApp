import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { TrackingMap } from '../../../features/location-tracking/components/TrackingMap';
import {
  getActiveSessions,
  updateLocation,
  getCurrentLocation,
  LocationTracking,
  LocationCoordinates,
} from '../../../services/locationTrackingApi';
import { safeNavigate } from '../../../hooks/useNavigation';

export default function LiveTrackingScreen() {
  const [tracking, setTracking] = useState<LocationTracking | null>(null);
  const [currentLocation, setCurrentLocation] = useState<LocationCoordinates | null>(null);
  const [locationHistory, setLocationHistory] = useState<LocationCoordinates[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTracking, setIsTracking] = useState(false);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    loadTracking();
    return () => {
      stopLocationUpdates();
    };
  }, []);

  const loadTracking = async () => {
    try {
      setLoading(true);

      // Get active tracking session
      const sessionsData = await getActiveSessions();
      if (sessionsData.sessions.length === 0) {
        Alert.alert('Ошибка', 'Нет активного отслеживания', [
          { text: 'OK', onPress: () => safeNavigate.back() },
        ]);
        return;
      }

      const activeTracking = sessionsData.sessions[0];
      setTracking(activeTracking);

      // Get current location and history
      const locationData = await getCurrentLocation({
        bookingId: activeTracking.bookingId,
        projectId: activeTracking.projectId,
      });

      if (locationData.location) {
        setCurrentLocation(locationData.location);
      }

      // Start location updates
      startLocationUpdates(activeTracking);
    } catch (error: any) {
      console.error('Failed to load tracking:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить данные отслеживания');
    } finally {
      setLoading(false);
    }
  };

  const startLocationUpdates = async (trackingSession: LocationTracking) => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Ошибка', 'Необходимо разрешение на доступ к геолокации');
        return;
      }

      setIsTracking(true);

      // Subscribe to location updates
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: trackingSession.settings.highAccuracyMode
            ? Location.Accuracy.High
            : Location.Accuracy.Balanced,
          timeInterval: trackingSession.settings.updateInterval * 1000,
          distanceInterval: 10, // Update every 10 meters
        },
        async (location) => {
          const newLocation: LocationCoordinates = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy || undefined,
            altitude: location.coords.altitude || undefined,
            heading: location.coords.heading || undefined,
            speed: location.coords.speed || undefined,
          };

          setCurrentLocation(newLocation);
          setLocationHistory((prev) => [...prev, newLocation]);

          // Send update to server
          try {
            await updateLocation({
              bookingId: trackingSession.bookingId,
              projectId: trackingSession.projectId,
              location: newLocation,
            });
          } catch (error) {
            console.error('Failed to update location:', error);
          }
        }
      );
    } catch (error) {
      console.error('Failed to start location updates:', error);
      Alert.alert('Ошибка', 'Не удалось начать обновление местоположения');
    }
  };

  const stopLocationUpdates = () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
    setIsTracking(false);
  };

  const handleCenterOnLocation = () => {
    // Map will auto-center when currentLocation changes
    if (currentLocation) {
      setCurrentLocation({ ...currentLocation });
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#F8F7FC]">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0165FB" />
        </View>
      </SafeAreaView>
    );
  }

  if (!tracking) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Map */}
      <TrackingMap
        currentLocation={currentLocation || undefined}
        locationHistory={locationHistory}
        showRoute={true}
        showGeofence={false}
      />

      {/* Header Overlay */}
      <SafeAreaView style={styles.headerOverlay}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>

          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Отслеживание</Text>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>В реальном времени</Text>
            </View>
          </View>

          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        {/* Stats Card */}
        {currentLocation && (
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Ionicons name="speedometer-outline" size={20} color="#6B7280" />
              <Text style={styles.statValue}>
                {currentLocation.speed
                  ? `${Math.round(currentLocation.speed * 3.6)} км/ч`
                  : '0 км/ч'}
              </Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Ionicons name="locate-outline" size={20} color="#6B7280" />
              <Text style={styles.statValue}>
                {currentLocation.accuracy
                  ? `±${Math.round(currentLocation.accuracy)} м`
                  : 'N/A'}
              </Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Ionicons name="location-outline" size={20} color="#6B7280" />
              <Text style={styles.statValue}>{locationHistory.length} точек</Text>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            onPress={handleCenterOnLocation}
            style={styles.centerButton}
          >
            <Ionicons name="locate" size={24} color="#0165FB" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(master)/location-tracking/history')}
            style={styles.historyButton}
          >
            <Ionicons name="time-outline" size={20} color="white" />
            <Text style={styles.historyButtonText}>История</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tracking Status Indicator */}
      {isTracking && (
        <View style={styles.trackingIndicator}>
          <View style={styles.trackingDot} />
          <Text style={styles.trackingText}>Отслеживание активно</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7FC',
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  centerButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  historyButton: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#0165FB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  historyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  trackingIndicator: {
    position: 'absolute',
    top: 120,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  trackingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 8,
  },
  trackingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
});
