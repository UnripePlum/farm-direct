import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthStackParamList } from '../../navigation/types';
import { Colors, Fonts, Spacing, BorderRadius } from '../../theme';
import { ASYNC_STORAGE_KEYS } from '../../utils/constants';

const { width } = Dimensions.get('window');

interface OnboardingScreenProps {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Onboarding'>;
}

const SLIDES = [
  {
    icon: 'leaf' as const,
    iconColor: Colors.primary,
    iconBg: '#DCFCE7',
    title: '농장에서 식탁까지\n직접 연결',
    subtitle: '신선한 농산물을 농부에게 직접 구매하세요.\n중간 유통 없이 더 신선하고 합리적인 가격으로.',
    bg: '#F0FDF4',
  },
  {
    icon: 'sparkles' as const,
    iconColor: Colors.secondary,
    iconBg: '#FEF3C7',
    title: 'AI가 추천하는\n최적의 가격',
    subtitle: '인공지능이 시장 데이터를 분석하여\n농부에게는 최적의 판매가를, 소비자에게는 합리적인 가격을.',
    bg: '#FFFBEB',
  },
  {
    icon: 'people' as const,
    iconColor: '#3B82F6',
    iconBg: '#DBEAFE',
    title: '농부와 소비자를\n잇는 플랫폼',
    subtitle: '신뢰 기반의 직거래 커뮤니티에서\n신선한 만남을 시작하세요.',
    bg: '#EFF6FF',
  },
];

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ navigation }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({ x: (currentIndex + 1) * width, animated: true });
      setCurrentIndex(currentIndex + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    await AsyncStorage.setItem(ASYNC_STORAGE_KEYS.ONBOARDING_COMPLETE, 'true');
    navigation.replace('Login');
  };

  const handleScroll = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);
  };

  const currentSlide = SLIDES[currentIndex];

  return (
    <View style={[styles.container, { backgroundColor: currentSlide.bg }]}>
      <TouchableOpacity style={styles.skipButton} onPress={handleComplete}>
        <Text style={styles.skipText}>건너뛰기</Text>
      </TouchableOpacity>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
      >
        {SLIDES.map((slide, index) => (
          <View key={index} style={[styles.slide, { backgroundColor: slide.bg }]}>
            <View style={[styles.iconCircle, { backgroundColor: slide.iconBg }]}>
              <Ionicons name={slide.icon} size={80} color={slide.iconColor} />
            </View>
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.subtitle}>{slide.subtitle}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentIndex ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.nextButton, { backgroundColor: currentSlide.iconColor }]}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          {currentIndex < SLIDES.length - 1 ? (
            <Ionicons name="arrow-forward" size={24} color={Colors.white} />
          ) : (
            <Text style={styles.startText}>시작하기</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: Spacing.xl,
    zIndex: 10,
    padding: Spacing.sm,
  },
  skipText: {
    fontSize: Fonts.sizes.md,
    color: Colors.textSecondary,
  },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxxl,
    paddingTop: 80,
  },
  iconCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xxxl,
  },
  title: {
    fontSize: Fonts.sizes.xxxl,
    fontWeight: Fonts.weights.extrabold,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: Fonts.sizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dots: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 24,
    backgroundColor: Colors.primary,
  },
  dotInactive: {
    width: 8,
    backgroundColor: Colors.border,
  },
  nextButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startText: {
    color: Colors.white,
    fontSize: Fonts.sizes.sm,
    fontWeight: Fonts.weights.bold,
  },
});
