import React, { useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import MapView, { Marker, Circle, PROVIDER_DEFAULT } from 'react-native-maps';
import { MaterialIcons } from '@expo/vector-icons';

interface Master {
  id: string;
  name: string;
  avatar?: string;
  rating: number;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  distance: number;
  isOnline: boolean;
}

interface MasterMapViewProps {
  masters: Master[];
  userLocation: {
    latitude: number;
    longitude: number;
  };
  radius: number;
  onMasterPress: (masterId: string) => void;
}

export const MasterMapView: React.FC<MasterMapViewProps> = ({
  masters,
  userLocation,
  radius,
  onMasterPress,
}) => {
  const [selectedMaster, setSelectedMaster] = useState<Master | null>(null);
  const mapRef = useRef<MapView>(null);

  const handleMarkerPress = (master: Master) => {
    setSelectedMaster(master);
    mapRef.current?.animateToRegion({
      latitude: master.coordinates.latitude,
      longitude: master.coordinates.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  };

  const handleRecenter = () => {
    mapRef.current?.animateToRegion({
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      latitudeDelta: radius / 55, // Approximate conversion
      longitudeDelta: radius / 55,
    });
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={{
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: radius / 55,
          longitudeDelta: radius / 55,
        }}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {/* Search radius circle */}
        <Circle
          center={userLocation}
          radius={radius * 1000} // Convert km to meters
          strokeColor="rgba(59, 130, 246, 0.5)"
          fillColor="rgba(59, 130, 246, 0.1)"
          strokeWidth={2}
        />

        {/* Master markers */}
        {masters.map((master) => (
          <Marker
            key={master.id}
            coordinate={master.coordinates}
            onPress={() => handleMarkerPress(master)}
          >
            <View style={styles.markerContainer}>
              <View
                style={[
                  styles.marker,
                  selectedMaster?.id === master.id && styles.markerSelected,
                ]}
              >
                <MaterialIcons
                  name="person"
                  size={20}
                  color={selectedMaster?.id === master.id ? '#FFF' : '#3B82F6'}
                />
                {master.isOnline && <View style={styles.onlineBadge} />}
              </View>
              <View style={styles.markerArrow} />
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Recenter button */}
      <TouchableOpacity style={styles.recenterButton} onPress={handleRecenter}>
        <MaterialIcons name="my-location" size={24} color="#3B82F6" />
      </TouchableOpacity>

      {/* Selected master card */}
      {selectedMaster && (
        <View style={styles.selectedCard}>
          <View style={styles.selectedCardContent}>
            <View style={styles.selectedCardInfo}>
              <Text style={styles.selectedCardName} numberOfLines={1}>
                {selectedMaster.name}
              </Text>
              <View style={styles.selectedCardMeta}>
                <MaterialIcons name="star" size={14} color="#F59E0B" />
                <Text style={styles.selectedCardRating}>{selectedMaster.rating}</Text>
                <Text style={styles.selectedCardDistance}>
                  • {selectedMaster.distance.toFixed(1)} км
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.selectedCardButton}
              onPress={() => onMasterPress(selectedMaster.id)}
            >
              <Text style={styles.selectedCardButtonText}>Открыть</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setSelectedMaster(null)}
          >
            <MaterialIcons name="close" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
  },
  marker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3B82F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  markerSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#1D4ED8',
  },
  onlineBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  markerArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#FFF',
    marginTop: -2,
  },
  recenterButton: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  selectedCard: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  selectedCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedCardInfo: {
    flex: 1,
  },
  selectedCardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  selectedCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedCardRating: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginLeft: 4,
  },
  selectedCardDistance: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  selectedCardButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  selectedCardButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
  },
});
