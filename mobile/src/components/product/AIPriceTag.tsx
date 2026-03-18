import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius } from '../../theme';
import { formatPrice } from '../../utils/formatters';

interface AIPriceTagProps {
  currentPrice: number;
  suggestedPrice: number;
  confidence?: number;
}

export const AIPriceTag: React.FC<AIPriceTagProps> = ({
  currentPrice,
  suggestedPrice,
  confidence,
}) => {
  const diff = suggestedPrice - currentPrice;
  const diffPercent = Math.abs(Math.round((diff / currentPrice) * 100));
  const isHigher = diff > 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="sparkles" size={14} color={Colors.secondary} />
        <Text style={styles.title}>AI 추천가</Text>
        {confidence != null && (
          <View style={styles.confidence}>
            <Text style={styles.confidenceText}>{Math.round(confidence * 100)}% 신뢰도</Text>
          </View>
        )}
      </View>
      <View style={styles.priceRow}>
        <Text style={styles.suggestedPrice}>{formatPrice(suggestedPrice)}</Text>
        <View style={[styles.diffBadge, isHigher ? styles.diffUp : styles.diffDown]}>
          <Ionicons
            name={isHigher ? 'trending-up' : 'trending-down'}
            size={12}
            color={isHigher ? Colors.error : Colors.success}
          />
          <Text style={[styles.diffText, isHigher ? styles.diffTextUp : styles.diffTextDown]}>
            {diffPercent}%
          </Text>
        </View>
      </View>
      <Text style={styles.currentLabel}>현재가: {formatPrice(currentPrice)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF8E1',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: Fonts.sizes.xs,
    color: Colors.secondary,
    fontWeight: Fonts.weights.semibold,
    flex: 1,
  },
  confidence: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  confidenceText: {
    fontSize: Fonts.sizes.xs,
    color: '#92400E',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  suggestedPrice: {
    fontSize: Fonts.sizes.xl,
    fontWeight: Fonts.weights.bold,
    color: Colors.text,
  },
  diffBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  diffUp: { backgroundColor: '#FEE2E2' },
  diffDown: { backgroundColor: '#D1FAE5' },
  diffText: { fontSize: Fonts.sizes.xs, fontWeight: Fonts.weights.semibold },
  diffTextUp: { color: Colors.error },
  diffTextDown: { color: Colors.success },
  currentLabel: {
    fontSize: Fonts.sizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
