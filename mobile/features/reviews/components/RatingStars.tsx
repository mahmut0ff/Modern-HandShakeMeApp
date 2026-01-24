import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../constants/Colors';

export interface RatingStarsProps {
  rating: number; // 1-5
  size?: 'small' | 'medium' | 'large';
  interactive?: boolean; // Input mode vs display mode
  onChange?: (rating: number) => void;
}

const SIZE_MAP = {
  small: 16,
  medium: 24,
  large: 32,
};

const getRatingColor = (rating: number): string => {
  if (rating >= 4.5) return Colors.yellow[500]; // Gold for excellent
  if (rating >= 3.5) return Colors.yellow[600]; // Orange for good
  if (rating >= 2.5) return Colors.warning; // Yellow for average
  if (rating >= 1.5) return Colors.yellow[700]; // Dark orange for below average
  return Colors.red[500]; // Red for poor
};

export const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  size = 'medium',
  interactive = false,
  onChange,
}) => {
  const iconSize = SIZE_MAP[size];
  const color = getRatingColor(rating);

  const handleStarPress = (starIndex: number) => {
    if (interactive && onChange) {
      onChange(starIndex + 1);
    }
  };

  const renderStar = (index: number) => {
    const starValue = index + 1;
    const filled = rating >= starValue;
    const halfFilled = !filled && rating >= starValue - 0.5;

    let iconName: keyof typeof Ionicons.glyphMap;
    if (filled) {
      iconName = 'star';
    } else if (halfFilled) {
      iconName = 'star-half';
    } else {
      iconName = 'star-outline';
    }

    const StarComponent = interactive ? TouchableOpacity : View;

    return (
      <StarComponent
        key={index}
        onPress={interactive ? () => handleStarPress(index) : undefined}
        style={styles.starContainer}
        activeOpacity={0.7}
      >
        <Ionicons name={iconName} size={iconSize} color={color} />
      </StarComponent>
    );
  };

  return (
    <View style={styles.container}>
      {[0, 1, 2, 3, 4].map((index) => renderStar(index))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starContainer: {
    marginHorizontal: 2,
  },
});
