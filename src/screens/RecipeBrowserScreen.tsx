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
  Alert,
  Image,
  ImageBackground,
  Dimensions,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../App';
import { Colors, Fonts, Spacing } from '../lib/theme';
import { useRecipeStore, Recipe } from '../store/recipeStore';
import { MY_RECIPES_COOKBOOK_ID } from '../lib/recipeGeneratorService';
import { usePantryStore } from '../store/pantryStore';

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

const R_CARD_GAP = Spacing.md;
const R_CARD_WIDTH = (Dimensions.get('window').width - Spacing.lg * 2 - R_CARD_GAP) / 2;

// --- Recipe card ---
function RecipeCard({ recipe, onPress, onLongPress }: { recipe: Recipe; onPress: () => void; onLongPress?: () => void }) {
  const isVeg = recipe.tags.includes('Vegetarian');
  const dotColor = isVeg ? '#4A8C3A' : '#C87840';

  const content = (
    <View style={styles.rcCardOverlay}>
      <View style={styles.rcCardBottom}>
        <Text style={styles.rcCardTitle} numberOfLines={2}>{recipe.title}</Text>
        <View style={styles.rcCardMetaRow}>
          <View style={[styles.rcDot, { backgroundColor: dotColor }]} />
          <Text style={styles.rcCardMeta} numberOfLines={1}>{recipe.duration_mins} min</Text>
        </View>
      </View>
    </View>
  );

  return (
    <TouchableOpacity
      style={styles.rcCard}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.8}
    >
      {recipe.image_url ? (
        <ImageBackground
          source={{ uri: recipe.image_url }}
          style={styles.rcCardBg}
          imageStyle={styles.rcCardBgImage}
        >
          {content}
        </ImageBackground>
      ) : (
        <View style={[styles.rcCardBg, { backgroundColor: Colors.surface }]}>
          {content}
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function RecipeBrowserScreen({ route, navigation }: Props) {
  const { cookbookId } = route.params;
  const { getCookbook, getRecipesByCookbook, removeRecipe, isUploadedCookbook } = useRecipeStore();
  const isMyRecipes = cookbookId === MY_RECIPES_COOKBOOK_ID;
  const canDeleteRecipes = isMyRecipes || isUploadedCookbook(cookbookId);

  const [showModal, setShowModal] = useState(!isMyRecipes);

  const { dietaryRestrictions: savedDietary, setDietaryRestrictions: saveDietary, getPantryNames } = usePantryStore();
  const [selectedDietary, setSelectedDietary] = useState<Set<string>>(new Set(savedDietary));
  const [usePantryFilter, setUsePantryFilter] = useState(false);
  const pantryNames = useMemo(() => getPantryNames().map((n) => n.toLowerCase()), []);

  const cookbook = getCookbook(cookbookId);
  const allRecipes = getRecipesByCookbook(cookbookId);

  const toggleDietary = (value: string) => {
    setSelectedDietary((prev) => {
      const next = new Set(prev);
      next.has(value) ? next.delete(value) : next.add(value);
      saveDietary(Array.from(next)); // Persist
      return next;
    });
  };

  const handleShowRecipes = () => {
    setShowModal(false);
  };

  // Apply all filters
  const filteredRecipes = useMemo(() => {
    let base = allRecipes;

    // Dietary filter
    base = applyDietaryFilter(base, selectedDietary);

    // Pantry filter — only show recipes where most ingredients are in pantry
    if (usePantryFilter && pantryNames.length > 0) {
      base = base.filter((recipe) => {
        const matchCount = recipe.ingredients.filter((ing) =>
          pantryNames.some((p) => ing.name.toLowerCase().includes(p) || p.includes(ing.name.toLowerCase()))
        ).length;
        // Show recipe if user has at least 60% of ingredients
        return matchCount >= recipe.ingredients.length * 0.6;
      });
    }

    // Newest first for "My Recipes" (IDs are `my_<timestamp>`)
    if (isMyRecipes) base = [...base].reverse();

    return base;
  }, [allRecipes, selectedDietary, usePantryFilter, pantryNames, isMyRecipes]);

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
        <TouchableOpacity onPress={() => setShowModal(true)} activeOpacity={0.7}>
          <Ionicons name="options-outline" size={22} color={Colors.muted} />
        </TouchableOpacity>
      </View>

      {/* Active prefs summary */}
      {(selectedDietary.size > 0 || usePantryFilter) && (
        <View style={styles.prefsBadge}>
          <Ionicons name="funnel-outline" size={13} color={Colors.accent} />
          <Text style={styles.prefsBadgeText}>
            {[selectedDietary.size > 0 && `${selectedDietary.size} dietary`, usePantryFilter && 'Pantry filter on'].filter(Boolean).join(' · ')}
          </Text>
          <TouchableOpacity onPress={() => { setSelectedDietary(new Set()); setUsePantryFilter(false); saveDietary([]); }} activeOpacity={0.7}>
            <Text style={styles.prefsClear}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}

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
        numColumns={2}
        columnWrapperStyle={styles.rcGridRow}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <RecipeCard
            recipe={item}
            onPress={() => navigation.navigate('IngredientChecklist', { recipeId: item.id })}
            onLongPress={canDeleteRecipes ? () => {
              Alert.alert(
                'Delete Recipe',
                `Delete "${item.title}"?`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: () => removeRecipe(item.id) },
                ],
              );
            } : undefined}
          />
        )}
      />

      {/* Preferences modal — single screen */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <SafeAreaView style={styles.modalSheet}>
            <View style={styles.modalTopBar}>
              <Text style={styles.modalHeading}>Your Preferences</Text>
              <TouchableOpacity onPress={handleShowRecipes} activeOpacity={0.7}>
                <Text style={styles.skipLabel}>Skip All</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent}>
              <Text style={styles.modalSub}>Dietary restrictions</Text>
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
              </View>

              {pantryNames.length > 0 && (
                <TouchableOpacity
                  style={[styles.pantryToggle, usePantryFilter && styles.pantryToggleActive]}
                  onPress={() => setUsePantryFilter(!usePantryFilter)}
                  activeOpacity={0.75}
                >
                  <Ionicons
                    name={usePantryFilter ? 'checkbox' : 'square-outline'}
                    size={22}
                    color={usePantryFilter ? Colors.accent : Colors.muted}
                  />
                  <View style={styles.pantryToggleText}>
                    <Text style={styles.pantryToggleLabel}>Only recipes I can make with my pantry</Text>
                    <Text style={styles.pantryToggleHint}>{pantryNames.length} items in your pantry</Text>
                  </View>
                </TouchableOpacity>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cta} onPress={handleShowRecipes} activeOpacity={0.85}>
                <Ionicons name="checkmark" size={18} color={Colors.bg} />
                <Text style={styles.ctaText}>Apply</Text>
              </TouchableOpacity>
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
  rcGridRow: {
    justifyContent: 'space-between',
    marginBottom: R_CARD_GAP,
  },
  rcCard: {
    width: R_CARD_WIDTH,
    height: R_CARD_WIDTH * 1.2,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#3A4A3A',
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  rcCardBg: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  rcCardBgImage: {
    borderRadius: 14,
  },
  rcCardOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: Spacing.sm + 2,
  },
  rcCardBottom: {
    backgroundColor: 'rgba(11,22,16,0.85)',
    borderRadius: 10,
    padding: Spacing.sm,
    gap: 4,
  },
  rcCardTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.text,
    lineHeight: 17,
  },
  rcCardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rcDot: { width: 8, height: 8, borderRadius: 4 },
  rcCardMeta: { fontFamily: Fonts.body, fontSize: 11, color: Colors.muted },
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
  pantryToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginTop: Spacing.lg,
  },
  pantryToggleActive: { borderColor: Colors.accent },
  pantryToggleText: { flex: 1, gap: 2 },
  pantryToggleLabel: { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.text },
  pantryToggleHint: { fontFamily: Fonts.body, fontSize: 12, color: Colors.muted },
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
