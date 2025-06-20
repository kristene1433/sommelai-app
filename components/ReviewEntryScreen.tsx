import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

type ReviewRoute = RouteProp<RootStackParamList, 'ReviewEntry'>;
type Nav        = NativeStackNavigationProp<RootStackParamList>;

export default function ReviewEntryScreen() {
  const { params } = useRoute<ReviewRoute>();
  const navigation = useNavigation<Nav>();
  const { entry }  = params;

  const Row = ({ label, value }: { label: string; value?: string }) =>
    value ? (
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
    ) : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F7F5EF' }}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          {/* ----- Title ----- */}
          <Text style={styles.header}>
            {entry.wineName}
            {entry.vintage ? ` (${entry.vintage})` : ''}
          </Text>

          {/* ----- Bottle Photo ----- */}
          {entry.photoUrl && (
            <Image source={{ uri: entry.photoUrl }} style={styles.photo} />
          )}

          {/* ----- Wine Info ----- */}
          <Text style={styles.section}>🍇 Wine Info</Text>
          <Row label="Region / Country" value={entry.region} />
          <Row label="Producer"         value={entry.producer} />
          <Row label="Varietals"        value={entry.varietals} />
          <Row label="Price"            value={entry.price} />
          <Row label="Alcohol %"        value={entry.alcoholPercent} />
          <Row label="Serving Temp"     value={entry.servingTemp} />
          <Row label="Date Tasted"      value={entry.dateTasted} />
          <Row label="Where / With Whom"value={entry.whereWithWhom} />
          <Row label="Rating (1–5)"     value={entry.rating} />

          <Text style={styles.section}>🟥 Visual</Text>
          <Row label="Clarity"          value={entry.clarity} />
          <Row label="Brightness"       value={entry.brightness} />
          <Row label="Color Intensity"  value={entry.colorIntensity} />
          <Row label="Hue (Red)"        value={entry.hueRed} />
          <Row label="Hue (White)"      value={entry.hueWhite} />
          <Row label="Viscosity"        value={entry.viscosity} />

          <Text style={styles.section}>🟨 Nose & Palate</Text>
          <Row label="Aroma Intensity"  value={entry.aromaIntensity} />
          <Row label="Primary Aroma"    value={entry.primaryAroma} />
          <Row label="Secondary Aroma"  value={entry.secondaryAroma} />
          <Row label="Tertiary Aroma"   value={entry.tertiaryAroma} />
          <Row label="Fruit Character"  value={entry.fruitCharacter} />
          <Row label="Non-Fruit Notes"  value={entry.nonFruitNotes} />

          <Text style={styles.section}>🟩 Structure</Text>
          <Row label="Sweetness"        value={entry.sweetness} />
          <Row label="Acidity"          value={entry.acidity} />
          <Row label="Tannin"           value={entry.tannin} />
          <Row label="Alcohol Level"    value={entry.alcoholLevel} />
          <Row label="Body"             value={entry.body} />
          <Row label="Texture"          value={entry.texture} />
          <Row label="Balance"          value={entry.balance} />
          <Row label="Finish"           value={entry.finish} />

          <Text style={styles.section}>🟦 Conclusion</Text>
          <Row label="Quality Level"    value={entry.qualityLevel} />
          <Row label="Readiness"        value={entry.readiness} />
          <Row label="Age Potential"    value={entry.agePotential} />
          <Row label="Grape Guess"      value={entry.grapeGuess} />
          <Row label="Origin Guess"     value={entry.originGuess} />

          {/* ----- Navigation Buttons ----- */}
          <View style={styles.buttons}>
            <Pressable
              style={[styles.button, styles.buttonSecondary]}
              onPress={() =>
                navigation.navigate('JournalList', { userEmail: entry.userEmail })
              }
            >
              <Text style={styles.buttonText}>⬅ Journal List</Text>
            </Pressable>
            <Pressable
              style={[styles.button, styles.buttonSecondary]}
              onPress={() => navigation.navigate('BlindTasting', { entry })}
            >
              <Text style={styles.buttonText}>🕶 Blind Tasting</Text>
            </Pressable>
            <Pressable
              style={[styles.button, styles.buttonPrimary]}
              onPress={() =>
                navigation.navigate('WineJournal', {
                  userEmail: entry.userEmail,
                  entry,
                })
              }
            >
              <Text style={styles.buttonText}>✏ Edit Entry</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------- Earthy Styles ---------- */
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 6,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FAF8F4', // warm cream
    borderRadius: 22,
    padding: 26,
    shadowColor: '#A68262',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: '#E4D6C2',
  },
  header: {
    fontSize: 29,
    fontWeight: 'bold',
    color: '#8B7C5A', // olive-brown
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.6,
  },
  section: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 22,
    marginBottom: 9,
    color: '#A68262', // taupe/coffee
    textShadowColor: '#f4eee3',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 5,
    paddingVertical: 4,
    paddingHorizontal: 1,
    borderBottomWidth: 0.5,
    borderColor: '#E4D6C2',
  },
  label: {
    fontWeight: '600',
    color: '#6E6040', // muted brown
    flexShrink: 1,
    fontSize: 16,
  },
  value: {
    color: '#554F39', // darker coffee
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  photo: {
    width: '100%',
    height: 220,
    borderRadius: 15,
    marginTop: 20,
    marginBottom: 18,
    backgroundColor: '#ECE3D3',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
    gap: 8,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    padding: 13,
    borderRadius: 11,
    marginHorizontal: 2,
    marginBottom: 5,
    shadowColor: '#D3C4B0',
    shadowOpacity: 0.10,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  buttonPrimary: {
    backgroundColor: '#B1624E', // terracotta
  },
  buttonSecondary: {
    backgroundColor: '#E9E2D1', // pale sand
    borderWidth: 1,
    borderColor: '#CBBFA4',
  },
  buttonText: {
    color: '#5E5C49', // earth brown
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.07,
  },
});
