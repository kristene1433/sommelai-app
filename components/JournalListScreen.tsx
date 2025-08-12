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

// Helper to format dateTasted nicely
const formatDate = (dateStr?: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

export default function JournalListScreen({ userEmail }: Props) {
  const [entries, setEntries] = useState<(EntryType & { _id?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isFocused = useIsFocused();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const fetchEntries = useCallback(async () => {
    try {
      const res  = await fetch(`https://sommelai-app-a743d57328f0.herokuapp.com/api/journal/${userEmail}`);
      const data = await res.json();
      setEntries(data);
    } catch (err) {
      console.error('Fetch journal error:', err);
      Alert.alert('Error', 'Failed to fetch journal entries');
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
            const res = await fetch(`https://sommelai-app-a743d57328f0.herokuapp.com/api/journal/${id}`, {
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

  const renderItem = ({ item }: { item: EntryType & { _id?: string } }) => {
    const formattedDate = formatDate(item.dateTasted);
    return (
      <TouchableOpacity
        style={styles.entryCard}
        onPress={() => navigation.navigate('ReviewEntry', { entry: item })}
        activeOpacity={0.85}
      >
        <View style={styles.entryContent}>
          {/* Main wine info */}
          <View style={styles.wineInfo}>
            <Text style={styles.wineName} numberOfLines={1}>
              {item.wineName || 'Unnamed Wine'}
            </Text>
            {item.vintage && (
              <Text style={styles.vintage}>({item.vintage})</Text>
            )}
          </View>

          {/* Producer and region */}
          <View style={styles.detailsRow}>
            {item.producer && (
              <Text style={styles.producer} numberOfLines={1}>
                {item.producer}
              </Text>
            )}
            {item.region && (
              <Text style={styles.region} numberOfLines={1}>
                {item.region}
              </Text>
            )}
          </View>

          {/* Date and varietals */}
          <View style={styles.bottomRow}>
            {formattedDate && (
              <Text style={styles.date}>{formattedDate}</Text>
            )}
            {item.varietals && (
              <Text style={styles.varietals} numberOfLines={1}>
                {item.varietals}
              </Text>
            )}
          </View>
        </View>

        {/* Delete button */}
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => deleteEntry(item._id)}
        >
          <Text style={styles.deleteIcon}>🗑</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchEntries();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#B8B8B8" />
      </View>
    );
  }

  const Header = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>📚 Your Wine Journal</Text>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('WineJournal', { userEmail })}
        activeOpacity={0.85}
      >
        <Text style={styles.addButtonText}>＋ New Entry</Text>
      </TouchableOpacity>
    </View>
  );

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateText}>No journal entries yet</Text>
      <Text style={styles.emptyStateSubtext}>Start documenting your wine experiences!</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={entries}
        keyExtractor={(item) => item._id ?? `${item.wineName}-${item.dateTasted}`}
        renderItem={renderItem}
        ListHeaderComponent={<Header />}
        ListEmptyComponent={<EmptyState />}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#B8B8B8']}
            tintColor="#B8B8B8"
          />
        }
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A', // Very dark charcoal background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0A0A',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#E0E0E0',
    letterSpacing: 0.3,
    fontFamily: 'serif',
  },
  addButton: {
    backgroundColor: '#404040',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  addButtonText: {
    color: '#E0E0E0',
    fontWeight: '600',
    fontSize: 14,
    letterSpacing: 0.1,
  },
  entryCard: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E', // Dark slate
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  entryContent: {
    flex: 1,
    marginRight: 12,
  },
  wineInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  wineName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#E0E0E0',
    flex: 1,
    marginRight: 8,
  },
  vintage: {
    fontSize: 14,
    color: '#B8B8B8',
    fontWeight: '500',
  },
  detailsRow: {
    flexDirection: 'row',
    marginBottom: 6,
    gap: 12,
  },
  producer: {
    fontSize: 14,
    color: '#B8B8B8',
    fontWeight: '500',
    flex: 1,
  },
  region: {
    fontSize: 14,
    color: '#A0A0A0',
    fontWeight: '400',
    flex: 1,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontSize: 12,
    color: '#A0A0A0',
    fontWeight: '500',
    fontStyle: 'italic',
  },
  varietals: {
    fontSize: 12,
    color: '#B8B8B8',
    fontWeight: '400',
    flex: 1,
    textAlign: 'right',
    marginLeft: 8,
  },
  deleteButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2A2A2A',
  },
  deleteIcon: {
    fontSize: 16,
    color: '#B8B8B8',
  },
  separator: {
    height: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#B8B8B8',
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#A0A0A0',
    textAlign: 'center',
    lineHeight: 20,
  },
});
