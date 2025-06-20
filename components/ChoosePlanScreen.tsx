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
          $9.99/month <Text style={styles.freeTrial}> (First month FREE!)</Text>
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
    justifyContent: 'center',
    padding: 28,
    backgroundColor: '#F7F5EF',
  },
  title: {
    fontSize: 33,
    fontWeight: '900',
    textAlign: 'center',
    color: '#8B7C5A',
    letterSpacing: 1,
    marginBottom: 5,
    fontFamily: 'serif',
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 16,
    color: '#9A7B4F',
    marginBottom: 26,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  planBox: {
    backgroundColor: '#FAF8F4',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D3C4B0',
    padding: 32,
    marginVertical: 8,
    shadowColor: '#A68262',
    shadowOpacity: 0.07,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
    alignItems: 'center',
  },
  planLabel: {
    fontSize: 22,
    fontWeight: '700',
    color: '#B1624E',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  price: {
    fontSize: 21,
    fontWeight: '600',
    color: '#8B7C5A',
    marginBottom: 8,
  },
  freeTrial: {
    color: '#388E3C',
    fontWeight: '600',
    fontSize: 15,
  },
  planDesc: {
    fontSize: 16,
    color: '#59422C',
    marginVertical: 14,
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonPrimary: {
    backgroundColor: '#B1624E',
    paddingVertical: 15,
    paddingHorizontal: 34,
    borderRadius: 13,
    alignItems: 'center',
    marginTop: 6,
    shadowColor: '#A68262',
    shadowOpacity: 0.16,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    minWidth: 180,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
    letterSpacing: 0.2,
  },
  finePrint: {
    color: '#7B6650',
    marginTop: 14,
    fontSize: 12,
    textAlign: 'center',
  },
});
