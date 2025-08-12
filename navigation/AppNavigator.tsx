import React, { useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen         from '../components/LoginScreen';
import SignupScreen        from '../components/SignupScreen';
import ChoosePlanScreen    from '../components/ChoosePlanScreen';
import MainTabs            from './MainTabs';

const Stack = createNativeStackNavigator();

/* 🔧  ONE place to change your backend IP  */
const BASE_URL = 'https://sommelai-app-a743d57328f0.herokuapp.com';

export default function AppNavigator() {
  const [userIsLoggedIn, setUserIsLoggedIn] = useState(false);
  const [userPlan,  setUserPlan ] = useState<'paid' | null>(null); // only 'paid'
  const [userEmail, setUserEmail] = useState('');

  /* -------------------------------------------------
     Fetch plan; Only allow paid users. No free user creation!
  --------------------------------------------------*/
  // Only keep fetch, remove auto-create:
  const fetchUserPlan = async (email: string) => {
    try {
      const res = await fetch(`${BASE_URL}/api/preferences/${email}`);
      if (res.status === 404) {
        alert('No preferences found. Please make sure you have completed payment and registration.');
        return;
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

