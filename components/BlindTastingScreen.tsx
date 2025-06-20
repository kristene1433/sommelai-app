import React, { useState } from 'react';
import {
  ScrollView,
  Text,
  TextInput,
  View,
  StyleSheet,
  Pressable,
} from 'react-native';
// import { LinearGradient } from 'expo-linear-gradient'; // For gradients if wanted
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

type R   = RouteProp<RootStackParamList, 'BlindTasting'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function BlindTastingScreen() {
  const { params } = useRoute<R>();
  const navigation = useNavigation<Nav>();
  const { entry }  = params;

  const [revealName,     setRevealName]     = useState('');
  const [revealProducer, setRevealProducer] = useState('');
  const [revealCountry,  setRevealCountry]  = useState('');
  const [revealRegion,   setRevealRegion]   = useState('');
  const [revealVintage,  setRevealVintage]  = useState('');
  const [aiReply, setAiReply] = useState<string | null>(null);

  type StrSetter = React.Dispatch<React.SetStateAction<string>>;
  const rows: [string, string, StrSetter][] = [
    ['Wine Name (optional)', revealName,     setRevealName],
    ['Producer (optional)',  revealProducer, setRevealProducer],
    ['Country (optional)',   revealCountry,  setRevealCountry],
    ['Region  (optional)',   revealRegion,   setRevealRegion],
    ['Vintage (optional)',   revealVintage,  setRevealVintage],
  ];

  const checkGuess = async () => {
    setAiReply(null);

    const prompt = `
A student did a blind tasting.  Their structured notes:

${JSON.stringify(entry, null, 2)}

They now reveal what the wine actually is (or guess):
• Name    : ${revealName    || '(not given)'}
• Producer: ${revealProducer|| '(not given)'}
• Country : ${revealCountry || '(not given)'}
• Region  : ${revealRegion  || '(not given)'}
• Vintage : ${revealVintage || '(not given)'}

TASK:
1. Judge how reasonable each revealed datum is **given ONLY the tasting note**.
2. Return scores:
   nameScore, producerScore, countryScore, regionScore, vintageScore (0-5).
3. Write a short (≤120 words) coaching comment.

Answer **JSON only**:
{
  "nameScore":#,
  "producerScore":#,
  "countryScore":#,
  "regionScore":#,
  "vintageScore":#,
  "comment":"..."
}
    `.trim();

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method : 'POST',
        headers: {
          'Content-Type' : 'application/json',
          Authorization  : `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model   : 'gpt-4o',
          messages: [
            { role: 'system', content: 'You are a concise WSET examiner.' },
            { role: 'user',   content: prompt },
          ],
          temperature: 0.2,
        }),
      });

      const data = await res.json();
      if (data.choices?.length) {
        setAiReply(data.choices[0].message.content?.trim());
      } else setAiReply('❌ No response from model');
    } catch (err) {
      console.error(err);
      setAiReply('❌ Network / API error');
    }
  };

  // --- MAIN RENDER ---
  // To use a LinearGradient background, swap <View> for <LinearGradient ...> below
  return (
    <View style={styles.gradient}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>🕶 Blind Tasting – Reveal & Score</Text>
          {rows.map(([ph, val, setter], idx) => (
            <TextInput
              key={idx}
              placeholder={ph}
              style={styles.input}
              value={val}
              onChangeText={setter}
              placeholderTextColor="#B2A489"
            />
          ))}

          <Pressable style={styles.buttonPrimary} onPress={checkGuess}>
            <Text style={styles.buttonText}>✅ Check Guess</Text>
          </Pressable>

          {aiReply && (
            <View style={styles.block}>
              <Text selectable style={styles.ai}>
                {aiReply}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

/* ---------- Earthy Styles ---------- */
const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    backgroundColor: '#F7F5EF', // soft sand/linen
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
    maxWidth: 430,
    backgroundColor: '#FAF8F4', // warm cream
    borderRadius: 22,
    padding: 26,
    shadowColor: '#A68262',
    shadowOpacity: 0.10,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: '#E4D6C2',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#8B7C5A', // olive-brown
    textAlign: 'center',
    marginBottom: 18,
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D3C4B0',
    borderRadius: 12,
    padding: 13,
    marginBottom: 10,
    fontSize: 16,
    backgroundColor: '#F9F7F2',
    color: '#554F39',
  },
  buttonPrimary: {
    backgroundColor: '#B1624E', // terracotta
    padding: 15,
    borderRadius: 13,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
    shadowColor: '#A68262',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  buttonText: {
    color: '#F7F5EF', // light sand
    fontWeight: '700',
    fontSize: 17,
    letterSpacing: 0.1,
  },
  block: {
    marginTop: 18,
    padding: 14,
    borderRadius: 13,
    backgroundColor: '#EFE5D7', // pale beige
    shadowColor: '#E4D6C2',
    shadowOpacity: 0.08,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  ai: {
    fontSize: 16,
    lineHeight: 22,
    color: '#6E6040', // muted brown
    fontWeight: '500',
  },
});

