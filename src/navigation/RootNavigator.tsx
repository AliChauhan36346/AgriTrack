import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { AuthNavigator } from './AuthNavigator';
import { OwnerTabsNavigator } from './OwnerTabsNavigator';
import { OfficerStackNavigator } from './OfficerStackNavigator';

export const RootNavigator: React.FC = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const userRole = useAuthStore((state) => state.userRole);

  if (!isAuthenticated) {
    return <AuthNavigator />;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {userRole === 'owner' ? <OwnerTabsNavigator /> : <OfficerStackNavigator />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

