import { supabase } from './lib/supabase';
import { uploadPhoto } from './lib/storage';
import { Recipe, Ingredient, Step, Note } from './types';

// ── ID generator (unchanged) ──────────────────────────────────────────────────
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ── Row ↔ Recipe mapping ──────────────────────────────────────────────────────
type RecipeRow = {
  id: string;
  user_id: string;
  name: string;
  tags: string[];
  prep_time: string | null;
  servings: string | null;
  ingredients: Ingredient[];
  steps: Step[];
  notes: Note[];
  photo_uri: string | null;
  source_url: string | null;
  source_image_uri: string | null;
  source_type: Recipe['sourceType'];
  created_at: string;
  updated_at: string;
};

function rowToRecipe(row: RecipeRow): Recipe {
  return {
    id: row.id,
    name: row.name,
    tags: row.tags ?? [],
    prepTime: row.prep_time ?? undefined,
    servings: row.servings ?? undefined,
    ingredients: row.ingredients ?? [],
    steps: row.steps ?? [],
    notes: row.notes ?? [],
    photoUri: row.photo_uri ?? undefined,
    sourceUrl: row.source_url ?? undefined,
    sourceImageUri: row.source_image_uri ?? undefined,
    sourceType: row.source_type,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function recipeToRow(
  recipe: Recipe,
  userId: string,
): Omit<RecipeRow, 'created_at'> & { updated_at: string } {
  return {
    id: recipe.id,
    user_id: userId,
    name: recipe.name,
    tags: recipe.tags,
    prep_time: recipe.prepTime ?? null,
    servings: recipe.servings ?? null,
    ingredients: recipe.ingredients,
    steps: recipe.steps,
    notes: recipe.notes,
    photo_uri: recipe.photoUri ?? null,
    source_url: recipe.sourceUrl ?? null,
    source_image_uri: recipe.sourceImageUri ?? null,
    source_type: recipe.sourceType,
    updated_at: new Date().toISOString(),
  };
}

async function getCurrentUserId(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) throw new Error('Not authenticated');
  return session.user.id;
}

// ── Public API ────────────────────────────────────────────────────────────────
export async function loadRecipes(): Promise<Recipe[]> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) throw new Error(`Failed to load recipes: ${error.message}`);
  return (data as RecipeRow[]).map(rowToRecipe);
}

export async function saveRecipe(recipe: Recipe): Promise<void> {
  const userId = await getCurrentUserId();

  let photoUri = recipe.photoUri;
  let sourceImageUri = recipe.sourceImageUri;

  if (photoUri?.startsWith('file://')) {
    photoUri = await uploadPhoto(photoUri, userId);
  }
  if (sourceImageUri?.startsWith('file://')) {
    sourceImageUri = await uploadPhoto(sourceImageUri, userId);
  }

  const row = recipeToRow({ ...recipe, photoUri, sourceImageUri }, userId);

  const { error } = await supabase
    .from('recipes')
    .upsert(row, { onConflict: 'id' });

  if (error) throw new Error(`Failed to save recipe: ${error.message}`);
}

export async function deleteRecipe(id: string): Promise<void> {
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from('recipes')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw new Error(`Failed to delete recipe: ${error.message}`);
}
