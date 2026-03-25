import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  useFonts,
  CormorantGaramond_600SemiBold,
  CormorantGaramond_600SemiBold_Italic,
} from '@expo-google-fonts/cormorant-garamond';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_600SemiBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Fonts } from './src/lib/theme';

// Screens
import SplashScreen from './src/screens/SplashScreen';
import OnboardingDietScreen from './src/screens/OnboardingDietScreen';
import OnboardingSkillScreen from './src/screens/OnboardingSkillScreen';
import OnboardingServesScreen from './src/screens/OnboardingServesScreen';
import HomeLibraryScreen from './src/screens/HomeLibraryScreen';
import RecipeBrowserScreen from './src/screens/RecipeBrowserScreen';
import IngredientChecklistScreen from './src/screens/IngredientChecklistScreen';
import CookModeScreen from './src/screens/CookModeScreen';
import CompletionScreen from './src/screens/CompletionScreen';
import RecentScreen from './src/screens/RecentScreen';
import ProfileScreen from './src/screens/ProfileScreen';

export type RootStackParamList = {
  Splash: undefined;
  OnboardingDiet: undefined;
  OnboardingSkill: undefined;
  OnboardingServes: undefined;
  MainTabs: undefined;
  HomeLibrary: undefined;
  RecipeBrowser: { cookbookId: string };
  IngredientChecklist: { recipeId: string };
  CookMode: { recipeId: string; serves: number };
  Completion: { recipeId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function TabIcon({ name, color, size }: { name: string; color: string; size: number }) {
  return <Ionicons name={name as any} size={size} color={color} />;
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.bg,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 80,
          paddingBottom: 20,
          paddingTop: 10,
        },
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.muted,
        tabBarLabelStyle: {
          fontFamily: 'PlusJakartaSans_400Regular',
          fontSize: 11,
        },
      }}
    >
      <Tab.Screen
        name="HomeLibrary"
        component={HomeLibraryScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="grid-outline" color={color} size={size} />
          ),
          tabBarLabel: 'library',
        }}
      />
      <Tab.Screen
        name="Recent"
        component={RecentScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="star-outline" color={color} size={size} />
          ),
          tabBarLabel: 'recent',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="person-outline" color={color} size={size} />
          ),
          tabBarLabel: 'profile',
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    CormorantGaramond_600SemiBold,
    CormorantGaramond_600SemiBold_Italic,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_600SemiBold,
  });

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: Colors.bg }} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
      >
        <Stack.Screen
          name="Splash"
          component={SplashScreen}
          options={{ animation: 'fade' }}
        />
        <Stack.Screen name="OnboardingDiet" component={OnboardingDietScreen} />
        <Stack.Screen name="OnboardingSkill" component={OnboardingSkillScreen} />
        <Stack.Screen name="OnboardingServes" component={OnboardingServesScreen} />
        <Stack.Screen
          name="HomeLibrary"
          component={MainTabs}
          options={{ animation: 'fade' }}
        />
        <Stack.Screen name="RecipeBrowser" component={RecipeBrowserScreen} />
        <Stack.Screen name="IngredientChecklist" component={IngredientChecklistScreen} />
        <Stack.Screen
          name="CookMode"
          component={CookModeScreen}
          options={{ animation: 'fade' }}
        />
        <Stack.Screen
          name="Completion"
          component={CompletionScreen}
          options={{ animation: 'fade' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
