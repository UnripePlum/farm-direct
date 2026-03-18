import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RouteProp } from '@react-navigation/native';

export type AuthStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  SignUp: undefined;
  RoleSelect: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Products: undefined;
  Cart: undefined;
  Profile: undefined;
};

export type ProductStackParamList = {
  ProductList: undefined;
  ProductDetail: { productId: number };
};

export type CartStackParamList = {
  Cart: undefined;
  Checkout: undefined;
  OrderConfirm: { orderId: number };
};

export type OrderStackParamList = {
  OrderHistory: undefined;
  OrderDetail: { orderId: number };
};

export type FarmerStackParamList = {
  FarmerDashboard: undefined;
  ProductManage: undefined;
  AddProduct: undefined;
  EditProduct: { productId: number };
  OrderManage: undefined;
};

export type MyPageStackParamList = {
  MyPage: undefined;
  Settings: undefined;
  OrderHistory: undefined;
  Notifications: undefined;
  WriteReview: { orderItemId: number; productId: number; productName: string };
};

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  RoleSelect: undefined;
};

// Navigation prop types
export type AuthNavProp = NativeStackNavigationProp<AuthStackParamList>;
export type MainTabNavProp = BottomTabNavigationProp<MainTabParamList>;
