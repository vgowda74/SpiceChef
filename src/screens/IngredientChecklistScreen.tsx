import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Linking,
  Image,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../App';
import { Colors, Fonts, Spacing } from '../lib/theme';
import { useRecipeStore } from '../store/recipeStore';
import { useOnboardingStore } from '../store/onboardingStore';
import { useCookStore } from '../store/cookStore';
import { usePantryStore } from '../store/pantryStore';
import { Alert } from 'react-native';

type Props = NativeStackScreenProps<RootStackParamList, 'IngredientChecklist'>;

type TabName = 'Ingredients' | 'Overview';

function formatAmount(amount: number): string {
  if (amount === 0) return '';
  if (!isFinite(amount)) return '—';
  const quarter = Math.round(amount * 4);
  const whole = Math.floor(quarter / 4);
  const rem = quarter % 4;
  const fracMap: Record<number, string> = { 1: '¼', 2: '½', 3: '¾' };
  const frac = fracMap[rem] ?? '';
  if (whole === 0 && frac) return frac;
  if (!frac) return whole.toString();
  return `${whole}${frac}`;
}

function scaleAmount(amount: number, baseServes: number, serves: number): string {
  if (amount === 0) return '';
  const scaled = (amount / baseServes) * serves;
  return formatAmount(scaled);
}

export default function IngredientChecklistScreen({ route, navigation }: Props) {
  const { recipeId } = route.params;
  const { getRecipe, getCookbook } = useRecipeStore();
  const { serves: defaultServes } = useOnboardingStore();
  const { startSession } = useCookStore();
  const { getPantryNames, addGroceryItem: addToGrocery } = usePantryStore();

  const recipe = getRecipe(recipeId);
  const cookbook = recipe ? getCookbook(recipe.cookbook_id) : undefined;
  const pantryNames = useMemo(() => new Set(getPantryNames().map((n) => n.toLowerCase())), []);
  const [serves, setServes] = useState(defaultServes);
  const [checked, setChecked] = useState<Set<number>>(() => {
    // Auto-check ingredients that are in the pantry
    if (!recipe) return new Set<number>();
    const autoChecked = new Set<number>();
    recipe.ingredients.forEach((ing, idx) => {
      if (pantryNames.has(ing.name.toLowerCase())) {
        autoChecked.add(idx);
      }
    });
    return autoChecked;
  });
  const [activeTab, setActiveTab] = useState<TabName>('Ingredients');

  if (!recipe) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={{ color: Colors.muted, padding: Spacing.lg }}>Recipe not found.</Text>
      </SafeAreaView>
    );
  }

  // Group ingredients by category
  const groupedIngredients = useMemo(() => {
    const groups: Record<string, { name: string; amount: number; unit: string; index: number }[]> = {};
    recipe.ingredients.forEach((ing, idx) => {
      const cat = ing.category || 'OTHER';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push({ ...ing, index: idx });
    });
    return groups;
  }, [recipe.ingredients]);

  const toggleCheck = (index: number) => {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  };

  const handleStart = () => {
    startSession(recipe.id, serves);
    navigation.navigate('CookMode', { recipeId: recipe.id, serves });
  };

  const tabs: TabName[] = ['Ingredients', 'Overview'];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={22} color={Colors.accent} />
          <Text style={styles.backLabel}>{cookbook?.title ?? 'Back'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Recipe title & meta */}
        {recipe.image_url && (
          <Image source={{ uri: recipe.image_url }} style={styles.heroImage} />
        )}
        <Text style={styles.recipeTitle}>{recipe.title}</Text>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={14} color={Colors.muted} />
            <Text style={styles.metaText}>{recipe.duration_mins} min</Text>
          </View>
          {recipe.tags.length > 0 && (
            <View style={styles.tagDot}>
              <View style={styles.tagDotInner} />
              <Text style={styles.tagText}>{recipe.tags[0]}</Text>
            </View>
          )}
        </View>

        {/* Serving selector */}
        <View style={styles.servingRow}>
          <Text style={styles.servingLabel}>SERVINGS</Text>
          <View style={styles.servingControls}>
            <TouchableOpacity
              style={styles.servingBtn}
              onPress={() => setServes(Math.max(1, serves - 1))}
              activeOpacity={0.7}
            >
              <Ionicons name="remove" size={18} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.servingValue}>{serves}</Text>
            <TouchableOpacity
              style={styles.servingBtn}
              onPress={() => setServes(serves + 1)}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={18} color={Colors.text} />
            </TouchableOpacity>
          </View>
          <Text style={styles.servingHint}>
            {serves === recipe.base_serves ? 'Original recipe' : `Scaled from ${recipe.base_serves} · Adjust spices to taste`}
          </Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, isActive && styles.tabActive]}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {activeTab === 'Ingredients' && (
          <>
            {/* Grouped ingredient list */}
            {Object.entries(groupedIngredients).map(([category, items]) => (
              <View key={category} style={styles.categoryGroup}>
                <Text style={styles.categoryLabel}>{category}</Text>
                {items.map((ing) => {
                  const isChecked = checked.has(ing.index);
                  const scaled = scaleAmount(ing.amount, recipe.base_serves, serves);
                  const unitStr = ing.unit ? `${scaled}${ing.unit}` : scaled;

                  return (
                    <TouchableOpacity
                      key={ing.index}
                      style={[styles.ingredientRow, isChecked && styles.ingredientRowChecked]}
                      onPress={() => toggleCheck(ing.index)}
                      activeOpacity={0.75}
                    >
                      <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                        {isChecked && (
                          <Ionicons name="checkmark" size={14} color={Colors.bg} />
                        )}
                      </View>
                      <Text
                        style={[styles.ingName, isChecked && styles.ingStrike]}
                        numberOfLines={1}
                      >
                        {ing.name}
                      </Text>
                      {unitStr !== '' && (
                        <Text style={[styles.ingAmount, isChecked && styles.ingStrike]}>
                          {unitStr}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </>
        )}

        {activeTab === 'Overview' && (
          <View style={styles.overviewTab}>
            <Text style={styles.overviewLabel}>RECIPE OVERVIEW</Text>
            <Text style={styles.overviewText}>
              {recipe.steps.map((s) => s.title || `Step ${s.order}`).join(' → ')}
            </Text>
            <View style={styles.overviewStats}>
              <View style={styles.overviewStat}>
                <Text style={styles.overviewStatValue}>{recipe.steps.length}</Text>
                <Text style={styles.overviewStatLabel}>Steps</Text>
              </View>
              <View style={styles.overviewStat}>
                <Text style={styles.overviewStatValue}>{recipe.duration_mins}</Text>
                <Text style={styles.overviewStatLabel}>Minutes</Text>
              </View>
              <View style={styles.overviewStat}>
                <Text style={styles.overviewStatValue}>{recipe.ingredients.length}</Text>
                <Text style={styles.overviewStatLabel}>Ingredients</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.addToGroceryBtn}
          onPress={() => {
            const missing = recipe.ingredients.filter(
              (ing) => !pantryNames.has(ing.name.toLowerCase())
            );
            if (missing.length === 0) {
              Alert.alert('All set!', 'You have everything in your pantry.');
              return;
            }
            missing.forEach((ing) => {
              const scaled = scaleAmount(ing.amount, recipe.base_serves, serves);
              addToGrocery(ing.name, `${scaled} ${ing.unit}`.trim(), ing.category || 'OTHER');
            });
            Alert.alert('Added!', `${missing.length} items added to your grocery list.`);
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="cart-outline" size={16} color={Colors.accent} />
          <Text style={styles.addToGroceryText}>Add missing to grocery list</Text>
        </TouchableOpacity>
        <View style={styles.footerRow}>
          <TouchableOpacity
            style={styles.youtubeBtn}
            onPress={() => {
              const query = encodeURIComponent(`how to make ${recipe.title}`);
              Linking.openURL(`https://www.youtube.com/results?search_query=${query}`);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="logo-youtube" size={22} color="#FF0000" />
            <Text style={styles.youtubeBtnText}>Watch</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cta} onPress={handleStart} activeOpacity={0.85}>
            <Ionicons name="checkmark" size={18} color={Colors.bg} />
            <Text style={styles.ctaText}>Start Cooking</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: -4,
  },
  backLabel: {
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.accent,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  heroImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    marginBottom: Spacing.md,
  },
  recipeTitle: {
    fontFamily: Fonts.heading,
    fontSize: 34,
    color: Colors.text,
    lineHeight: 40,
    marginBottom: Spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  servingRow: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  servingLabel: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.muted,
    letterSpacing: 1.2,
    marginBottom: Spacing.sm,
  },
  servingControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  servingBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  servingValue: {
    fontFamily: Fonts.heading,
    fontSize: 36,
    color: Colors.accent,
    minWidth: 50,
    textAlign: 'center',
  },
  servingHint: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.muted,
    marginTop: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.muted,
  },
  tagDot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tagDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent,
  },
  tagText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.accent,
  },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginRight: Spacing.lg,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: Colors.accent,
  },
  tabText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.muted,
  },
  tabTextActive: {
    fontFamily: Fonts.bodySemiBold,
    color: Colors.text,
  },
  categoryGroup: {
    marginBottom: Spacing.lg,
  },
  categoryLabel: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    marginBottom: Spacing.sm,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: Spacing.md,
    marginBottom: 2,
  },
  ingredientRowChecked: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  checkboxChecked: {
    backgroundColor: '#4A6B3A',
    borderColor: '#4A6B3A',
  },
  ingName: {
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.text,
    flex: 1,
  },
  ingAmount: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.muted,
  },
  ingStrike: {
    color: Colors.muted,
    textDecorationLine: 'line-through',
  },
  overviewTab: {
    gap: Spacing.lg,
  },
  overviewLabel: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  overviewText: {
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.text,
    lineHeight: 24,
  },
  overviewStats: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    justifyContent: 'space-around',
  },
  overviewStat: {
    alignItems: 'center',
    gap: 4,
  },
  overviewStatValue: {
    fontFamily: Fonts.heading,
    fontSize: 28,
    color: Colors.accent,
  },
  overviewStatLabel: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  addToGroceryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    marginBottom: Spacing.sm,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addToGroceryText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.accent,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  youtubeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingVertical: 16,
  },
  youtubeBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    color: Colors.text,
  },
  cta: {
    flex: 1,
    backgroundColor: Colors.accent,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  ctaText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 16,
    color: Colors.bg,
  },
});
