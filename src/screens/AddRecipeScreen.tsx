import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../App';
import { Colors, Fonts, Spacing } from '../lib/theme';
import { useRecipeStore } from '../store/recipeStore';
import { generateRecipe, MY_RECIPES_COOKBOOK_ID } from '../lib/recipeGeneratorService';
import { getLimits } from '../lib/cookbookService';
import { usePurchaseStore } from '../store/purchaseStore';
import { generateRecipeImage } from '../lib/imageService';

const SAMPLE_PROMPT =
  'A creamy vegetarian curry with paneer and spinach — no nuts, gluten-free. Serves 2, under 30 minutes. I have coconut milk, onions, and garam masala.';

const PROMPT_CHIPS = [
  'Vegetarian',
  'Vegan',
  'Gluten-free',
  'Serves 2',
  'Serves 4',
  'Under 30 min',
];

export default function AddRecipeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { addGeneratedRecipe, recipes } = useRecipeStore();
  const { isPro } = usePurchaseStore();
  const limits = getLimits(isPro);

  const [description, setDescription] = useState('');
  const [generating, setGenerating] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const useSample = () => {
    setDescription(SAMPLE_PROMPT);
    inputRef.current?.focus();
  };

  const appendChip = (chip: string) => {
    const separator = description.length > 0 && !description.endsWith(' ') ? ', ' : '';
    setDescription(description + separator + chip.toLowerCase());
    inputRef.current?.focus();
  };

  const handleGenerate = async () => {
    // Check generated recipe limit
    const generatedCount = recipes.filter((r) => r.cookbook_id === MY_RECIPES_COOKBOOK_ID).length;
    if (generatedCount >= limits.MAX_GENERATED_RECIPES) {
      navigation.navigate('Upgrade');
      return;
    }

    const prompt = description.trim();
    if (!prompt) {
      Alert.alert('Add a description', 'Tell us what kind of recipe you want.');
      return;
    }

    setGenerating(true);
    try {
      const recipe = await generateRecipe(prompt);
      addGeneratedRecipe(recipe);
      // Generate image in background — don't block navigation
      generateRecipeImage(recipe.id, recipe.title).then((url) => {
        if (url) useRecipeStore.getState().setRecipeImage(recipe.id, url);
      });
      setGenerating(false);
      navigation.navigate('RecipeBrowser', { cookbookId: MY_RECIPES_COOKBOOK_ID });
    } catch (err: any) {
      setGenerating(false);
      Alert.alert('Generation failed', err.message || 'Could not generate a recipe. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="close" size={24} color={Colors.muted} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create a Recipe</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Subtitle */}
          <Text style={styles.subtitle}>Describe what you're craving</Text>
          <Text style={styles.hint}>
            Mention dietary needs, serving size, and ingredients you have — the more detail, the better.
          </Text>

          {/* Text input */}
          <View style={styles.inputWrapper}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              multiline
              value={description}
              onChangeText={setDescription}
              placeholder="Describe your recipe here..."
              placeholderTextColor={Colors.muted}
              selectionColor={Colors.accent}
              autoCorrect
              autoCapitalize="sentences"
            />
          </View>

          {/* Sample example */}
          <TouchableOpacity style={styles.sampleRow} onPress={useSample} activeOpacity={0.7}>
            <Ionicons name="bulb-outline" size={16} color={Colors.accent} />
            <Text style={styles.sampleLabel}>Try an example</Text>
            <Ionicons name="arrow-forward" size={14} color={Colors.muted} />
          </TouchableOpacity>

          {/* Quick chips */}
          <Text style={styles.chipsLabel}>QUICK IDEAS</Text>
          <View style={styles.chips}>
            {PROMPT_CHIPS.map((chip) => (
              <TouchableOpacity key={chip} style={styles.chip} onPress={() => appendChip(chip)} activeOpacity={0.7}>
                <Text style={styles.chipText}>{chip}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Generate button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.generateBtn, generating && styles.generateBtnDisabled]}
            onPress={handleGenerate}
            activeOpacity={0.8}
            disabled={generating}
          >
            {generating ? (
              <>
                <ActivityIndicator size="small" color={Colors.bg} />
                <Text style={styles.generateLabel}>Cooking up your recipe…</Text>
              </>
            ) : (
              <>
                <Ionicons name="sparkles" size={18} color={Colors.bg} />
                <Text style={styles.generateLabel}>Generate Recipe</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontFamily: Fonts.heading,
    fontSize: 22,
    color: Colors.text,
  },
  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  subtitle: {
    fontFamily: Fonts.heading,
    fontSize: 32,
    color: Colors.text,
    lineHeight: 38,
    marginBottom: Spacing.sm,
  },
  hint: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.muted,
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  inputWrapper: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    minHeight: 140,
  },
  input: {
    fontFamily: Fonts.body,
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
    textAlignVertical: 'top',
    minHeight: 112,
  },
  sampleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.xl,
  },
  sampleLabel: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.accent,
  },
  chipsLabel: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.muted,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
  },
  chipText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.muted,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    borderRadius: 14,
    paddingVertical: 16,
    gap: Spacing.sm,
  },
  generateBtnDisabled: {
    opacity: 0.6,
  },
  generateLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 16,
    color: Colors.bg,
  },
});
