import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  SectionList,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../App';
import { Colors, Fonts, Spacing } from '../lib/theme';
import { useMealPlanStore } from '../store/mealPlanStore';

type Props = NativeStackScreenProps<RootStackParamList, 'GroceryList'>;

export default function GroceryListScreen({ route, navigation }: Props) {
  const { planId } = route.params;
  const { mealPlans, toggleGroceryItem } = useMealPlanStore();
  const plan = mealPlans.find((p) => p.id === planId);

  if (!plan) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={{ color: Colors.muted, padding: Spacing.lg }}>Plan not found.</Text>
      </SafeAreaView>
    );
  }

  // Group by category
  const grouped: Record<string, { name: string; amount: string; checked: boolean; index: number }[]> = {};
  plan.groceryList.forEach((item, idx) => {
    const cat = item.category || 'OTHER';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push({ ...item, index: idx });
  });

  const sections = Object.entries(grouped).map(([category, items]) => ({
    title: category,
    data: items,
  }));

  const totalItems = plan.groceryList.length;
  const checkedItems = plan.groceryList.filter((i) => i.checked).length;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Grocery List</Text>
          <Text style={styles.headerSub}>{checkedItems} of {totalItems} items</Text>
        </View>
        <View style={{ width: 22 }} />
      </View>

      {/* Progress bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: totalItems > 0 ? `${(checkedItems / totalItems) * 100}%` : '0%' }]} />
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => `${item.index}-${item.name}`}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionTitle}>{section.title}</Text>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.groceryRow, item.checked && styles.groceryRowChecked]}
            onPress={() => toggleGroceryItem(planId, item.index)}
            activeOpacity={0.75}
          >
            <View style={[styles.checkbox, item.checked && styles.checkboxChecked]}>
              {item.checked && <Ionicons name="checkmark" size={14} color={Colors.bg} />}
            </View>
            <Text style={[styles.groceryName, item.checked && styles.groceryStrike]} numberOfLines={1}>
              {item.name}
            </Text>
            {item.amount ? (
              <Text style={[styles.groceryAmount, item.checked && styles.groceryStrike]}>
                {item.amount}
              </Text>
            ) : null}
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
        SectionSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
      />
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
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontFamily: Fonts.heading, fontSize: 22, color: Colors.text },
  headerSub: { fontFamily: Fonts.body, fontSize: 12, color: Colors.muted },
  progressBar: {
    height: 3,
    backgroundColor: Colors.border,
  },
  progressFill: {
    height: 3,
    backgroundColor: Colors.accent,
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  sectionTitle: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.muted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  groceryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  groceryRowChecked: {
    backgroundColor: Colors.bg,
    borderColor: Colors.border,
    opacity: 0.6,
  },
  checkbox: {
    width: 24, height: 24, borderRadius: 6,
    borderWidth: 1.5, borderColor: Colors.muted,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4A6B3A',
    borderColor: '#4A6B3A',
  },
  groceryName: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.text,
  },
  groceryAmount: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: Colors.accent,
  },
  groceryStrike: {
    textDecorationLine: 'line-through',
    color: Colors.muted,
  },
});
