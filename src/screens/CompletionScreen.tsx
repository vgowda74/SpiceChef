import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Animated,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { CommonActions } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { Colors, Fonts, Spacing } from '../lib/theme';
import { useRecipeStore } from '../store/recipeStore';
import { useCookStore } from '../store/cookStore';

type Props = NativeStackScreenProps<RootStackParamList, 'Completion'>;

export default function CompletionScreen({ route, navigation }: Props) {
  const { recipeId } = route.params;
  const { getRecipe } = useRecipeStore();
  const { endSession } = useCookStore();

  const recipe = getRecipe(recipeId);

  const scale = useRef(new Animated.Value(0.6)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    endSession();

    Animated.sequence([
      Animated.delay(150),
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideUp, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const goHome = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'HomeLibrary' }],
      })
    );
  };

  const cookAgain = () => {
    navigation.replace('IngredientChecklist', { recipeId });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      <View style={styles.container}>
        {/* Check mark */}
        <Animated.View
          style={[
            styles.checkCircle,
            { transform: [{ scale }], opacity },
          ]}
        >
          <Ionicons name="checkmark" size={48} color={Colors.bg} />
        </Animated.View>

        {/* Text content */}
        <Animated.View
          style={[
            styles.textBlock,
            { opacity, transform: [{ translateY: slideUp }] },
          ]}
        >
          <Text style={styles.allDone}>All Done</Text>
          <Text style={styles.recipeTitle}>{recipe?.title}</Text>
          <Text style={styles.subtitle}>Beautifully made.</Text>

          {/* Stats row */}
          {recipe && (
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{recipe.steps.length}</Text>
                <Text style={styles.statLabel}>steps</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{recipe.duration_mins}</Text>
                <Text style={styles.statLabel}>minutes</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{recipe.ingredients.length}</Text>
                <Text style={styles.statLabel}>ingredients</Text>
              </View>
            </View>
          )}
        </Animated.View>

        {/* Actions */}
        <Animated.View style={[styles.actions, { opacity }]}>
          <TouchableOpacity
            style={styles.btnSecondary}
            onPress={cookAgain}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh-outline" size={18} color={Colors.text} />
            <Text style={styles.btnSecondaryText}>Cook again</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnPrimary} onPress={goHome} activeOpacity={0.85}>
            <Text style={styles.btnPrimaryText}>Back to Library</Text>
            <Ionicons name="library-outline" size={18} color={Colors.bg} />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xl,
  },
  checkCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  allDone: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 4,
  },
  recipeTitle: {
    fontFamily: Fonts.heading,
    fontSize: 36,
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 42,
  },
  subtitle: {
    fontFamily: Fonts.headingItalic,
    fontSize: 18,
    color: Colors.muted,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statItem: {
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontFamily: Fonts.heading,
    fontSize: 28,
    color: Colors.accent,
    lineHeight: 32,
  },
  statLabel: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: Colors.border,
  },
  actions: {
    width: '100%',
    gap: Spacing.md,
  },
  btnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  btnSecondaryText: {
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.text,
  },
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: Colors.accent,
  },
  btnPrimaryText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 16,
    color: Colors.bg,
  },
});
