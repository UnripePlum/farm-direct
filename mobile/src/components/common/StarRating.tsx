import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '../../theme';

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: number;
  editable?: boolean;
  onRatingChange?: (rating: number) => void;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxStars = 5,
  size = 16,
  editable = false,
  onRatingChange,
}) => {
  return (
    <View style={styles.container}>
      {Array.from({ length: maxStars }, (_, i) => {
        const filled = i < Math.floor(rating);
        const half = !filled && i < rating;
        const name = filled ? 'star' : half ? 'star-half' : 'star-outline';

        if (editable) {
          return (
            <TouchableOpacity key={i} onPress={() => onRatingChange?.(i + 1)}>
              <Ionicons name={name} size={size} color={Colors.secondary} />
            </TouchableOpacity>
          );
        }

        return <Ionicons key={i} name={name} size={size} color={Colors.secondary} />;
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 2,
  },
});
