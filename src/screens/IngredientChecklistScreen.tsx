import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../App';
import { Colors, Fonts, Spacing } from '../lib/theme';
import { useRecipeStore } from '../store/recipeStore';
import { useOnboardingStore } from '../store/onboardingStore';
import { useCookStore } from '../store/cookStore';

type Props = NativeStackScreenProps<RootStackParamList, 'IngredientChecklist'>;

type TabName = 'Ingredients' | 'Shopping list' | 'Overview';

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

  const recipe = getRecipe(recipeId);
  const cookbook = recipe ? getCookbook(recipe.cookbook_id) : undefined;
  const [serves, setServes] = useState(defaultServes);
  const [checked, setChecked] = useState<Set<number>>(new Set());
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

  const tabs: TabName[] = ['Ingredients', 'Shopping list', 'Overview'];

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
        <Text style={styles.recipeTitle}>{recipe.title}</Text>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={14} color={Colors.muted} />
            <Text style={styles.metaText}>{recipe.duration_mins} min</Text>
          </View>
          <Text style={styles.metaText}>Serves {serves}</Text>
          {recipe.tags.length > 0 && (
            <View style={styles.tagDot}>
              <View style={styles.tagDotInner} />
              <Text style={styles.tagText}>{recipe.tags[0]}</Text>
            </View>
          )}
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

        {activeTab === 'Shopping list' && (
          <View style={styles.placeholderTab}>
            <Ionicons name="cart-outline" size={40} color={Colors.border} />
            <Text style={styles.placeholderText}>
              Shopping list will auto-generate from unchecked ingredients.
            </Text>
          </View>
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
        <TouchableOpacity style={styles.cta} onPress={handleStart} activeOpacity={0.85}>
          <Ionicons name="checkmark" size={18} color={Colors.bg} />
          <Text style={styles.ctaText}>Start Cooking</Text>
        </TouchableOpacity>
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
    marginBottom: Spacing.lg,
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
  placeholderTab: {
    alignItems: 'center',
    paddingTop: Spacing.xxl,
    gap: Spacing.md,
  },
  placeholderText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.muted,
    textAlign: 'center',
    lineHeight: 22,
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
  cta: {
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
