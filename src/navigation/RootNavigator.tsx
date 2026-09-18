import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { AuthNavigator } from './AuthNavigator';
import { OfficerTabs } from './OfficerTabs';
import { OwnerTabs } from './OwnerTabs';

export const RootNavigator: React.FC = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const selectedRole = useAuthStore((state) => state.selectedRole);

  if (!isAuthenticated) {
    return <AuthNavigator />;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {selectedRole === 'officer' ? <OfficerTabs /> : <OwnerTabs />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
