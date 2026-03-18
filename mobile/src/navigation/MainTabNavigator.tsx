import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '../theme';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';

// Screens
import { HomeScreen } from '../screens/home/HomeScreen';
import { ProductListScreen } from '../screens/product/ProductListScreen';
import { ProductDetailScreen } from '../screens/product/ProductDetailScreen';
import { CartScreen } from '../screens/cart/CartScreen';
import { CheckoutScreen } from '../screens/cart/CheckoutScreen';
import { OrderConfirmScreen } from '../screens/order/OrderConfirmScreen';
import { OrderHistoryScreen } from '../screens/order/OrderHistoryScreen';
import { WriteReviewScreen } from '../screens/review/WriteReviewScreen';
import { FarmerDashboardScreen } from '../screens/farmer/FarmerDashboardScreen';
import { ProductManageScreen } from '../screens/farmer/ProductManageScreen';
import { OrderManageScreen } from '../screens/farmer/OrderManageScreen';
import { AddProductScreen } from '../screens/farmer/AddProductScreen';
import { MyPageScreen } from '../screens/mypage/MyPageScreen';
import { SettingsScreen } from '../screens/mypage/SettingsScreen';
import { NotificationScreen } from '../screens/notification/NotificationScreen';

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const ProductStack = createNativeStackNavigator();
const CartStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

const HomeStackNavigator = () => (
  <HomeStack.Navigator screenOptions={{ headerShown: false }}>
    <HomeStack.Screen name="HomeMain" component={HomeScreen} />
    <HomeStack.Screen name="Notifications" component={NotificationScreen} />
    <HomeStack.Screen name="ProductDetail" component={ProductDetailScreen} />
  </HomeStack.Navigator>
);

const ProductStackNavigator = () => (
  <ProductStack.Navigator screenOptions={{ headerShown: false }}>
    <ProductStack.Screen name="ProductList" component={ProductListScreen} />
    <ProductStack.Screen name="ProductDetail" component={ProductDetailScreen} />
  </ProductStack.Navigator>
);

const CartStackNavigator = () => (
  <CartStack.Navigator screenOptions={{ headerShown: false }}>
    <CartStack.Screen name="CartMain" component={CartScreen} />
    <CartStack.Screen name="Checkout" component={CheckoutScreen} />
    <CartStack.Screen name="OrderConfirm" component={OrderConfirmScreen} />
    <CartStack.Screen name="OrderHistory" component={OrderHistoryScreen} />
    <CartStack.Screen name="WriteReview" component={WriteReviewScreen} />
  </CartStack.Navigator>
);

const FarmerProfileStack = () => (
  <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
    <ProfileStack.Screen name="FarmerDashboard" component={FarmerDashboardScreen} />
    <ProfileStack.Screen name="ProductManage" component={ProductManageScreen} />
    <ProfileStack.Screen name="AddProduct" component={AddProductScreen} />
    <ProfileStack.Screen name="OrderManage" component={OrderManageScreen} />
    <ProfileStack.Screen name="Notifications" component={NotificationScreen} />
  </ProfileStack.Navigator>
);

const ConsumerProfileStack = () => (
  <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
    <ProfileStack.Screen name="MyPage" component={MyPageScreen} />
    <ProfileStack.Screen name="Settings" component={SettingsScreen} />
    <ProfileStack.Screen name="OrderHistory" component={OrderHistoryScreen} />
    <ProfileStack.Screen name="Notifications" component={NotificationScreen} />
    <ProfileStack.Screen name="WriteReview" component={WriteReviewScreen} />
    <ProfileStack.Screen name="Cart" component={CartScreen} />
  </ProfileStack.Navigator>
);

export const MainTabNavigator: React.FC = () => {
  const { user } = useAuthStore();
  const isFarmer = user?.role === 'farmer';
  const { getTotalItems } = useCartStore();
  const cartCount = getTotalItems();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home-outline';
          if (route.name === 'HomeTab') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'ProductsTab') iconName = focused ? 'leaf' : 'leaf-outline';
          else if (route.name === 'CartTab') iconName = focused ? 'bag' : 'bag-outline';
          else if (route.name === 'ProfileTab') iconName = focused ? 'person' : 'person-outline';
          return (
            <View style={styles.iconWrapper}>
              <Ionicons name={iconName} size={size} color={color} />
              {route.name === 'CartTab' && cartCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cartCount > 9 ? '9+' : cartCount}</Text>
                </View>
              )}
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeStackNavigator} options={{ tabBarLabel: '홈' }} />
      <Tab.Screen name="ProductsTab" component={ProductStackNavigator} options={{ tabBarLabel: '상품' }} />
      <Tab.Screen name="CartTab" component={CartStackNavigator} options={{ tabBarLabel: '장바구니' }} />
      <Tab.Screen
        name="ProfileTab"
        component={isFarmer ? FarmerProfileStack : ConsumerProfileStack}
        options={{ tabBarLabel: isFarmer ? '농장' : '마이' }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingBottom: 8,
    paddingTop: 8,
    height: 70,
  },
  tabLabel: {
    fontSize: Fonts.sizes.xs,
    fontWeight: Fonts.weights.medium,
  },
  iconWrapper: {
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -6,
    right: -8,
    backgroundColor: Colors.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  cartBadgeText: {
    fontSize: 9,
    color: Colors.white,
    fontWeight: Fonts.weights.bold,
  },
});
