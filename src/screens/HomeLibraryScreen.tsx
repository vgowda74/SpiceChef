import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../App';
import { Colors, Fonts, Spacing } from '../lib/theme';
import { useRecipeStore, Cookbook } from '../store/recipeStore';
import { uploadAndParseCookbook, getLimits } from '../lib/cookbookService';
import { maybeRequestReview } from '../lib/reviewService';
import { usePurchaseStore } from '../store/purchaseStore';
import { MY_RECIPES_COOKBOOK_ID } from '../lib/recipeGeneratorService';
import { useMealPlanStore } from '../store/mealPlanStore';

// Navigation prop can come from either the stack or the tab navigator
type Props = {
  navigation: any;
};

// Simple emoji icons for cookbooks based on title
function getCookbookEmoji(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes('indian') || lower.includes('spice')) return '🍛';
  if (lower.includes('plenty') || lower.includes('vegetable') || lower.includes('veg')) return '🥬';
  if (lower.includes('death') || lower.includes('cocktail') || lower.includes('drink')) return '🍸';
  if (lower.includes('italian') || lower.includes('pasta')) return '🍝';
  if (lower.includes('bread') || lower.includes('bak')) return '🍞';
  if (lower.includes('dessert') || lower.includes('sweet')) return '🍰';
  return '📖';
}

function CookbookRow({
  cookbook,
  onPress,
  onLongPress,
  isNew,
}: {
  cookbook: Cookbook;
  onPress: () => void;
  onLongPress: () => void;
  isNew?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.cookbookRow, cookbook.loading && styles.cookbookRowLoading]}
      onPress={cookbook.loading ? undefined : onPress}
      onLongPress={cookbook.loading ? undefined : onLongPress}
      activeOpacity={cookbook.loading ? 1 : 0.8}
    >
      <View style={[styles.cookbookIcon, { backgroundColor: cookbook.accent_color }]}>
        {cookbook.loading
          ? <ActivityIndicator size="small" color={Colors.accent} />
          : <Text style={styles.cookbookEmoji}>{getCookbookEmoji(cookbook.title)}</Text>
        }
      </View>
      <View style={styles.cookbookInfo}>
        <View style={styles.cookbookTitleRow}>
          <Text style={styles.cookbookTitle} numberOfLines={1}>{cookbook.title}</Text>
          {isNew && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
          )}
        </View>
        <Text style={styles.cookbookMeta}>
          {cookbook.loading ? 'Reading your cookbook…' : `${cookbook.author} · ${cookbook.recipe_count} recipes found`}
        </Text>
      </View>
      {cookbook.loading
        ? <ActivityIndicator size="small" color={Colors.muted} style={{ marginRight: 4 }} />
        : (
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{cookbook.recipe_count}</Text>
          </View>
        )
      }
    </TouchableOpacity>
  );
}

export default function HomeLibraryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { cookbooks, addCookbook, addPendingCookbook, resolvePendingCookbook, rejectPendingCookbook, lifetimeUploads, incrementLifetimeUploads } = useRecipeStore();
  const { isPro } = usePurchaseStore();
  const { mealPlans, removeMealPlan } = useMealPlanStore();
  const limits = getLimits(isPro);
  const [searchQuery, setSearchQuery] = useState('');

  const { isFeaturedCookbook, isUploadedCookbook, removeCookbook } = useRecipeStore();

  const filteredCookbooks = (searchQuery
    ? cookbooks.filter(
        (cb) =>
          cb.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          cb.author.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : cookbooks
  ).sort((a, b) => {
    // "My Recipes" always first
    if (a.id === MY_RECIPES_COOKBOOK_ID) return -1;
    if (b.id === MY_RECIPES_COOKBOOK_ID) return 1;
    // Featured cookbooks next (newest first)
    const aFeatured = isFeaturedCookbook(a.id);
    const bFeatured = isFeaturedCookbook(b.id);
    if (aFeatured && !bFeatured) return -1;
    if (!aFeatured && bFeatured) return 1;
    if (aFeatured && bFeatured) return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    return 0;
  });

  const isSupabaseConfigured =
    !!process.env.EXPO_PUBLIC_SUPABASE_URL &&
    !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  const handleUpload = async () => {
    // Check upload limit
    if (lifetimeUploads >= limits.MAX_UPLOADS) {
      navigation.navigate('Upgrade');
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];

      // Check file size
      if (file.size && file.size > limits.MAX_PDF_SIZE_BYTES) {
        const maxMB = Math.round(limits.MAX_PDF_SIZE_BYTES / (1024 * 1024));
        const fileMB = (file.size / (1024 * 1024)).toFixed(1);
        Alert.alert(
          'File too large',
          `This PDF is ${fileMB} MB. The maximum size is ${maxMB} MB — try a shorter cookbook.`,
        );
        return;
      }

      const title = file.name.replace(/\.pdf$/i, '').replace(/_/g, ' ');

      // Count this upload (even if it fails later — prevents abuse)
      incrementLifetimeUploads();

      // Add placeholder immediately so it appears in the list
      const pendingId = addPendingCookbook(title);

      if (isSupabaseConfigured) {
        // Parse in the background — don't block the UI
        uploadAndParseCookbook(file.uri, file.name).then(({ cookbook, recipes }) => {
          resolvePendingCookbook(pendingId, cookbook, recipes);
          maybeRequestReview();
        }).catch((err: any) => {
          rejectPendingCookbook(pendingId);
          Alert.alert(
            'Upload failed',
            err.message || 'Something went wrong parsing the cookbook.',
            [{ text: 'OK' }],
          );
        });
      } else {
        // Fallback mock when Supabase is not configured
        setTimeout(() => {
          const cookbook = addCookbook(title);
          rejectPendingCookbook(pendingId); // remove placeholder
          navigation.navigate('RecipeBrowser', { cookbookId: cookbook.id });
        }, 2000);
      }
    } catch {
      // picker was dismissed or failed — nothing to clean up
    }
  };

  const handleMealPlanTap = () => {
    if (mealPlans.length > 0) {
      Alert.alert(
        'Replace meal plan?',
        'Creating a new plan will replace your current one.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Create new', onPress: () => navigation.navigate('MealPlanWizard') },
        ],
      );
    } else {
      navigation.navigate('MealPlanWizard');
    }
  };

  const formatPlanDate = (plan: { createdAt: string; days: { day: string }[] }) => {
    const start = new Date(plan.createdAt);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${fmt(start)} – ${fmt(end)}`;
  };

  const renderHeader = () => (
    <View>
      {/* Search bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color={Colors.muted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search your cookbooks..."
          placeholderTextColor={Colors.muted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Action buttons 2x2 grid */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={[styles.actionBtn, styles.actionBtnUpload]} onPress={handleUpload} activeOpacity={0.75}>
          <View style={styles.actionIcon}>
            <Ionicons name="arrow-up" size={20} color={Colors.accent} />
          </View>
          <View style={styles.actionText}>
            <Text style={styles.actionLabel}>Upload cookbook</Text>
            <Text style={styles.actionSub}>PDF · Any cuisine</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnCreate]}
          onPress={() => navigation.navigate('AddRecipe')}
          activeOpacity={0.75}
        >
          <View style={[styles.actionIcon, styles.actionIconCreate]}>
            <Ionicons name="sparkles" size={20} color={Colors.bg} />
          </View>
          <View style={styles.actionText}>
            <Text style={styles.actionLabel}>Add recipe</Text>
            <Text style={styles.actionSub}>Describe · AI generates</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnMealPlan]}
          onPress={handleMealPlanTap}
          activeOpacity={0.75}
        >
          <View style={styles.actionIcon}>
            <Ionicons name="calendar-outline" size={20} color={Colors.accent} />
          </View>
          <View style={styles.actionText}>
            <Text style={styles.actionLabel}>Meal Planner</Text>
            <Text style={styles.actionSub}>Plan your week</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnGrocery]}
          onPress={() => {
            if (mealPlans.length > 0) {
              navigation.navigate('GroceryList', { planId: mealPlans[0].id });
            } else {
              Alert.alert('No meal plan', 'Create a meal plan first to get a grocery list.');
            }
          }}
          activeOpacity={0.75}
        >
          <View style={styles.actionIcon}>
            <Ionicons name="cart-outline" size={20} color={Colors.accent} />
          </View>
          <View style={styles.actionText}>
            <Text style={styles.actionLabel}>Grocery List</Text>
            <Text style={styles.actionSub}>From meal plan</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Meal Plans section */}
      {mealPlans.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>MEAL PLANS</Text>
          {mealPlans.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={styles.mealPlanCard}
              onPress={() => navigation.navigate('MealPlanView', { planId: plan.id })}
              onLongPress={() => {
                Alert.alert(
                  'Delete Meal Plan',
                  'Delete this meal plan and its grocery list?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => removeMealPlan(plan.id) },
                  ],
                );
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="calendar" size={18} color={Colors.accent} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.mealPlanCardTitle}>
                  Week of {formatPlanDate(plan)}
                </Text>
                <Text style={styles.mealPlanCardSub}>
                  {plan.days.length} days · {plan.days.reduce((sum, d) => sum + d.meals.length, 0)} meals · Serves {plan.servingSize}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.muted} />
            </TouchableOpacity>
          ))}
        </>
      )}

      {/* Section label */}
      {filteredCookbooks.length > 0 && (
        <Text style={[styles.sectionLabel, { marginTop: Spacing.lg }]}>
          MY COOKBOOKS ({filteredCookbooks.length})
        </Text>
      )}
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Ionicons name="book-outline" size={48} color={Colors.border} />
      <Text style={styles.emptyTitle}>No cookbooks yet</Text>
      <Text style={styles.emptySub}>
        Upload your first PDF above and we'll extract every recipe for you.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      <FlatList
        data={filteredCookbooks}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        renderItem={({ item }) => (
          <CookbookRow
            cookbook={item}
            onPress={() => navigation.navigate('RecipeBrowser', { cookbookId: item.id })}
            onLongPress={() => {
              Alert.alert(
                'Delete Cookbook',
                `Delete "${item.title}" and all its recipes?`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: () => removeCookbook(item.id) },
                ],
              );
            }}
            isNew={isFeaturedCookbook(item.id)}
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
    paddingBottom: Spacing.xxl + 80, // extra space for tab bar
  },
  searchBar: {
    marginTop: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    gap: 10,
    marginBottom: Spacing.lg,
  },
  searchInput: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.text,
    padding: 0,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'column',
    borderRadius: 14,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  actionBtnUpload: {
    backgroundColor: '#2A3B1E',
    borderColor: '#3D5228',
  },
  actionBtnCreate: {
    backgroundColor: '#2A2A1A',
    borderColor: '#4A4A28',
  },
  actionBtnMealPlan: {
    backgroundColor: '#1A2A3A',
    borderColor: '#284A5A',
  },
  actionBtnGrocery: {
    backgroundColor: '#2A1A2A',
    borderColor: '#4A284A',
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconCreate: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  actionText: {
    gap: 2,
  },
  actionLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: Colors.text,
  },
  actionSub: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.muted,
  },
  sectionLabel: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    marginBottom: Spacing.md,
  },
  mealPlanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  mealPlanCardTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    color: Colors.text,
  },
  mealPlanCardSub: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.muted,
  },
  cookbookRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  cookbookRowLoading: {
    opacity: 0.6,
  },
  cookbookIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cookbookEmoji: {
    fontSize: 22,
  },
  cookbookInfo: {
    flex: 1,
    gap: 3,
  },
  cookbookTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cookbookTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 16,
    color: Colors.text,
    flexShrink: 1,
  },
  newBadge: {
    backgroundColor: Colors.accent,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  newBadgeText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 9,
    color: Colors.bg,
    letterSpacing: 0.8,
  },
  cookbookMeta: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.muted,
  },
  countBadge: {
    backgroundColor: '#2A3B1E',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#3D5228',
  },
  countBadgeText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.accent,
  },
  empty: {
    alignItems: 'center',
    paddingTop: Spacing.xxl,
    gap: Spacing.md,
  },
  emptyTitle: {
    fontFamily: Fonts.heading,
    fontSize: 24,
    color: Colors.muted,
  },
  emptySub: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.muted,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: Spacing.xl,
  },
});
