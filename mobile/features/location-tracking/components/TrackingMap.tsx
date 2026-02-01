import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import MapView, { Marker, Polyline, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { LocationCoordinates } from '../../../services/locationTrackingApi';

interface TrackingMapProps {
  currentLocation?: LocationCoordinates;
  locationHistory?: LocationCoordinates[];
  destination?: LocationCoordinates;
  geofenceRadius?: number;
  showRoute?: boolean;
  showGeofence?: boolean;
  onMapReady?: () => void;
}

export const TrackingMap: React.FC<TrackingMapProps> = ({
  currentLocation,
  locationHistory = [],
  destination,
  geofenceRadius = 100,
  showRoute = true,
  showGeofence = false,
  onMapReady,
}) => {
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    if (currentLocation && mapRef.current) {
      // Center map on current location
      mapRef.current.animateToRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  }, [currentLocation]);

  useEffect(() => {
    if (locationHistory.length > 0 && mapRef.current) {
      // Fit map to show entire route
      const coordinates = locationHistory.map(loc => ({
        latitude: loc.latitude,
        longitude: loc.longitude,
      }));

      if (destination) {
        coordinates.push({
          latitude: destination.latitude,
          longitude: destination.longitude,
        });
      }

      if (coordinates.length > 1) {
        mapRef.current.fitToCoordinates(coordinates, {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: true,
        });
      }
    }
  }, [locationHistory, destination]);

  const initialRegion = currentLocation
    ? {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }
    : {
        latitude: 42.8746, // Bishkek default
        longitude: 74.5698,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
        onMapReady={onMapReady}
      >
        {/* Current Location Marker */}
        {currentLocation && (
          <Marker
            coordinate={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
            }}
            title="Текущее местоположение"
            description="Мастер здесь"
          >
            <View style={styles.currentMarker}>
              <Ionicons name="navigate" size={24} color="#0165FB" />
            </View>
          </Marker>
        )}

        {/* Destination Marker */}
        {destination && (
          <Marker
            coordinate={{
              latitude: destination.latitude,
              longitude: destination.longitude,
            }}
            title="Место назначения"
            description="Адрес заказа"
            pinColor="#10B981"
          />
        )}

        {/* Route Polyline */}
        {showRoute && locationHistory.length > 1 && (
          <Polyline
            coordinates={locationHistory.map(loc => ({
              latitude: loc.latitude,
              longitude: loc.longitude,
            }))}
            strokeColor="#0165FB"
            strokeWidth={4}
            lineDashPattern={[0]}
          />
        )}

        {/* Geofence Circle */}
        {showGeofence && destination && (
          <Circle
            center={{
              latitude: destination.latitude,
              longitude: destination.longitude,
            }}
            radius={geofenceRadius}
            strokeColor="rgba(16, 185, 129, 0.5)"
            fillColor="rgba(16, 185, 129, 0.1)"
            strokeWidth={2}
          />
        )}

        {/* Historical Points */}
        {locationHistory.length > 2 && locationHistory.slice(0, -1).map((loc, index) => (
          <Marker
            key={index}
            coordinate={{
              latitude: loc.latitude,
              longitude: loc.longitude,
            }}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.historyPoint} />
          </Marker>
        ))}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7FC',
  },
  map: {
    width: Dimensions.get('window').width,
    height: '100%',
  },
  currentMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  historyPoint: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0165FB',
    borderWidth: 2,
    borderColor: 'white',
  },
});
