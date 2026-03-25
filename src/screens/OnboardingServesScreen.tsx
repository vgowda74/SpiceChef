import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import OnboardingLayout from '../components/OnboardingLayout';
import { useOnboardingStore } from '../store/onboardingStore';
import { Colors, Fonts, Spacing } from '../lib/theme';
import { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'OnboardingServes'>;

const QUICK_PICKS = [1, 2, 4, 6, 8];

export default function OnboardingServesScreen({ navigation }: Props) {
  const { serves, setServes } = useOnboardingStore();

  const decrement = () => serves > 1 && setServes(serves - 1);
  const increment = () => serves < 20 && setServes(serves + 1);

  return (
    <OnboardingLayout
      step={3}
      totalSteps={3}
      title="How many people do you usually cook for?"
      subtitle="All recipes will auto-scale to this default. You can change it per session."
      ctaLabel="Let's Cook"
      onNext={() => navigation.navigate('HomeLibrary')}
    >
      <View style={styles.container}>
        {/* Stepper */}
        <View style={styles.stepper}>
          <TouchableOpacity
            style={[styles.stepBtn, serves <= 1 && styles.stepBtnDisabled]}
            onPress={decrement}
            disabled={serves <= 1}
            activeOpacity={0.7}
          >
            <Text style={styles.stepBtnText}>−</Text>
          </TouchableOpacity>

          <View style={styles.countBox}>
            <Text style={styles.count}>{serves}</Text>
            <Text style={styles.countLabel}>{serves === 1 ? 'person' : 'people'}</Text>
          </View>

          <TouchableOpacity
            style={[styles.stepBtn, serves >= 20 && styles.stepBtnDisabled]}
            onPress={increment}
            disabled={serves >= 20}
            activeOpacity={0.7}
          >
            <Text style={styles.stepBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Quick picks */}
        <View style={styles.quickRow}>
          {QUICK_PICKS.map((n) => (
            <TouchableOpacity
              key={n}
              style={[styles.quickChip, serves === n && styles.quickChipSelected]}
              onPress={() => setServes(n)}
              activeOpacity={0.75}
            >
              <Text style={[styles.quickChipText, serves === n && styles.quickChipTextSelected]}>
                {n}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.hint}>
          Recipes with 4 servings become {serves} — ingredients scale automatically.
        </Text>
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.xl,
    paddingTop: Spacing.xl,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  stepBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnDisabled: {
    borderColor: Colors.border,
    opacity: 0.4,
  },
  stepBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 24,
    color: Colors.accent,
    lineHeight: 28,
  },
  countBox: {
    alignItems: 'center',
    minWidth: 80,
  },
  count: {
    fontFamily: Fonts.heading,
    fontSize: 72,
    color: Colors.text,
    lineHeight: 78,
  },
  countLabel: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.muted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  quickRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  quickChip: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  quickChipSelected: {
    borderColor: Colors.accent,
    backgroundColor: '#1E2E1E',
  },
  quickChipText: {
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.muted,
  },
  quickChipTextSelected: {
    fontFamily: Fonts.bodySemiBold,
    color: Colors.accent,
  },
  hint: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.muted,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: Spacing.lg,
  },
});
