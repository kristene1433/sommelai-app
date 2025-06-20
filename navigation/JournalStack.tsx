// JournalStack.tsx — type-safe (with Blind Tasting)
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import JournalListScreen   from '../components/JournalListScreen';
import WineJournalScreen   from '../components/WineJournalScreen';
import ReviewEntryScreen   from '../components/ReviewEntryScreen';
import BlindTastingScreen  from '../components/BlindTastingScreen';

import { RootStackParamList } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();

type Props = {
  route?: { params?: { userEmail?: string } };
};

export default function JournalStack({ route }: Props) {
  const userEmail = route?.params?.userEmail ?? '';

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* 📚 list */}
      <Stack.Screen name="JournalList">
        {() => <JournalListScreen userEmail={userEmail} />}
      </Stack.Screen>

      {/* ✍️ add / edit */}
      <Stack.Screen
        name="WineJournal"
        component={WineJournalScreen}
        initialParams={{ userEmail }}   // ← pass email once
      />

      {/* 🔍 review */}
      <Stack.Screen name="ReviewEntry"  component={ReviewEntryScreen} />

      {/* 🕶 blind tasting */}
      <Stack.Screen name="BlindTasting" component={BlindTastingScreen} />
    </Stack.Navigator>
  );
}


