import React from 'react';
import { View, StyleSheet } from 'react-native';
import { RoleSelectScreen } from '../screens/auth/RoleSelectScreen';

interface AuthNavigatorProps {
  onAuthenticated?: () => void;
}

export const AuthNavigator: React.FC<AuthNavigatorProps> = () => {
  return (
    <View style={styles.container}>
      <RoleSelectScreen />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
