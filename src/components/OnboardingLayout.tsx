import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Colors, Fonts, Spacing } from '../lib/theme';

interface Props {
  step: number;        // 1 | 2 | 3
  totalSteps: number;
  title: string;
  subtitle: string;
  ctaLabel: string;
  onNext: () => void;
  ctaDisabled?: boolean;
  children: React.ReactNode;
}

export default function OnboardingLayout({
  step,
  totalSteps,
  title,
  subtitle,
  ctaLabel,
  onNext,
  ctaDisabled = false,
  children,
}: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      {/* Progress dots */}
      <View style={styles.progressRow}>
        {Array.from({ length: totalSteps }).map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i + 1 === step ? styles.dotActive : styles.dotInactive]}
          />
        ))}
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.stepLabel}>Step {step} of {totalSteps}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>{children}</View>

      {/* CTA */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.cta, ctaDisabled && styles.ctaDisabled]}
          onPress={onNext}
          disabled={ctaDisabled}
          activeOpacity={0.8}
        >
          <Text style={styles.ctaText}>{ctaLabel}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
    paddingHorizontal: Spacing.lg,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  dot: {
    height: 4,
    borderRadius: 2,
  },
  dotActive: {
    width: 24,
    backgroundColor: Colors.accent,
  },
  dotInactive: {
    width: 8,
    backgroundColor: Colors.border,
  },
  header: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  stepLabel: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.muted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  title: {
    fontFamily: Fonts.heading,
    fontSize: 36,
    color: Colors.text,
    lineHeight: 42,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.muted,
    lineHeight: 22,
  },
  content: {
    flex: 1,
  },
  footer: {
    paddingVertical: Spacing.xl,
  },
  cta: {
    backgroundColor: Colors.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaDisabled: {
    opacity: 0.35,
  },
  ctaText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 16,
    color: Colors.bg,
    letterSpacing: 0.3,
  },
});
