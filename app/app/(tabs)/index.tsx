import { useCallback, useEffect, useState } from 'react';
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
import { colors, fonts, hebrewFonts, fontSize, radius, spacing } from '../../src/theme';
import { Recipe } from '../../src/types';
import { loadRecipes } from '../../src/store';

function RecipeCard({ recipe, onPress }: { recipe: Recipe; onPress: () => void }) {
  const [imageAspect, setImageAspect] = useState<number | null>(null);
  const isRTL = /[\u0590-\u05FF]/.test(recipe.name);
  const f = isRTL ? hebrewFonts : fonts;

  useEffect(() => {
    if (recipe.photoUri) {
      Image.getSize(recipe.photoUri, (w, h) => {
        if (w && h) setImageAspect(w / h);
      });
    }
  }, [recipe.photoUri]);

  return (
    <Pressable style={styles.card} onPress={onPress}>
      {recipe.photoUri ? (
        <Image
          source={{ uri: recipe.photoUri }}
          style={[
            styles.cardImage,
            imageAspect ? { aspectRatio: imageAspect } : { height: 180 },
          ]}
        />
      ) : (
        <View style={[styles.cardImage, { height: 180 }, styles.cardImagePlaceholder]}>
          <Ionicons name="image-outline" size={32} color={colors.borderStrong} />
          <Text style={styles.noPhotoText}>No photo</Text>
        </View>
      )}
      <View style={styles.cardBody}>
        <Text style={[styles.cardName, { fontFamily: f.serif }]} numberOfLines={2}>
          {recipe.name}
        </Text>
        {recipe.tags.length > 0 && (
          <View style={styles.tags}>
            {recipe.tags.slice(0, 3).map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={[styles.tagText, { fontFamily: f.sans }]}>{tag}</Text>
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
      loadRecipes().then(setRecipes).catch(() => {});
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
            Import your first recipe to get started
          </Text>
          <Pressable
            style={styles.emptyBtn}
            onPress={() => router.push('/(tabs)/add')}
          >
            <Ionicons name="add" size={18} color={colors.white} />
            <Text style={styles.emptyBtnText}>Add recipe</Text>
          </Pressable>
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
    width: '100%',
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
    marginBottom: spacing[8],
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
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[6],
    backgroundColor: colors.accent,
    paddingHorizontal: spacing[20],
    paddingVertical: spacing[12],
    borderRadius: radius.full,
    marginTop: spacing[16],
  },
  emptyBtnText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSize.base,
    color: colors.white,
  },
  rtlText: {
    writingDirection: 'rtl',
    textAlign: 'right',
  },
});
