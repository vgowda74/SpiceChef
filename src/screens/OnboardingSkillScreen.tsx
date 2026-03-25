import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import OnboardingLayout from '../components/OnboardingLayout';
import { useOnboardingStore, SkillLevel } from '../store/onboardingStore';
import { Colors, Fonts, Spacing } from '../lib/theme';
import { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'OnboardingSkill'>;

const OPTIONS: {
  value: SkillLevel;
  label: string;
  description: string;
  icon: string;
}[] = [
  {
    value: 'beginner',
    label: 'Home Cook',
    description: 'I follow recipes closely and appreciate extra guidance.',
    icon: '🍳',
  },
  {
    value: 'intermediate',
    label: 'Confident Cook',
    description: 'I improvise occasionally and understand most techniques.',
    icon: '🔪',
  },
  {
    value: 'advanced',
    label: 'Seasoned Chef',
    description: 'I experiment freely and rarely need step-by-step help.',
    icon: '👨‍🍳',
  },
];

export default function OnboardingSkillScreen({ navigation }: Props) {
  const { skillLevel, setSkillLevel } = useOnboardingStore();

  return (
    <OnboardingLayout
      step={2}
      totalSteps={3}
      title="How would you describe your cooking?"
      subtitle="This helps us tailor how much detail we show in Cook Mode."
      ctaLabel="Continue"
      onNext={() => navigation.navigate('OnboardingServes')}
      ctaDisabled={!skillLevel}
    >
      <View style={styles.list}>
        {OPTIONS.map((opt) => {
          const selected = skillLevel === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[styles.card, selected && styles.cardSelected]}
              onPress={() => setSkillLevel(opt.value)}
              activeOpacity={0.8}
            >
              <View style={styles.cardLeft}>
                <Text style={styles.cardIcon}>{opt.icon}</Text>
              </View>
              <View style={styles.cardBody}>
                <Text style={[styles.cardTitle, selected && styles.cardTitleSelected]}>
                  {opt.label}
                </Text>
                <Text style={styles.cardDesc}>{opt.description}</Text>
              </View>
              <View style={[styles.radio, selected && styles.radioSelected]}>
                {selected && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: Spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  cardSelected: {
    borderColor: Colors.accent,
    backgroundColor: '#1A2B1A',
  },
  cardLeft: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIcon: {
    fontSize: 22,
  },
  cardBody: {
    flex: 1,
    gap: 3,
  },
  cardTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    color: Colors.text,
  },
  cardTitleSelected: {
    color: Colors.accent,
  },
  cardDesc: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.muted,
    lineHeight: 18,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: Colors.accent,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.accent,
  },
});
