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
type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ReviewEntryScreen() {
  const { params } = useRoute<ReviewRoute>();
  const navigation = useNavigation<Nav>();
  const { entry } = params;

  const Row = ({ label, value }: { label: string; value?: string }) =>
    value ? (
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
    ) : null;

  // Format dateTasted nicely or show nothing if missing/invalid
  const formattedDateTasted = entry.dateTasted
    ? new Date(entry.dateTasted).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : undefined;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
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
          <Row label="Producer" value={entry.producer} />
          <Row label="Varietals" value={entry.varietals} />
          <Row label="Date Tasted" value={formattedDateTasted} />

          {/* ----- Visual ----- */}
          <Text style={styles.section}>🟥 Visual</Text>
          <Row label="Clarity" value={entry.clarity} />
          <Row label="Brightness" value={entry.brightness} />
          <Row label="Color Intensity" value={entry.colorIntensity} />
          <Row label="Hue (Red)" value={entry.hueRed} />
          <Row label="Hue (White)" value={entry.hueWhite} />
          <Row label="Viscosity" value={entry.viscosity} />

          {/* ----- Nose & Palate ----- */}
          <Text style={styles.section}>🟨 Nose & Palate</Text>
          <Row label="Aroma Intensity" value={entry.aromaIntensity} />
          <Row label="Primary Aroma" value={entry.primaryAroma} />
          <Row label="Secondary Aroma" value={entry.secondaryAroma} />
          <Row label="Tertiary Aroma" value={entry.tertiaryAroma} />

          {/* ----- Structure ----- */}
          <Text style={styles.section}>🟩 Structure</Text>
          <Row label="Sweetness" value={entry.sweetness} />
          <Row label="Acidity" value={entry.acidity} />
          <Row label="Tannin" value={entry.tannin} />
          <Row label="Alcohol Level" value={entry.alcoholLevel} />
          <Row label="Body" value={entry.body} />
          <Row label="Finish" value={entry.finish} />

          {/* ----- Conclusion ----- */}
          <Text style={styles.section}>🟦 Conclusion</Text>
          <Row label="Quality Level" value={entry.qualityLevel} />
          <Row label="Readiness" value={entry.readiness} />
          <Row label="Age Potential" value={entry.agePotential} />
          <Row label="Grape Guess" value={entry.grapeGuess} />
          <Row label="Origin Guess" value={entry.originGuess} />

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A', // Very dark charcoal background
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 6,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#1E1E1E', // Dark slate
    borderRadius: 24,
    padding: 28,
    shadowColor: '#000000',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A', // Subtle border
  },
  header: {
    fontSize: 29,
    fontWeight: '700',
    color: '#E0E0E0', // Light gray text
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.6,
    fontFamily: 'serif',
  },
  section: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 22,
    marginBottom: 9,
    color: '#B8B8B8', // Medium gray
    letterSpacing: 0.3,
    fontFamily: 'serif',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 5,
    paddingVertical: 4,
    paddingHorizontal: 1,
    borderBottomWidth: 0.5,
    borderColor: '#2A2A2A', // Subtle border
  },
  label: {
    fontWeight: '600',
    color: '#A0A0A0', // Light gray
    flexShrink: 1,
    fontSize: 16,
  },
  value: {
    color: '#E0E0E0', // Light gray text
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
    backgroundColor: '#2A2A2A', // Dark background
    borderWidth: 1,
    borderColor: '#404040', // Medium gray border
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
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  buttonPrimary: {
    backgroundColor: '#404040', // Medium gray
    borderWidth: 1,
    borderColor: '#505050', // Lighter gray accent
  },
  buttonSecondary: {
    backgroundColor: '#2A2A2A', // Dark slate
    borderWidth: 1.5,
    borderColor: '#404040', // Medium gray border
  },
  buttonText: {
    color: '#E0E0E0', // Light gray text
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.07,
  },
});
