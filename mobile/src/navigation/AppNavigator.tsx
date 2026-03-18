import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import { setTokenGetter, setUnauthorizedHandler } from '../api/client';
import { AuthNavigator } from './AuthNavigator';
import { MainTabNavigator } from './MainTabNavigator';
import { RoleSelectScreen } from '../screens/auth/RoleSelectScreen';
import { Colors } from '../theme';

const Root = createNativeStackNavigator();

export const AppNavigator: React.FC = () => {
  const { isAuthenticated, isLoading, user, loadStoredAuth, logout, getToken } = useAuthStore();

  useEffect(() => {
    // Wire up API client with auth store
    setTokenGetter(getToken);
    setUnauthorizedHandler(logout);
    // Load persisted auth
    loadStoredAuth();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const hasRole = user?.role != null;

  return (
    <Root.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      {!isAuthenticated ? (
        <Root.Screen name="Auth" component={AuthNavigator} />
      ) : !hasRole ? (
        <Root.Screen name="RoleSelect" component={RoleSelectScreen} />
      ) : (
        <Root.Screen name="Main" component={MainTabNavigator} />
      )}
    </Root.Navigator>
  );
};

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
});
