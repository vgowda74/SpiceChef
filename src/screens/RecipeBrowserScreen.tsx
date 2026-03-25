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
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../App';
import { Colors, Fonts, Spacing } from '../lib/theme';
import { useRecipeStore, Recipe } from '../store/recipeStore';
import { useOnboardingStore } from '../store/onboardingStore';

type Props = NativeStackScreenProps<RootStackParamList, 'RecipeBrowser'>;

function getCookbookEmoji(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes('indian') || lower.includes('spice')) return '🍛';
  if (lower.includes('plenty') || lower.includes('vegetable') || lower.includes('veg')) return '🥬';
  if (lower.includes('death') || lower.includes('cocktail') || lower.includes('drink')) return '🍸';
  if (lower.includes('italian') || lower.includes('pasta')) return '🍝';
  return '📖';
}

const FILTERS = ['All', 'Vegetarian', 'Under 30 min', 'Cooking', 'Quick', 'Indian'];

function RecipeRow({ recipe, onPress }: { recipe: Recipe; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.recipeRow} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.recipeDot} />
      <View style={styles.recipeInfo}>
        <Text style={styles.recipeTitle}>{recipe.title}</Text>
        <Text style={styles.recipeMeta}>
          {recipe.tags.join(' · ')}
        </Text>
      </View>
      <Text style={styles.recipeDuration}>{recipe.duration_mins} min</Text>
    </TouchableOpacity>
  );
}

export default function RecipeBrowserScreen({ route, navigation }: Props) {
  const { cookbookId } = route.params;
  const { getCookbook, getRecipesByCookbook } = useRecipeStore();
  const { dietary } = useOnboardingStore();
  const [activeFilter, setActiveFilter] = useState('All');

  const cookbook = getCookbook(cookbookId);
  const allRecipes = getRecipesByCookbook(cookbookId);

  const filteredRecipes = useMemo(() => {
    if (activeFilter === 'All') return allRecipes;
    if (activeFilter === 'Under 30 min')
      return allRecipes.filter((r) => r.duration_mins <= 30);
    return allRecipes.filter((r) =>
      r.tags.some((tag) => tag.toLowerCase().includes(activeFilter.toLowerCase()))
    );
  }, [allRecipes, activeFilter]);

  // Count recipes matching user dietary preferences
  const matchCount = useMemo(() => {
    if (dietary.length === 0) return 0;
    return allRecipes.filter((r) =>
      r.tags.some((tag) =>
        dietary.some((d) => tag.toLowerCase().includes(d.toLowerCase()))
      )
    ).length;
  }, [allRecipes, dietary]);

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Back button + title */}
      <View style={styles.backRow}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.backLabel}>Your Library</Text>
      </View>

      {/* Cookbook card */}
      <View style={styles.cookbookCard}>
        <View style={[styles.cookbookIcon, { backgroundColor: cookbook?.accent_color ?? Colors.surface }]}>
          <Text style={styles.cookbookEmoji}>
            {getCookbookEmoji(cookbook?.title ?? '')}
          </Text>
        </View>
        <View style={styles.cookbookInfo}>
          <Text style={styles.cookbookName}>{cookbook?.title ?? 'Cookbook'}</Text>
          <Text style={styles.cookbookAuthor}>{cookbook?.author ?? ''}</Text>
          <Text style={styles.cookbookStats}>
            {allRecipes.length} recipes{matchCount > 0 ? ` · ${matchCount} match your filters` : ''}
          </Text>
        </View>
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterRow}
      >
        {FILTERS.map((filter) => {
          const isActive = activeFilter === filter;
          return (
            <TouchableOpacity
              key={filter}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => setActiveFilter(filter)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                {filter}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Recipe count */}
      <Text style={styles.recipeCount}>
        {filteredRecipes.length} RECIPES FOUND
      </Text>

      {allRecipes.length === 0 && (
        <View style={styles.emptyBox}>
          <Ionicons name="reader-outline" size={40} color={Colors.border} />
          <Text style={styles.emptyTitle}>No recipes found</Text>
          <Text style={styles.emptySub}>
            This cookbook was uploaded but no recipes were extracted yet.
          </Text>
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
          <RecipeRow
            recipe={item}
            onPress={() =>
              navigation.navigate('IngredientChecklist', { recipeId: item.id })
            }
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  header: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    gap: 4,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  backLabel: {
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.muted,
  },
  cookbookCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  cookbookIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cookbookEmoji: {
    fontSize: 26,
  },
  cookbookInfo: {
    flex: 1,
    gap: 2,
  },
  cookbookName: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 18,
    color: Colors.text,
  },
  cookbookAuthor: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.accent,
  },
  cookbookStats: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.muted,
    marginTop: 2,
  },
  filterScroll: {
    marginBottom: Spacing.md,
    marginHorizontal: -Spacing.lg,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: Spacing.lg,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: 'transparent',
  },
  filterChipActive: {
    backgroundColor: Colors.text,
    borderColor: Colors.text,
  },
  filterText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.muted,
  },
  filterTextActive: {
    color: Colors.bg,
    fontFamily: Fonts.bodySemiBold,
  },
  recipeCount: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.muted,
    letterSpacing: 1.2,
    marginBottom: Spacing.md,
  },
  recipeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  recipeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.accent,
    opacity: 0.6,
  },
  recipeInfo: {
    flex: 1,
    gap: 3,
  },
  recipeTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 16,
    color: Colors.text,
  },
  recipeMeta: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.muted,
  },
  recipeDuration: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.muted,
  },
  emptyBox: {
    alignItems: 'center',
    paddingTop: Spacing.xxl,
    gap: Spacing.md,
  },
  emptyTitle: {
    fontFamily: Fonts.heading,
    fontSize: 22,
    color: Colors.muted,
  },
  emptySub: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.muted,
    textAlign: 'center',
    lineHeight: 22,
  },
});
