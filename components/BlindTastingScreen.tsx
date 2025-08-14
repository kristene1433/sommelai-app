import React, { useState } from 'react';
import { OPENAI_API_KEY } from '@env';
import {
  ScrollView,
  Text,
  TextInput,
  View,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

type R = RouteProp<RootStackParamList, 'BlindTasting'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function BlindTastingScreen() {
  const { params } = useRoute<R>();
  const navigation = useNavigation<Nav>();
  const { entry } = params;

  const [revealName, setRevealName] = useState('');
  const [revealProducer, setRevealProducer] = useState('');
  const [revealCountry, setRevealCountry] = useState('');
  const [revealRegion, setRevealRegion] = useState('');
  const [revealVintage, setRevealVintage] = useState('');
  const [aiReply, setAiReply] = useState<string | null>(null);
  const [parsedReply, setParsedReply] = useState<null | {
    nameScore: number;
    producerScore: number;
    countryScore: number;
    regionScore: number;
    vintageScore: number;
    comment: string;
  }>(null);
  const [isLoading, setIsLoading] = useState(false);

  type StrSetter = React.Dispatch<React.SetStateAction<string>>;
  const rows: [string, string, StrSetter][] = [
    ['Wine Name (optional)', revealName, setRevealName],
    ['Producer (optional)', revealProducer, setRevealProducer],
    ['Country (optional)', revealCountry, setRevealCountry],
    ['Region  (optional)', revealRegion, setRevealRegion],
    ['Vintage (optional)', revealVintage, setRevealVintage],
  ];

  const checkGuess = async () => {
    if (isLoading) return; // Prevent multiple clicks
    
    setIsLoading(true);
    setAiReply(null);
    setParsedReply(null);

    const prompt = `
A student did a blind tasting.  Their structured notes:

${JSON.stringify(entry, null, 2)}

They now reveal what the wine actually is (or guess):
• Name    : ${revealName || '(not given)'}
• Producer: ${revealProducer || '(not given)'}
• Country : ${revealCountry || '(not given)'}
• Region  : ${revealRegion || '(not given)'}
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
      const res = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY?.trim()}`,
        },
        body: JSON.stringify({
          model: 'gpt-5-mini',
          input: [
            { role: 'system', content: 'You are a concise WSET examiner.' },
            { role: 'user', content: prompt },
          ],
        }),
      });

      const data = await res.json();

      if (data && data.output_text) {
        const text = data.output_text.trim();

        setAiReply(text || null);

        try {
          const jsonString = text
            ?.match(/\{[\s\S]*\}/)?.[0] ?? '{}';

          const parsed = JSON.parse(jsonString);

          if (
            typeof parsed.nameScore === 'number' &&
            typeof parsed.producerScore === 'number' &&
            typeof parsed.countryScore === 'number' &&
            typeof parsed.regionScore === 'number' &&
            typeof parsed.vintageScore === 'number' &&
            typeof parsed.comment === 'string'
          ) {
            setParsedReply(parsed);
          } else {
            setParsedReply(null);
          }
        } catch {
          setParsedReply(null);
        }
      } else {
        setAiReply('❌ No response from model');
        setParsedReply(null);
      }
    } catch (err) {
      console.error(err);
      setAiReply('❌ Network / API error');
      setParsedReply(null);
    } finally {
      setIsLoading(false);
    }
  };

  const askSommelier = async (question: string) => {
    try {
      setIsLoading(true);
      const res = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY?.trim()}`,
        },
        body: JSON.stringify({
          model: 'gpt-5-mini',
          input: [
            {
              role: 'system',
              content: 'You are a master sommelier helping with blind wine tasting. Provide detailed analysis and guidance.'
            },
            {
              role: 'user',
              content: question
            }
          ],
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      const answer = data.output_text || 'No answer returned';
      setAiReply(answer);
    } catch (error) {
      console.error('Error asking sommelier:', error);
      setAiReply('Sorry, I encountered an error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
              placeholderTextColor="#A0A0A0"
            />
          ))}

          <Pressable 
            style={[
              styles.buttonPrimary, 
              isLoading && styles.buttonDisabled
            ]} 
            onPress={checkGuess}
            disabled={isLoading}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#E0E0E0" />
                <Text style={[styles.buttonText, styles.loadingText]}>
                  Processing...
                </Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>✅ Check Guess</Text>
            )}
          </Pressable>

          {aiReply && (
            <View style={styles.resultBox}>
              <ScrollView>
                {parsedReply ? (
                  <View>
                    <Text style={styles.resultLabel}>
                      Name Score: <Text style={styles.resultValue}>{parsedReply.nameScore}/5</Text>
                    </Text>
                    <Text style={styles.resultLabel}>
                      Producer Score: <Text style={styles.resultValue}>{parsedReply.producerScore}/5</Text>
                    </Text>
                    <Text style={styles.resultLabel}>
                      Country Score: <Text style={styles.resultValue}>{parsedReply.countryScore}/5</Text>
                    </Text>
                    <Text style={styles.resultLabel}>
                      Region Score: <Text style={styles.resultValue}>{parsedReply.regionScore}/5</Text>
                    </Text>
                    <Text style={styles.resultLabel}>
                      Vintage Score: <Text style={styles.resultValue}>{parsedReply.vintageScore}/5</Text>
                    </Text>
                    <Text style={[styles.resultLabel, { marginTop: 12 }]}>Coaching Comment:</Text>
                    <Text style={styles.commentText}>{parsedReply.comment}</Text>
                  </View>
                ) : (
                  <Text style={styles.ai} selectable>{aiReply}</Text>
                )}
              </ScrollView>
            </View>
          )}

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
    maxWidth: 430,
    backgroundColor: '#1E1E1E', // Dark slate
    borderRadius: 22,
    padding: 26,
    shadowColor: '#000000',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A', // Subtle border
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#E0E0E0', // Light gray text
    textAlign: 'center',
    marginBottom: 18,
    letterSpacing: 0.5,
    fontFamily: 'serif',
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#404040', // Medium gray border
    borderRadius: 12,
    padding: 13,
    marginBottom: 10,
    fontSize: 16,
    backgroundColor: '#2A2A2A', // Dark input background
    color: '#E0E0E0', // Light gray text
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  buttonPrimary: {
    backgroundColor: '#404040', // Medium gray
    padding: 15,
    borderRadius: 13,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    borderWidth: 1,
    borderColor: '#505050', // Lighter gray accent
  },
  buttonSecondary: {
    backgroundColor: '#2A2A2A', // Dark slate
    borderWidth: 1.5,
    borderColor: '#404040', // Medium gray border
    padding: 15,
    borderRadius: 13,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  buttonText: {
    color: '#E0E0E0', // Light gray text
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.07,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginLeft: 8,
  },
  resultBox: {
    maxHeight: 240,
    marginTop: 12,
    padding: 14,
    borderRadius: 13,
    backgroundColor: '#252525', // Darker slate
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  ai: {
    fontSize: 16,
    lineHeight: 22,
    color: '#E0E0E0', // Light gray text
    fontWeight: '500',
  },
  resultLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#B8B8B8', // Medium gray
    marginBottom: 4,
  },
  resultValue: {
    fontWeight: '700',
    color: '#E0E0E0', // Light gray text
  },
  commentText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#B8B8B8', // Medium gray
    lineHeight: 20,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 8,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    padding: 13,
    borderRadius: 11,
    marginHorizontal: 4,
    marginBottom: 5,
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
});
