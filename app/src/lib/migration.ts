import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { Recipe } from '../types';

const MIGRATION_FLAG = 'mise_migration_v1_done';
const LEGACY_RECIPES_KEY = 'mise_recipes';

export async function migrateLocalDataIfNeeded(userId: string): Promise<void> {
  const done = await AsyncStorage.getItem(MIGRATION_FLAG);
  if (done === '1') return;

  try {
    const raw = await AsyncStorage.getItem(LEGACY_RECIPES_KEY);
    if (!raw) {
      await AsyncStorage.setItem(MIGRATION_FLAG, '1');
      return;
    }

    const recipes: Recipe[] = JSON.parse(raw);
    if (recipes.length === 0) {
      await AsyncStorage.setItem(MIGRATION_FLAG, '1');
      return;
    }

    console.log(`[migration] Migrating ${recipes.length} recipes to Supabase…`);

    const rows = recipes.map((r) => ({
      id: r.id,
      user_id: userId,
      name: r.name,
      tags: r.tags,
      prep_time: r.prepTime ?? null,
      servings: r.servings ?? null,
      ingredients: r.ingredients,
      steps: r.steps,
      notes: r.notes,
      // Skip local file:// URIs — they won't be accessible on other devices
      photo_uri: r.photoUri?.startsWith('http') ? r.photoUri : null,
      source_url: r.sourceUrl ?? null,
      source_image_uri: r.sourceImageUri?.startsWith('http') ? r.sourceImageUri : null,
      source_type: r.sourceType,
      created_at: r.createdAt,
      updated_at: r.updatedAt,
    }));

    const { error } = await supabase
      .from('recipes')
      .upsert(rows, { onConflict: 'id', ignoreDuplicates: true });

    if (error) {
      console.error('[migration] Upsert error:', error.message);
      return; // Don't set flag — retry next time
    }

    console.log('[migration] Done.');
    await AsyncStorage.setItem(MIGRATION_FLAG, '1');
  } catch (e) {
    console.error('[migration] Unexpected error:', e);
  }
}
