import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, TextInput, Text, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator,
  Pressable, Linking, Alert, Image, Switch, Keyboard,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { OPENAI_API_KEY } from '@env';
import * as FileSystem from 'expo-file-system';
import { Audio, AVPlaybackStatusSuccess } from 'expo-av';
import { Buffer } from 'buffer';
global.Buffer = Buffer;

type Props = { userPlan: 'paid'; userEmail: string };
type Prefs = { wineTypes: string[]; flavorProfiles: string[] };
type LocalItem = {
  name: string; price: string; store: string;
  address?: string; url?: string;
};

const BASE_URL = 'http://localhost:5000';

function cleanAssistantResponse(raw: string) {
  return raw
    .replace(/(\*{1,2})(.*?)\1/g, '$2')
    .replace(/^\d+\.\s*/gm, '')
    .replace(/^- /gm, '')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

export default function WineChat({ userPlan, userEmail }: Props) {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [localRes, setLocalRes] = useState<LocalItem[]>([]);
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [loading, setLoading] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [chatHistory, setChatHistory] = useState<
    { role: 'user' | 'assistant'; content: string; type?: 'vision' | 'text' }[]
  >([]);
  const [photoAsset, setPhotoAsset] = useState<any>(null);
  const scrollRef = useRef<ScrollView | null>(null);
  const [usePreferences, setUsePreferences] = useState(true);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [chatHistory]);

  const loadPrefs = useCallback(async () => {
    if (userPlan !== 'paid') {
      setPrefs(null);
      return;
    }
    try {
      const r = await fetch(`${BASE_URL}/api/preferences/${userEmail}`);
      if (r.ok) setPrefs(await r.json());
    } catch {}
  }, [userPlan, userEmail]);

  useEffect(() => {
    loadPrefs();
  }, [loadPrefs]);

  useFocusEffect(useCallback(() => {
    loadPrefs();
  }, [loadPrefs]));

  const fetchLocalWine = async (q: string) => {
    try {
      const zipRes = await fetch(`${BASE_URL}/api/zip/${userEmail}`);
      const { zip } = await zipRes.json();
      if (!zip) {
        setResponse('No ZIP on file. Please add it in Profile.');
        setChatHistory(prev => [
          ...prev,
          { role: 'user', content: q, type: 'text' },
          { role: 'assistant', content: 'No ZIP on file. Please add it in Profile.', type: 'text' },
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
          { role: 'user', content: q, type: 'text' },
          { role: 'assistant', content: 'Local search failed.', type: 'text' },
        ]);
        return;
      }
      let { results } = (await apiRes.json()) as { results: LocalItem[] };
      if (prefs?.wineTypes.length) {
        const wanted = prefs.wineTypes.map(t => t.toLowerCase());
        const filtered = results.filter(r =>
          wanted.some(w => r.name.toLowerCase().includes(w))
        );
        if (filtered.length) results = filtered;
      }
      if (!results.length) {
        setResponse('No local listings found.');
        setChatHistory(prev => [
          ...prev,
          { role: 'user', content: q, type: 'text' },
          { role: 'assistant', content: 'No local listings found.', type: 'text' },
        ]);
        return;
      }
      setLocalRes(results.slice(0, 3));
      setChatHistory(prev => [
        ...prev,
        { role: 'user', content: q, type: 'text' },
        // Removed blank assistant message to prevent UI confusion
      ]);
    } catch {
      setResponse('Sorry, I could not retrieve local availability.');
      setChatHistory(prev => [
        ...prev,
        { role: 'user', content: q, type: 'text' },
        { role: 'assistant', content: 'Sorry, I could not retrieve local availability.', type: 'text' },
      ]);
    }
  };

  const askSommelier = async () => {
    if (!question.trim()) return;
    Keyboard.dismiss();
    setLocalRes([]);
    setQuestion('');

    const wantsLocal = /(nearby|near me|local|in my area|where can i (find|buy|get|purchase|order)|where to (buy|get|purchase|order)|buy .* near|purchase .* near|get .* near|shop .* near)/i.test(
      question.trim().toLowerCase()
    );

    if (wantsLocal) {
      setLoading(true);
      await fetchLocalWine(question);
      setLoading(false);
      return;
    }

    const messages = [
      {
        role: 'system',
        content:
          'You are a master sommelier and friendly conversationalist. ' +
          'The conversation is about a specific wine identified earlier. ' +
          'For every follow-up question, answer as if referring to that wine unless the user explicitly changes topic. ' +
          (usePreferences && prefs
            ? `USER PREFERENCES:\n- Wine Types: ${prefs.wineTypes.join(', ') || 'any'}\n- Flavor Profiles: ${prefs.flavorProfiles.join(', ') || 'any'}\n`
            : 'USER PREFERENCES: None provided.\n') +
          '\nInstructions:\n' +
          '- Always answer about the known wine unless told otherwise.\n' +
          '- Recommend 2–3 varietals when asked.\n' +
          '- Add Perfect Pairing section (no bullets, no numbers, no markdown—just conversational style).\n' +
          '- End with a question to keep chat going.\n' +
          '- Be knowledgeable, approachable, charming. No asterisks, no markdown, no numbered lists.',
      },
      ...chatHistory.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: question },
    ];

    setLoading(true);
    setResponse('');
    try {
      const r = await fetch(`${BASE_URL}/api/chat/somm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messages,
          usePreferences: usePreferences,
          preferences: prefs
        }),
      });
      const data = await r.json();
      
      if (r.ok && data && data.answer) {
        const content = cleanAssistantResponse(data.answer);
        setResponse(content);
        setChatHistory(prev => [
          ...prev,
          { role: 'user', content: question, type: 'text' },
          { role: 'assistant', content, type: 'text' },
        ]);
        setQuestion('');
      } else if (data.error) {
        console.error('Backend API Error:', data.error);
        setResponse(`⚠️ API Error: ${data.error || 'Unknown error'}`);
        setChatHistory(prev => [
          ...prev,
          { role: 'user', content: question, type: 'text' },
          { role: 'assistant', content: `⚠️ API Error: ${data.error || 'Unknown error'}`, type: 'text' },
        ]);
      } else {
        setResponse('⚠️ No answer returned.');
        setChatHistory(prev => [
          ...prev,
          { role: 'user', content: question, type: 'text' },
          { role: 'assistant', content: '⚠️ No answer returned.', type: 'text' },
        ]);
      }
    } catch (error) {
      console.error('Network Error:', error);
      setResponse('⚠️ Network error - please check your connection');
      setChatHistory(prev => [
        ...prev,
        { role: 'user', content: question, type: 'text' },
        { role: 'assistant', content: '⚠️ Network error - please check your connection', type: 'text' },
      ]);
    }
    setLoading(false);
  };

  const pickPhoto = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!res.canceled && res.assets?.length) setPhotoAsset(res.assets[0]);
  };

  const askWithPhoto = async () => {
    if (!photoAsset && !question.trim()) {
      Alert.alert('Add a photo and a question!');
      return;
    }
    Keyboard.dismiss();
    setQuestion('');

    const lastVisionAssistant = [...chatHistory]
      .reverse()
      .find(m => m.type === 'vision' && m.role === 'assistant');
    const previousWineDescription = lastVisionAssistant?.content || '';

    setLoading(true);
    try {
      const form = new FormData();
      form.append('photo', {
        uri: photoAsset.uri,
        name: photoAsset.fileName || 'wine.jpg',
        type: photoAsset.type || 'image/jpeg',
      } as any);
      form.append('question', question || 'What can you tell me about this wine?');

      if (previousWineDescription) {
        form.append('previousWineDescription', previousWineDescription);
      }

      const r = await fetch(`${BASE_URL}/api/vision/somm`, {
        method: 'POST',
        body: form,
      });
      const json = await r.json();
      if (r.ok) {
        const clean = cleanAssistantResponse(json.answer);
        setResponse(clean);
        setChatHistory(prev => [
          ...prev,
          { role: 'user', content: `📸 "${question || 'What can you tell me about this wine?'}"`, type: 'vision' },
          { role: 'assistant', content: clean, type: 'vision' },
        ]);
        setPhotoAsset(null);
        setQuestion('');
      } else {
        Alert.alert('Vision error', json.error || 'Unable to analyze image');
      }
    } catch {
      Alert.alert('Network error', 'Could not reach server');
    }
    setLoading(false);
  };

  const speakResponse = async (text: string) => {
    if (Platform.OS === 'web') return;
    try {
      setIsSpeaking(true);
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
      }
      const cleanText = cleanAssistantResponse(text);
      const r = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY?.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model: 'tts-1', input: cleanText, voice: 'nova' }),
      });
      const buf = await r.arrayBuffer();
      const path = FileSystem.cacheDirectory + 'sommelai.mp3';
      await FileSystem.writeAsStringAsync(path, Buffer.from(buf).toString('base64'), {
        encoding: FileSystem.EncodingType.Base64,
      });
      const { sound: newSound } = await Audio.Sound.createAsync({ uri: path });
      setSound(newSound);
      await newSound.playAsync();
      newSound.setOnPlaybackStatusUpdate(status => {
        if (!status.isLoaded) return;
        if ((status as AVPlaybackStatusSuccess).didJustFinish) {
          setIsSpeaking(false);
        }
      });
    } catch (err) {
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = async () => {
    try {
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
      }
    } catch {}
    setSound(null);
    setIsSpeaking(false);
  };

  useEffect(() => {
    return () => {
      sound?.unloadAsync();
    };
  }, [sound]);

  const safeUrl = (url: string) =>
    url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;

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
        <Text style={styles.listTitle}>{item.name}</Text>
        <Text style={styles.price}>${item.price}</Text>
        <Text style={styles.sub}>{item.store}</Text>
        {item.address ? <Text style={styles.sub}>{item.address}</Text> : null}
        <Pressable onPress={() => handleLinkPress(rawUrl)} android_ripple={{ color: '#e0e0e0' }}>
          <Text
            style={[styles.sub, { color: '#0066cc', textDecorationLine: 'underline', marginTop: 2 }]}
            numberOfLines={1}
          >
            {displayUrl}
          </Text>
        </Pressable>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.gradient}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.header}>🍷 Ask Your AI Sommelier</Text>
          {userPlan === 'paid' && (
            <View style={styles.prefsToggleRow}>
              <Text style={styles.prefsToggleText}>Use My Preferences</Text>
              <Switch
                value={usePreferences}
                onValueChange={setUsePreferences}
                trackColor={{ true: '#B1624E', false: '#D8C8B8' }}
                thumbColor={usePreferences ? '#8B7C5A' : '#B8A88A'}
              />
            </View>
          )}
          {!usePreferences && userPlan === 'paid' && (
            <Text style={styles.prefsOffNote}>Preferences are OFF. You’ll get classic sommelier answers!</Text>
          )}
          <TextInput
            style={styles.input}
            placeholder="e.g. What wine pairs with goat cheese?"
            value={question}
            onChangeText={setQuestion}
            placeholderTextColor="#9C8C7B"
            multiline
          />
          {photoAsset && (
            <View style={{ alignItems: 'center', marginBottom: 10 }}>
              <Image source={{ uri: photoAsset.uri }} style={{ width: 120, height: 180, borderRadius: 12 }} />
              <Pressable onPress={() => setPhotoAsset(null)}>
                <Text style={{ color: '#B1624E', marginTop: 5, fontWeight: '600' }}>Remove photo</Text>
              </Pressable>
            </View>
          )}

          <View style={styles.buttonRow}>
            <Pressable style={styles.buttonSecondary} onPress={pickPhoto} disabled={loading}>
              <Text style={styles.buttonText}>📸 Upload Photo</Text>
            </Pressable>
            <Pressable
              style={[
                styles.buttonPrimary,
                {
                  opacity: loading || (!question.trim() && !photoAsset) ? 0.5 : 1,
                },
              ]}
              onPress={photoAsset ? askWithPhoto : askSommelier}
              disabled={loading || (!question.trim() && !photoAsset)}
            >
              <Text style={styles.buttonText}>{loading ? 'Thinking…' : 'Ask'}</Text>
            </Pressable>
          </View>

          {loading && <ActivityIndicator size="large" color="#A68262" style={{ marginTop: 22 }} />}

          {!!localRes.length ? (
            <View style={styles.responseBox}>{localRes.map((it, idx) => <Listing key={idx} item={it} />)}</View>
          ) : (
            <ScrollView
              ref={scrollRef}
              style={styles.chatBox}
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
            >
              {chatHistory.length === 0 && !loading && (
                <Text style={styles.emptyStateText}>
                  Ask me anything about wine! 🍷
                </Text>
              )}
              {chatHistory.map((msg, idx) => (
                <View
                  key={idx}
                  style={[styles.chatBubble, msg.role === 'user' ? styles.userBubble : styles.assistantBubble]}
                >
                  {msg.role === 'assistant'
                    ? cleanAssistantResponse(msg.content)
                        .split('\n')
                        .filter(line => !!line.trim())
                        .map((line, i) =>
                          line.trim().toLowerCase().startsWith('perfect pairing') ? (
                            <View key={i} style={styles.pairingBubble}>
                              <Text style={styles.pairingText}>{line.trim()}</Text>
                            </View>
                          ) : (
                            <View key={i} style={styles.assistantItemBubble}>
                              <Text style={styles.chatText}>{line.trim()}</Text>
                            </View>
                          )
                        )
                    : (
                      <Text style={styles.chatText}>{msg.content}</Text>
                    )}
                </View>
              ))}
              {loading && (
                <View style={styles.loadingBubble}>
                  <ActivityIndicator size="small" color="#E0E0E0" />
                  <Text style={styles.loadingText}>Thinking...</Text>
                </View>
              )}
            </ScrollView>
          )}

          {Platform.OS !== 'web' && !!response && !localRes.length && (
            <View style={styles.speakAndResetRow}>
              {!isSpeaking ? (
                <Pressable style={[styles.buttonSecondary, styles.smallButton]} onPress={() => speakResponse(response)}>
                  <Text style={styles.smallButtonText}>🔊 Hear Sommelier Speak</Text>
                </Pressable>
              ) : (
                <Pressable style={[styles.buttonSecondary, styles.smallButton]} onPress={stopSpeaking}>
                  <Text style={styles.smallButtonText}>⏹ Stop Speaking</Text>
                </Pressable>
              )}

              <Pressable
                style={[styles.buttonSecondary, styles.smallButton, { marginLeft: 10 }]}
                onPress={() => {
                  setChatHistory([]);
                  setResponse('');
                  setQuestion('');
                  setLocalRes([]);
                  setPhotoAsset(null);
                }}
              >
                <Text style={[styles.smallButtonText, { color: '#5E5C49' }]}>🧼 Start Over</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    backgroundColor: '#0A0A0A', // Very dark charcoal background
  },
  content: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingVertical: 38,
    paddingHorizontal: 2,
  },
  card: {
    width: '100%',
    maxWidth: 470,
    backgroundColor: '#1E1E1E', // Dark slate
    borderRadius: 24,
    padding: 26,
    shadowColor: '#000000',
    shadowOpacity: 0.3,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#2A2A2A', // Subtle border
  },
  header: {
    fontSize: 27,
    fontWeight: '700',
    marginBottom: 19,
    textAlign: 'center',
    color: '#E0E0E0', // Light gray text
    letterSpacing: 0.3,
    fontFamily: 'serif',
  },
  prefsToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 8,
    marginTop: -5,
  },
  prefsToggleText: {
    color: '#B8B8B8', // Medium gray
    fontWeight: '600',
    fontSize: 16,
    marginRight: 12,
  },
  prefsOffNote: {
    color: '#A0A0A0', // Light gray
    marginBottom: 7,
    fontWeight: '600',
    textAlign: 'center',
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#404040', // Medium gray border
    borderRadius: 13,
    padding: 15,
    marginBottom: 12,
    backgroundColor: '#2A2A2A', // Dark input background
    color: '#E0E0E0', // Light gray text
    fontSize: 16,
    minHeight: 56,
    textAlignVertical: 'top',
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  responseBox: {
    marginTop: 22,
    backgroundColor: '#252525', // Darker slate
    borderRadius: 15,
    padding: 17,
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  listingCard: {
    marginBottom: 14,
    borderRadius: 11,
    backgroundColor: '#2A2A2A', // Dark slate
    padding: 10,
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#B8B8B8', // Medium gray
  },
  price: {
    fontSize: 15,
    color: '#E0E0E0', // Light gray text
    fontWeight: 'bold',
    marginBottom: 2,
  },
  sub: {
    fontSize: 14,
    color: '#A0A0A0', // Light gray
  },
  chatBox: {
    maxHeight: 400,
    marginTop: 18,
    marginBottom: 12,
    paddingBottom: 40,
  },
  chatBubble: {
    padding: 12,
    marginVertical: 7,
    marginHorizontal: 8,
    borderRadius: 14,
    maxWidth: '80%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#404040', // Medium gray
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#2A2A2A', // Dark slate
  },
  assistantItemBubble: {
    marginBottom: 7,
    backgroundColor: '#252525', // Darker slate
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
    maxWidth: '90%',
  },
  pairingBubble: {
    marginBottom: 7,
    backgroundColor: '#3A3A3A', // Darker slate
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    alignSelf: 'flex-start',
    maxWidth: '90%',
    borderLeftWidth: 5,
    borderLeftColor: '#404040', // Medium gray
  },
  pairingText: {
    fontWeight: '700',
    color: '#B8B8B8', // Medium gray
    fontSize: 16,
    fontStyle: 'italic',
  },
  chatText: {
    fontSize: 16,
    color: '#E0E0E0', // Light gray text
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 9,
    gap: 7,
  },
  buttonPrimary: {
    backgroundColor: '#404040', // Medium gray
    padding: 14,
    borderRadius: 13,
    alignItems: 'center',
    marginVertical: 5,
    flex: 1,
    marginHorizontal: 3,
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
    borderWidth: 1,
    borderColor: '#505050', // Lighter gray accent
  },
  buttonSecondary: {
    backgroundColor: '#2A2A2A', // Dark slate
    padding: 14,
    borderRadius: 13,
    alignItems: 'center',
    marginVertical: 5,
    flex: 1,
    marginHorizontal: 3,
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
    fontSize: 16,
    letterSpacing: 0.09,
  },
  speakAndResetRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 10,
  },
  smallButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginVertical: 5,
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  smallButtonText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.05,
    color: '#E0E0E0', // Light gray text
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#B8B8B8',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 20,
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginVertical: 7,
    marginHorizontal: 8,
    borderRadius: 14,
    backgroundColor: '#2A2A2A',
    alignSelf: 'flex-start',
    maxWidth: '80%',
  },
  loadingText: {
    fontSize: 16,
    color: '#B8B8B8',
    marginLeft: 8,
  },
});
