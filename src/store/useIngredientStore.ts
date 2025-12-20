import { create } from 'zustand';

interface IngredientStore {
  ingredients: string[];
  addIngredient: (ingredient: string) => void;
  removeIngredient: (index: number) => void;
  targetDish: string;
  setTargetDish: (dish: string) => void;
  searchMode: 'fast' | 'detailed';
  setSearchMode: (mode: 'fast' | 'detailed') => void;
}

export const useIngredientStore = create<IngredientStore>((set) => ({
  ingredients: [],
  targetDish: '',
  searchMode: 'fast',
  addIngredient: (ingredient) =>
    set((state) => {
      const trimmed = ingredient.trim();
      // 중복 방지 및 빈 문자열 방지
      if (!trimmed || state.ingredients.includes(trimmed)) return state;
      return { ingredients: [...state.ingredients, trimmed] };
    }),
  removeIngredient: (index) =>
    set((state) => ({
      ingredients: state.ingredients.filter((_, i) => i !== index),
    })),
  setTargetDish: (dish) => set({ targetDish: dish }),
  setSearchMode: (mode) => set({ searchMode: mode }),
}));
