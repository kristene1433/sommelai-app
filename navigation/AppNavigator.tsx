import React, { useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen         from '../components/LoginScreen';
import SignupScreen        from '../components/SignupScreen';
import ChoosePlanScreen    from '../components/ChoosePlanScreen';
import MainTabs            from './MainTabs';

const Stack = createNativeStackNavigator();

/* 🔧  ONE place to change your backend IP  */
const BASE_URL = 'http://192.168.4.80:5000';

export default function AppNavigator() {
  const [userIsLoggedIn, setUserIsLoggedIn] = useState(false);
  const [userPlan,  setUserPlan ] = useState<'free' | 'paid' | null>(null);
  const [userEmail, setUserEmail] = useState('');

  /* -------------------------------------------------
     Fetch plan; if user isn’t in DB yet (404) create
     a default FREE document so login succeeds.
  --------------------------------------------------*/
  const fetchUserPlan = async (email: string) => {
    try {
      const res = await fetch(`${BASE_URL}/api/preferences/${email}`);

      if (res.status === 404) {
        // create a default free entry
        await fetch(`${BASE_URL}/api/preferences`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            plan: 'free',
            wineTypes: [],
            flavorProfiles: [],
          }),
        });
        setUserPlan('free');
      } else if (res.ok) {
        const data = await res.json();
        setUserPlan(data.plan);
      } else {
        throw new Error('Bad response from server');
      }

      setUserEmail(email);
      setUserIsLoggedIn(true);
    } catch (err) {
      console.error('❌ fetchPlan error:', err);
      alert('Could not connect to server. Is the backend running?');
    }
  };

  /* Central logout helper passed to MainTabs > Profile */
  const logout = () => {
    setUserIsLoggedIn(false);
    setUserPlan(null);
    setUserEmail('');
  };

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!userIsLoggedIn ? (
        <>
          <Stack.Screen name="Login">
            {(p) => <LoginScreen  {...p} fetchPlan={fetchUserPlan} />}
          </Stack.Screen>

          <Stack.Screen name="Signup">
            {(p) => <SignupScreen {...p} fetchPlan={fetchUserPlan} />}
          </Stack.Screen>

          <Stack.Screen name="ChoosePlan">
            {(p) => <ChoosePlanScreen {...p} fetchPlan={fetchUserPlan} />}
          </Stack.Screen>
        </>
      ) : (
        <Stack.Screen name="MainTabs">
          {(p) => (
            <MainTabs
              {...p}
              userPlan={userPlan}
              userEmail={userEmail}
              logout={logout}
            />
          )}
        </Stack.Screen>
      )}
    </Stack.Navigator>
  );
}
