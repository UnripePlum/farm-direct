import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius } from '../../theme';

const CATEGORIES = [
  { id: '1', name: '채소', icon: 'leaf-outline', color: '#4CAF50', bg: '#E8F5E9' },
  { id: '2', name: '과일', icon: 'nutrition-outline', color: '#FF9800', bg: '#FFF3E0' },
  { id: '3', name: '곡물', icon: 'layers-outline', color: '#795548', bg: '#EFEBE9' },
  { id: '4', name: '버섯', icon: 'flower-outline', color: '#9C27B0', bg: '#F3E5F5' },
  { id: '5', name: '나물', icon: 'eco-outline', color: '#8BC34A', bg: '#F1F8E9' },
  { id: '6', name: '견과류', icon: 'ellipse-outline', color: '#FF5722', bg: '#FBE9E7' },
  { id: '7', name: '유제품', icon: 'water-outline', color: '#03A9F4', bg: '#E1F5FE' },
  { id: '8', name: '전체', icon: 'grid-outline', color: Colors.primary, bg: '#E8F5E9' },
];

export const CategoryGrid: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  const handlePress = (categoryId: string, categoryName: string) => {
    if (categoryId === '8') {
      navigation.navigate('Products');
    } else {
      navigation.navigate('Products', { categoryId, categoryName });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>카테고리</Text>
      <View style={styles.grid}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={styles.item}
            onPress={() => handlePress(cat.id, cat.name)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconWrapper, { backgroundColor: cat.bg }]}>
              <Ionicons name={cat.icon as any} size={26} color={cat.color} />
            </View>
            <Text style={styles.name}>{cat.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  title: {
    fontSize: Fonts.sizes.xl,
    fontWeight: Fonts.weights.bold,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  item: {
    width: '21%',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  iconWrapper: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: Fonts.sizes.xs,
    color: Colors.text,
    fontWeight: Fonts.weights.medium,
    textAlign: 'center',
  },
});
