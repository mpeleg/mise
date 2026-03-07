export interface Ingredient {
  id: string;
  name: string;
  quantity: string;
  preparation?: string;
}

export interface Step {
  id: string;
  order: number;
  text: string;
}

export interface Recipe {
  id: string;
  name: string;
  tags: string[];
  prepTime?: string;
  servings?: string;
  ingredients: Ingredient[];
  steps: Step[];
  notes: Note[];
  photoUri?: string;
  sourceUrl?: string;
  sourceType: 'manual' | 'voice' | 'link' | 'image';
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  text: string;
  createdAt: string;
}
