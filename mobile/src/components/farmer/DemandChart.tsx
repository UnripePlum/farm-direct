import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius } from '../../theme';
import { DemandForecast } from '../../types';
import { formatDate } from '../../utils/formatters';

interface DemandChartProps {
  forecasts: DemandForecast[];
}

const TREND_CONFIG = {
  increasing: { icon: 'trending-up', color: Colors.success, label: '수요 증가' },
  stable: { icon: 'remove', color: Colors.secondary, label: '수요 안정' },
  decreasing: { icon: 'trending-down', color: Colors.error, label: '수요 감소' },
};

export const DemandChart: React.FC<DemandChartProps> = ({ forecasts }) => {
  if (!forecasts || forecasts.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>수요 예측 데이터가 없습니다</Text>
      </View>
    );
  }

  const maxDemand = Math.max(...forecasts.map((f) => f.predicted_demand));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>7일 수요 예측</Text>
      <View style={styles.bars}>
        {forecasts.slice(0, 7).map((forecast, index) => {
          const height = maxDemand > 0 ? (forecast.predicted_demand / maxDemand) * 80 : 10;
          const trend = TREND_CONFIG[forecast.trend];
          return (
            <View key={index} style={styles.barItem}>
              <Text style={styles.barValue}>{forecast.predicted_demand}</Text>
              <View style={[styles.bar, { height, backgroundColor: trend.color }]} />
              <Text style={styles.barDate}>
                {formatDate(forecast.period_start).slice(8, 10)}일
              </Text>
            </View>
          );
        })}
      </View>
      {forecasts[0] && (
        <View style={styles.trendBadge}>
          <Ionicons name={TREND_CONFIG[forecasts[0].trend].icon as any} size={14} color={TREND_CONFIG[forecasts[0].trend].color} />
          <Text style={[styles.trendText, { color: TREND_CONFIG[forecasts[0].trend].color }]}>
            {TREND_CONFIG[forecasts[0].trend].label}
          </Text>
          <Text style={styles.confidenceText}>
            (신뢰도 {Math.round(forecasts[0].confidence * 100)}%)
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
  },
  title: {
    fontSize: Fonts.sizes.lg,
    fontWeight: Fonts.weights.bold,
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    height: 100,
  },
  barItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  barValue: {
    fontSize: Fonts.sizes.xs,
    color: Colors.textSecondary,
  },
  bar: {
    width: '100%',
    borderRadius: BorderRadius.sm,
    minHeight: 6,
  },
  barDate: {
    fontSize: Fonts.sizes.xs,
    color: Colors.textSecondary,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.md,
  },
  trendText: {
    fontSize: Fonts.sizes.sm,
    fontWeight: Fonts.weights.semibold,
  },
  confidenceText: {
    fontSize: Fonts.sizes.xs,
    color: Colors.textSecondary,
  },
  empty: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: Fonts.sizes.sm,
  },
});
