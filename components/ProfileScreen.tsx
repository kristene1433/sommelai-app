import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView, Alert, Pressable, Modal,
} from 'react-native';

type Props = {
  userEmail : string;
  userPlan  : 'free' | 'paid';
  logout    : () => void;
  navigation: any;
};

const BASE_URL = 'https://sommelai-app-a743d57328f0.herokuapp.com';

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

  // New states for subscription
  const [subscriptionEnd, setSubscriptionEnd] = useState<number | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [loadingCancel, setLoadingCancel] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        // Load profile info
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

        // Load subscription end date if paid
        if (userPlan === 'paid') {
          const subRes = await fetch(`${BASE_URL}/api/subscription/end-date?email=${encodeURIComponent(userEmail)}`);
          if (subRes.ok) {
            const json = await subRes.json();
            if (json.endDate) setSubscriptionEnd(json.endDate);
          }
        }
      } catch (err) {
        console.error('Load profile error:', err);
      }
    })();
  }, [userEmail, userPlan]);

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

  // Cancel subscription handler
  const confirmCancelSubscription = async () => {
    setLoadingCancel(true);
    try {
      const res = await fetch(`${BASE_URL}/api/subscription/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert(
          'Subscription Cancelled',
          `Your subscription will remain active until ${subscriptionEnd ? new Date(subscriptionEnd).toLocaleDateString() : 'end of billing period'}.`,
        );
        setShowCancelModal(false);
      } else {
        Alert.alert('Error', data.error || 'Failed to cancel subscription.');
      }
    } catch (err) {
      console.error('Cancel subscription error:', err);
      Alert.alert('Error', 'Failed to cancel subscription.');
    } finally {
      setLoadingCancel(false);
    }
  };

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
              placeholderTextColor="#A0A0A0"
            />
            <Text style={styles.label}>Plan</Text>
            <Text style={styles.readonly}>{userPlan === 'paid' ? 'Premium' : 'Free'}</Text>

            {userPlan === 'paid' && subscriptionEnd && (
              <View style={{ marginTop: 12 }}>
                <Text style={{ fontSize: 14, color: '#B8B8B8' }}>
                  Your subscription is active until: {new Date(subscriptionEnd).toLocaleDateString()}
                </Text>
                <Pressable
                  style={[styles.buttonSecondary, { marginTop: 10 }]}
                  onPress={() => setShowCancelModal(true)}
                >
                  <Text style={styles.buttonText}>Cancel Subscription</Text>
                </Pressable>
              </View>
            )}
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
                placeholderTextColor="#A0A0A0"
              />
              <TextInput
                style={styles.input}
                value={confirmPass}
                onChangeText={setConfirmPass}
                placeholder="Confirm New Password"
                secureTextEntry
                placeholderTextColor="#A0A0A0"
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
                placeholderTextColor="#A0A0A0"
              />
              <TextInput
                style={styles.input}
                value={newPass}
                onChangeText={setNewPass}
                placeholder="New Password"
                secureTextEntry
                placeholderTextColor="#A0A0A0"
              />
              <TextInput
                style={styles.input}
                value={confirmPass}
                onChangeText={setConfirmPass}
                placeholder="Confirm New Password"
                secureTextEntry
                placeholderTextColor="#A0A0A0"
              />
            </View>
          ) : null}

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Contact Info</Text>
            <TextInput style={styles.input} placeholder="First Name" value={firstName} onChangeText={setFirst} placeholderTextColor="#A0A0A0" />
            <TextInput style={styles.input} placeholder="Last Name" value={lastName} onChangeText={setLast} placeholderTextColor="#A0A0A0" />
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Address</Text>
            <TextInput style={styles.input} placeholder="Street Address" value={address} onChangeText={setAddr} placeholderTextColor="#A0A0A0" />
            <TextInput style={styles.input} placeholder="City" value={city} onChangeText={setCity} placeholderTextColor="#A0A0A0" />
            <TextInput style={styles.input} placeholder="State" value={stateVal} onChangeText={setStateVal} placeholderTextColor="#A0A0A0" />
            <TextInput style={styles.input} placeholder="ZIP" value={zip} onChangeText={setZip} keyboardType="number-pad" placeholderTextColor="#A0A0A0" />
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
                placeholderTextColor="#A0A0A0"
              />
              <TextInput
                style={[styles.input, { flex: 2 }]}
                placeholder="Phone Number"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                placeholderTextColor="#A0A0A0"
              />
            </View>
          </View>

          <Pressable style={styles.buttonPrimary} onPress={save}>
            <Text style={styles.buttonText}>✅ Save Profile</Text>
          </Pressable>
          <Pressable style={[styles.buttonSecondary, { marginTop: 18 }]} onPress={handleLogout}>
            <Text style={styles.buttonText}>🚪 Log Out</Text>
          </Pressable>
        </View>

        {/* Cancel Subscription Confirmation Modal */}
        <Modal
          transparent
          visible={showCancelModal}
          animationType="fade"
          onRequestClose={() => setShowCancelModal(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContent}>
              <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 10 }}>
                Confirm Subscription Cancellation
              </Text>
              <Text style={{ marginBottom: 20 }}>
                Are you sure you want to cancel your subscription? It will remain active until{' '}
                {subscriptionEnd ? new Date(subscriptionEnd).toLocaleDateString() : 'your period ends'}.
              </Text>

              <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                <Pressable
                  style={[styles.buttonSecondary, { marginRight: 10 }]}
                  onPress={() => setShowCancelModal(false)}
                  disabled={loadingCancel}
                >
                  <Text style={styles.buttonText}>No</Text>
                </Pressable>
                <Pressable
                  style={styles.buttonPrimary}
                  onPress={confirmCancelSubscription}
                  disabled={loadingCancel}
                >
                  <Text style={styles.buttonText}>{loadingCancel ? 'Cancelling...' : 'Yes, Cancel'}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    backgroundColor: '#0A0A0A', // Very dark charcoal background
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
    backgroundColor: '#1E1E1E', // Dark slate
    borderRadius: 24,
    padding: 28,
    shadowColor: '#000000',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
    marginVertical: 20,
    borderWidth: 1,
    borderColor: '#2A2A2A', // Subtle border
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#E0E0E0', // Light gray text
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 0.8,
    fontFamily: 'serif',
  },
  sectionCard: {
    backgroundColor: '#252525', // Darker slate
    borderRadius: 20,
    padding: 22,
    marginVertical: 8,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#B8B8B8', // Medium gray
    marginBottom: 8,
    letterSpacing: 0.3,
    fontFamily: 'serif',
  },
  label: {
    marginTop: 10,
    fontSize: 14,
    color: '#A0A0A0', // Light gray
    fontWeight: '500',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  readonly: {
    fontSize: 16,
    color: '#E0E0E0', // Light gray text
    backgroundColor: '#2A2A2A', // Dark background
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    marginTop: 4,
    fontWeight: '600',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#404040', // Medium gray
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#404040', // Medium gray border
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
    marginTop: 8,
    marginBottom: 4,
    backgroundColor: '#2A2A2A', // Dark input background
    color: '#E0E0E0', // Light gray text
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  phoneRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 8,
    gap: 8,
  },
  buttonPrimary: {
    backgroundColor: '#404040', // Medium gray
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginVertical: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    borderWidth: 1,
    borderColor: '#505050', // Lighter gray accent
  },
  buttonSecondary: {
    backgroundColor: '#2A2A2A', // Dark slate
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginVertical: 6,
    borderWidth: 1.5,
    borderColor: '#404040', // Medium gray border
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  buttonText: {
    color: '#E0E0E0', // Light gray text
    fontWeight: '700',
    fontSize: 18,
    letterSpacing: 0.2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: '#000000EE', // Very dark backdrop
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1E1E1E', // Dark slate
    padding: 28,
    borderRadius: 20,
    width: '85%',
    shadowColor: '#000000',
    shadowOpacity: 0.35,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
});


