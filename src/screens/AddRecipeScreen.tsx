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
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
// expo-file-system used for base64 encoding
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../App';
import { Colors, Fonts, Spacing } from '../lib/theme';
import { useRecipeStore, Recipe } from '../store/recipeStore';
import { generateRecipe, MY_RECIPES_COOKBOOK_ID } from '../lib/recipeGeneratorService';
import { getLimits } from '../lib/cookbookService';
import { usePurchaseStore } from '../store/purchaseStore';
import { generateRecipeImage } from '../lib/imageService';
import { supabase } from '../lib/supabase';

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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  const useSample = () => {
    setDescription(SAMPLE_PROMPT);
    inputRef.current?.focus();
  };

  const [imageBase64, setImageBase64] = useState<string | null>(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.5,
      base64: true,
      allowsEditing: false,
      exif: false,
    });
    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      setImageBase64(result.assets[0].base64 || null);
    }
  };

  const removeImage = () => { setSelectedImage(null); setImageBase64(null); };

  const handleGenerateFromImage = async () => {
    if (!selectedImage || !supabase) return;

    const generatedCount = recipes.filter((r) => r.cookbook_id === MY_RECIPES_COOKBOOK_ID).length;
    if (generatedCount >= limits.MAX_GENERATED_RECIPES) {
      navigation.navigate('Upgrade');
      return;
    }

    setGenerating(true);
    try {
      if (!imageBase64) {
        Alert.alert('Image error', 'Could not read the image. Please try picking it again.');
        setGenerating(false);
        return;
      }
      const base64 = imageBase64;

      const { data, error } = await supabase.functions.invoke('generate-recipe-from-image', {
        body: {
          image_base64: base64,
          media_type: 'image/jpeg',
          description: description.trim() || undefined,
        },
      });

      if (error) throw new Error(error.message);

      if (data?.identified === false) {
        setGenerating(false);
        Alert.alert(
          'Could not identify dish',
          data.error || 'We couldn\'t recognize a dish in this image. Try a clearer photo of the food.',
        );
        return;
      }

      if (!data?.recipe) throw new Error(data?.error || 'Could not generate recipe');

      const parsed = data.recipe;
      const recipe: Recipe = {
        id: `my_${Date.now()}`,
        cookbook_id: MY_RECIPES_COOKBOOK_ID,
        title: parsed.title || 'My Recipe',
        base_serves: parsed.base_serves || 4,
        duration_mins: parsed.duration_mins || 30,
        tags: parsed.tags || [],
        ingredients: (parsed.ingredients || []).map((ing: any) => ({
          name: ing.name,
          amount: Number(ing.amount) || 1,
          unit: ing.unit || '',
          category: ing.category || 'PANTRY',
        })),
        steps: (parsed.steps || []).map((step: any) => ({
          order: step.order,
          title: step.title,
          text: step.text,
          timer_seconds: step.timer_seconds,
          timer_label: step.timer_label,
          needed_ingredients: (step.needed_ingredients || []).map((ni: any) => {
            if (typeof ni === 'object' && ni !== null && ni.name) {
              return { name: ni.name, amount: Number(ni.amount) || 0, unit: ni.unit || '' };
            }
            return ni;
          }),
        })),
      };

      addGeneratedRecipe(recipe);
      generateRecipeImage(recipe.id, recipe.title).then((url) => {
        if (url) useRecipeStore.getState().setRecipeImage(recipe.id, url);
      });
      setGenerating(false);
      navigation.navigate('RecipeBrowser', { cookbookId: MY_RECIPES_COOKBOOK_ID });
    } catch (err: any) {
      setGenerating(false);
      Alert.alert('Generation failed', err.message || 'Could not generate recipe from image.');
    }
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
          <Text style={styles.subtitle}>Describe or snap it</Text>
          <Text style={styles.hint}>
            Describe a dish in your own words, or screenshot a food post from social media — we'll generate the full recipe.
          </Text>

          {/* Image picker */}
          {selectedImage ? (
            <View style={styles.imagePreview}>
              <Image source={{ uri: selectedImage }} style={styles.previewImage} />
              <TouchableOpacity style={styles.removeImageBtn} onPress={removeImage}>
                <Ionicons name="close-circle" size={28} color={Colors.text} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImage} activeOpacity={0.7}>
              <Ionicons name="camera-outline" size={24} color={Colors.accent} />
              <Text style={styles.imagePickerText}>Add a food photo or screenshot</Text>
              <Text style={styles.imagePickerHint}>From Instagram, TikTok, Facebook, or your camera</Text>
            </TouchableOpacity>
          )}

          {/* Text input */}
          <View style={styles.inputWrapper}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              multiline
              value={description}
              onChangeText={setDescription}
              placeholder={selectedImage ? "Add details (optional)..." : "Or describe your recipe here..."}
              placeholderTextColor={Colors.muted}
              selectionColor={Colors.accent}
              autoCorrect
              autoCapitalize="sentences"
            />
          </View>

          {/* Sample example */}
          {!selectedImage && (
            <TouchableOpacity style={styles.sampleRow} onPress={useSample} activeOpacity={0.7}>
              <Ionicons name="bulb-outline" size={16} color={Colors.accent} />
              <Text style={styles.sampleLabel}>Try an example</Text>
              <Ionicons name="arrow-forward" size={14} color={Colors.muted} />
            </TouchableOpacity>
          )}

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
            onPress={selectedImage ? handleGenerateFromImage : handleGenerate}
            activeOpacity={0.8}
            disabled={generating}
          >
            {generating ? (
              <>
                <ActivityIndicator size="small" color={Colors.bg} />
                <Text style={styles.generateLabel}>
                  {selectedImage ? 'Analyzing your photo…' : 'Cooking up your recipe…'}
                </Text>
              </>
            ) : (
              <>
                <Ionicons name={selectedImage ? 'camera' : 'sparkles'} size={18} color={Colors.bg} />
                <Text style={styles.generateLabel}>
                  {selectedImage ? 'Generate from Photo' : 'Generate Recipe'}
                </Text>
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
  imagePickerBtn: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  imagePickerText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    color: Colors.text,
  },
  imagePickerHint: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.muted,
  },
  imagePreview: {
    marginBottom: Spacing.md,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
  },
  removeImageBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 14,
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
