import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  SectionList,
  TextInput,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing } from '../lib/theme';
import { usePantryStore } from '../store/pantryStore';

type TabName = 'Grocery' | 'Pantry';

export default function GroceryListScreen() {
  const navigation = useNavigation();
  const {
    groceryItems, pantryItems, customGroups,
    addGroceryItem, removeGroceryItem, toggleGroceryItem,
    addPantryItem, removePantryItem,
    groceryToPantry, pantryToGrocery,
    addCustomGroup, removeCustomGroup, moveGroceryToGroup,
  } = usePantryStore();

  const [activeTab, setActiveTab] = useState<TabName>('Grocery');
  const [showAddItem, setShowAddItem] = useState(false);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemAmount, setNewItemAmount] = useState('');
  const [newItemGroup, setNewItemGroup] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [moveItemIndex, setMoveItemIndex] = useState<number | null>(null);

  // --- Grocery sections ---
  // Stores are only user-created (customGroups) — never auto-categories like DAIRY, PRODUCE
  const userStores = useMemo(() => [...customGroups].sort(), [customGroups]);

  const grocerySections = useMemo(() => {
    const grouped: Record<string, { name: string; amount: string; checked: boolean; index: number; source: string }[]> = {};
    groceryItems.forEach((item, idx) => {
      const g = item.group || 'OTHER';
      if (!grouped[g]) grouped[g] = [];
      grouped[g].push({ ...item, index: idx });
    });
    customGroups.forEach((g) => { if (!grouped[g]) grouped[g] = []; });
    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([title, data]) => ({ title, data }));
  }, [groceryItems, customGroups]);

  // --- Pantry sections ---
  const pantrySections = useMemo(() => {
    const grouped: Record<string, { name: string; amount: string; group: string; index: number }[]> = {};
    pantryItems.forEach((item, idx) => {
      const g = item.group || 'PANTRY';
      if (!grouped[g]) grouped[g] = [];
      grouped[g].push({ ...item, index: idx });
    });
    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([title, data]) => ({ title, data }));
  }, [pantryItems]);

  const groceryCount = groceryItems.length;
  const checkedCount = groceryItems.filter((i) => i.checked).length;
  const pantryCount = pantryItems.length;

  const handleAddItem = () => {
    const name = newItemName.trim();
    if (!name) return;
    const group = newItemGroup || 'OTHER';
    if (activeTab === 'Grocery') {
      addGroceryItem(name, newItemAmount.trim(), group);
    } else {
      addPantryItem(name, newItemAmount.trim(), group);
    }
    setNewItemName('');
    setNewItemAmount('');
    setNewItemGroup('');
    setShowAddItem(false);
  };

  const handleAddGroup = () => {
    const name = newGroupName.trim();
    if (!name) return;
    addCustomGroup(name);
    setNewGroupName('');
    setShowAddGroup(false);
  };

  const handleMoveItem = (group: string) => {
    if (moveItemIndex !== null) {
      moveGroceryToGroup(moveItemIndex, group);
      setMoveItemIndex(null);
    }
  };

  const isCustom = (g: string) => customGroups.includes(g);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Grocery & Pantry</Text>
        {activeTab === 'Grocery' && (
          <TouchableOpacity onPress={() => setShowAddGroup(true)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="storefront-outline" size={22} color={Colors.accent} />
          </TouchableOpacity>
        )}
        {activeTab === 'Pantry' && <View style={{ width: 22 }} />}
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {(['Grocery', 'Pantry'] as TabName[]).map((tab) => {
          const isActive = activeTab === tab;
          const count = tab === 'Grocery' ? groceryCount : pantryCount;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Progress bar (grocery only) */}
      {activeTab === 'Grocery' && groceryCount > 0 && (
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(checkedCount / groceryCount) * 100}%` }]} />
        </View>
      )}

      {/* Grocery Tab */}
      {activeTab === 'Grocery' && (
        grocerySections.length === 0 || groceryItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cart-outline" size={48} color={Colors.border} />
            <Text style={styles.emptyTitle}>No grocery items</Text>
            <Text style={styles.emptyHint}>Tap + to add items or generate a meal plan</Text>
          </View>
        ) : (
          <SectionList
            sections={grocerySections}
            keyExtractor={(item, idx) => `g-${item.index}-${idx}`}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            renderSectionHeader={({ section }) => (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                {isCustom(section.title) && (
                  <TouchableOpacity
                    onPress={() => Alert.alert('Delete group?', 'Items move to OTHER.', [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Delete', style: 'destructive', onPress: () => removeCustomGroup(section.title) },
                    ])}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="trash-outline" size={14} color={Colors.muted} />
                  </TouchableOpacity>
                )}
              </View>
            )}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.itemRow, item.checked && styles.itemRowChecked]}
                onPress={() => {
                  Alert.alert(item.name, 'What would you like to do?', [
                    { text: 'Bought it — move to Pantry', onPress: () => groceryToPantry(item.index) },
                    { text: 'Assign Store', onPress: () => setMoveItemIndex(item.index) },
                    { text: 'Delete', style: 'destructive', onPress: () => removeGroceryItem(item.index) },
                    { text: 'Cancel', style: 'cancel' },
                  ]);
                }}
                activeOpacity={0.75}
              >
                <View style={[styles.checkbox, item.checked && styles.checkboxChecked]}>
                  {item.checked && <Ionicons name="checkmark" size={14} color={Colors.bg} />}
                </View>
                <Text style={[styles.itemName, item.checked && styles.itemStrike]} numberOfLines={1}>
                  {item.name}
                </Text>
                {item.amount ? (
                  <Text style={[styles.itemAmount, item.checked && styles.itemStrike]}>{item.amount}</Text>
                ) : null}
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
            SectionSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
            ListFooterComponent={<View style={{ height: 80 }} />}
          />
        )
      )}

      {/* Pantry Tab */}
      {activeTab === 'Pantry' && (
        pantryItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="basket-outline" size={48} color={Colors.border} />
            <Text style={styles.emptyTitle}>Pantry is empty</Text>
            <Text style={styles.emptyHint}>Add ingredients you already have at home</Text>
          </View>
        ) : (
          <SectionList
            sections={pantrySections}
            keyExtractor={(item, idx) => `p-${item.index}-${idx}`}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            renderSectionHeader={({ section }) => (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
              </View>
            )}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.itemRow}
                onPress={() => {
                  Alert.alert(item.name, 'What would you like to do?', [
                    { text: 'Ran out — move to Grocery', onPress: () => pantryToGrocery(item.index) },
                    { text: 'Remove', style: 'destructive', onPress: () => removePantryItem(item.index) },
                    { text: 'Cancel', style: 'cancel' },
                  ]);
                }}
                activeOpacity={0.75}
              >
                <Ionicons name="checkmark-circle" size={22} color="#4A6B3A" />
                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                {item.amount ? <Text style={styles.itemAmount}>{item.amount}</Text> : null}
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
            SectionSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
            ListFooterComponent={<View style={{ height: 80 }} />}
          />
        )
      )}

      {/* Add item FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowAddItem(true)}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={26} color={Colors.bg} />
      </TouchableOpacity>

      {/* Add Item Modal */}
      <Modal visible={showAddItem} transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.modalBg}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView contentContainerStyle={styles.modalScrollContent} keyboardShouldPersistTaps="handled">
            <View style={styles.modalSheet}>
              <Text style={styles.modalTitle}>
                Add to {activeTab}
              </Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Item name"
                placeholderTextColor={Colors.muted}
                value={newItemName}
                onChangeText={setNewItemName}
                autoFocus
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Amount (optional)"
                placeholderTextColor={Colors.muted}
                value={newItemAmount}
                onChangeText={setNewItemAmount}
              />
              {activeTab === 'Grocery' && userStores.length > 0 && (
                <>
                  <Text style={styles.modalLabel}>ADD TO STORE</Text>
                  <View style={styles.groupChips}>
                    {userStores.map((g) => (
                      <TouchableOpacity
                        key={g}
                        style={[styles.groupChip, newItemGroup === g && styles.groupChipSelected]}
                        onPress={() => setNewItemGroup(g)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.groupChipText, newItemGroup === g && styles.groupChipTextSelected]}>
                          {g}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalCancel} onPress={() => setShowAddItem(false)}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalConfirm} onPress={handleAddItem}>
                  <Text style={styles.modalConfirmText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add Group Modal */}
      <Modal visible={showAddGroup} transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.modalBg}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView contentContainerStyle={styles.modalScrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Add Store</Text>
            <Text style={styles.modalHint}>e.g. Walmart, Costco, Amazon Fresh, Trader Joe's</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Store name"
              placeholderTextColor={Colors.muted}
              value={newGroupName}
              onChangeText={setNewGroupName}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowAddGroup(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={handleAddGroup}>
                <Text style={styles.modalConfirmText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Assign Store Modal */}
      <Modal visible={moveItemIndex !== null} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Assign Store</Text>
            <Text style={styles.modalHint}>Pick where to buy this item</Text>
            <View style={styles.groupChips}>
              {userStores.map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.groupChip, styles.groupChipSelectable]}
                  onPress={() => handleMoveItem(g)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.groupChipText}>{g}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.groupChip, styles.groupChipNew]}
                onPress={() => { setMoveItemIndex(null); setShowAddGroup(true); }}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={14} color={Colors.accent} />
                <Text style={styles.groupChipNewText}>New store</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.modalCancel} onPress={() => setMoveItemIndex(null)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { flex: 1, textAlign: 'center', fontFamily: Fonts.heading, fontSize: 22, color: Colors.text },
  tabRow: {
    flexDirection: 'row', paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm, gap: Spacing.sm,
  },
  tab: {
    flex: 1, alignItems: 'center', paddingVertical: Spacing.sm,
    borderRadius: 10, backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
  },
  tabActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  tabText: { fontFamily: Fonts.body, fontSize: 14, color: Colors.muted },
  tabTextActive: { fontFamily: Fonts.bodySemiBold, color: Colors.bg },
  progressBar: { height: 3, backgroundColor: Colors.border },
  progressFill: { height: 3, backgroundColor: Colors.accent },
  list: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.xxl },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: Spacing.md, marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontFamily: Fonts.body, fontSize: 11, color: Colors.muted,
    letterSpacing: 1.2, textTransform: 'uppercase',
  },
  itemRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, gap: Spacing.sm,
  },
  itemRowChecked: { backgroundColor: Colors.bg, opacity: 0.6 },
  checkbox: {
    width: 24, height: 24, borderRadius: 6,
    borderWidth: 1.5, borderColor: Colors.muted,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: '#4A6B3A', borderColor: '#4A6B3A' },
  itemName: { flex: 1, fontFamily: Fonts.body, fontSize: 15, color: Colors.text },
  itemAmount: { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.accent },
  itemStrike: { textDecorationLine: 'line-through', color: Colors.muted },
  emptyState: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md,
  },
  emptyTitle: { fontFamily: Fonts.heading, fontSize: 20, color: Colors.muted },
  emptyHint: { fontFamily: Fonts.body, fontSize: 13, color: Colors.muted },
  fab: {
    position: 'absolute', bottom: Spacing.xl, right: Spacing.lg,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center',
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 4,
  },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalScrollContent: { flexGrow: 1, justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: Spacing.lg, paddingBottom: Spacing.xxl, gap: Spacing.md,
  },
  modalTitle: { fontFamily: Fonts.heading, fontSize: 24, color: Colors.text },
  modalHint: { fontFamily: Fonts.body, fontSize: 13, color: Colors.muted },
  modalInput: {
    backgroundColor: Colors.bg, borderRadius: 12, borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, fontFamily: Fonts.body, fontSize: 15, color: Colors.text,
  },
  modalLabel: {
    fontFamily: Fonts.body, fontSize: 11, color: Colors.muted,
    letterSpacing: 1.2, marginTop: Spacing.sm,
  },
  groupChips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  groupChip: {
    backgroundColor: Colors.bg, borderRadius: 20, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2,
  },
  groupChipSelected: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  groupChipSelectable: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  groupChipNew: {
    borderStyle: 'dashed', borderColor: Colors.accent,
    flexDirection: 'row', gap: 4, alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
  },
  groupChipNewText: { fontFamily: Fonts.body, fontSize: 13, color: Colors.accent },
  groupChipText: { fontFamily: Fonts.body, fontSize: 13, color: Colors.muted },
  groupChipTextSelected: { fontFamily: Fonts.bodySemiBold, fontSize: 13, color: Colors.bg },
  modalActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  modalCancel: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center',
  },
  modalCancelText: { fontFamily: Fonts.body, fontSize: 15, color: Colors.muted },
  modalConfirm: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    backgroundColor: Colors.accent, alignItems: 'center',
  },
  modalConfirmText: { fontFamily: Fonts.bodySemiBold, fontSize: 15, color: Colors.bg },
});
