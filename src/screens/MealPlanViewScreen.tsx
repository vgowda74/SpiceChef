import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../App';
import { Colors, Fonts, Spacing } from '../lib/theme';
import { useMealPlanStore } from '../store/mealPlanStore';
import { useRecipeStore } from '../store/recipeStore';
import { generateRecipe } from '../lib/recipeGeneratorService';

type Props = NativeStackScreenProps<RootStackParamList, 'MealPlanView'>;

const MEAL_EMOJI: Record<string, string> = {
  breakfast: '🍳',
  lunch_dinner: '🍛',
  snack: '🍪',
  dessert: '🍰',
  drinks: '🍹',
};

const MEAL_LABEL: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch_dinner: 'Lunch / Dinner',
  snack: 'Snack',
  dessert: 'Dessert',
  drinks: 'Drink',
};

export default function MealPlanViewScreen({ route, navigation }: Props) {
  const { planId } = route.params;
  const { mealPlans, updateMealSlotRecipeId } = useMealPlanStore();
  const { addGeneratedRecipe } = useRecipeStore();
  const plan = mealPlans.find((p) => p.id === planId);

  const [selectedDay, setSelectedDay] = useState(0);
  const [generatingMeal, setGeneratingMeal] = useState<string | null>(null);

  if (!plan) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={{ color: Colors.muted, padding: Spacing.lg }}>Meal plan not found.</Text>
      </SafeAreaView>
    );
  }

  const currentDay = plan.days[selectedDay];

  const handleMealTap = async (mealType: string, title: string) => {
    // Check if recipe already generated
    const slot = currentDay.meals.find((m) => m.mealType === mealType);
    if (slot?.recipeId) {
      navigation.navigate('IngredientChecklist', { recipeId: slot.recipeId });
      return;
    }

    // Generate full recipe
    setGeneratingMeal(mealType);
    try {
      const description = `${title}. Serves ${plan.servingSize}. Complete recipe with ingredients and step-by-step instructions.`;
      const recipe = await generateRecipe(description);
      addGeneratedRecipe(recipe);
      updateMealSlotRecipeId(planId, currentDay.day, mealType, recipe.id);
      setGeneratingMeal(null);
      navigation.navigate('IngredientChecklist', { recipeId: recipe.id });
    } catch (err: any) {
      setGeneratingMeal(null);
      Alert.alert('Failed', err.message || 'Could not generate recipe.');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Meal Plan</Text>
        <Text style={styles.headerServes}>Serves {plan.servingSize}</Text>
      </View>

      {/* Day selector */}
      <View style={styles.daySelector}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daySelectorScroll}>
          {plan.days.map((day, idx) => {
            const isActive = idx === selectedDay;
            const shortDay = day.day.slice(0, 3);
            return (
              <TouchableOpacity
                key={day.day}
                style={[styles.dayTab, isActive && styles.dayTabActive]}
                onPress={() => setSelectedDay(idx)}
                activeOpacity={0.7}
              >
                <Text style={[styles.dayTabText, isActive && styles.dayTabTextActive]}>
                  {shortDay}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Day label */}
      <Text style={styles.dayLabel}>{currentDay.day}</Text>

      {/* Meals list */}
      <FlatList
        data={currentDay.meals}
        keyExtractor={(item) => `${currentDay.day}-${item.mealType}`}
        contentContainerStyle={styles.mealList}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => {
          const isGenerating = generatingMeal === item.mealType;
          const hasRecipe = !!item.recipeId;
          return (
            <TouchableOpacity
              style={styles.mealCard}
              onPress={() => handleMealTap(item.mealType, item.title)}
              activeOpacity={0.8}
              disabled={isGenerating}
            >
              <View style={styles.mealCardHeader}>
                <Text style={styles.mealEmoji}>{MEAL_EMOJI[item.mealType] || '🍽️'}</Text>
                <Text style={styles.mealTypeLabel}>{MEAL_LABEL[item.mealType] || item.mealType}</Text>
                {hasRecipe && <Ionicons name="checkmark-circle" size={16} color={Colors.accent} />}
              </View>
              <Text style={styles.mealTitle}>{item.title}</Text>
              {item.description ? (
                <Text style={styles.mealDesc}>{item.description}</Text>
              ) : null}
              <View style={styles.mealFooter}>
                {item.duration_mins > 0 && (
                  <View style={styles.mealMeta}>
                    <Ionicons name="time-outline" size={13} color={Colors.muted} />
                    <Text style={styles.mealMetaText}>{item.duration_mins} min</Text>
                  </View>
                )}
                {isGenerating ? (
                  <ActivityIndicator size="small" color={Colors.accent} />
                ) : (
                  <Text style={styles.mealAction}>
                    {hasRecipe ? 'View recipe →' : 'Tap to generate recipe →'}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* Grocery list button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.groceryBtn}
          onPress={() => navigation.navigate('GroceryList', { planId })}
          activeOpacity={0.85}
        >
          <Ionicons name="cart-outline" size={18} color={Colors.bg} />
          <Text style={styles.groceryBtnText}>View Grocery List</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.md,
  },
  headerTitle: { flex: 1, fontFamily: Fonts.heading, fontSize: 22, color: Colors.text },
  headerServes: { fontFamily: Fonts.body, fontSize: 13, color: Colors.muted },
  daySelector: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  daySelectorScroll: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: 6,
  },
  dayTab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dayTabActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  dayTabText: { fontFamily: Fonts.bodySemiBold, fontSize: 13, color: Colors.muted },
  dayTabTextActive: { color: Colors.bg },
  dayLabel: {
    fontFamily: Fonts.heading,
    fontSize: 28,
    color: Colors.text,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  mealList: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  mealCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: 6,
  },
  mealCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mealEmoji: { fontSize: 18 },
  mealTypeLabel: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.muted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  mealTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 17,
    color: Colors.text,
  },
  mealDesc: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.muted,
    lineHeight: 19,
  },
  mealFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  mealMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mealMetaText: { fontFamily: Fonts.body, fontSize: 12, color: Colors.muted },
  mealAction: { fontFamily: Fonts.body, fontSize: 12, color: Colors.accent },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  groceryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.accent,
    borderRadius: 14,
    paddingVertical: 16,
  },
  groceryBtnText: { fontFamily: Fonts.bodySemiBold, fontSize: 16, color: Colors.bg },
});
