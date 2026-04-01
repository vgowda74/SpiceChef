import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing } from '../lib/theme';
import { usePurchaseStore } from '../store/purchaseStore';
import { getProProduct, buyPro, restoreProPurchase } from '../lib/iapService';

const FEATURES = [
  {
    icon: 'sparkles' as const,
    title: 'AI-Generated Recipes',
    free: '5 recipes',
    pro: '100 recipes',
  },
  {
    icon: 'book' as const,
    title: 'Cookbook Uploads',
    free: '3 cookbooks',
    pro: '25 cookbooks',
  },
  {
    icon: 'list' as const,
    title: 'Recipes per Cookbook',
    free: '20 recipes',
    pro: '50 recipes',
  },
  {
    icon: 'calendar' as const,
    title: 'Meal Plans',
    free: '1 plan',
    pro: '20 plans',
  },
];

export default function UpgradeScreen() {
  const navigation = useNavigation();
  const { isPro } = usePurchaseStore();
  const [price, setPrice] = useState('$9.99');
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    getProProduct().then((product) => {
      if (product?.displayPrice) setPrice(product.displayPrice);
    });
  }, []);

  // Auto-dismiss if purchase completes
  useEffect(() => {
    if (isPro) {
      Alert.alert('Welcome to Pro!', 'Your upgrade is active. Enjoy SpiceChef Pro!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }
  }, [isPro]);

  const handleBuy = async () => {
    setPurchasing(true);
    try {
      await buyPro();
    } catch (err: any) {
      if (err.code !== 'E_USER_CANCELLED') {
        Alert.alert('Purchase failed', err.message || 'Please try again.');
      }
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const found = await restoreProPurchase();
      if (!found) {
        Alert.alert('No purchase found', 'We could not find a previous SpiceChef Pro purchase.');
      }
    } catch {
      Alert.alert('Restore failed', 'Please try again.');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      {/* Close button */}
      <TouchableOpacity
        style={styles.closeBtn}
        onPress={() => navigation.goBack()}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Ionicons name="close" size={24} color={Colors.muted} />
      </TouchableOpacity>

      <View style={styles.content}>
        {/* Header */}
        <Text style={styles.heading}>Unlock{'\n'}SpiceChef Pro</Text>
        <Text style={styles.subheading}>One-time purchase. Yours forever.</Text>

        {/* Comparison table */}
        <View style={styles.table}>
          {/* Table header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { flex: 1 }]}></Text>
            <Text style={[styles.tableHeaderText, styles.colFree]}>Free</Text>
            <Text style={[styles.tableHeaderText, styles.colPro]}>Pro</Text>
          </View>

          {FEATURES.map((f) => (
            <View key={f.title} style={styles.tableRow}>
              <View style={styles.featureCol}>
                <Ionicons name={f.icon} size={16} color={Colors.accent} />
                <Text style={styles.featureLabel}>{f.title}</Text>
              </View>
              <Text style={styles.freeValue}>{f.free}</Text>
              <Text style={styles.proValue}>{f.pro}</Text>
            </View>
          ))}
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={[styles.buyBtn, purchasing && styles.buyBtnDisabled]}
          onPress={handleBuy}
          activeOpacity={0.85}
          disabled={purchasing || restoring}
        >
          {purchasing ? (
            <ActivityIndicator size="small" color={Colors.bg} />
          ) : (
            <>
              <Ionicons name="diamond" size={18} color={Colors.bg} />
              <Text style={styles.buyLabel}>Upgrade for {price}</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Restore */}
        <TouchableOpacity
          style={styles.restoreBtn}
          onPress={handleRestore}
          activeOpacity={0.7}
          disabled={purchasing || restoring}
        >
          {restoring ? (
            <ActivityIndicator size="small" color={Colors.muted} />
          ) : (
            <Text style={styles.restoreLabel}>Restore Purchase</Text>
          )}
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
  closeBtn: {
    position: 'absolute',
    top: 56,
    right: Spacing.lg,
    zIndex: 10,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
  },
  heading: {
    fontFamily: Fonts.heading,
    fontSize: 40,
    color: Colors.text,
    lineHeight: 46,
    marginBottom: Spacing.sm,
  },
  subheading: {
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.muted,
    marginBottom: Spacing.xl + Spacing.md,
  },
  table: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.xl + Spacing.md,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tableHeaderText: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.muted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  colFree: {
    width: 72,
    textAlign: 'center',
  },
  colPro: {
    width: 72,
    textAlign: 'center',
    color: Colors.accent,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  featureCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureLabel: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.text,
  },
  freeValue: {
    width: 72,
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.muted,
    textAlign: 'center',
  },
  proValue: {
    width: 72,
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.accent,
    textAlign: 'center',
  },
  buyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    borderRadius: 14,
    paddingVertical: 16,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  buyBtnDisabled: {
    opacity: 0.6,
  },
  buyLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 16,
    color: Colors.bg,
  },
  restoreBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  restoreLabel: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.muted,
  },
});
