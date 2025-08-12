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

const wineTypes = ['Red', 'White', 'Rosé', 'Sparkling', 'Fortified'];
const flavorProfiles = ['Dry', 'Sweet', 'Earthy', 'Fruity', 'Spicy'];
const bodyOptions = ['Big', 'Medium', 'Light'];

type Props = {
  userEmail: string;
};

const BASE_URL = 'https://sommelai-app-a743d57328f0.herokuapp.com';

export default function PreferencesScreen({ userEmail }: Props) {
  const [selectedWines, setSelectedWines] = useState<string[]>([]);
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>([]);
  const [selectedBody, setSelectedBody] = useState<string>('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/preferences/${userEmail}`);
        if (res.ok) {
          const data = await res.json();
          setSelectedWines(data.wineTypes || []);
          setSelectedFlavors(data.flavorProfiles || []);
          setSelectedBody(data.body || '');
        }
      } catch (err) {
        console.error('Load prefs error:', err);
      }
    })();
  }, [userEmail]);

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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          wineTypes: selectedWines,
          flavorProfiles: selectedFlavors,
          body: selectedBody,
        }),
      });
      if (!res.ok) throw new Error('Bad response');
      Alert.alert('Saved', 'Preferences updated!');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Could not save preferences.');
    }
  };

  return (
    <View style={styles.gradient}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>🍷 My Preferences</Text>

          {/* Wine Types */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Wine Types</Text>
            {wineTypes.map((w) => (
              <View style={styles.row} key={w}>
                <Text style={styles.label}>{w}</Text>
                <Switch
                  value={selectedWines.includes(w)}
                  onValueChange={() => toggle(w, selectedWines, setSelectedWines)}
                  trackColor={{ true: '#B1624E', false: '#D8C8B8' }} // terracotta, sand
                  thumbColor={selectedWines.includes(w) ? '#8B7C5A' : '#B8A88A'} // olive, beige
                />
              </View>
            ))}
          </View>

          {/* Flavor Profiles (excluding Body) */}
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

          {/* Body Selection (Single Choice) */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Body</Text>
            <View style={styles.bodyOptionsContainer}>
              {bodyOptions.map((option) => {
                const selected = selectedBody === option;
                return (
                  <Pressable
                    key={option}
                    style={[
                      styles.bodyOption,
                      selected ? styles.bodyOptionSelected : styles.bodyOptionUnselected,
                    ]}
                    onPress={() => setSelectedBody(option)}
                  >
                    <Text style={selected ? styles.bodyTextSelected : styles.bodyTextUnselected}>
                      {option}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Save Button */}
          <Pressable style={styles.buttonPrimary} onPress={savePreferences}>
            <Text style={styles.buttonText}> ✅ Save Preferences</Text>
          </Pressable>
        </View>
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
    fontSize: 28,
    fontWeight: '700',
    color: '#E0E0E0', // Light gray text
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 0.5,
    fontFamily: 'serif',
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
    fontSize: 18,
    fontWeight: '600',
    color: '#B8B8B8', // Medium gray
    marginBottom: 12,
    letterSpacing: 0.3,
    fontFamily: 'serif',
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
    marginTop: 10,
    fontSize: 14,
    color: '#A0A0A0', // Light gray
    fontWeight: '500',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  buttonPrimary: {
    backgroundColor: '#404040', // Medium gray
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 24,
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
  bodyOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  bodyOption: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 2,
    marginHorizontal: 8,
  },
  bodyOptionSelected: {
    backgroundColor: '#404040', // Medium gray
    borderColor: '#505050', // Lighter gray accent
  },
  bodyOptionUnselected: {
    backgroundColor: '#F6F4ED',
    borderColor: '#D3C4B0',
  },
  bodyTextSelected: {
    color: '#FFFFFF', // White text for selected
    fontWeight: '600',
    fontSize: 16,
  },
  bodyTextUnselected: {
    color: '#5E5C49',
    fontWeight: '600',
    fontSize: 16,
  },
});
