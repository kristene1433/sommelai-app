import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, Pressable, ActivityIndicator } from 'react-native';
import * as Linking from 'expo-linking';


type Props = {
  navigation: any;
  route: any; // You can type this more strictly if you know your params structure
  fetchPlan: (email: string) => Promise<void>;
};



const BASE_URL = 'https://sommelai-app-a743d57328f0.herokuapp.com'; // <-- change as needed for your backend

export default function ChoosePlanScreen({ navigation, route, fetchPlan }: Props) {
  const { email, password } = route.params;
  const [loading, setLoading] = useState(false);

  const startStripeCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!data.url) throw new Error('Could not get Stripe URL');
      Linking.openURL(data.url);
    } catch (err) {
      Alert.alert('Error', 'Could not start checkout. Check your connection.');
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🍇 Free The Cork</Text>
      <Text style={styles.subtitle}>Unlock your personal wine experience.</Text>
      <View style={styles.planBox}>
        <Text style={styles.planLabel}>Premium Plan</Text>
        <Text style={styles.price}>
          $2.99/month <Text style={styles.freeTrial}> (First month FREE!)</Text>
        </Text>
        <Text style={styles.planDesc}>
          – Personalized AI Sommelier{'\n'}
          – Wine & food pairing advice{'\n'}
          – Wine journal{'\n'}
          – Local wine recommendations{'\n'}
          – Cancel anytime
        </Text>

        <Pressable
          style={[styles.buttonPrimary, loading && { opacity: 0.6 }]}
          onPress={startStripeCheckout}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Please wait...' : 'Start Free Month'}
          </Text>
        </Pressable>
        {loading && <ActivityIndicator style={{ marginTop: 14 }} />}
        <Text style={styles.finePrint}>
          Cancel anytime. No charge for the first month.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A', // Very dark charcoal background
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#1E1E1E', // Dark slate
    borderRadius: 24,
    padding: 32,
    shadowColor: '#000000',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A', // Subtle border
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#E0E0E0', // Light gray text
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.8,
    fontFamily: 'serif',
  },
  subtitle: {
    fontSize: 18,
    color: '#B8B8B8', // Medium gray
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    letterSpacing: 0.3,
  },
  button: {
    backgroundColor: '#404040', // Medium gray
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginVertical: 8,
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    borderWidth: 1,
    borderColor: '#505050', // Lighter gray accent
  },
  buttonText: {
    color: '#E0E0E0', // Light gray text
    fontWeight: '700',
    fontSize: 18,
    letterSpacing: 0.2,
  },
  loadingText: {
    color: '#B8B8B8', // Medium gray
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
});
