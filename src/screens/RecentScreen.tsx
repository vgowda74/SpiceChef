import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../App';
import { Colors, Fonts, Spacing } from '../lib/theme';
import { useCookStore, RecentCook } from '../store/cookStore';
import { useRecipeStore } from '../store/recipeStore';

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}

function RecentRow({
  entry,
  onPress,
}: {
  entry: RecentCook;
  onPress: () => void;
}) {
  const { getRecipe, getCookbook } = useRecipeStore();
  const recipe = getRecipe(entry.recipeId);
  const cookbook = getCookbook(entry.cookbookId);

  if (!recipe) return null;

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.rowLeft}>
        <Text style={styles.rowTitle} numberOfLines={1}>{recipe.title}</Text>
        <Text style={styles.rowMeta}>
          {cookbook?.title ?? 'Cookbook'} · {recipe.duration_mins} min · {timeAgo(entry.completedAt)}
        </Text>
      </View>
      <View style={styles.cookAgainBtn}>
        <Ionicons name="refresh-outline" size={16} color={Colors.accent} />
        <Text style={styles.cookAgainText}>Cook</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function RecentScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { recentlyCooked } = useCookStore();

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Ionicons name="time-outline" size={48} color={Colors.border} />
      <Text style={styles.emptyTitle}>No recent cooks</Text>
      <Text style={styles.emptySub}>
        Recipes you complete will show up here so you can quickly cook them again.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      <FlatList
        data={recentlyCooked}
        keyExtractor={(item, idx) => `${item.recipeId}_${idx}`}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.heading}>Recently Cooked</Text>
            {recentlyCooked.length > 0 && (
              <Text style={styles.countLabel}>{recentlyCooked.length} SESSIONS</Text>
            )}
          </View>
        }
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        renderItem={({ item }) => (
          <RecentRow
            entry={item}
            onPress={() => navigation.navigate('IngredientChecklist', { recipeId: item.recipeId })}
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
    paddingBottom: Spacing.xxl + 80,
  },
  header: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  heading: {
    fontFamily: Fonts.heading,
    fontSize: 38,
    color: Colors.text,
    lineHeight: 44,
    marginBottom: Spacing.sm,
  },
  countLabel: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  rowLeft: {
    flex: 1,
    gap: 3,
  },
  rowTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 16,
    color: Colors.text,
  },
  rowMeta: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.muted,
  },
  cookAgainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2A3B1E',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3D5228',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  cookAgainText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.accent,
  },
  empty: {
    alignItems: 'center',
    paddingTop: Spacing.xxl * 2,
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
