import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../App';
import { Colors, Fonts, Spacing } from '../lib/theme';
import { useMealPlanStore, MealType, DrinkType } from '../store/mealPlanStore';
import { generateMealPlan } from '../lib/mealPlanService';
import { getLimits } from '../lib/cookbookService';
import { usePurchaseStore } from '../store/purchaseStore';
import { usePantryStore } from '../store/pantryStore';

const TOTAL_STEPS = 5;

const DIETARY_OPTIONS = [
  'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free',
  'Nut-Free', 'Low-Carb', 'Halal', 'Kosher',
];

const MEAL_TYPE_OPTIONS: { key: MealType; label: string; icon: string }[] = [
  { key: 'breakfast', label: 'Breakfast', icon: '🍳' },
  { key: 'lunch_dinner', label: 'Lunch / Dinner', icon: '🍛' },
  { key: 'snack', label: 'Snacks', icon: '🍪' },
  { key: 'dessert', label: 'Dessert', icon: '🍰' },
  { key: 'drinks', label: 'Drinks', icon: '🍹' },
];

const DRINK_OPTIONS: { key: DrinkType; label: string }[] = [
  { key: 'coffee', label: 'Coffee' },
  { key: 'tea', label: 'Tea' },
  { key: 'smoothie', label: 'Smoothie' },
  { key: 'cocktail', label: 'Cocktail' },
  { key: 'juice', label: 'Juice' },
];

export default function MealPlanWizardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { wizard, setWizardField, resetWizard, addMealPlan, incrementLifetimeMealPlans, lifetimeMealPlans } = useMealPlanStore();
  const { isPro } = usePurchaseStore();
  const { dietaryRestrictions: savedDietary, setDietaryRestrictions: saveDietary, getPantryNames } = usePantryStore();
  const limits = getLimits(isPro);
  const [step, setStep] = useState(1);
  const [ingredientInput, setIngredientInput] = useState('');
  const [generating, setGenerating] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  // Pre-fill dietary restrictions and pantry items on mount
  useEffect(() => {
    if (savedDietary.length > 0 && wizard.dietaryRestrictions.length === 0) {
      setWizardField('dietaryRestrictions', savedDietary);
    }
    const pantryNames = getPantryNames();
    if (pantryNames.length > 0 && wizard.availableIngredients.length === 0) {
      setWizardField('availableIngredients', pantryNames);
    }
  }, []);

  const goNext = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  const goBack = () => {
    if (step === 1) {
      resetWizard();
      navigation.goBack();
    } else {
      setStep((s) => s - 1);
    }
  };

  const toggleDietary = (item: string) => {
    const current = wizard.dietaryRestrictions;
    const updated = current.includes(item) ? current.filter((d) => d !== item) : [...current, item];
    setWizardField('dietaryRestrictions', updated);
    saveDietary(updated); // Persist for future use
  };

  const addIngredient = () => {
    const trimmed = ingredientInput.trim();
    if (trimmed && !wizard.availableIngredients.includes(trimmed)) {
      setWizardField('availableIngredients', [...wizard.availableIngredients, trimmed]);
    }
    setIngredientInput('');
  };

  const removeIngredient = (item: string) => {
    setWizardField('availableIngredients', wizard.availableIngredients.filter((i) => i !== item));
  };

  const toggleMealType = (key: MealType) => {
    const current = wizard.mealTypes;
    if (current.includes(key)) {
      setWizardField('mealTypes', current.filter((m) => m !== key));
      if (key === 'drinks') setWizardField('drinkTypes', []);
    } else {
      setWizardField('mealTypes', [...current, key]);
    }
  };

  const toggleDrinkType = (key: DrinkType) => {
    const current = wizard.drinkTypes;
    setWizardField(
      'drinkTypes',
      current.includes(key) ? current.filter((d) => d !== key) : [...current, key],
    );
  };

  const handleGenerate = async () => {
    if (lifetimeMealPlans >= limits.MAX_MEAL_PLANS) {
      navigation.navigate('Upgrade');
      return;
    }

    if (wizard.mealTypes.length === 0) {
      Alert.alert('Select meal types', 'Pick at least one meal type to plan.');
      return;
    }

    setGenerating(true);

    const messages = [
      'Understanding your preferences...',
      'Gathering ingredients...',
      'Crafting your meals...',
      'Planning your week...',
      'Building your grocery list...',
      'Almost done...',
    ];
    let msgIndex = 0;
    setLoadingMsg(messages[0]);
    const msgInterval = setInterval(() => {
      msgIndex = Math.min(msgIndex + 1, messages.length - 1);
      setLoadingMsg(messages[msgIndex]);
    }, 2500);

    try {
      const plan = await generateMealPlan(wizard);
      clearInterval(msgInterval);
      addMealPlan(plan);
      incrementLifetimeMealPlans();
      // Add meal plan grocery items to persistent grocery list
      const { addGroceryItems } = usePantryStore.getState();
      const groceryItems = plan.groceryList.map((g) => ({
        name: g.name,
        amount: g.amount,
        group: g.group || g.category || 'OTHER',
      }));
      addGroceryItems(groceryItems);
      setGenerating(false);
      resetWizard();
      navigation.replace('MealPlanView', { planId: plan.id });
    } catch (err: any) {
      clearInterval(msgInterval);
      setGenerating(false);
      Alert.alert('Generation failed', err.message || 'Could not generate meal plan. Please try again.');
    }
  };

  const renderStepContent = () => {
    switch (step) {
      // Step 1: Dietary restrictions
      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Dietary Restrictions</Text>
            <Text style={styles.stepHint}>Select any that apply, or skip.</Text>
            <View style={styles.chipGrid}>
              {DIETARY_OPTIONS.map((item) => {
                const selected = wizard.dietaryRestrictions.includes(item);
                return (
                  <TouchableOpacity
                    key={item}
                    style={[styles.chip, selected && styles.chipSelected]}
                    onPress={() => toggleDietary(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{item}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );

      // Step 2: Ingredients on hand
      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>What's in Your Pantry?</Text>
            <Text style={styles.stepHint}>
              Add ingredients you already have. These will be excluded from your grocery list.
            </Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.textInput}
                value={ingredientInput}
                onChangeText={setIngredientInput}
                placeholder="e.g. olive oil, garlic, rice..."
                placeholderTextColor={Colors.muted}
                selectionColor={Colors.accent}
                onSubmitEditing={addIngredient}
                returnKeyType="done"
              />
              <TouchableOpacity style={styles.addBtn} onPress={addIngredient} activeOpacity={0.7}>
                <Ionicons name="add" size={20} color={Colors.bg} />
              </TouchableOpacity>
            </View>
            {wizard.availableIngredients.length > 0 && (
              <View style={styles.chipGrid}>
                {wizard.availableIngredients.map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={[styles.chip, styles.chipSelected]}
                    onPress={() => removeIngredient(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.chipTextSelected}>{item}</Text>
                    <Ionicons name="close" size={14} color={Colors.bg} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        );

      // Step 3: Meal types
      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>What Meals to Plan?</Text>
            <Text style={styles.stepHint}>Select the meal types you want in your plan.</Text>
            <View style={styles.mealTypeList}>
              {MEAL_TYPE_OPTIONS.map(({ key, label, icon }) => {
                const selected = wizard.mealTypes.includes(key);
                return (
                  <TouchableOpacity
                    key={key}
                    style={[styles.mealTypeRow, selected && styles.mealTypeRowSelected]}
                    onPress={() => toggleMealType(key)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.mealTypeEmoji}>{icon}</Text>
                    <Text style={[styles.mealTypeLabel, selected && styles.mealTypeLabelSelected]}>
                      {label}
                    </Text>
                    <Ionicons
                      name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                      size={22}
                      color={selected ? Colors.accent : Colors.muted}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>

            {wizard.mealTypes.includes('drinks') && (
              <View style={styles.drinkSection}>
                <Text style={styles.drinkLabel}>DRINK TYPES</Text>
                <View style={styles.chipGrid}>
                  {DRINK_OPTIONS.map(({ key, label }) => {
                    const selected = wizard.drinkTypes.includes(key);
                    return (
                      <TouchableOpacity
                        key={key}
                        style={[styles.chip, selected && styles.chipSelected]}
                        onPress={() => toggleDrinkType(key)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
        );

      // Step 4: Same vs varied
      case 4:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Weekly Variety</Text>
            <Text style={styles.stepHint}>Same meals every day or different each day?</Text>
            <View style={styles.modeCards}>
              <TouchableOpacity
                style={[styles.modeCard, wizard.planMode === 'same' && styles.modeCardSelected]}
                onPress={() => setWizardField('planMode', 'same')}
                activeOpacity={0.7}
              >
                <Ionicons name="refresh-outline" size={28} color={wizard.planMode === 'same' ? Colors.accent : Colors.muted} />
                <Text style={[styles.modeTitle, wizard.planMode === 'same' && styles.modeTitleSelected]}>
                  Same Every Day
                </Text>
                <Text style={styles.modeDesc}>Simpler grocery list, easy routine</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modeCard, wizard.planMode === 'varied' && styles.modeCardSelected]}
                onPress={() => setWizardField('planMode', 'varied')}
                activeOpacity={0.7}
              >
                <Ionicons name="shuffle-outline" size={28} color={wizard.planMode === 'varied' ? Colors.accent : Colors.muted} />
                <Text style={[styles.modeTitle, wizard.planMode === 'varied' && styles.modeTitleSelected]}>
                  Different Each Day
                </Text>
                <Text style={styles.modeDesc}>More variety, explore new dishes</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      // Step 5: Serving size
      case 5:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>How Many People?</Text>
            <Text style={styles.stepHint}>We'll scale all recipes and the grocery list.</Text>
            <View style={styles.servingControl}>
              <TouchableOpacity
                style={styles.servingBtn}
                onPress={() => setWizardField('servingSize', Math.max(1, wizard.servingSize - 1))}
                activeOpacity={0.7}
              >
                <Ionicons name="remove" size={22} color={Colors.text} />
              </TouchableOpacity>
              <Text style={styles.servingValue}>{wizard.servingSize}</Text>
              <TouchableOpacity
                style={styles.servingBtn}
                onPress={() => setWizardField('servingSize', wizard.servingSize + 1)}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={22} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <Text style={styles.servingLabel}>
              {wizard.servingSize === 1 ? 'person' : 'people'}
            </Text>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name={step === 1 ? 'close' : 'chevron-back'} size={24} color={Colors.muted} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meal Planner</Text>
        <Text style={styles.stepIndicator}>{step}/{TOTAL_STEPS}</Text>
      </View>

      {/* Progress dots */}
      <View style={styles.dots}>
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <View key={i} style={[styles.dot, i < step && styles.dotFilled]} />
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {renderStepContent()}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        {step < TOTAL_STEPS ? (
          <View style={styles.footerRow}>
            {(step === 1 || step === 2) && (
              <TouchableOpacity style={styles.skipBtn} onPress={goNext} activeOpacity={0.7}>
                <Text style={styles.skipText}>Skip</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.nextBtn} onPress={goNext} activeOpacity={0.85}>
              <Text style={styles.nextText}>Next</Text>
              <Ionicons name="arrow-forward" size={18} color={Colors.bg} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.generateBtn, generating && styles.generateBtnDisabled]}
            onPress={handleGenerate}
            activeOpacity={0.85}
            disabled={generating}
          >
            {generating ? (
              <>
                <ActivityIndicator size="small" color={Colors.bg} />
                <Text style={styles.generateText}>{loadingMsg}</Text>
              </>
            ) : (
              <>
                <Ionicons name="calendar" size={18} color={Colors.bg} />
                <Text style={styles.generateText}>Generate Meal Plan</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { fontFamily: Fonts.heading, fontSize: 22, color: Colors.text },
  stepIndicator: { fontFamily: Fonts.body, fontSize: 13, color: Colors.muted },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.sm,
  },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: Colors.border,
  },
  dotFilled: { backgroundColor: Colors.accent },
  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  stepContent: { gap: Spacing.md },
  stepTitle: {
    fontFamily: Fonts.heading,
    fontSize: 30,
    color: Colors.text,
    lineHeight: 36,
  },
  stepHint: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.muted,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chipSelected: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  chipText: { fontFamily: Fonts.body, fontSize: 14, color: Colors.muted },
  chipTextSelected: { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.bg },

  // Step 2 — ingredients input
  inputRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  textInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.text,
  },
  addBtn: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },

  // Step 3 — meal types
  mealTypeList: { gap: Spacing.sm },
  mealTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  mealTypeRowSelected: { borderColor: Colors.accent },
  mealTypeEmoji: { fontSize: 24 },
  mealTypeLabel: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 16,
    color: Colors.muted,
  },
  mealTypeLabelSelected: { fontFamily: Fonts.bodySemiBold, color: Colors.text },
  drinkSection: { marginTop: Spacing.md, gap: Spacing.sm },
  drinkLabel: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.muted,
    letterSpacing: 1.2,
  },

  // Step 4 — mode cards
  modeCards: { gap: Spacing.md },
  modeCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  modeCardSelected: { borderColor: Colors.accent },
  modeTitle: { fontFamily: Fonts.bodySemiBold, fontSize: 16, color: Colors.muted },
  modeTitleSelected: { color: Colors.text },
  modeDesc: { fontFamily: Fonts.body, fontSize: 13, color: Colors.muted, textAlign: 'center' },

  // Step 5 — serving size
  servingControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xl,
    marginTop: Spacing.xl,
  },
  servingBtn: {
    width: 52, height: 52, borderRadius: 26,
    borderWidth: 1.5, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  servingValue: {
    fontFamily: Fonts.heading,
    fontSize: 64,
    color: Colors.accent,
    minWidth: 80,
    textAlign: 'center',
  },
  servingLabel: {
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.muted,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },

  // Footer
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  footerRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  skipBtn: {
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipText: { fontFamily: Fonts.body, fontSize: 15, color: Colors.muted },
  nextBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.accent,
    borderRadius: 14,
    paddingVertical: 14,
  },
  nextText: { fontFamily: Fonts.bodySemiBold, fontSize: 16, color: Colors.bg },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.accent,
    borderRadius: 14,
    paddingVertical: 16,
  },
  generateBtnDisabled: { opacity: 0.6 },
  generateText: { fontFamily: Fonts.bodySemiBold, fontSize: 16, color: Colors.bg },
});
