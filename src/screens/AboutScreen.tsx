import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../App';
import { Colors, Fonts, Spacing } from '../lib/theme';
import { usePurchaseStore } from '../store/purchaseStore';

const FEATURES = [
  {
    icon: 'cloud-upload-outline' as const,
    title: 'Upload Your Cookbooks',
    description: 'Import any cookbook as a PDF. We extract every recipe — ingredients, steps, and timers — ready to cook.',
  },
  {
    icon: 'sparkles-outline' as const,
    title: 'Create Recipes',
    description: 'Describe any dish you have in mind and AI generates a complete recipe with ingredients and step-by-step instructions.',
  },
  {
    icon: 'flame-outline' as const,
    title: 'Cook Step-by-Step',
    description: 'Follow guided cook mode with built-in timers, ingredient checklists, and auto-scaled serving quantities.',
  },
];

export default function AboutScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isPro } = usePurchaseStore();

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* App identity */}
        <View style={styles.brand}>
          <Image
            source={require('../../assets/icon.png')}
            style={styles.icon}
            resizeMode="contain"
          />
          <Text style={styles.tagline}>Your cookbooks, guided.</Text>
        </View>

        {/* Intro */}
        <Text style={styles.intro}>
          SpiceChef transforms your cookbook collection into a hands-on cooking companion. Bring your own recipes — we handle the rest.
        </Text>

        {/* Feature cards */}
        <View style={styles.features}>
          {FEATURES.map((f) => (
            <View key={f.title} style={styles.featureCard}>
              <View style={styles.featureIconWrap}>
                <Ionicons name={f.icon} size={22} color={Colors.accent} />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Upgrade / Pro status */}
        {isPro ? (
          <View style={styles.proStatus}>
            <Ionicons name="diamond" size={16} color={Colors.accent} />
            <Text style={styles.proStatusText}>SpiceChef Pro</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.upgradeBtn}
            onPress={() => navigation.navigate('Upgrade')}
            activeOpacity={0.8}
          >
            <Ionicons name="diamond-outline" size={16} color={Colors.bg} />
            <Text style={styles.upgradeBtnText}>Upgrade to Pro</Text>
          </TouchableOpacity>
        )}

        {/* Footer note */}
        <Text style={styles.footer}>
          SpiceChef is a tool, not a content platform.{'\n'}You bring the books — we make them cookable.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl + 80,
  },
  brand: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  icon: {
    width: 140,
    height: 140,
    marginBottom: Spacing.sm,
  },
  tagline: {
    fontFamily: Fonts.headingItalic,
    fontSize: 16,
    color: Colors.muted,
    marginTop: 2,
  },
  intro: {
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.text,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.sm,
  },
  features: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  featureCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  featureIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
    gap: 4,
  },
  featureTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    color: Colors.text,
  },
  featureDesc: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.muted,
    lineHeight: 20,
  },
  upgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    borderRadius: 14,
    paddingVertical: 14,
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  upgradeBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    color: Colors.bg,
  },
  proStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: Spacing.xl,
  },
  proStatusText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    color: Colors.accent,
  },
  footer: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
