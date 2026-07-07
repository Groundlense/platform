import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
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

// Initialize Navigation Stack
const Stack = createNativeStackNavigator();

// Initialize React Query client
const queryClient = new QueryClient();

function App() {
  useEffect(() => {
    const interval = setInterval(async () => {
      const token = await storage.getToken();
      if (!token) return;

      const queue = await storage.getSyncQueue();
      if (queue.length > 0) {
        console.log(`[Auto-Sync] Found ${queue.length} pending ops, attempting background sync...`);
        try {
          const result = await syncManager.syncWithServer();
          if (result.success) {
            console.log('[Auto-Sync] Sync completed successfully.');
          } else {
            console.warn('[Auto-Sync] Sync failed:', result.error);
          }
        } catch (err) {
          console.warn('[Auto-Sync] Auto-sync failed:', err);
        }
      }
    }, 15000); // Check every 15 seconds

    return () => clearInterval(interval);
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
                headerShown: false,
              }}
            >
              <Stack.Screen name="Login" component={LoginScreen} />
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
                options={{ presentation: 'transparentModal', animation: 'fade' }}
              />
              <Stack.Screen 
                name="Terminate" 
                component={TerminateScreen} 
                options={{ presentation: 'transparentModal', animation: 'fade' }}
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
