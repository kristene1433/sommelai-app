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
    <View style={styles.bg}>
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

        <Pressable style={styles.button} onPress={handleSignup}>
          <Text style={styles.buttonText}>🍷 Sign Up</Text>
        </Pressable>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.linkText}>Already have an account? Log in</Text>
        </TouchableOpacity>
      </View>
    </View>
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
    fontSize: 36,
    fontWeight: '700',
    color: '#E0E0E0', // Light gray text
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 1,
    fontFamily: 'serif',
  },
  subtitle: {
    fontSize: 18,
    color: '#B8B8B8', // Medium gray
    textAlign: 'center',
    marginBottom: 32,
    letterSpacing: 0.3,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#404040', // Medium gray border
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#2A2A2A', // Dark input background
    color: '#E0E0E0', // Light gray text
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
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
  linkText: {
    color: '#B8B8B8', // Medium gray
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    textDecorationLine: 'underline',
  },
});

