import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  Pressable,
} from 'react-native';
// import { LinearGradient } from 'expo-linear-gradient'; // If you want to use gradients

const wineTypes      = ['Red', 'White', 'Rosé', 'Sparkling', 'Fortified'];
const flavorProfiles = ['Dry', 'Fruity', 'Sweet', 'Earthy', 'Spicy', 'Bold'];

type Props = {
  userEmail: string;
};

const BASE_URL = 'http://192.168.4.80:5000';

export default function PreferencesScreen({ userEmail }: Props) {
  const [selectedWines,   setSelectedWines]   = useState<string[]>([]);
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/preferences/${userEmail}`);
        if (res.ok) {
          const data = await res.json();
          setSelectedWines(data.wineTypes      || []);
          setSelectedFlavors(data.flavorProfiles || []);
        }
      } catch (err) {
        console.error('Load prefs error:', err);
      }
    })();
  }, []);

  const toggle = (
    item: string,
    state: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setter(state.includes(item) ? state.filter((i) => i !== item) : [...state, item]);
  };

  const savePreferences = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/preferences`, {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({
          email: userEmail,
          wineTypes      : selectedWines,
          flavorProfiles : selectedFlavors,
        }),
      });
      if (!res.ok) throw new Error('Bad response');
      Alert.alert('Saved', 'Preferences updated!');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Could not save preferences.');
    }
  };

  // Use LinearGradient for background if you want (see comments).
  return (
    <View style={styles.gradient}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>🍷 My Preferences</Text>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Wine Types</Text>
            {wineTypes.map((w) => (
              <View style={styles.row} key={w}>
                <Text style={styles.label}>{w}</Text>
                <Switch
                  value={selectedWines.includes(w)}
                  onValueChange={() => toggle(w, selectedWines, setSelectedWines)}
                  trackColor={{ true: '#B1624E', false: '#D8C8B8' }}   // terracotta, sand
                  thumbColor={selectedWines.includes(w) ? '#8B7C5A' : '#B8A88A'} // olive, beige
                />
              </View>
            ))}
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Flavor Profiles</Text>
            {flavorProfiles.map((f) => (
              <View style={styles.row} key={f}>
                <Text style={styles.label}>{f}</Text>
                <Switch
                  value={selectedFlavors.includes(f)}
                  onValueChange={() => toggle(f, selectedFlavors, setSelectedFlavors)}
                  trackColor={{ true: '#B1624E', false: '#D8C8B8' }}
                  thumbColor={selectedFlavors.includes(f) ? '#8B7C5A' : '#B8A88A'}
                />
              </View>
            ))}
          </View>

          <Pressable style={styles.buttonPrimary} onPress={savePreferences}>
            <Text style={styles.buttonText}>💾 Save Preferences</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

/* ---------- Earthy Organic Styles ---------- */
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
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  sectionCard: {
    backgroundColor: '#F4EFE8', // soft sand
    borderRadius: 18,
    padding: 18,
    marginVertical: 10,
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
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 13,
    paddingVertical: 4,
    paddingHorizontal: 3,
    borderBottomWidth: 0.5,
    borderColor: '#E4D6C2',
  },
  label: {
    fontSize: 17,
    color: '#6E6040', // walnut brown
    fontWeight: '500',
  },
  buttonPrimary: {
    backgroundColor: '#B1624E', // terracotta
    padding: 15,
    borderRadius: 13,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#A68262',
    shadowOpacity: 0.13,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  buttonText: {
    color: '#FAF8F4',
    fontWeight: '700',
    fontSize: 17,
    letterSpacing: 0.1,
  },
});

