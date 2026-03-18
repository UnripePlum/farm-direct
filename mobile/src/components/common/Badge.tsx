import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Fonts, BorderRadius, Spacing } from '../../theme';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'organic' | 'default';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

const VARIANT_STYLES: Record<BadgeVariant, { bg: string; text: string }> = {
  success: { bg: '#D1FAE5', text: '#065F46' },
  warning: { bg: '#FEF3C7', text: '#92400E' },
  error: { bg: '#FEE2E2', text: '#991B1B' },
  info: { bg: '#DBEAFE', text: '#1E40AF' },
  organic: { bg: '#DCFCE7', text: '#166534' },
  default: { bg: Colors.divider, text: Colors.textSecondary },
};

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'default', style }) => {
  const variantStyle = VARIANT_STYLES[variant];
  return (
    <View style={[styles.badge, { backgroundColor: variantStyle.bg }, style]}>
      <Text style={[styles.text, { color: variantStyle.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: Fonts.sizes.xs,
    fontWeight: Fonts.weights.semibold,
  },
});
