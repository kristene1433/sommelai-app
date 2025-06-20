import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView, Alert, Pressable,
} from 'react-native';
// import { LinearGradient } from 'expo-linear-gradient'; // For gradients if desired

type Props = {
  userEmail : string;
  userPlan  : 'free' | 'paid';
  logout    : () => void;
  navigation: any;
};

const BASE_URL = 'http://192.168.4.80:5000';

export default function ProfileScreen({ userEmail, userPlan, logout, navigation }: Props) {
  const [userId, setUserId]     = useState('');
  const [email, setEmail]       = useState(userEmail);
  const [firstName, setFirst]   = useState('');
  const [lastName, setLast]     = useState('');
  const [address, setAddr]      = useState('');
  const [city, setCity]         = useState('');
  const [stateVal, setStateVal] = useState('');
  const [zip, setZip]           = useState('');
  const [areaCode, setArea]     = useState('');
  const [phone, setPhone]       = useState('');

  const [oldPass, setOldPass]         = useState('');
  const [newPass, setNewPass]         = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/preferences/${userEmail}`);
        if (res.ok) {
          const d = await res.json();
          setFirst   (d.firstName || '');
          setLast    (d.lastName  || '');
          setAddr    (d.address   || '');
          setCity    (d.city      || '');
          setStateVal(d.state     || '');
          setZip     (d.zip       || '');
          setArea    (d.areaCode  || '');
          setPhone   (d.phone     || '');
          setUserId  (d._id       || '');
          setEmail   (d.email     || userEmail);
          setHasPassword(d.hasPassword || false);
        }
      } catch (err) {
        console.error('Load profile error:', err);
      }
    })();
  }, []);

  const handleLogout = () => {
    logout();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const save = async () => {
    try {
      let credentialChanged = false;

      // 1. Email change
      if (email !== userEmail) {
        if (!email.includes('@')) {
          Alert.alert('Invalid Email', 'Please enter a valid email address.');
          return;
        }
        const res = await fetch(`${BASE_URL}/api/preferences/change-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, newEmail: email }),
        });
        const data = await res.json();
        if (!res.ok) {
          Alert.alert('Error', data.error || 'Could not change email.');
          return;
        }
        credentialChanged = true;
      }

      // 2. Password change or set
      if (hasPassword === false && (newPass || confirmPass)) {
        if (!newPass || !confirmPass) {
          Alert.alert('Error', 'Please fill both new password fields.');
          return;
        }
        if (newPass !== confirmPass) {
          Alert.alert('Error', 'Passwords do not match.');
          return;
        }
        const res = await fetch(`${BASE_URL}/api/preferences/set-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, newPassword: newPass }),
        });
        const data = await res.json();
        if (!res.ok) {
          Alert.alert('Error', data.error || 'Could not set password.');
          return;
        }
        credentialChanged = true;
      } else if (hasPassword === true && (oldPass || newPass || confirmPass)) {
        if (!oldPass || !newPass || !confirmPass) {
          Alert.alert('Error', 'Please fill all password fields.');
          return;
        }
        if (newPass !== confirmPass) {
          Alert.alert('Error', 'Passwords do not match.');
          return;
        }
        const res = await fetch(`${BASE_URL}/api/preferences/change-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, oldPassword: oldPass, newPassword: newPass }),
        });
        const data = await res.json();
        if (!res.ok) {
          Alert.alert('Error', data.error || 'Could not change password.');
          return;
        }
        credentialChanged = true;
      }

      // 3. Save profile (other fields)
      const res = await fetch(`${BASE_URL}/api/preferences`, {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({
          email, firstName, lastName, address, city, state: stateVal, zip, areaCode, phone,
        }),
      });
      if (!res.ok) throw new Error('Bad response');

      if (credentialChanged) {
        Alert.alert(
          'Credentials Updated',
          'Your email or password was changed. Please login again.',
          [{ text: 'OK', onPress: handleLogout }]
        );
      } else {
        Alert.alert('Saved', 'Profile updated!');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Could not save profile.');
    }
  };

  // Use LinearGradient for background if you want (see comment).
  return (
    <View style={styles.gradient}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>👤 My Profile</Text>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Account</Text>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="Email"
              placeholderTextColor="#b8a88a"
            />
            <Text style={styles.label}>Plan</Text>
            <Text style={styles.readonly}>{userPlan === 'paid' ? 'Premium' : 'Free'}</Text>
          </View>

          {hasPassword === false ? (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Set Password</Text>
              <TextInput
                style={styles.input}
                value={newPass}
                onChangeText={setNewPass}
                placeholder="New Password"
                secureTextEntry
                placeholderTextColor="#b8a88a"
              />
              <TextInput
                style={styles.input}
                value={confirmPass}
                onChangeText={setConfirmPass}
                placeholder="Confirm New Password"
                secureTextEntry
                placeholderTextColor="#b8a88a"
              />
            </View>
          ) : hasPassword === true ? (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Change Password</Text>
              <TextInput
                style={styles.input}
                value={oldPass}
                onChangeText={setOldPass}
                placeholder="Current Password"
                secureTextEntry
                placeholderTextColor="#b8a88a"
              />
              <TextInput
                style={styles.input}
                value={newPass}
                onChangeText={setNewPass}
                placeholder="New Password"
                secureTextEntry
                placeholderTextColor="#b8a88a"
              />
              <TextInput
                style={styles.input}
                value={confirmPass}
                onChangeText={setConfirmPass}
                placeholder="Confirm New Password"
                secureTextEntry
                placeholderTextColor="#b8a88a"
              />
            </View>
          ) : null}

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Contact Info</Text>
            <TextInput style={styles.input} placeholder="First Name" value={firstName} onChangeText={setFirst} placeholderTextColor="#b8a88a" />
            <TextInput style={styles.input} placeholder="Last Name" value={lastName} onChangeText={setLast} placeholderTextColor="#b8a88a" />
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Address</Text>
            <TextInput style={styles.input} placeholder="Street Address" value={address} onChangeText={setAddr} placeholderTextColor="#b8a88a" />
            <TextInput style={styles.input} placeholder="City" value={city} onChangeText={setCity} placeholderTextColor="#b8a88a" />
            <TextInput style={styles.input} placeholder="State" value={stateVal} onChangeText={setStateVal} placeholderTextColor="#b8a88a" />
            <TextInput style={styles.input} placeholder="ZIP" value={zip} onChangeText={setZip} keyboardType="number-pad" placeholderTextColor="#b8a88a" />
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Phone</Text>
            <View style={styles.phoneRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginRight: 6 }]}
                placeholder="Area"
                maxLength={3}
                keyboardType="number-pad"
                value={areaCode}
                onChangeText={setArea}
                placeholderTextColor="#b8a88a"
              />
              <TextInput
                style={[styles.input, { flex: 2 }]}
                placeholder="Phone Number"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                placeholderTextColor="#b8a88a"
              />
            </View>
          </View>

          <Pressable style={styles.buttonPrimary} onPress={save}>
            <Text style={styles.buttonText}>💾 Save Profile</Text>
          </Pressable>
          <Pressable style={[styles.buttonSecondary, { marginTop: 18 }]} onPress={handleLogout}>
            <Text style={styles.buttonText}>🚪 Log Out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    backgroundColor: '#F7F5EF', // sand/linen
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 6,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FAF8F4', // off-white cream
    borderRadius: 22,
    padding: 24,
    shadowColor: '#A68262',
    shadowOpacity: 0.11,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
    marginVertical: 20,
    borderWidth: 1,
    borderColor: '#E4D6C2',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#8B7C5A', // olive-brown
    textAlign: 'center',
    marginBottom: 14,
    letterSpacing: 0.5,
  },
  sectionCard: {
    backgroundColor: '#F4EFE8', // soft sand
    borderRadius: 18,
    padding: 18,
    marginVertical: 7,
    marginBottom: 10,
    shadowColor: '#A68262',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
    borderWidth: 1,
    borderColor: '#EFE0CA',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#7B6E49', // earthy brown-olive
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  label: {
    marginTop: 8,
    fontSize: 13,
    color: '#9E895B', // muted straw/khaki
    fontWeight: '500',
    marginBottom: 2,
  },
  readonly: {
    fontSize: 15,
    color: '#78623C',
    backgroundColor: '#F7F0E2',
    borderRadius: 8,
    padding: 9,
    marginBottom: 7,
    marginTop: 3,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E4D6C2',
    borderRadius: 12,
    padding: 11,
    fontSize: 15,
    marginTop: 7,
    marginBottom: 3,
    backgroundColor: '#FCFAF5',
    color: '#665B47', // taupe/brown
  },
  phoneRow: { flexDirection: 'row', alignItems: 'center', marginTop: 7 },
  buttonPrimary: {
    backgroundColor: '#B1624E', // terracotta
    padding: 15,
    borderRadius: 13,
    alignItems: 'center',
    marginVertical: 10,
    shadowColor: '#A68262',
    shadowOpacity: 0.13,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  buttonSecondary: {
    backgroundColor: '#F3E5D5', // pale sand
    padding: 14,
    borderRadius: 13,
    alignItems: 'center',
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#C4B295',
  },
  buttonText: {
    color: '#6E6040', // walnut brown
    fontWeight: '700',
    fontSize: 17,
    letterSpacing: 0.1,
  },
});

