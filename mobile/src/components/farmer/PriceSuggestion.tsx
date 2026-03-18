import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius } from '../../theme';
import { PriceSuggestion as PriceSuggestionType } from '../../types';
import { formatPrice } from '../../utils/formatters';

interface PriceSuggestionProps {
  suggestion: PriceSuggestionType;
  onApplied?: () => void;
}

const DEMAND_COLORS: Record<string, string> = {
  low: Colors.textSecondary,
  medium: Colors.secondary,
  high: Colors.success,
  very_high: Colors.error,
};

const DEMAND_LABELS: Record<string, string> = {
  low: '낮음',
  medium: '보통',
  high: '높음',
  very_high: '매우 높음',
};

export const PriceSuggestionCard: React.FC<PriceSuggestionProps> = ({ suggestion }) => {
  const demandColor = DEMAND_COLORS[suggestion.demand_level] ?? Colors.textSecondary;
  const demandLabel = DEMAND_LABELS[suggestion.demand_level] ?? suggestion.demand_level;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.productId} numberOfLines={1}>상품 {suggestion.product_id.slice(0, 8)}...</Text>
        <View style={[styles.demandBadge, { backgroundColor: demandColor + '20' }]}>
          <Text style={[styles.demandText, { color: demandColor }]}>
            수요 {demandLabel}
          </Text>
        </View>
      </View>

      <View style={styles.priceComparison}>
        <View style={styles.priceBlock}>
          <Text style={styles.priceLabel}>AI 추천가</Text>
          <Text style={styles.suggestedPrice}>
            {formatPrice(suggestion.suggested_price)}
          </Text>
        </View>
      </View>

      {suggestion.reasoning && (
        <Text style={styles.reasoning} numberOfLines={2}>{suggestion.reasoning}</Text>
      )}

      <View style={styles.footer}>
        <View style={styles.confidenceBar}>
          <Text style={styles.confidenceLabel}>신뢰도</Text>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${suggestion.confidence * 100}%` }]} />
          </View>
          <Text style={styles.confidenceValue}>{Math.round(suggestion.confidence * 100)}%</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.secondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  productId: {
    fontSize: Fonts.sizes.lg,
    fontWeight: Fonts.weights.semibold,
    color: Colors.text,
    flex: 1,
  },
  demandBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  demandText: {
    fontSize: Fonts.sizes.xs,
    fontWeight: Fonts.weights.semibold,
  },
  priceComparison: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    marginBottom: Spacing.md,
  },
  priceBlock: {
    flex: 1,
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: Fonts.sizes.xs,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  suggestedPrice: {
    fontSize: Fonts.sizes.xl,
    fontWeight: Fonts.weights.bold,
    color: Colors.text,
  },
  reasoning: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  confidenceBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  confidenceLabel: {
    fontSize: Fonts.sizes.xs,
    color: Colors.textSecondary,
  },
  barTrack: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.divider,
    borderRadius: 2,
  },
  barFill: {
    height: 4,
    backgroundColor: Colors.secondary,
    borderRadius: 2,
  },
  confidenceValue: {
    fontSize: Fonts.sizes.xs,
    color: Colors.textSecondary,
    minWidth: 30,
  },
});
