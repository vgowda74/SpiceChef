import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import OnboardingLayout from '../components/OnboardingLayout';
import { useOnboardingStore, DietaryRestriction } from '../store/onboardingStore';
import { Colors, Fonts, Spacing } from '../lib/theme';
import { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'OnboardingDiet'>;

const OPTIONS: { label: string; value: DietaryRestriction; emoji: string }[] = [
  { label: 'Vegetarian', value: 'vegetarian', emoji: '🥦' },
  { label: 'Vegan', value: 'vegan', emoji: '🌱' },
  { label: 'Gluten-Free', value: 'gluten-free', emoji: '🌾' },
  { label: 'Dairy-Free', value: 'dairy-free', emoji: '🥛' },
  { label: 'Nut-Free', value: 'nut-free', emoji: '🥜' },
  { label: 'Halal', value: 'halal', emoji: '☪️' },
  { label: 'Kosher', value: 'kosher', emoji: '✡️' },
];

export default function OnboardingDietScreen({ navigation }: Props) {
  const { dietary, toggleDietary } = useOnboardingStore();

  return (
    <OnboardingLayout
      step={1}
      totalSteps={3}
      title="Any dietary restrictions?"
      subtitle="We'll flag ingredients that don't fit your needs. Select all that apply."
      ctaLabel="Continue"
      onNext={() => navigation.navigate('OnboardingSkill')}
    >
      <View style={styles.grid}>
        {OPTIONS.map((opt) => {
          const selected = dietary.includes(opt.value);
          return (
            <TouchableOpacity
              key={opt.value}
              style={[styles.chip, selected && styles.chipSelected]}
              onPress={() => toggleDietary(opt.value)}
              activeOpacity={0.75}
            >
              <Text style={styles.chipEmoji}>{opt.emoji}</Text>
              <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* None option */}
        <TouchableOpacity
          style={[styles.chip, styles.chipWide, dietary.length === 0 && styles.chipSelected]}
          onPress={() => {
            // deselect all — store's dietary becomes []
            dietary.forEach((d) => toggleDietary(d));
          }}
          activeOpacity={0.75}
        >
          <Text style={[styles.chipLabel, dietary.length === 0 && styles.chipLabelSelected]}>
            No restrictions
          </Text>
        </TouchableOpacity>
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  chipSelected: {
    borderColor: Colors.accent,
    backgroundColor: '#1E2E1E',
  },
  chipWide: {
    paddingHorizontal: 20,
  },
  chipEmoji: {
    fontSize: 16,
  },
  chipLabel: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.muted,
  },
  chipLabelSelected: {
    color: Colors.accent,
    fontFamily: Fonts.bodySemiBold,
  },
});
