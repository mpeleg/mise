import AsyncStorage from '@react-native-async-storage/async-storage';
import { Recipe } from './types';

const RECIPES_KEY = 'mise_recipes';

export async function loadRecipes(): Promise<Recipe[]> {
  const raw = await AsyncStorage.getItem(RECIPES_KEY);
  if (!raw) return [];
  return JSON.parse(raw);
}

export async function saveRecipe(recipe: Recipe): Promise<void> {
  const recipes = await loadRecipes();
  const idx = recipes.findIndex((r) => r.id === recipe.id);
  if (idx >= 0) {
    recipes[idx] = recipe;
  } else {
    recipes.unshift(recipe);
  }
  await AsyncStorage.setItem(RECIPES_KEY, JSON.stringify(recipes));
}

export async function deleteRecipe(id: string): Promise<void> {
  const recipes = await loadRecipes();
  const filtered = recipes.filter((r) => r.id !== id);
  await AsyncStorage.setItem(RECIPES_KEY, JSON.stringify(filtered));
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
