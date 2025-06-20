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

// 1. Define your stack routes here:
type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  AppMain: undefined;
  // Add others as needed
};

// 2. Type for your navigation prop:
type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;


type Props = {
  navigation: LoginScreenNavigationProp;
  fetchPlan: (email: string) => Promise<void>;
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
          // This triggers your app context to switch to logged in!
          await fetchPlan(email); // <-- This sets user state in AppNavigator
          // Optionally clear password
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
          placeholderTextColor="#b09b82"
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          placeholder="Password"
          placeholderTextColor="#b09b82"
          style={styles.input}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Pressable style={styles.loginBtn} onPress={handleLogin}>
          <Text style={styles.loginBtnText}>🍷 Log In</Text>
        </Pressable>

        <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
          <Text style={styles.link}>Don’t have an account? Sign up</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, resizeMode: 'cover', justifyContent: 'center' },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 28,
    backgroundColor: 'rgba(247,245,239,0.75)',
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    textAlign: 'center',
    color: '#8B7C5A',
    letterSpacing: 1,
    marginBottom: 9,
    fontFamily: 'serif',
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 17,
    color: '#9A7B4F',
    marginBottom: 32,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#C2B280',
    backgroundColor: '#F9F6F0',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    fontSize: 16,
    color: '#59422C',
    fontWeight: '500',
  },
  loginBtn: {
    backgroundColor: '#B1624E',
    padding: 15,
    borderRadius: 13,
    alignItems: 'center',
    marginTop: 6,
    shadowColor: '#A68262',
    shadowOpacity: 0.18,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  loginBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
    letterSpacing: 0.2,
  },
  link: {
    textAlign: 'center',
    marginTop: 19,
    color: '#B1624E',
    fontWeight: '600',
    textDecorationLine: 'underline',
    fontSize: 15,
  },
});
