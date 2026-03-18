import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius, Shadows } from '../../theme';
import { formatPrice } from '../../utils/formatters';

interface StatItem {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  bg: string;
  trend?: string;
  trendUp?: boolean;
}

interface SalesStatsProps {
  totalSales: number;
  totalOrders: number;
  pendingOrders: number;
  averageRating: number;
}

export const SalesStats: React.FC<SalesStatsProps> = ({
  totalSales,
  totalOrders,
  pendingOrders,
  averageRating,
}) => {
  const stats: StatItem[] = [
    {
      label: '총 매출',
      value: formatPrice(totalSales),
      icon: 'cash-outline',
      color: Colors.success,
      bg: '#D1FAE5',
      trend: '+12%',
      trendUp: true,
    },
    {
      label: '총 주문',
      value: `${totalOrders}건`,
      icon: 'bag-outline',
      color: Colors.primary,
      bg: '#DCFCE7',
      trend: '+8%',
      trendUp: true,
    },
    {
      label: '처리 대기',
      value: `${pendingOrders}건`,
      icon: 'time-outline',
      color: Colors.secondary,
      bg: '#FEF3C7',
    },
    {
      label: '평균 평점',
      value: `${averageRating.toFixed(1)}점`,
      icon: 'star-outline',
      color: '#F59E0B',
      bg: '#FEF3C7',
    },
  ];

  return (
    <View style={styles.grid}>
      {stats.map((stat, index) => (
        <View key={index} style={styles.card}>
          <View style={[styles.iconWrapper, { backgroundColor: stat.bg }]}>
            <Ionicons name={stat.icon as any} size={22} color={stat.color} />
          </View>
          <Text style={styles.value}>{stat.value}</Text>
          <Text style={styles.label}>{stat.label}</Text>
          {stat.trend && (
            <View style={styles.trendRow}>
              <Ionicons
                name={stat.trendUp ? 'trending-up' : 'trending-down'}
                size={12}
                color={stat.trendUp ? Colors.success : Colors.error}
              />
              <Text style={[styles.trend, { color: stat.trendUp ? Colors.success : Colors.error }]}>
                {stat.trend}
              </Text>
            </View>
          )}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  card: {
    width: '47%',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.small,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  value: {
    fontSize: Fonts.sizes.xl,
    fontWeight: Fonts.weights.bold,
    color: Colors.text,
    marginBottom: 4,
  },
  label: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textSecondary,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 4,
  },
  trend: {
    fontSize: Fonts.sizes.xs,
    fontWeight: Fonts.weights.semibold,
  },
});
