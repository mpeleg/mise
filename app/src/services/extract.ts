import { supabase } from '../lib/supabase';
import { Ingredient, Step } from '../types';
import { generateId } from '../store';

export interface ExtractedRecipe {
  name: string;
  prepTime?: string;
  servings?: string;
  tags: string[];
  ingredients: Ingredient[];
  steps: Step[];
  imageUrl?: string;
}

function hydrateIds(recipe: ExtractedRecipe): ExtractedRecipe {
  return {
    ...recipe,
    ingredients: recipe.ingredients.map((i) =>
      i.id ? i : { ...i, id: generateId() },
    ),
    steps: recipe.steps.map((s, idx) => {
      if (typeof s === 'string') {
        return { id: generateId(), order: idx + 1, text: s };
      }
      return s.id ? s : { ...s, id: generateId(), order: idx + 1 };
    }),
  };
}

export async function extractFromUrl(url: string): Promise<ExtractedRecipe> {
  const { data, error } = await supabase.functions.invoke('extract-from-url', {
    body: { url },
  });

  if (error) throw new Error(`Extraction failed: ${error.message}`);

  const recipe = hydrateIds(data as ExtractedRecipe);
  return recipe;
}

export async function extractFromImage(
  imageUri: string,
): Promise<ExtractedRecipe> {
  // Read image as base64 via fetch (works cross-platform)
  const response = await fetch(imageUri);
  const blob = await response.blob();
  const base64: string = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

  const ext = imageUri.split('.').pop()?.toLowerCase() || 'jpeg';
  const mediaType =
    ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

  const { data, error } = await supabase.functions.invoke(
    'extract-from-image',
    { body: { base64, mediaType } },
  );

  if (error) throw new Error(`Image extraction failed: ${error.message}`);

  return hydrateIds(data as ExtractedRecipe);
}
