import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ImageBackground,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

const WineBg = require('../assets/wine-bg.jpg');
const BASE_URL = 'https://sommelai-app-a743d57328f0.herokuapp.com';

type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  AppMain: undefined;
};

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

type Props = {
  navigation: LoginScreenNavigationProp;
  fetchPlan: (email: string, navigation: any) => Promise<void>;
};

export default function LoginScreen({ navigation, fetchPlan }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (email && password) {
      try {
        const res = await fetch(`${BASE_URL}/api/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        console.log('Login response:', data);

        if (data.error) {
          alert(data.error);
        } else if (data.success) {
          // Pass navigation for fetchPlan to navigate properly
          await fetchPlan(email, navigation);
          setPassword('');
        } else {
          alert('Unknown error. Please try again.');
        }
      } catch (err) {
        alert('Login failed. Please try again.');
      }
    } else {
      alert('Please enter email and password');
    }
  };

  return (
    <ImageBackground source={WineBg} style={styles.bg}>
      <View style={styles.container}>
        <Text style={styles.title}>🍇 Free The Cork</Text>
        <Text style={styles.subtitle}>
          Your personal wine companion. Log in to unlock your cellar!
        </Text>

        <TextInput
          placeholder="Email"
          placeholderTextColor="rgba(42, 42, 42, 0.8)"
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          placeholder="Password"
          placeholderTextColor="rgba(42, 42, 42, 0.8)"
          style={styles.input}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Pressable style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>🍷 Log In</Text>
        </Pressable>

        <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
          <Text style={styles.linkText}>Don't have an account? Sign up</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  container: {
    width: 300, // Smaller fixed width
    height: 280, // Smaller fixed height
    backgroundColor: 'rgba(255, 255, 255, 0.15)', // Very light translucent white
    borderRadius: 24,
    padding: 24, // Reduced padding
    shadowColor: '#000000',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
    // Removed black border
  },
  title: {
    fontSize: 28, // Smaller font
    fontWeight: '700',
    color: '#000000', // Black text for maximum contrast
    textAlign: 'center',
    marginBottom: 6, // Reduced margin
    letterSpacing: 1,
    fontFamily: 'serif',
    textShadowColor: 'rgba(255, 255, 255, 0.9)', // White shadow for depth
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 14, // Smaller font
    color: '#000000', // Black text for maximum contrast
    textAlign: 'center',
    marginBottom: 20, // Reduced margin
    letterSpacing: 0.3,
    textShadowColor: 'rgba(255, 255, 255, 0.8)', // White shadow for depth
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  input: {
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.6)', // Black border for better contrast
    borderRadius: 14,
    padding: 12, // Reduced padding
    fontSize: 14, // Smaller font
    marginBottom: 12, // Reduced margin
    backgroundColor: '#F5F5F5', // Light grey, almost white
    color: '#000000', // Black text for better contrast on light background
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  button: {
    backgroundColor: '#F5F5F5', // Light grey, almost white
    padding: 14, // Reduced padding
    borderRadius: 16,
    alignItems: 'center',
    marginVertical: 6, // Reduced margin
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.6)', // Black border for better contrast
  },
  buttonText: {
    color: '#000000', // Black text for better contrast on light background
    fontWeight: '700',
    fontSize: 16, // Smaller font
    letterSpacing: 0.2,
    textShadowColor: 'rgba(255, 255, 255, 0.8)', // White shadow for depth
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  linkText: {
    color: '#000000', // Black text for maximum contrast
    fontSize: 14, // Smaller font
    textAlign: 'center',
    marginTop: 16, // Reduced margin
    textDecorationLine: 'underline',
    textShadowColor: 'rgba(255, 255, 255, 0.8)', // White shadow for depth
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
