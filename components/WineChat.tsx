import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, TextInput, Text, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator,
  Pressable, Linking, Alert, Image,
} from 'react-native';
// import { LinearGradient } from 'expo-linear-gradient'; // Uncomment if using gradient background!
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { OPENAI_API_KEY } from '@env';
import * as FileSystem from 'expo-file-system';
import { Audio, AVPlaybackStatusSuccess } from 'expo-av';
import { Buffer } from 'buffer';
global.Buffer = Buffer;

type Props  = { userPlan: 'free' | 'paid'; userEmail: string };
type Prefs  = { wineTypes: string[]; flavorProfiles: string[] };
type LocalItem = {
  name: string; price: string; store: string;
  address?: string; url?: string;
};

const BASE_URL = 'https://sommelai-app-a743d57328f0.herokuapp.com';

export default function WineChat({ userPlan, userEmail }: Props) {
  const [question,  setQuestion]  = useState('');
  const [response,  setResponse]  = useState('');
  const [localRes,  setLocalRes]  = useState<LocalItem[]>([]);
  const [prefs,     setPrefs]     = useState<Prefs | null>(null);
  const [loading,   setLoading]   = useState(false);

  const [sound,       setSound]       = useState<Audio.Sound | null>(null);
  const [isSpeaking,  setIsSpeaking]  = useState(false);
  const [dailyCount,  setDailyCount]  = useState(0);

  const [chatHistory, setChatHistory] = useState<
    { role: 'user' | 'assistant'; content: string }[]
  >([]);

  // For Vision/photo
  const [photoAsset, setPhotoAsset] = useState<any>(null);

  const scrollRef = useRef<ScrollView | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [chatHistory]);

  // --- Preferences ---
  const loadPrefs = useCallback(async () => {
    if (userPlan !== 'paid') { setPrefs(null); return; }
    try {
      const r = await fetch(`${BASE_URL}/api/preferences/${userEmail}`);
      if (r.ok) setPrefs(await r.json());
    } catch { /* silent */ }
  }, [userPlan, userEmail]);
  useEffect(() => { loadPrefs(); }, [loadPrefs]);
  useFocusEffect(useCallback(() => { loadPrefs(); }, [loadPrefs]));

  // --- Local store lookup ---
  const fetchLocalWine = async (q: string) => {
    try {
      const zipRes = await fetch(`${BASE_URL}/api/zip/${userEmail}`);
      const { zip } = await zipRes.json();
      if (!zip) {
        setResponse('No ZIP on file. Please add it in Profile.');
        // 👇 Add to chatHistory for full context:
        setChatHistory(prev => [
          ...prev,
          { role: 'user', content: q },
          { role: 'assistant', content: 'No ZIP on file. Please add it in Profile.' },
        ]);
        return;
      }
  
      const apiRes = await fetch(`${BASE_URL}/api/searchWineLocal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zip, query: q }),
      });
      if (!apiRes.ok) {
        setResponse('Local search failed.');
        setChatHistory(prev => [
          ...prev,
          { role: 'user', content: q },
          { role: 'assistant', content: 'Local search failed.' },
        ]);
        return;
      }
  
      let { results } = await apiRes.json() as { results: LocalItem[] };
  
      if (prefs?.wineTypes.length) {
        const wanted = prefs.wineTypes.map(t => t.toLowerCase());
        const filtered = results.filter(r =>
          wanted.some(w => r.name.toLowerCase().includes(w)));
        if (filtered.length) results = filtered;
      }
      if (!results.length) {
        setResponse('No local listings found.');
        setChatHistory(prev => [
          ...prev,
          { role: 'user', content: q },
          { role: 'assistant', content: 'No local listings found.' },
        ]);
        return;
      }
  
      setLocalRes(results.slice(0, 3));
  
      // Create a short summary for assistant reply:
      const summary =
        results
          .slice(0, 3)
          .map(
            (r, idx) =>
              `${idx + 1}. ${r.name} ($${r.price}) at ${r.store}${r.address ? ', ' + r.address : ''}`
          )
          .join('\n');
  
      setChatHistory(prev => [
        ...prev,
        { role: 'user', content: q },
        {
          role: 'assistant',
          content:
            `Here are local listings for "${q}":\n${summary}`,
        },
      ]);
    } catch {
      setResponse('Sorry, I could not retrieve local availability.');
      setChatHistory(prev => [
        ...prev,
        { role: 'user', content: q },
        { role: 'assistant', content: 'Sorry, I could not retrieve local availability.' },
      ]);
    }
  };
  

  // --- Text-only Ask ---
  const askSommelier = async () => {
    if (!question.trim()) return;
    setLocalRes([]);
    setQuestion('');

    if (userPlan === 'free' && dailyCount >= 5) {
      setResponse('⚠️ Free plan limit reached. Upgrade to ask more questions.');
      return;
    }

    const wantsLocal = /(nearby|near me|local|in my area|where can i (find|buy|get|purchase|order)|where to (buy|get|purchase|order)|buy .* near|purchase .* near|get .* near|shop .* near)/i
      .test(question);

    if (wantsLocal) {
      setLoading(true);
      await fetchLocalWine(question);
      if (userPlan === 'free') setDailyCount(c => c + 1);
      setLoading(false);
      return;
    }

    const systemPrompt =
      'You are a master sommelier and friendly conversationalist. Only answer wine-related questions.' +
      '\n\n' +
      (prefs && (prefs.wineTypes.length || prefs.flavorProfiles.length)
        ? `USER PREFERENCES:\n- Wine Types: ${prefs.wineTypes.join(', ') || 'any'}\n- Flavor Profiles: ${prefs.flavorProfiles.join(', ') || 'any'}\n`
        : 'USER PREFERENCES: None provided.\n') +
      '\nInstructions:\n' +
      '- Recommend 2–3 specific varietals when asked.\n' +
      '- Add **Perfect Pairing** section.\n' +
      '- End with a question to keep chat going.\n' +
      '- Be knowledgeable, approachable, charming.';

    const messages = [
      { role: 'system', content: systemPrompt },
      ...chatHistory,
      { role: 'user', content: question },
    ];

    setLoading(true); setResponse('');
    try {
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ model: 'gpt-4o', messages }),
      });
      const data = await r.json();
      if (data.choices?.length) {
        const content = data.choices[0].message.content;
        setResponse(content);
        setChatHistory(prev => [
          ...prev,
          { role: 'user', content: question },
          { role: 'assistant', content },
        ]);
        setQuestion(''); 
      } else { setResponse('⚠️ No answer returned.'); }
      if (userPlan === 'free') setDailyCount(c => c + 1);
    } catch {
      setResponse('Something went wrong.');
    }
    setLoading(false);
  };

  // --- Vision (photo + question together) ---
  const pickPhoto = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!res.canceled && res.assets?.length) setPhotoAsset(res.assets[0]);
  };

  const askWithPhoto = async () => {
    if (!photoAsset && !question.trim()) {
      Alert.alert("Add a photo and a question!");
      return;
    }
    setQuestion('');

    const wantsLocal = /(nearby|near me|local|in my area|where can i (find|buy|get|purchase|order)|where to (buy|get|purchase|order)|buy .* near|purchase .* near|get .* near|shop .* near)/i
      .test(question);

    if (wantsLocal) {
      setLoading(true);
      await fetchLocalWine(question);
      setLoading(false);
      return;
    }

    const form = new FormData();
    if (photoAsset) {
      form.append('photo', {
        uri: photoAsset.uri,
        name: 'wine.jpg',
        type: 'image/jpeg',
      } as any);
    }
    form.append('question', question || "What can you tell me about this wine?");

    setLoading(true);
    try {
      const r = await fetch(`${BASE_URL}/api/vision/somm`, {
        method: 'POST',
        body: form,
      });
      const json = await r.json();
      if (r.ok) {
        setResponse(json.answer);
        setChatHistory(prev => [
          ...prev,
          { role: 'user', content: `📸 "${question || 'What can you tell me about this wine?'}"` },
          { role: 'assistant', content: json.answer },
        ]);
        setPhotoAsset(null); // clear photo after ask
        setQuestion(''); // <-- CLEAR THE QUESTION INPUT HERE
      } else {
        Alert.alert('Vision error', json.error || 'Unable to analyze image');
      }
    } catch {
      Alert.alert('Network error', 'Could not reach server');
    }
    setLoading(false);
  };

  // --- TTS ---
  const speakResponse = async (text: string) => {
    if (Platform.OS === 'web') return;

    try {
      setIsSpeaking(true);

      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
      }

      const r = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model: 'tts-1', input: text, voice: 'nova' }),
      });
      const buf  = await r.arrayBuffer();

      const path = FileSystem.cacheDirectory + 'sommelai.mp3';
      await FileSystem.writeAsStringAsync(
        path,
        Buffer.from(buf).toString('base64'),
        { encoding: FileSystem.EncodingType.Base64 },
      );

      const { sound: newSound } = await Audio.Sound.createAsync({ uri: path });
      setSound(newSound);
      await newSound.playAsync();

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) return;
        if ((status as AVPlaybackStatusSuccess).didJustFinish) {
          setIsSpeaking(false);
        }
      });
    } catch (err) {
      console.warn('TTS error', err);
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = async () => {
    try {
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
      }
    } catch { /* ignore */ }
    setSound(null);
    setIsSpeaking(false);
  };

  useEffect(() => () => { sound?.unloadAsync(); }, [sound]);

  // --- Helper for safe URLs and link open (NEW) ---
  const safeUrl = (url: string) =>
    url.startsWith('http://') || url.startsWith('https://')
      ? url
      : `https://${url}`;

  const handleLinkPress = async (url: string) => {
    const validUrl = safeUrl(url);
    try {
      const supported = await Linking.canOpenURL(validUrl);
      if (supported) {
        await Linking.openURL(validUrl);
      } else {
        Alert.alert('Invalid link', 'Sorry, this link could not be opened.');
      }
    } catch {
      Alert.alert('Error', 'Something went wrong opening the link.');
    }
  };

  const Listing = ({ item }: { item: LocalItem }) => {
    const fallback = `https://www.wine-searcher.com/find/${encodeURIComponent(item.name)}`;
    const rawUrl = item.url || fallback;
    const displayUrl = safeUrl(rawUrl);

    return (
      <View style={styles.listingCard}>
        <Text style={styles.listTitle}>{item.name} – ${item.price}</Text>
        <Text style={styles.sub}>{item.store}</Text>
        {item.address ? <Text style={styles.sub}>{item.address}</Text> : null}
        <Pressable
          onPress={() => handleLinkPress(rawUrl)}
          android_ripple={{ color: '#e0e0e0' }}
        >
          <Text
            style={[
              styles.sub,
              { color: '#0066cc', textDecorationLine: 'underline', marginTop: 2 }
            ]}
            numberOfLines={1}
          >
            {displayUrl}
          </Text>
        </Pressable>
      </View>
    );
  };

  // ---- UI ----
  // For full fade background, use LinearGradient. Here, use a soft blue for simplicity.
  return (
    <KeyboardAvoidingView
      style={styles.gradient}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.header}>🍷 Ask Your AI Sommelier</Text>

          <TextInput
            style={styles.input}
            placeholder="e.g. What wine pairs with goat cheese?"
            value={question}
            onChangeText={setQuestion}
            placeholderTextColor="#9C8C7B"
            multiline
          />

          {/* Photo preview */}
          {photoAsset &&
            <View style={{ alignItems: 'center', marginBottom: 10 }}>
              <Image source={{ uri: photoAsset.uri }} style={{ width: 120, height: 180, borderRadius: 12 }} />
              <Pressable onPress={() => setPhotoAsset(null)}>
                <Text style={{ color: '#B1624E', marginTop: 5, fontWeight: '600' }}>Remove photo</Text>
              </Pressable>
            </View>
          }

          <View style={styles.buttonRow}>
            <Pressable style={styles.buttonSecondary} onPress={pickPhoto} disabled={loading}>
              <Text style={styles.buttonText}>📸 Upload Photo</Text>
            </Pressable>
            <Pressable
              style={[styles.buttonPrimary, { opacity: loading || (!photoAsset && !question.trim()) ? 0.5 : 1 }]}
              onPress={askWithPhoto}
              disabled={loading || (!photoAsset && !question.trim())}
            >
              <Text style={styles.buttonText}>{loading ? "Thinking…" : "Ask with Photo"}</Text>
            </Pressable>
          </View>
          <Pressable
            style={[styles.buttonPrimary, { opacity: loading ? 0.5 : 1 }]}
            onPress={askSommelier}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? "Thinking…" : "Ask (Text Only)"}</Text>
          </Pressable>

          {loading && (
            <ActivityIndicator size="large" color="#A68262" style={{ marginTop: 22 }} />
          )}

          {/* Local listings or chat */}
          {!!localRes.length ? (
            <View style={styles.responseBox}>
              {localRes.map((it, idx) => <Listing key={idx} item={it} />)}
            </View>
          ) : (
            <ScrollView ref={scrollRef} style={styles.chatBox}>
              {chatHistory.map((msg, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.chatBubble,
                    msg.role === 'user' ? styles.userBubble : styles.assistantBubble,
                  ]}
                >
                  <Text style={styles.chatText}>{msg.content}</Text>
                </View>
              ))}
            </ScrollView>
          )}

          {/* TTS buttons */}
          {Platform.OS !== 'web' && !!response && !localRes.length && (
            <View style={{ marginTop: 10 }}>
              {!isSpeaking ? (
                <Pressable style={styles.buttonSecondary} onPress={() => speakResponse(response)}>
                  <Text style={styles.buttonText}>🔊 Hear Sommelier Speak</Text>
                </Pressable>
              ) : (
                <Pressable style={styles.buttonSecondary} onPress={stopSpeaking}>
                  <Text style={styles.buttonText}>⏹ Stop Speaking</Text>
                </Pressable>
              )}
              {isSpeaking && <ActivityIndicator style={{ marginTop: 10 }} />}
            </View>
          )}

          {userPlan === 'free' && (
            <Text style={{ marginTop: 20, textAlign: 'center', color: '#B1624E', fontWeight: '600' }}>
              🔓 Upgrade to unlock preferences and unlimited inquiries.
            </Text>
          )}

          <Pressable
            style={[styles.buttonSecondary, { marginTop: 32, backgroundColor: '#F3EFE7' }]}
            onPress={() => {
              setChatHistory([]);
              setResponse('');
              setQuestion('');
              setLocalRes([]);
              setPhotoAsset(null);
            }}
          >
            <Text style={[styles.buttonText, { color: '#5E5C49' }]}>🧼 Start Over</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* ---------- styles ---------- */
const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    backgroundColor: '#F7F5EF', // sand/linen base
  },
  content: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingVertical: 38,
    paddingHorizontal: 2,
  },
  card: {
    width: '100%',
    maxWidth: 470,
    backgroundColor: '#FAF8F4', // light earth
    borderRadius: 24,
    padding: 26,
    shadowColor: '#A68262',
    shadowOpacity: 0.10,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
    marginVertical: 10,
  },
  header: {
    fontSize: 27,
    fontWeight: 'bold',
    marginBottom: 19,
    textAlign: 'center',
    color: '#8B7C5A', // olive-brown
    letterSpacing: 0.3,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D3C4B0',
    borderRadius: 13,
    padding: 15,
    marginBottom: 12,
    backgroundColor: '#F6F4ED',
    color: '#5E5C49',
    fontSize: 16,
    minHeight: 56,
    textAlignVertical: 'top',
  },
  responseBox: {
    marginTop: 22,
    backgroundColor: '#F2E9DF',
    borderRadius: 15,
    padding: 17,
    shadowColor: '#9C8C7B',
    shadowOpacity: 0.08,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  listingCard: {
    marginBottom: 14,
    borderRadius: 11,
    backgroundColor: '#F5ECE2',
    padding: 10,
    shadowColor: '#A68262',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#B1624E', // terracotta
  },
  sub: {
    fontSize: 14,
    color: '#7D7358', // muted brown
  },
  chatBox: {
    maxHeight: 400,
    marginTop: 18,
    marginBottom: 12,
  },
  chatBubble: {
    padding: 12,
    marginVertical: 7,
    marginHorizontal: 8,
    borderRadius: 14,
    maxWidth: '80%',
    shadowColor: '#A68262',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#A9B09F44', // sage green transparent
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#D4BFAA55', // tan transparent
  },
  chatText: {
    fontSize: 16,
    color: '#5E5C49',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 9,
    gap: 7,
  },
  buttonPrimary: {
    backgroundColor: '#B1624E', // terracotta
    padding: 14,
    borderRadius: 13,
    alignItems: 'center',
    marginVertical: 5,
    flex: 1,
    marginHorizontal: 3,
    shadowColor: '#8B7C5A',
    shadowOpacity: 0.11,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  buttonSecondary: {
    backgroundColor: '#A9B09F', // sage
    padding: 14,
    borderRadius: 13,
    alignItems: 'center',
    marginVertical: 5,
    flex: 1,
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: '#B1A48A',
  },
  buttonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.09,
  },
});