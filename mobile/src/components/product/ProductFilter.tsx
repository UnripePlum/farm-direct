import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Fonts, Spacing, BorderRadius } from '../../theme';

interface FilterChip {
  id: string;
  label: string;
}

interface ProductFilterProps {
  selectedCategory: string | null;
  onCategoryChange: (categoryId: string | null) => void;
  onOrganicToggle: (value: boolean) => void;
  isOrganic: boolean;
  onSortChange: (sort: string) => void;
  currentSort: string;
}

const SORT_OPTIONS: FilterChip[] = [
  { id: '-created_at', label: '최신순' },
  { id: 'price', label: '낮은가격' },
  { id: '-price', label: '높은가격' },
  { id: '-stock', label: '재고순' },
];

const CATEGORIES: FilterChip[] = [
  { id: '1', label: '채소' },
  { id: '2', label: '과일' },
  { id: '3', label: '곡물' },
  { id: '4', label: '버섯' },
  { id: '5', label: '나물' },
  { id: '6', label: '견과류' },
];

export const ProductFilter: React.FC<ProductFilterProps> = ({
  selectedCategory,
  onCategoryChange,
  onOrganicToggle,
  isOrganic,
  onSortChange,
  currentSort,
}) => {
  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity
          style={[styles.chip, isOrganic && styles.chipActive]}
          onPress={() => onOrganicToggle(!isOrganic)}
        >
          <Text style={[styles.chipText, isOrganic && styles.chipTextActive]}>🌿 유기농</Text>
        </TouchableOpacity>

        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.chip, selectedCategory === cat.id && styles.chipActive]}
            onPress={() => onCategoryChange(selectedCategory === cat.id ? null : cat.id)}
          >
            <Text style={[styles.chipText, selectedCategory === cat.id && styles.chipTextActive]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}

        <View style={styles.divider} />

        {SORT_OPTIONS.map((sort) => (
          <TouchableOpacity
            key={sort.id}
            style={[styles.chip, currentSort === sort.id && styles.chipActive]}
            onPress={() => onSortChange(sort.id)}
          >
            <Text style={[styles.chipText, currentSort === sort.id && styles.chipTextActive]}>
              {sort.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textSecondary,
    fontWeight: Fonts.weights.medium,
  },
  chipTextActive: {
    color: Colors.white,
    fontWeight: Fonts.weights.semibold,
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.xs,
  },
});
