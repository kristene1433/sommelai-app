import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import WineChat from '../components/WineChat';
import PreferencesScreen from '../components/PreferencesScreen';
import ProfileScreen from '../components/ProfileScreen';
//import WineJournalScreen from '../components/WineJournalScreen';
import JournalStack from './JournalStack'; 
import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();

type Props = {
  userPlan: 'free' | 'paid' | null;
  userEmail: string;
  logout: () => void;
};

export default function MainTabs({ userPlan, userEmail, logout }: Props) {
  const iconFor = (name: string) =>
    name === 'Sommelier' ? 'wine'
      : name === 'Preferences' ? 'options'
      : name === 'Profile' ? 'person-circle'
      : name === 'Journal' ? 'book'
      : 'help';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={iconFor(route.name) as any} size={size} color={color} />
        ),
        tabBarActiveTintColor: '#800000',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      {/* Sommelier chat ------------------------------------------------ */}
      <Tab.Screen name="Sommelier">
        {(p) => (
          <WineChat
            {...p}
            userPlan={userPlan || 'free'}
            userEmail={userEmail}
          />
        )}
      </Tab.Screen>

      {/* Wine Journal -------------------------------------------------- */}
      
      <Tab.Screen
        name="Journal"
        component={JournalStack}
        initialParams={{ userEmail }}
      />


      {/* Preferences (paid only) -------------------------------------- */}
      {userPlan === 'paid' && (
        <Tab.Screen name="Preferences">
          {(p) => <PreferencesScreen {...p} userEmail={userEmail} />}
        </Tab.Screen>
      )}

      {/* Profile / Logout --------------------------------------------- */}
      <Tab.Screen name="Profile">
        {(p) => (
          <ProfileScreen
            {...p}
            userEmail={userEmail}
            userPlan={userPlan || 'free'}
            logout={logout}
          />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
