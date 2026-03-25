import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../App';
import { Colors, Fonts, Spacing } from '../lib/theme';
import { useRecipeStore } from '../store/recipeStore';
import { useCookStore } from '../store/cookStore';

type Props = NativeStackScreenProps<RootStackParamList, 'CookMode'>;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m} : ${s}`;
}

export default function CookModeScreen({ route, navigation }: Props) {
  const { recipeId, serves } = route.params;
  const { getRecipe } = useRecipeStore();
  const { currentStepIndex, setStepIndex } = useCookStore();

  const recipe = getRecipe(recipeId);

  const [timeLeft, setTimeLeft] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerDone, setTimerDone] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stepIndex = currentStepIndex;

  // Reset timer on step change
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const step = recipe?.steps[stepIndex];
    setTimeLeft(step?.timer_seconds ?? 0);
    setTimerRunning(false);
    setTimerDone(false);
  }, [stepIndex, recipeId]);

  // Manage countdown
  useEffect(() => {
    if (timerRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setTimerRunning(false);
            setTimerDone(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerRunning]);

  if (!recipe) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={{ color: Colors.muted, padding: Spacing.lg }}>Recipe not found.</Text>
      </SafeAreaView>
    );
  }

  const totalSteps = recipe.steps.length;
  const currentStep = recipe.steps[stepIndex];
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === totalSteps - 1;
  const hasTimer = !!currentStep.timer_seconds && currentStep.timer_seconds > 0;
  const timerTotal = currentStep.timer_seconds ?? 0;

  const handlePrev = () => {
    if (!isFirstStep) setStepIndex(stepIndex - 1);
  };

  const handleNext = () => {
    if (isLastStep) {
      navigation.replace('Completion', { recipeId });
    } else {
      setStepIndex(stepIndex + 1);
    }
  };

  const handleEnd = () => {
    Alert.alert(
      'Leave cook mode?',
      'Your progress on this recipe will be lost.',
      [
        { text: 'Keep cooking', style: 'cancel' },
        { text: 'Exit', style: 'destructive', onPress: () => navigation.popToTop() },
      ]
    );
  };

  const toggleTimer = () => {
    if (timerDone) {
      setTimeLeft(timerTotal);
      setTimerDone(false);
      setTimerRunning(false);
    } else {
      setTimerRunning((r) => !r);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      {/* Top header */}
      <View style={styles.topHeader}>
        <Text style={styles.stepLabel}>
          STEP {stepIndex + 1} OF {totalSteps} · {recipe.title.toUpperCase()}
        </Text>
        <TouchableOpacity onPress={handleEnd} activeOpacity={0.7}>
          <Text style={styles.endText}>End</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Step title */}
        {currentStep.title && (
          <Text style={styles.stepTitle}>{currentStep.title}</Text>
        )}

        {/* Instruction card */}
        <View style={styles.instructionCard}>
          <Text style={styles.stepNumberLabel}>STEP {stepIndex + 1}</Text>
          <Text style={styles.instructionText}>{currentStep.text}</Text>
        </View>

        {/* Timer */}
        {hasTimer && (
          <View style={styles.timerCard}>
            <View style={styles.timerRow}>
              <Text style={[styles.timerDisplay, timerDone && styles.timerDisplayDone]}>
                {timerDone ? '00 : 00' : formatTime(timeLeft)}
              </Text>
              <TouchableOpacity
                style={[styles.timerBtn, timerDone && styles.timerBtnDone]}
                onPress={toggleTimer}
                activeOpacity={0.8}
              >
                {timerDone ? (
                  <Ionicons name="refresh" size={22} color={Colors.bg} />
                ) : timerRunning ? (
                  <Ionicons name="pause" size={22} color={Colors.bg} />
                ) : (
                  <Ionicons name="play" size={22} color={Colors.bg} />
                )}
              </TouchableOpacity>
            </View>
            {currentStep.timer_label && (
              <Text style={styles.timerLabel}>{currentStep.timer_label}</Text>
            )}
          </View>
        )}

        {/* Needed this step */}
        {currentStep.needed_ingredients && currentStep.needed_ingredients.length > 0 && (
          <View style={styles.neededSection}>
            <Text style={styles.neededLabel}>NEEDED THIS STEP</Text>
            <View style={styles.neededChips}>
              {currentStep.needed_ingredients.map((item, idx) => (
                <View key={idx} style={styles.neededChip}>
                  <Text style={styles.neededChipText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navRow}>
        <TouchableOpacity
          style={[styles.navBtnSecondary, isFirstStep && styles.navBtnDisabled]}
          onPress={handlePrev}
          disabled={isFirstStep}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={18} color={isFirstStep ? Colors.border : Colors.text} />
          <Text style={[styles.navSecondaryText, isFirstStep && { color: Colors.border }]}>
            Prev
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navBtnPrimary}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text style={styles.navPrimaryText}>
            {isLastStep ? 'Finish' : 'Next step'}
          </Text>
          <Ionicons
            name={isLastStep ? 'checkmark' : 'arrow-forward'}
            size={18}
            color={Colors.bg}
          />
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
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  stepLabel: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.muted,
    letterSpacing: 1,
    flex: 1,
  },
  endText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.muted,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  stepTitle: {
    fontFamily: Fonts.headingItalic,
    fontSize: 24,
    color: Colors.accent,
    marginBottom: Spacing.md,
  },
  instructionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  stepNumberLabel: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.muted,
    letterSpacing: 1.2,
    marginBottom: Spacing.md,
  },
  instructionText: {
    fontFamily: Fonts.body,
    fontSize: 17,
    color: Colors.text,
    lineHeight: 28,
  },
  timerCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timerDisplay: {
    fontFamily: Fonts.heading,
    fontSize: 48,
    color: Colors.text,
    letterSpacing: 2,
  },
  timerDisplayDone: {
    color: Colors.accent,
  },
  timerBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerBtnDone: {
    backgroundColor: Colors.muted,
  },
  timerLabel: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.muted,
    marginTop: Spacing.sm,
  },
  neededSection: {
    marginBottom: Spacing.lg,
  },
  neededLabel: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.muted,
    letterSpacing: 1.2,
    marginBottom: Spacing.sm,
  },
  neededChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  neededChip: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  neededChipText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.text,
  },
  navRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  navBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  navBtnDisabled: {
    opacity: 0.3,
  },
  navSecondaryText: {
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.text,
  },
  navBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.accent,
  },
  navPrimaryText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 16,
    color: Colors.bg,
  },
});
