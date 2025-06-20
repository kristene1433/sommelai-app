import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, EntryType } from '../types';

type Props = { userEmail: string };

export default function JournalListScreen({ userEmail }: Props) {
  const [entries, setEntries] = useState<(EntryType & { _id?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isFocused = useIsFocused();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const fetchEntries = useCallback(async () => {
    try {
      const res  = await fetch(`http://192.168.4.80:5000/api/journal/${userEmail}`);
      const data = await res.json();
      setEntries(data);
    } catch (err) {
      console.error('Fetch journal error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userEmail]);

  useEffect(() => {
    if (isFocused) {
      setLoading(true);
      fetchEntries();
    }
  }, [isFocused, fetchEntries]);

  const deleteEntry = (id?: string) => {
    if (!id) return;
    Alert.alert('Delete entry?', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await fetch(`http://192.168.4.80:5000/api/journal/${id}`, {
              method: 'DELETE',
            });
            if (res.ok) {
              setEntries((prev) => prev.filter((e) => e._id !== id));
            } else Alert.alert('Error', 'Failed to delete entry');
          } catch (err) {
            console.error('Delete error', err);
            Alert.alert('Error', 'Network issue while deleting');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: EntryType & { _id?: string } }) => (
    <View style={styles.card}>
      <TouchableOpacity
        style={{ flex: 1 }}
        onPress={() => navigation.navigate('ReviewEntry', { entry: item })}
        activeOpacity={0.85}
      >
        <Text style={styles.title}>
          {item.wineName} {item.vintage ? `(${item.vintage})` : ''}
        </Text>
        <Text style={styles.subtitle}>
          {item.region}
          {item.dateTasted ? ` — ${item.dateTasted}` : ''}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => deleteEntry(item._id)}>
        <Text style={styles.delete}>🗑</Text>
      </TouchableOpacity>
    </View>
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchEntries();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#A68262" />
      </View>
    );
  }

  const Header = () => (
    <View style={styles.headerRow}>
      <Text style={styles.header}>📚 Your Wine Journal</Text>
      <TouchableOpacity
        style={styles.addBtn}
        onPress={() => navigation.navigate('WineJournal', { userEmail })}
        activeOpacity={0.85}
      >
        <Text style={styles.addText}>＋ New Entry</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.gradient}>
      <FlatList
        data={entries}
        keyExtractor={(item) => item._id ?? `${item.wineName}-${item.dateTasted}`}
        renderItem={renderItem}
        ListHeaderComponent={<Header />}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </SafeAreaView>
  );
}

/* -------- earthy styles -------- */
const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    backgroundColor: '#F7F5EF', // sand/linen
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 24,
    paddingHorizontal: 2,
    paddingTop: 2,
    gap: 12,
  },
  header: {
    fontSize: 27,
    fontWeight: 'bold',
    color: '#8B7C5A', // olive-brown
    letterSpacing: 0.2,
  },
  addBtn: {
    backgroundColor: '#B1624E', // terracotta
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 18,
    shadowColor: '#A68262',
    shadowOpacity: 0.10,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  addText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
    letterSpacing: 0.1,
  },
  list: {
    padding: 18,
    paddingBottom: 40,
    paddingTop: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 19,
    paddingHorizontal: 18,
    backgroundColor: '#FAF8F4',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#D3C4B0',
    shadowColor: '#A68262',
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    gap: 7,
  },
  delete: { fontSize: 22, marginLeft: 12, color: '#B1624E', fontWeight: 'bold' },
  title: { fontSize: 19, fontWeight: '700', color: '#5E5C49', marginBottom: 3 },
  subtitle: { color: '#A68262', marginTop: 0, fontWeight: '500' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
