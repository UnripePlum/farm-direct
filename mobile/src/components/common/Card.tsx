import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, BorderRadius, Shadows, Spacing } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  shadow?: 'small' | 'medium' | 'large' | 'none';
  padding?: number;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  shadow = 'small',
  padding = Spacing.lg,
}) => {
  const shadowStyle = shadow !== 'none' ? Shadows[shadow] : {};

  return (
    <View style={[styles.card, shadowStyle, { padding }, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
  },
});
