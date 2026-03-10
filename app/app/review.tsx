import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors, fonts, fontSize, radius, spacing } from '../src/theme';
import { Recipe, Ingredient, Step } from '../src/types';
import { saveRecipe, generateId } from '../src/store';
import { extractFromUrl, extractFromImage, downloadImage } from '../src/services/extract';

export default function ReviewScreen() {
  const params = useLocalSearchParams<{
    sourceType: string;
    sourceUrl?: string;
    photoUri?: string;
    recipeId?: string;
  }>();
  const router = useRouter();

  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState('');
  const [name, setName] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [servings, setServings] = useState('');
  // Don't use source image as recipe photo — it's a scan/screenshot, not a food photo
  const [photoUri, setPhotoUri] = useState(
    params.sourceType === 'image' ? '' : (params.photoUri || '')
  );
  const [sourceUrl, setSourceUrl] = useState(params.sourceUrl || '');
  const [sourceImageUri, setSourceImageUri] = useState(
    params.sourceType === 'image' ? (params.photoUri || '') : ''
  );
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { id: generateId(), name: '', quantity: '' },
  ]);
  const [steps, setSteps] = useState<Step[]>([
    { id: generateId(), order: 1, text: '' },
  ]);

  // Load existing recipe when editing
  useEffect(() => {
    if (!params.recipeId) return;
    (async () => {
      const { loadRecipes } = await import('../src/store');
      const recipes = await loadRecipes();
      const existing = recipes.find((r) => r.id === params.recipeId);
      if (!existing) return;
      setName(existing.name);
      setPrepTime(existing.prepTime || '');
      setServings(existing.servings || '');
      setPhotoUri(existing.photoUri || '');
      setSourceUrl(existing.sourceUrl || '');
      setSourceImageUri(existing.sourceImageUri || '');
      setTags(existing.tags);
      if (existing.ingredients.length > 0) setIngredients(existing.ingredients);
      if (existing.steps.length > 0) setSteps(existing.steps);
    })();
  }, [params.recipeId]);

  // Run AI extraction on mount for link/image imports
  useEffect(() => {
    const source = params.sourceType;
    if (source !== 'link' && source !== 'image') return;
    if (params.recipeId) return; // Don't extract when editing

    setExtracting(true);
    setExtractError('');

    const run = source === 'link'
      ? extractFromUrl(params.sourceUrl || '')
      : extractFromImage(params.photoUri || '');

    run
      .then(async (result) => {
        setName(result.name);
        if (result.prepTime) setPrepTime(result.prepTime);
        if (result.servings) setServings(result.servings);
        setTags(result.tags);
        if (result.ingredients.length > 0) setIngredients(result.ingredients);
        if (result.steps.length > 0) setSteps(result.steps);

        // Auto-populate food photo for link imports
        if (source === 'link' && result.imageUrl) {
          try {
            const localUri = await downloadImage(result.imageUrl);
            setPhotoUri(localUri);
          } catch (e) {
            console.log('[review] Failed to download recipe image:', e);
          }
        }
      })
      .catch((err) => {
        setExtractError(err.message || 'Failed to extract recipe');
      })
      .finally(() => setExtracting(false));
  }, []);

  const addIngredient = () => {
    setIngredients([...ingredients, { id: generateId(), name: '', quantity: '' }]);
  };

  const updateIngredient = (id: string, field: 'name' | 'quantity', value: string) => {
    setIngredients(ingredients.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  };

  const removeIngredient = (id: string) => {
    if (ingredients.length <= 1) return;
    setIngredients(ingredients.filter((i) => i.id !== id));
  };

  const addStep = () => {
    setSteps([...steps, { id: generateId(), order: steps.length + 1, text: '' }]);
  };

  const updateStep = (id: string, text: string) => {
    setSteps(steps.map((s) => (s.id === id ? { ...s, text } : s)));
  };

  const removeStep = (id: string) => {
    if (steps.length <= 1) return;
    const filtered = steps.filter((s) => s.id !== id);
    setSteps(filtered.map((s, i) => ({ ...s, order: i + 1 })));
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Recipe name required', 'Give your recipe a name before saving.');
      return;
    }

    const validIngredients = ingredients.filter((i) => i.name.trim());
    const validSteps = steps.filter((s) => s.text.trim());

    const recipe: Recipe = {
      id: params.recipeId || generateId(),
      name: name.trim(),
      tags,
      prepTime: prepTime.trim() || undefined,
      servings: servings.trim() || undefined,
      ingredients: validIngredients,
      steps: validSteps.map((s, i) => ({ ...s, order: i + 1 })),
      notes: [],
      photoUri: photoUri || undefined,
      sourceUrl: sourceUrl || undefined,
      sourceImageUri: sourceImageUri || undefined,
      sourceType: (params.sourceType as Recipe['sourceType']) || 'manual',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveRecipe(recipe);
    router.dismissAll();
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Top bar */}
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </Pressable>
          <Text style={styles.topBarTitle}>
            {params.recipeId ? 'Edit recipe' : 'New recipe'}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {extracting && (
          <View style={styles.extractingBar}>
            <ActivityIndicator color={colors.accent} size="small" />
            <Text style={styles.extractingText}>
              Extracting recipe{params.sourceType === 'link' ? ' from link' : ' from image'}...
            </Text>
          </View>
        )}

        {extractError !== '' && (
          <Pressable
            style={styles.errorBar}
            onPress={() => setExtractError('')}
          >
            <Text style={styles.errorText}>{extractError}</Text>
            <Text style={styles.errorDismiss}>Tap to dismiss</Text>
          </Pressable>
        )}

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Photo */}
          <Pressable style={styles.photoArea} onPress={pickPhoto}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photo} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="camera-outline" size={28} color={colors.borderStrong} />
                <Text style={styles.photoPlaceholderText}>Add photo</Text>
              </View>
            )}
          </Pressable>

          {/* Name */}
          <TextInput
            style={styles.nameInput}
            value={name}
            onChangeText={setName}
            placeholder="Recipe name"
            placeholderTextColor={colors.textPlaceholder}
          />

          {/* Meta row */}
          <View style={styles.metaRow}>
            <View style={styles.metaField}>
              <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
              <TextInput
                style={styles.metaInput}
                value={prepTime}
                onChangeText={setPrepTime}
                placeholder="e.g. 30 min"
                placeholderTextColor={colors.textPlaceholder}
              />
            </View>
            <View style={styles.metaField}>
              <Ionicons name="people-outline" size={16} color={colors.textSecondary} />
              <TextInput
                style={styles.metaInput}
                value={servings}
                onChangeText={setServings}
                placeholder="e.g. 4"
                placeholderTextColor={colors.textPlaceholder}
              />
            </View>
          </View>

          {/* Source URL */}
          {sourceUrl ? (
            <View style={styles.sourceRow}>
              <Ionicons name="link-outline" size={14} color={colors.accent} />
              <Text style={styles.sourceText} numberOfLines={1}>
                {sourceUrl}
              </Text>
            </View>
          ) : null}

          {/* Source Image */}
          {sourceImageUri ? (
            <View style={styles.sourceRow}>
              <Ionicons name="image-outline" size={14} color={colors.accent} />
              <Text style={styles.sourceText}>Imported from image</Text>
            </View>
          ) : null}

          {/* Tags */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagsWrap}>
              {tags.map((tag) => (
                <Pressable
                  key={tag}
                  style={styles.tag}
                  onPress={() => removeTag(tag)}
                >
                  <Text style={styles.tagText}>{tag}</Text>
                  <Ionicons name="close" size={12} color={colors.tagText} />
                </Pressable>
              ))}
              <View style={styles.tagInputWrap}>
                <TextInput
                  style={styles.tagInput}
                  value={tagInput}
                  onChangeText={setTagInput}
                  placeholder="+ Add tag"
                  placeholderTextColor={colors.textPlaceholder}
                  returnKeyType="done"
                  onSubmitEditing={addTag}
                  blurOnSubmit={false}
                />
              </View>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Ingredients */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            {ingredients.map((ing, idx) => (
              <View key={ing.id} style={styles.ingredientRow}>
                <TextInput
                  style={styles.ingredientName}
                  value={ing.name}
                  onChangeText={(v) => updateIngredient(ing.id, 'name', v)}
                  placeholder={`Ingredient ${idx + 1}`}
                  placeholderTextColor={colors.textPlaceholder}
                />
                <TextInput
                  style={styles.ingredientQty}
                  value={ing.quantity}
                  onChangeText={(v) => updateIngredient(ing.id, 'quantity', v)}
                  placeholder="Qty"
                  placeholderTextColor={colors.textPlaceholder}
                />
                {ingredients.length > 1 && (
                  <Pressable onPress={() => removeIngredient(ing.id)} hitSlop={8}>
                    <Ionicons name="remove-circle-outline" size={20} color={colors.textPlaceholder} />
                  </Pressable>
                )}
              </View>
            ))}
            <Pressable style={styles.addRow} onPress={addIngredient}>
              <Ionicons name="add" size={16} color={colors.textPlaceholder} />
              <Text style={styles.addRowText}>Add ingredient</Text>
            </Pressable>
          </View>

          <View style={styles.divider} />

          {/* Steps */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Steps</Text>
            {steps.map((step) => (
              <View key={step.id} style={styles.stepRow}>
                <View style={styles.stepNum}>
                  <Text style={styles.stepNumText}>{step.order}</Text>
                </View>
                <TextInput
                  style={styles.stepInput}
                  value={step.text}
                  onChangeText={(v) => updateStep(step.id, v)}
                  placeholder={`Step ${step.order}`}
                  placeholderTextColor={colors.textPlaceholder}
                  multiline
                />
                {steps.length > 1 && (
                  <Pressable onPress={() => removeStep(step.id)} hitSlop={8}>
                    <Ionicons name="remove-circle-outline" size={20} color={colors.textPlaceholder} />
                  </Pressable>
                )}
              </View>
            ))}
            <Pressable style={styles.addRow} onPress={addStep}>
              <Ionicons name="add" size={16} color={colors.textPlaceholder} />
              <Text style={styles.addRowText}>Add step</Text>
            </Pressable>
          </View>

          <View style={{ height: spacing[48] }} />
        </ScrollView>

        {/* Save button */}
        <View style={styles.ctaBar}>
          <Pressable style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>Save recipe</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[20],
    paddingVertical: spacing[12],
  },
  topBarTitle: {
    fontFamily: fonts.serif,
    fontSize: fontSize.md,
    color: colors.text,
  },
  extractingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[8],
    backgroundColor: colors.surface,
    paddingHorizontal: spacing[20],
    paddingVertical: spacing[12],
  },
  extractingText: {
    fontFamily: fonts.sans,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  errorBar: {
    backgroundColor: '#FDF2F2',
    paddingHorizontal: spacing[20],
    paddingVertical: spacing[12],
  },
  errorText: {
    fontFamily: fonts.sans,
    fontSize: fontSize.sm,
    color: colors.error,
    marginBottom: spacing[2],
  },
  errorDismiss: {
    fontFamily: fonts.sans,
    fontSize: fontSize.xs,
    color: colors.textPlaceholder,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing[20],
  },
  photoArea: {
    height: 180,
    borderRadius: radius.xl,
    overflow: 'hidden',
    marginBottom: spacing[20],
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    flex: 1,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[6],
  },
  photoPlaceholderText: {
    fontFamily: fonts.sans,
    fontSize: fontSize.sm,
    color: colors.textPlaceholder,
  },
  nameInput: {
    fontFamily: fonts.serif,
    fontSize: fontSize.xl,
    color: colors.text,
    marginBottom: spacing[16],
    padding: 0,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing[12],
    marginBottom: spacing[16],
  },
  metaField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[8],
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[12],
  },
  metaInput: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: fontSize.sm,
    color: colors.text,
    padding: 0,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[6],
    marginBottom: spacing[16],
  },
  sourceText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSize.sm,
    color: colors.accent,
    flex: 1,
  },
  section: {
    marginBottom: spacing[24],
  },
  sectionTitle: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.xs,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.textSecondary,
    marginBottom: spacing[12],
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[8],
    alignItems: 'center',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    backgroundColor: colors.tag,
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[6],
    borderRadius: radius.full,
  },
  tagText: {
    fontFamily: fonts.sans,
    fontSize: fontSize.sm,
    color: colors.tagText,
  },
  tagInputWrap: {
    minWidth: 80,
  },
  tagInput: {
    fontFamily: fonts.sans,
    fontSize: fontSize.sm,
    color: colors.text,
    padding: spacing[6],
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: spacing[24],
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[8],
    marginBottom: spacing[8],
  },
  ingredientName: {
    flex: 2,
    fontFamily: fonts.sans,
    fontSize: fontSize.base,
    color: colors.text,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing[8],
  },
  ingredientQty: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing[8],
    textAlign: 'right',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[12],
    marginBottom: spacing[12],
  },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing[4],
  },
  stepNumText: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.sm,
    color: colors.white,
  },
  stepInput: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: fontSize.base,
    color: colors.text,
    lineHeight: 22,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing[8],
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[6],
    paddingVertical: spacing[8],
  },
  addRowText: {
    fontFamily: fonts.sans,
    fontSize: fontSize.sm,
    color: colors.textPlaceholder,
  },
  ctaBar: {
    paddingHorizontal: spacing[20],
    paddingVertical: spacing[16],
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saveBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.full,
    paddingVertical: spacing[16],
    alignItems: 'center',
  },
  saveBtnText: {
    fontFamily: fonts.sans,
    fontSize: fontSize.base,
    color: colors.white,
  },
});
