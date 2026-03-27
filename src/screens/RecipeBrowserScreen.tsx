import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Modal,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../App';
import { Colors, Fonts, Spacing } from '../lib/theme';
import { useRecipeStore, Recipe } from '../store/recipeStore';
import { MY_RECIPES_COOKBOOK_ID } from '../lib/recipeGeneratorService';

type Props = NativeStackScreenProps<RootStackParamList, 'RecipeBrowser'>;

function getCookbookEmoji(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes('indian') || lower.includes('spice')) return '🍛';
  if (lower.includes('italian') || lower.includes('pasta')) return '🍝';
  return '📖';
}

// --- Dietary options ---
const DIETARY_OPTIONS = [
  { label: 'Vegetarian', value: 'vegetarian', emoji: '🥦' },
  { label: 'Vegan', value: 'vegan', emoji: '🌱' },
  { label: 'Gluten-Free', value: 'gluten-free', emoji: '🌾' },
  { label: 'Dairy-Free', value: 'dairy-free', emoji: '🥛' },
  { label: 'Nut Allergy', value: 'nut-allergy', emoji: '🥜' },
  { label: 'Halal', value: 'halal', emoji: '☪️' },
  { label: 'Kosher', value: 'kosher', emoji: '✡️' },
  { label: 'Low Carb', value: 'low-carb', emoji: '🥗' },
];

// --- Pantry ingredient groups ---
interface PantryItem {
  id: string;
  label: string;
  terms: string[]; // matched against recipe ingredient names
}

const PANTRY_GROUPS: { group: string; items: PantryItem[] }[] = [
  {
    group: 'Aromatics',
    items: [
      { id: 'garlic', label: 'Garlic', terms: ['garlic'] },
      { id: 'ginger', label: 'Ginger', terms: ['ginger'] },
      { id: 'onion', label: 'Onion', terms: ['onion'] },
      { id: 'green_chilli', label: 'Green Chilli', terms: ['green chilli', 'chilli'] },
    ],
  },
  {
    group: 'Vegetables',
    items: [
      { id: 'tomatoes', label: 'Tomatoes', terms: ['tomato'] },
      { id: 'potatoes', label: 'Potatoes', terms: ['potato'] },
      { id: 'spinach', label: 'Spinach', terms: ['spinach'] },
      { id: 'cauliflower', label: 'Cauliflower', terms: ['cauliflower'] },
      { id: 'coriander', label: 'Fresh Coriander', terms: ['coriander', 'cilantro'] },
    ],
  },
  {
    group: 'Spices',
    items: [
      { id: 'cumin', label: 'Cumin', terms: ['cumin'] },
      { id: 'turmeric', label: 'Turmeric', terms: ['turmeric'] },
      { id: 'garam_masala', label: 'Garam Masala', terms: ['garam masala'] },
      { id: 'coriander_powder', label: 'Coriander Powder', terms: ['coriander powder'] },
      { id: 'chilli_powder', label: 'Chilli Powder', terms: ['chilli powder', 'chili powder', 'red chilli'] },
      { id: 'mustard_seeds', label: 'Mustard Seeds', terms: ['mustard'] },
    ],
  },
  {
    group: 'Dairy',
    items: [
      { id: 'butter_ghee', label: 'Butter / Ghee', terms: ['butter', 'ghee'] },
      { id: 'yogurt', label: 'Yogurt', terms: ['yogurt'] },
      { id: 'cream', label: 'Heavy Cream', terms: ['cream'] },
      { id: 'paneer', label: 'Paneer', terms: ['paneer'] },
    ],
  },
  {
    group: 'Protein',
    items: [
      { id: 'chicken', label: 'Chicken', terms: ['chicken'] },
      { id: 'lamb', label: 'Lamb', terms: ['lamb'] },
      { id: 'prawns', label: 'Prawns', terms: ['prawn', 'shrimp'] },
      { id: 'eggs', label: 'Eggs', terms: ['egg'] },
    ],
  },
  {
    group: 'Pantry Staples',
    items: [
      { id: 'rice', label: 'Basmati Rice', terms: ['rice', 'basmati'] },
      { id: 'lentils', label: 'Lentils / Dal', terms: ['lentil', 'dal', 'urad'] },
      { id: 'chickpeas', label: 'Chickpeas', terms: ['chickpea', 'chana', 'chole'] },
      { id: 'coconut_milk', label: 'Coconut Milk', terms: ['coconut milk'] },
      { id: 'oil', label: 'Vegetable Oil', terms: ['oil'] },
      { id: 'tomato_paste', label: 'Tomato Paste', terms: ['tomato paste', 'tomato puree'] },
    ],
  },
];

// Build a flat lookup: pantryId → terms
const PANTRY_TERMS: Record<string, string[]> = {};
PANTRY_GROUPS.forEach((g) => g.items.forEach((i) => (PANTRY_TERMS[i.id] = i.terms)));

const FILTERS = ['All', 'Vegetarian', 'Non-Veg', 'Under 30 min'];

// --- Filtering helpers ---
function applyDietaryFilter(recipes: Recipe[], dietary: Set<string>): Recipe[] {
  if (dietary.size === 0) return recipes;
  return recipes.filter((recipe) => {
    const ings = recipe.ingredients.map((i) => i.name.toLowerCase());

    if (dietary.has('vegetarian') || dietary.has('vegan')) {
      if (!recipe.tags.includes('Vegetarian')) return false;
    }
    if (dietary.has('vegan')) {
      // exclude dairy
      if (ings.some((i) => i.includes('paneer') || i.includes('cream') || i.includes('butter') || i.includes('ghee') || i.includes('yogurt'))) return false;
    }
    if (dietary.has('gluten-free')) {
      if (ings.some((i) => i.includes('flour') || i.includes('bread') || i.includes('naan') || i.includes('roti'))) return false;
    }
    if (dietary.has('dairy-free')) {
      if (ings.some((i) => i.includes('butter') || i.includes('cream') || i.includes('paneer') || i.includes('yogurt') || i.includes('ghee') || i.includes('milk'))) return false;
    }
    if (dietary.has('nut-allergy')) {
      if (ings.some((i) => i.includes('cashew') || i.includes('almond') || i.includes('peanut') || i.includes('nut'))) return false;
    }
    if (dietary.has('low-carb')) {
      if (ings.some((i) => i.includes('rice') || i.includes('potato') || i.includes('chickpea') || i.includes('lentil') || i.includes('dal'))) return false;
    }
    return true;
  });
}

// Key pantry IDs that actually distinguish recipes (protein, special produce/dairy)
// Basic spices and aromatics selected alone should not restrict results.
const KEY_PANTRY_IDS = new Set([
  'chicken', 'lamb', 'prawns', 'eggs',
  'paneer', 'yogurt', 'cream', 'butter_ghee',
  'spinach', 'cauliflower', 'potatoes',
  'rice', 'lentils', 'chickpeas', 'coconut_milk', 'tomato_paste',
]);

function applyPantryFilter(recipes: Recipe[], pantry: Set<string>): Recipe[] {
  if (pantry.size === 0) return recipes;

  // Only filter on key selections; if user only picked basic aromatics/spices, show all
  const selectedKeyIds = [...pantry].filter((id) => KEY_PANTRY_IDS.has(id));
  if (selectedKeyIds.length === 0) return recipes;

  // Build the set of match terms for selected key items
  const keyTerms: string[] = [];
  selectedKeyIds.forEach((id) => {
    if (PANTRY_TERMS[id]) keyTerms.push(...PANTRY_TERMS[id]);
  });

  return recipes.filter((recipe) => {
    // Find this recipe's key ingredients (those that appear in KEY_PANTRY_IDS term lists)
    const allKeyTerms = [...KEY_PANTRY_IDS].flatMap((id) => PANTRY_TERMS[id] ?? []);
    const recipeKeyIngs = recipe.ingredients.filter((ing) =>
      allKeyTerms.some((term) => ing.name.toLowerCase().includes(term))
    );

    // If recipe has no "key" ingredients (simple pantry dish), always show it
    if (recipeKeyIngs.length === 0) return true;

    // Show recipe only if user has ALL of its key ingredients
    return recipeKeyIngs.every((ing) =>
      keyTerms.some((term) => ing.name.toLowerCase().includes(term))
    );
  });
}

// --- Recipe row ---
function RecipeRow({ recipe, onPress }: { recipe: Recipe; onPress: () => void }) {
  const isVeg = recipe.tags.includes('Vegetarian');
  return (
    <TouchableOpacity style={styles.recipeRow} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.recipeDot, { backgroundColor: isVeg ? '#4A8C3A' : '#C87840' }]} />
      <View style={styles.recipeInfo}>
        <Text style={styles.recipeTitle}>{recipe.title}</Text>
        <Text style={styles.recipeMeta}>{recipe.tags.join(' · ')}</Text>
      </View>
      <Text style={styles.recipeDuration}>{recipe.duration_mins} min</Text>
    </TouchableOpacity>
  );
}

export default function RecipeBrowserScreen({ route, navigation }: Props) {
  const { cookbookId } = route.params;
  const { getCookbook, getRecipesByCookbook } = useRecipeStore();
  const isMyRecipes = cookbookId === MY_RECIPES_COOKBOOK_ID;

  const [activeFilter, setActiveFilter] = useState('All');
  const [showModal, setShowModal] = useState(!isMyRecipes);
  const [modalStep, setModalStep] = useState<1 | 2>(1);

  const [selectedDietary, setSelectedDietary] = useState<Set<string>>(new Set());
  const [selectedPantry, setSelectedPantry] = useState<Set<string>>(new Set());

  const cookbook = getCookbook(cookbookId);
  const allRecipes = getRecipesByCookbook(cookbookId);

  const toggleDietary = (value: string) => {
    setSelectedDietary((prev) => {
      const next = new Set(prev);
      next.has(value) ? next.delete(value) : next.add(value);
      return next;
    });
  };

  const togglePantry = (id: string) => {
    setSelectedPantry((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleShowRecipes = () => {
    setShowModal(false);
  };

  // Apply all filters
  const filteredRecipes = useMemo(() => {
    let base = allRecipes;

    // Chip filter
    if (activeFilter === 'Under 30 min') base = base.filter((r) => r.duration_mins <= 30);
    else if (activeFilter === 'Vegetarian') base = base.filter((r) => r.tags.includes('Vegetarian'));
    else if (activeFilter === 'Non-Veg') base = base.filter((r) => r.tags.includes('Non-Veg'));

    // Dietary & pantry filters from prefs modal
    base = applyDietaryFilter(base, selectedDietary);
    base = applyPantryFilter(base, selectedPantry);

    // Newest first for "My Recipes" (IDs are `my_<timestamp>`)
    if (isMyRecipes) base = [...base].reverse();

    return base;
  }, [allRecipes, activeFilter, selectedDietary, selectedPantry, isMyRecipes]);

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.backRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.backLabel}>Your Library</Text>
      </View>

      <View style={styles.cookbookCard}>
        <View style={[styles.cookbookIcon, { backgroundColor: cookbook?.accent_color ?? Colors.surface }]}>
          <Text style={styles.cookbookEmoji}>{getCookbookEmoji(cookbook?.title ?? '')}</Text>
        </View>
        <View style={styles.cookbookInfo}>
          <Text style={styles.cookbookName}>{cookbook?.title ?? 'Cookbook'}</Text>
          <Text style={styles.cookbookAuthor}>{cookbook?.author ?? ''}</Text>
          <Text style={styles.cookbookStats}>{allRecipes.length} recipes</Text>
        </View>
        <TouchableOpacity onPress={() => { setModalStep(1); setShowModal(true); }} activeOpacity={0.7}>
          <Ionicons name="options-outline" size={22} color={Colors.muted} />
        </TouchableOpacity>
      </View>

      {/* Active prefs summary */}
      {(selectedDietary.size > 0 || selectedPantry.size > 0) && (
        <View style={styles.prefsBadge}>
          <Ionicons name="funnel-outline" size={13} color={Colors.accent} />
          <Text style={styles.prefsBadgeText}>
            {[selectedDietary.size > 0 && `${selectedDietary.size} dietary`, selectedPantry.size > 0 && `${selectedPantry.size} ingredients`].filter(Boolean).join(' · ')}
          </Text>
          <TouchableOpacity onPress={() => { setSelectedDietary(new Set()); setSelectedPantry(new Set()); }} activeOpacity={0.7}>
            <Text style={styles.prefsClear}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterRow}>
        {FILTERS.map((filter) => {
          const isActive = activeFilter === filter;
          return (
            <TouchableOpacity key={filter} style={[styles.filterChip, isActive && styles.filterChipActive]} onPress={() => setActiveFilter(filter)} activeOpacity={0.7}>
              <Text style={[styles.filterText, isActive && styles.filterTextActive]}>{filter}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Text style={styles.recipeCount}>{filteredRecipes.length} RECIPES FOUND</Text>

      {filteredRecipes.length === 0 && allRecipes.length > 0 && (
        <View style={styles.emptyBox}>
          <Ionicons name="search-outline" size={40} color={Colors.border} />
          <Text style={styles.emptyTitle}>No matches</Text>
          <Text style={styles.emptySub}>Try adjusting your dietary or ingredient preferences.</Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      <FlatList
        data={filteredRecipes}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        renderItem={({ item }) => (
          <RecipeRow recipe={item} onPress={() => navigation.navigate('IngredientChecklist', { recipeId: item.id })} />
        )}
      />

      {/* Prefs modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <SafeAreaView style={styles.modalSheet}>
            {/* Step header */}
            <View style={styles.modalTopBar}>
              <View style={styles.stepDots}>
                <View style={[styles.stepDot, modalStep === 1 && styles.stepDotActive]} />
                <View style={[styles.stepDot, modalStep === 2 && styles.stepDotActive]} />
              </View>
              <TouchableOpacity onPress={handleShowRecipes} activeOpacity={0.7}>
                <Text style={styles.skipLabel}>Skip</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent}>
              {modalStep === 1 ? (
                <>
                  <Text style={styles.modalHeading}>{cookbook?.title}</Text>
                  <Text style={styles.modalSub}>Any dietary needs? Select all that apply.</Text>

                  <View style={styles.chipGrid}>
                    {DIETARY_OPTIONS.map((opt) => {
                      const isActive = selectedDietary.has(opt.value);
                      return (
                        <TouchableOpacity
                          key={opt.value}
                          style={[styles.chip, isActive && styles.chipActive]}
                          onPress={() => toggleDietary(opt.value)}
                          activeOpacity={0.75}
                        >
                          <Text style={styles.chipEmoji}>{opt.emoji}</Text>
                          <Text style={[styles.chipLabel, isActive && styles.chipLabelActive]}>{opt.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                    {/* None option */}
                    <TouchableOpacity
                      style={[styles.chip, styles.chipWide, selectedDietary.size === 0 && styles.chipActive]}
                      onPress={() => setSelectedDietary(new Set())}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.chipLabel, selectedDietary.size === 0 && styles.chipLabelActive]}>No restrictions</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.modalHeading}>What's in your kitchen?</Text>
                  <Text style={styles.modalSub}>Select ingredients you have. We'll show recipes you can make.</Text>

                  {PANTRY_GROUPS.map((group) => (
                    <View key={group.group} style={styles.pantryGroup}>
                      <Text style={styles.pantryGroupLabel}>{group.group.toUpperCase()}</Text>
                      <View style={styles.chipGrid}>
                        {group.items.map((item) => {
                          const isActive = selectedPantry.has(item.id);
                          return (
                            <TouchableOpacity
                              key={item.id}
                              style={[styles.chip, isActive && styles.chipActive]}
                              onPress={() => togglePantry(item.id)}
                              activeOpacity={0.75}
                            >
                              <Text style={[styles.chipLabel, isActive && styles.chipLabelActive]}>{item.label}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  ))}
                </>
              )}
            </ScrollView>

            {/* Footer CTA */}
            <View style={styles.modalFooter}>
              {modalStep === 1 ? (
                <TouchableOpacity style={styles.cta} onPress={() => setModalStep(2)} activeOpacity={0.85}>
                  <Text style={styles.ctaText}>Next — What's in your kitchen?</Text>
                  <Ionicons name="arrow-forward" size={18} color={Colors.bg} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.cta} onPress={handleShowRecipes} activeOpacity={0.85}>
                  <Ionicons name="checkmark" size={18} color={Colors.bg} />
                  <Text style={styles.ctaText}>Show My Recipes</Text>
                </TouchableOpacity>
              )}
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl },
  header: { paddingTop: Spacing.sm, paddingBottom: Spacing.md },
  backRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg, gap: 4 },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginLeft: -8 },
  backLabel: { fontFamily: Fonts.body, fontSize: 15, color: Colors.muted },
  cookbookCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    borderRadius: 14, borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, gap: Spacing.md, marginBottom: Spacing.md,
  },
  cookbookIcon: { width: 56, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cookbookEmoji: { fontSize: 26 },
  cookbookInfo: { flex: 1, gap: 2 },
  cookbookName: { fontFamily: Fonts.bodySemiBold, fontSize: 18, color: Colors.text },
  cookbookAuthor: { fontFamily: Fonts.body, fontSize: 13, color: Colors.accent },
  cookbookStats: { fontFamily: Fonts.body, fontSize: 12, color: Colors.muted, marginTop: 2 },
  prefsBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#1A2B1A', borderRadius: 8, borderWidth: 1, borderColor: '#2C4A2A',
    paddingHorizontal: 12, paddingVertical: 8, marginBottom: Spacing.md,
  },
  prefsBadgeText: { fontFamily: Fonts.body, fontSize: 12, color: Colors.accent, flex: 1 },
  prefsClear: { fontFamily: Fonts.body, fontSize: 12, color: Colors.muted, textDecorationLine: 'underline' },
  filterScroll: { marginBottom: Spacing.md, marginHorizontal: -Spacing.lg },
  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: Spacing.lg },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: 'transparent',
  },
  filterChipActive: { backgroundColor: Colors.text, borderColor: Colors.text },
  filterText: { fontFamily: Fonts.body, fontSize: 13, color: Colors.muted },
  filterTextActive: { color: Colors.bg, fontFamily: Fonts.bodySemiBold },
  recipeCount: { fontFamily: Fonts.body, fontSize: 11, color: Colors.muted, letterSpacing: 1.2, marginBottom: Spacing.md },
  recipeRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    borderRadius: 14, borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, gap: Spacing.md,
  },
  recipeDot: { width: 10, height: 10, borderRadius: 5 },
  recipeInfo: { flex: 1, gap: 3 },
  recipeTitle: { fontFamily: Fonts.bodySemiBold, fontSize: 16, color: Colors.text },
  recipeMeta: { fontFamily: Fonts.body, fontSize: 12, color: Colors.muted },
  recipeDuration: { fontFamily: Fonts.body, fontSize: 13, color: Colors.muted },
  emptyBox: { alignItems: 'center', paddingTop: Spacing.xxl, gap: Spacing.md },
  emptyTitle: { fontFamily: Fonts.heading, fontSize: 22, color: Colors.muted },
  emptySub: { fontFamily: Fonts.body, fontSize: 14, color: Colors.muted, textAlign: 'center', lineHeight: 22 },
  // Modal
  modalBg: { flex: 1, backgroundColor: 'rgba(11,22,16,0.92)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderWidth: 1, borderColor: Colors.border, maxHeight: '90%',
  },
  modalTopBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.sm,
  },
  stepDots: { flexDirection: 'row', gap: 6 },
  stepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.border },
  stepDotActive: { backgroundColor: Colors.accent, width: 20 },
  skipLabel: { fontFamily: Fonts.body, fontSize: 14, color: Colors.muted },
  modalScroll: { flex: 0 },
  modalScrollContent: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.lg },
  modalHeading: { fontFamily: Fonts.heading, fontSize: 28, color: Colors.text, marginBottom: 4 },
  modalSub: { fontFamily: Fonts.body, fontSize: 14, color: Colors.muted, marginBottom: Spacing.lg },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 50,
    borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.bg,
  },
  chipWide: { paddingHorizontal: 20 },
  chipActive: { borderColor: Colors.accent, backgroundColor: '#1E2E1E' },
  chipEmoji: { fontSize: 15 },
  chipLabel: { fontFamily: Fonts.body, fontSize: 13, color: Colors.muted },
  chipLabelActive: { color: Colors.accent, fontFamily: Fonts.bodySemiBold },
  pantryGroup: { marginBottom: Spacing.lg },
  pantryGroupLabel: {
    fontFamily: Fonts.body, fontSize: 11, color: Colors.muted,
    textTransform: 'uppercase', letterSpacing: 1.4, marginBottom: Spacing.sm,
  },
  modalFooter: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg },
  cta: {
    backgroundColor: Colors.accent, borderRadius: 14, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
  },
  ctaText: { fontFamily: Fonts.bodySemiBold, fontSize: 16, color: Colors.bg },
});
