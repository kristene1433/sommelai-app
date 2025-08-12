import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { CommonActions } from '@react-navigation/native';

export default function PaymentSuccessScreen({ navigation }: any) {
  useEffect(() => {
    // After showing success message, reset navigation stack to Login screen
    const timer = setTimeout(() => {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        })
      );
    }, 4000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 24, marginBottom: 10 }}>🎉 Payment Successful!</Text>
      <Text>You will be redirected to the login screen shortly.</Text>
    </View>
  );
}
