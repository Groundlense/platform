import React, { useEffect, useRef } from 'react';
import { AppState, StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Import Screens
import LoginScreen from './src/screens/LoginScreen';
import ProjectSelectionScreen from './src/screens/ProjectSelectionScreen';
import BoringListScreen from './src/screens/BoringListScreen';
import RigSetupScreen from './src/screens/RigSetupScreen';
import StartBoringScreen from './src/screens/StartBoringScreen';
import SPTEntryScreen from './src/screens/SPTEntryScreen';
import SoilDescriptionScreen from './src/screens/SoilDescriptionScreen';
import SampleCollectionScreen from './src/screens/SampleCollectionScreen';
import WaterTableScreen from './src/screens/WaterTableScreen';
import RockCoringScreen from './src/screens/RockCoringScreen';
import TerminateScreen from './src/screens/TerminateScreen';
import BoringClosureScreen from './src/screens/BoringClosureScreen';
import EngineerQueryScreen from './src/screens/EngineerQueryScreen';

import { syncManager } from './src/services/sync';
import { storage } from './src/services/storage';
import { media } from './src/services/media';
import BrandHeader from './src/components/BrandHeader';

// Initialize Navigation Stack
const Stack = createNativeStackNavigator();

// Initialize React Query client
const queryClient = new QueryClient();

function App() {
  // Guards against overlapping sync runs (15s interval + AppState trigger)
  const syncInFlightRef = useRef(false);

  // One-time purge of caches written by older builds (mock-data era) —
  // everything repopulates from the main DB on the next sync.
  useEffect(() => {
    storage.ensureCacheVersion().then((wiped) => {
      if (wiped) {
        console.log('[Cache] Stale local cache cleared; will resync from server.');
      }
    });
  }, []);

  useEffect(() => {
    const runBackgroundSync = async (reason: string, onlyWhenPending: boolean) => {
      if (syncInFlightRef.current) return;

      const token = await storage.getToken();
      if (!token) return;

      if (onlyWhenPending) {
        const queue = await storage.getSyncQueue();
        const photos = await media.getPhotoQueue();
        if (queue.length === 0 && photos.length === 0) return;
        console.log(
          `[Auto-Sync:${reason}] ${queue.length} pending op(s), ${photos.length} queued photo(s) — syncing...`
        );
      }

      syncInFlightRef.current = true;
      try {
        const result = await syncManager.syncWithServer();
        if (result.success) {
          console.log(`[Auto-Sync:${reason}] Sync completed successfully.`);
        } else {
          console.warn(`[Auto-Sync:${reason}] Sync failed:`, result.error);
        }
      } catch (err) {
        console.warn(`[Auto-Sync:${reason}] Auto-sync failed:`, err);
      } finally {
        syncInFlightRef.current = false;
      }
    };

    // Every 15 seconds — only when something is actually pending
    const interval = setInterval(() => {
      runBackgroundSync('interval', true).catch(() => {});
    }, 15000);

    // When the app returns to the foreground — full sync (also pulls fresh
    // assignments so workers see new-borehole notices promptly)
    const appStateSub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        runBackgroundSync('foreground', false).catch(() => {});
      }
    });

    return () => {
      clearInterval(interval);
      appStateSub.remove();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider style={{ flex: 1 }}>
          <StatusBar barStyle="light-content" backgroundColor="#993C1D" />
          <NavigationContainer>
            <Stack.Navigator
              initialRouteName="Login"
              screenOptions={{
                // Brand bar (logo + wordmark) on every screen; the login
                // screen and transparent popups opt out below.
                headerShown: true,
                header: () => <BrandHeader />,
              }}
            >
              <Stack.Screen
                name="Login"
                component={LoginScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen name="ProjectSelection" component={ProjectSelectionScreen} />
              <Stack.Screen name="BoringList" component={BoringListScreen} />
              <Stack.Screen name="RigSetup" component={RigSetupScreen} />
              <Stack.Screen name="StartBoring" component={StartBoringScreen} />
              <Stack.Screen name="SPTEntry" component={SPTEntryScreen} />
              <Stack.Screen name="SoilDescription" component={SoilDescriptionScreen} />
              <Stack.Screen name="SampleCollection" component={SampleCollectionScreen} />
              
              {/* Popups & Modals */}
              <Stack.Screen
                name="WaterTable"
                component={WaterTableScreen}
                options={{ presentation: 'transparentModal', animation: 'fade', headerShown: false }}
              />
              <Stack.Screen
                name="Terminate"
                component={TerminateScreen}
                options={{ presentation: 'transparentModal', animation: 'fade', headerShown: false }}
              />
              <Stack.Screen name="RockCoring" component={RockCoringScreen} />
              <Stack.Screen name="BoringClosure" component={BoringClosureScreen} />
              <Stack.Screen name="EngineerQuery" component={EngineerQueryScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

export default App;
