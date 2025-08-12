import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import WineChat from '../components/WineChat';
import PreferencesScreen from '../components/PreferencesScreen';
import ProfileScreen from '../components/ProfileScreen';
import JournalStack from './JournalStack'; 
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';

const Tab = createBottomTabNavigator();

type Props = {
  userPlan: 'paid' | null;
  userEmail: string;
  logout: () => void;
  navigation: any;
};

export default function MainTabs({ userPlan, userEmail, logout }: Props) {
  const iconFor = (name: string) =>
    name === 'Sommelier' ? 'wine'
      : name === 'Preferences' ? 'options'
      : name === 'Profile' ? 'person-circle'
      : name === 'Journal' ? 'book'
      : 'help';

  const effectivePlan = userPlan ?? 'paid';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={iconFor(route.name) as any} size={size} color={color} />
        ),
        tabBarActiveTintColor: styles.tabBarActiveLabel.color,
        tabBarInactiveTintColor: styles.tabBarLabel.color,
        tabBarStyle: styles.tabBar,
        headerShown: false,
      })}
    >
      {/* Sommelier chat ------------------------------------------------ */}
      <Tab.Screen name="Sommelier">
        {(p) => (
          <WineChat
            {...p}
            userPlan={effectivePlan}
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
      {effectivePlan === 'paid' && (
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
            userPlan={effectivePlan}
            logout={logout}
          />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#1E1E1E', // Dark slate
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A', // Subtle border
    shadowColor: '#000000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B8B8B8', // Medium gray
  },
  tabBarActiveLabel: {
    color: '#E0E0E0', // Light gray text
  },
  tabBarIcon: {
    color: '#B8B8B8', // Medium gray
  },
  tabBarActiveIcon: {
    color: '#E0E0E0', // Light gray text
  },
});
