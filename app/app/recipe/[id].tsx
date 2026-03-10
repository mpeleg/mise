import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  Linking,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, fontSize, radius, spacing } from '../../src/theme';
import { Recipe } from '../../src/types';
import { loadRecipes, deleteRecipe } from '../../src/store';

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [showSourceImage, setShowSourceImage] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadRecipes().then((recipes) => {
        const found = recipes.find((r) => r.id === id);
        setRecipe(found || null);
      });
    }, [id])
  );

  if (!recipe) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Recipe not found</Text>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.backLink}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const handleDelete = () => {
    deleteRecipe(recipe.id).then(() => {
      router.back();
    });
  };

  const handleEdit = () => {
    router.push({
      pathname: '/review',
      params: { recipeId: recipe.id, sourceType: recipe.sourceType },
    });
  };

  // Detect if recipe content is primarily Hebrew/RTL
  const isRTL = /[\u0590-\u05FF]/.test(recipe.name);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Nav bar */}
      <View style={styles.navBar}>
        <Pressable style={styles.navBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </Pressable>
        <View style={styles.navActions}>
          <Pressable style={styles.navBtn} onPress={handleEdit}>
            <Ionicons name="create-outline" size={18} color={colors.text} />
          </Pressable>
          <Pressable style={styles.navBtn} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={18} color={colors.text} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        {recipe.photoUri ? (
          <Image source={{ uri: recipe.photoUri }} style={styles.hero} />
        ) : (
          <View style={[styles.hero, styles.heroPlaceholder]}>
            <Ionicons name="restaurant-outline" size={48} color={colors.borderStrong} />
          </View>
        )}

        {/* Header */}
        <Text style={[styles.recipeName, isRTL && styles.rtlText]}>{recipe.name}</Text>

        {(recipe.prepTime || recipe.servings) && (
          <View style={styles.metaRow}>
            {recipe.prepTime && (
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.metaText}>{recipe.prepTime}</Text>
              </View>
            )}
            {recipe.servings && (
              <View style={styles.metaItem}>
                <Ionicons name="people-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.metaText}>{recipe.servings} servings</Text>
              </View>
            )}
          </View>
        )}

        {recipe.tags.length > 0 && (
          <View style={styles.tagsRow}>
            {recipe.tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {recipe.sourceUrl && (
          <Pressable
            style={styles.sourceRow}
            onPress={() => Linking.openURL(recipe.sourceUrl!)}
          >
            <Ionicons name="link-outline" size={14} color={colors.accent} />
            <Text style={styles.sourceLink} numberOfLines={1}>
              {recipe.sourceUrl.replace(/^https?:\/\/(www\.)?/, '')}
            </Text>
          </Pressable>
        )}

        {recipe.sourceImageUri && (
          <Pressable
            style={styles.sourceRow}
            onPress={() => setShowSourceImage(true)}
          >
            <Ionicons name="image-outline" size={14} color={colors.accent} />
            <Text style={styles.sourceLink}>View source image</Text>
          </Pressable>
        )}

        <View style={styles.divider} />

        {/* Ingredients */}
        {recipe.ingredients.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            {recipe.ingredients.map((ing) => (
              <View key={ing.id} style={[styles.ingredientRow, isRTL && styles.rtlRow]}>
                <Text style={[styles.ingredientName, isRTL && styles.rtlText]}>{ing.name}</Text>
                <Text style={[styles.ingredientQty, isRTL && styles.rtlText]}>{ing.quantity}</Text>
              </View>
            ))}
          </View>
        )}

        {recipe.ingredients.length > 0 && recipe.steps.length > 0 && (
          <View style={styles.divider} />
        )}

        {/* Steps */}
        {recipe.steps.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Steps</Text>
            <View style={styles.stepList}>
              {recipe.steps.map((step) => (
                <View key={step.id} style={[styles.stepRow, isRTL && styles.rtlRow]}>
                  <View style={styles.stepNum}>
                    <Text style={styles.stepNumText}>{step.order}</Text>
                  </View>
                  <Text style={[styles.stepText, isRTL && styles.rtlText]}>{step.text}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: spacing[48] }} />
      </ScrollView>

      {/* Source image fullscreen modal */}
      {recipe.sourceImageUri && (
        <Modal
          visible={showSourceImage}
          transparent
          animationType="fade"
          onRequestClose={() => setShowSourceImage(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowSourceImage(false)}
          >
            <SafeAreaView style={styles.modalContainer} edges={['top']}>
              <Pressable
                style={styles.modalClose}
                onPress={() => setShowSourceImage(false)}
              >
                <Ionicons name="close" size={24} color={colors.white} />
              </Pressable>
            </SafeAreaView>
            <Image
              source={{ uri: recipe.sourceImageUri }}
              style={styles.modalImage}
              resizeMode="contain"
            />
          </Pressable>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[12],
  },
  emptyText: {
    fontFamily: fonts.serif,
    fontSize: fontSize.lg,
    color: colors.text,
  },
  backLink: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSize.base,
    color: colors.accent,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[8],
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navActions: {
    flexDirection: 'row',
    gap: spacing[4],
  },
  hero: {
    width: '100%',
    height: 240,
    borderRadius: radius.xl,
    marginBottom: spacing[20],
  },
  heroPlaceholder: {
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing[20],
  },
  recipeName: {
    fontFamily: fonts.serif,
    fontSize: fontSize.xl,
    color: colors.text,
    lineHeight: 32,
    marginBottom: spacing[12],
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing[20],
    marginBottom: spacing[12],
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
  },
  metaText: {
    fontFamily: fonts.sans,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[6],
    marginBottom: spacing[12],
  },
  tag: {
    backgroundColor: colors.tag,
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[4],
    borderRadius: radius.full,
  },
  tagText: {
    fontFamily: fonts.sans,
    fontSize: fontSize.xs,
    color: colors.tagText,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[6],
    marginBottom: spacing[16],
  },
  sourceLink: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSize.sm,
    color: colors.accent,
    textDecorationLine: 'underline',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing[20],
  },
  section: {
    marginBottom: spacing[8],
  },
  sectionTitle: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.xs,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.textSecondary,
    marginBottom: spacing[16],
  },
  ingredientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[12],
    borderBottomWidth: 1,
    borderBottomColor: '#EAE4DC',
  },
  ingredientName: {
    fontFamily: fonts.sans,
    fontSize: fontSize.base,
    color: colors.text,
  },
  ingredientQty: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  stepList: {
    gap: spacing[16],
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[12],
  },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.sm,
    color: colors.white,
  },
  stepText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: fontSize.base,
    color: colors.text,
    lineHeight: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 1,
  },
  modalClose: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    margin: spacing[16],
  },
  modalImage: {
    width: '100%',
    height: '80%',
  },
  rtlText: {
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  rtlRow: {
    flexDirection: 'row-reverse',
  },
});
