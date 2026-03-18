import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius, Shadows } from '../../theme';
import { formatPrice } from '../../utils/formatters';

const MOCK_TRENDS = [
  { name: '대파', price: 2800, change: 12, trend: 'up' as const },
  { name: '감자', price: 3500, change: -5, trend: 'down' as const },
  { name: '사과', price: 8900, change: 3, trend: 'up' as const },
  { name: '쌀(5kg)', price: 18000, change: 0, trend: 'stable' as const },
];

export const PriceTrendWidget: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="analytics-outline" size={20} color={Colors.primary} />
          <Text style={styles.title}>오늘의 시세</Text>
        </View>
        <Text style={styles.subtitle}>AI 기반 실시간 농산물 가격</Text>
      </View>
      <View style={styles.grid}>
        {MOCK_TRENDS.map((item, index) => (
          <View key={index} style={styles.trendItem}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
            <View style={styles.changeRow}>
              <Ionicons
                name={
                  item.trend === 'up'
                    ? 'trending-up'
                    : item.trend === 'down'
                    ? 'trending-down'
                    : 'remove'
                }
                size={12}
                color={
                  item.trend === 'up'
                    ? Colors.error
                    : item.trend === 'down'
                    ? Colors.success
                    : Colors.textSecondary
                }
              />
              <Text
                style={[
                  styles.changeText,
                  item.trend === 'up'
                    ? styles.changeUp
                    : item.trend === 'down'
                    ? styles.changeDown
                    : styles.changeStable,
                ]}
              >
                {item.change > 0 ? '+' : ''}
                {item.change}%
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: Spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.small,
  },
  header: {
    marginBottom: Spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: 4,
  },
  title: {
    fontSize: Fonts.sizes.lg,
    fontWeight: Fonts.weights.bold,
    color: Colors.text,
  },
  subtitle: {
    fontSize: Fonts.sizes.xs,
    color: Colors.textSecondary,
    marginLeft: 28,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  trendItem: {
    width: '47%',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  itemName: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: Fonts.sizes.lg,
    fontWeight: Fonts.weights.bold,
    color: Colors.text,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  changeText: {
    fontSize: Fonts.sizes.xs,
    fontWeight: Fonts.weights.semibold,
  },
  changeUp: { color: Colors.error },
  changeDown: { color: Colors.success },
  changeStable: { color: Colors.textSecondary },
});
