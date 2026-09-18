import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { RoleSelectScreen } from '../screens/auth/RoleSelectScreen';
import { PhoneAuthScreen } from '../screens/auth/PhoneAuthScreen';

interface AuthNavigatorProps {
  onAuthenticated?: () => void;
}

export const AuthNavigator: React.FC<AuthNavigatorProps> = ({ onAuthenticated }) => {
  const [currentStep, setCurrentStep] = useState<'role' | 'otp'>('role');

  return (
    <View style={styles.container}>
      {currentStep === 'role' ? (
        <RoleSelectScreen onContinueToOtp={() => setCurrentStep('otp')} />
      ) : (
        <PhoneAuthScreen
          onBackToRole={() => setCurrentStep('role')}
          onSuccess={onAuthenticated}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
