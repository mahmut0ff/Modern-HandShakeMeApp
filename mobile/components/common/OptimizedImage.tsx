import React, { useState } from 'react';
import { Image, View, ActivityIndicator, StyleSheet, ImageStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface OptimizedImageProps {
  uri: string;
  width?: number;
  height?: number;
  style?: ImageStyle;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
  placeholder?: boolean;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  uri,
  width,
  height,
  style,
  resizeMode = 'cover',
  placeholder = true,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const optimizedUri = uri.includes('?')
    ? `${uri}&w=${width || 400}&q=80`
    : `${uri}?w=${width || 400}&q=80`;

  if (error) {
    return (
      <View style={[styles.placeholder, { width, height }, style]}>
        <Ionicons name="image-outline" size={40} color="#CCC" />
      </View>
    );
  }

  return (
    <View style={[{ width, height }, style]}>
      {loading && placeholder && (
        <View style={[styles.placeholder, StyleSheet.absoluteFill]}>
          <ActivityIndicator size="small" color="#007AFF" />
        </View>
      )}
      <Image
        source={{ uri: optimizedUri }}
        style={[{ width, height }, style]}
        resizeMode={resizeMode}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
