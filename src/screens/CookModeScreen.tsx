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

/** Scale numeric amounts in a text string by the serving ratio */
function scaleTextAmounts(text: string, ratio: number): string {
  if (ratio === 1) return text;
  // Match numbers (including decimals) that appear before units or ingredients
  return text.replace(/(\d+\.?\d*)/g, (match) => {
    const num = parseFloat(match);
    if (isNaN(num)) return match;
    const scaled = num * ratio;
    // Format nicely: drop decimals if whole, otherwise 1 decimal
    if (scaled === Math.floor(scaled)) return scaled.toString();
    return scaled.toFixed(1).replace(/\.0$/, '');
  });
}

/** Parse **bold** markers in step text into styled Text elements, with optional scaling */
function RichStepText({ text, style, boldStyle, scaleRatio = 1 }: { text: string; style: any; boldStyle: any; scaleRatio?: number }) {
  const scaledText = scaleTextAmounts(text, scaleRatio);
  const parts = scaledText.split(/(\*\*[^*]+\*\*)/g);
  return (
    <Text style={style}>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <Text key={i} style={boldStyle}>
              {part.slice(2, -2)}
            </Text>
          );
        }
        return part;
      })}
    </Text>
  );
}

/** Format scaled amount as a clean string with fractions */
function formatScaledAmount(amount: number): string {
  if (amount === 0) return '';
  if (!isFinite(amount)) return '—';
  const quarter = Math.round(amount * 4);
  const whole = Math.floor(quarter / 4);
  const rem = quarter % 4;
  const fracMap: Record<number, string> = { 1: '¼', 2: '½', 3: '¾' };
  const frac = fracMap[rem] ?? '';
  if (whole === 0 && frac) return frac;
  if (!frac) return whole.toString();
  return `${whole}${frac}`;
}

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
          <RichStepText
            text={currentStep.text}
            style={styles.instructionText}
            boldStyle={styles.instructionBold}
            scaleRatio={recipe.base_serves ? serves / recipe.base_serves : 1}
          />
        </View>

        {/* Timer */}
        {hasTimer && (
          <View style={styles.timerCard}>
            <View style={styles.timerRow}>
              <TouchableOpacity
                style={styles.timerAdjustBtn}
                onPress={() => setTimeLeft((t) => Math.max(0, t - 30))}
                activeOpacity={0.7}
                disabled={timerDone}
              >
                <Ionicons name="remove" size={20} color={timerDone ? Colors.border : Colors.text} />
              </TouchableOpacity>

              <Text style={[styles.timerDisplay, timerDone && styles.timerDisplayDone]}>
                {timerDone ? '00 : 00' : formatTime(timeLeft)}
              </Text>

              <TouchableOpacity
                style={styles.timerAdjustBtn}
                onPress={() => setTimeLeft((t) => t + 30)}
                activeOpacity={0.7}
                disabled={timerDone}
              >
                <Ionicons name="add" size={20} color={timerDone ? Colors.border : Colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.timerAdjustHint}>30 sec</Text>

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

            {currentStep.timer_label && (
              <Text style={styles.timerLabel}>{currentStep.timer_label}</Text>
            )}
          </View>
        )}

        {/* Needed this step */}
        {currentStep.needed_ingredients && currentStep.needed_ingredients.length > 0 && (
          <View style={styles.neededSection}>
            <Text style={styles.neededLabel}>NEEDED THIS STEP</Text>
            <View style={styles.neededList}>
              {currentStep.needed_ingredients.map((item, idx) => {
                // Support both string format ("2 tbsp oil") and object format ({ name, amount, unit })
                if (typeof item === 'object' && item !== null) {
                  const scaled = recipe.base_serves
                    ? (item.amount / recipe.base_serves) * serves
                    : item.amount;
                  return (
                    <View key={idx} style={styles.neededRow}>
                      <View style={styles.neededDot} />
                      <Text style={styles.neededName}>{item.name}</Text>
                      <Text style={styles.neededAmount}>
                        {formatScaledAmount(scaled)} {item.unit}
                      </Text>
                    </View>
                  );
                }
                // Fallback for legacy string format
                return (
                  <View key={idx} style={styles.neededRow}>
                    <View style={styles.neededDot} />
                    <Text style={styles.neededName}>{item}</Text>
                  </View>
                );
              })}
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
  instructionBold: {
    fontFamily: Fonts.bodySemiBold,
    color: Colors.accent,
  },
  timerCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  timerAdjustBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerAdjustHint: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.muted,
  },
  timerDisplay: {
    fontFamily: Fonts.heading,
    fontSize: 48,
    color: Colors.text,
    letterSpacing: 2,
    minWidth: 180,
    textAlign: 'center',
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
  neededList: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: 12,
  },
  neededRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  neededDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent,
  },
  neededName: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  neededAmount: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: Colors.accent,
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
