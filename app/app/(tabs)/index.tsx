import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Image,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, fontSize, radius, spacing } from '../../src/theme';
import { Recipe } from '../../src/types';
import { loadRecipes } from '../../src/store';

function RecipeCard({ recipe, onPress }: { recipe: Recipe; onPress: () => void }) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      {recipe.photoUri ? (
        <Image source={{ uri: recipe.photoUri }} style={styles.cardImage} />
      ) : (
        <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
          <Ionicons name="image-outline" size={32} color={colors.borderStrong} />
          <Text style={styles.noPhotoText}>No photo</Text>
        </View>
      )}
      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={2}>
          {recipe.name}
        </Text>
        <Text style={styles.cardMeta}>
          {[recipe.prepTime, recipe.servings && `${recipe.servings} servings`]
            .filter(Boolean)
            .join(' \u00B7 ')}
        </Text>
        {recipe.tags.length > 0 && (
          <View style={styles.tags}>
            {recipe.tags.slice(0, 3).map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadRecipes().then(setRecipes);
    }, [])
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.appName}>mise</Text>
      </View>

      {recipes.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No recipes yet</Text>
          <Text style={styles.emptySub}>
            Tap the Add tab to import your first recipe
          </Text>
        </View>
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.feed}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <RecipeCard
              recipe={item}
              onPress={() => router.push(`/recipe/${item.id}`)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    paddingHorizontal: spacing[20],
    paddingBottom: spacing[16],
  },
  appName: {
    fontFamily: fonts.serif,
    fontSize: 28,
    color: colors.text,
  },
  feed: {
    paddingHorizontal: spacing[20],
    paddingBottom: spacing[24],
    gap: spacing[16],
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  cardImage: {
    height: 180,
  },
  cardImagePlaceholder: {
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[8],
  },
  noPhotoText: {
    fontFamily: fonts.sans,
    fontSize: fontSize.xs,
    color: colors.textPlaceholder,
  },
  cardBody: {
    padding: spacing[16],
  },
  cardName: {
    fontFamily: fonts.serif,
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: 22,
    marginBottom: spacing[4],
  },
  cardMeta: {
    fontFamily: fonts.sans,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing[12],
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[6],
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
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[32],
    gap: spacing[8],
  },
  emptyTitle: {
    fontFamily: fonts.serif,
    fontSize: fontSize.lg,
    color: colors.text,
  },
  emptySub: {
    fontFamily: fonts.sans,
    fontSize: fontSize.sm,
    color: colors.textPlaceholder,
    textAlign: 'center',
    lineHeight: 20,
  },
});
