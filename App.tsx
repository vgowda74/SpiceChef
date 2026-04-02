import React, { useEffect } from 'react';
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
import AboutScreen from './src/screens/AboutScreen';
import AddRecipeScreen from './src/screens/AddRecipeScreen';
import UpgradeScreen from './src/screens/UpgradeScreen';
import MealPlanWizardScreen from './src/screens/MealPlanWizardScreen';
import MealPlanViewScreen from './src/screens/MealPlanViewScreen';
import GroceryListScreen from './src/screens/GroceryListScreen';
import { setupIAP, teardownIAP } from './src/lib/iapService';
import { fetchFeaturedCookbooks } from './src/lib/featuredService';
import { useRecipeStore } from './src/store/recipeStore';
import { generateRecipeImage } from './src/lib/imageService';

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
  AddRecipe: undefined;
  Upgrade: undefined;
  MealPlanWizard: undefined;
  MealPlanView: { planId: string };
  GroceryList: undefined;
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
        name="Library"
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
        name="About"
        component={AboutScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="information-circle-outline" color={color} size={size} />
          ),
          tabBarLabel: 'about',
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  useEffect(() => {
    setupIAP();
    // Load featured cookbooks from backend
    fetchFeaturedCookbooks().then(({ cookbooks, recipes }) => {
      if (cookbooks.length > 0) {
        useRecipeStore.getState().mergeFeaturedCookbooks(cookbooks, recipes);
      }
    });
    // Generate images for user-created recipes missing them (in background)
    setTimeout(() => {
      const store = useRecipeStore.getState();
      const userRecipes = store.recipes.filter(
        (r) => !r.image_url && (r.id.startsWith('my_') || r.cookbook_id === 'cb_my_recipes')
      );
      userRecipes.forEach((r) => {
        generateRecipeImage(r.id, r.title).then((url) => {
          if (url) useRecipeStore.getState().setRecipeImage(r.id, url);
        });
      });
    }, 3000); // Delay to not block startup
    return () => { teardownIAP(); };
  }, []);

  const [fontsLoaded, fontError] = useFonts({
    CormorantGaramond_600SemiBold,
    CormorantGaramond_600SemiBold_Italic,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_600SemiBold,
  });

  if (!fontsLoaded && !fontError) {
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
        <Stack.Screen
          name="AddRecipe"
          component={AddRecipeScreen}
          options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="Upgrade"
          component={UpgradeScreen}
          options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="MealPlanWizard"
          component={MealPlanWizardScreen}
          options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Screen name="MealPlanView" component={MealPlanViewScreen} />
        <Stack.Screen name="GroceryList" component={GroceryListScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
