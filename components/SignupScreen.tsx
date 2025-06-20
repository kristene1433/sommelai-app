import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from 'react-native';


type Props = {
  navigation: any;
  fetchPlan: (email: string) => Promise<void>;
};



export default function SignupScreen({ navigation, fetchPlan }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignup = () => {
    if (email && password) {
      navigation.navigate('ChoosePlan', { email, password });
    } else {
      alert('Please enter email and password');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🍇 Free The Cork</Text>
      <Text style={styles.subtitle}>Create your account to join the wine journey.</Text>

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

      <Pressable style={styles.signupBtn} onPress={handleSignup}>
        <Text style={styles.signupBtnText}>🍷 Sign Up</Text>
      </Pressable>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Already have an account? Log in</Text>
      </TouchableOpacity>
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
    fontSize: 34,
    fontWeight: '900',
    textAlign: 'center',
    color: '#8B7C5A',
    letterSpacing: 1,
    marginBottom: 6,
    fontFamily: 'serif',
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 17,
    color: '#9A7B4F',
    marginBottom: 28,
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
  signupBtn: {
    backgroundColor: '#B1624E',
    padding: 15,
    borderRadius: 13,
    alignItems: 'center',
    marginTop: 6,
    shadowColor: '#A68262',
    shadowOpacity: 0.16,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  signupBtnText: {
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

