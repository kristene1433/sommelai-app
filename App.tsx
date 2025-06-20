import 'react-native-reanimated';
import React, { useEffect } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import AppNavigator from './navigation/AppNavigator';
import { Buffer } from 'buffer';
global.Buffer = Buffer;

const linking = {
  prefixes: ['sommelai-app://'],
  config: {
    // Optional: Add specific routes if you want
    screens: {
      MainTabs: 'main',
      CheckoutSuccess: 'checkout-success',
      // ...any other screens
    },
  },
};

export default function App() {
  // Optional: global URL handler for Stripe deep link
  useEffect(() => {
    const handleDeepLink = ({ url }: { url: string }) => {
      // You can handle additional logic here if you want
      // For example, trigger a Redux action or store update
      if (url.includes('checkout-success')) {
        // handle payment success (e.g., mark user as subscribed)
        // Possibly navigate to a Thank You screen if you want
        // navigationRef.current?.navigate('MainTabs');
      }
      if (url.includes('checkout-cancel')) {
        // handle cancellation (show alert or navigate)
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <NavigationContainer linking={linking} theme={DefaultTheme}>
      <AppNavigator />
    </NavigationContainer>
  );
}
