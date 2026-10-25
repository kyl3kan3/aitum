import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface ShoppingListItem {
  id: string;
  name: string;
  amount: string;
  unit: string;
  checked: boolean;
  recipeId: string;
  recipeName: string;
}

export interface Collection {
  id: string;
  name: string;
  icon: string;
  color: string;
  recipeIds: string[];
  createdAt: string;
}

export interface MealPlanItem {
  id: string;
  recipeId: string;
  date: string; // YYYY-MM-DD
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
}

export interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodium: number;
}

// Mock nutrition data for recipes
export const recipeNutrition: Record<string, NutritionInfo> = {
  "1": { calories: 285, protein: 12, carbs: 36, fat: 10, fiber: 2, sodium: 480 },
  "2": { calories: 380, protein: 34, carbs: 18, fat: 20, fiber: 0, sodium: 520 },
  "3": { calories: 420, protein: 38, carbs: 12, fat: 26, fiber: 2, sodium: 680 },
  "4": { calories: 340, protein: 28, carbs: 18, fat: 18, fiber: 3, sodium: 890 },
  "5": { calories: 320, protein: 22, carbs: 28, fat: 14, fiber: 4, sodium: 620 },
  "6": { calories: 290, protein: 32, carbs: 2, fat: 18, fiber: 0, sodium: 380 },
};

interface AppStore {
  // Theme
  themeMode: "light" | "dark" | "system";
  setThemeMode: (mode: "light" | "dark" | "system") => void;

  // Shopping List
  shoppingList: ShoppingListItem[];
  addToShoppingList: (items: Omit<ShoppingListItem, "id" | "checked">[]) => void;
  toggleShoppingItem: (id: string) => void;
  removeShoppingItem: (id: string) => void;
  clearShoppingList: () => void;
  clearCheckedItems: () => void;

  // Collections
  collections: Collection[];
  addCollection: (collection: Omit<Collection, "id" | "createdAt">) => void;
  removeCollection: (id: string) => void;
  addRecipeToCollection: (collectionId: string, recipeId: string) => void;
  removeRecipeFromCollection: (collectionId: string, recipeId: string) => void;

  // Meal Planning
  mealPlan: MealPlanItem[];
  addToMealPlan: (item: Omit<MealPlanItem, "id">) => void;
  removeFromMealPlan: (id: string) => void;
  clearMealPlanForDate: (date: string) => void;

  // Cooking Mode
  isCookingMode: boolean;
  currentCookingRecipeId: string | null;
  currentStep: number;
  completedSteps: number[];
  activeTimer: { minutes: number; seconds: number; isRunning: boolean } | null;
  setCookingMode: (enabled: boolean, recipeId?: string) => void;
  setCurrentStep: (step: number) => void;
  toggleStepComplete: (step: number) => void;
  setActiveTimer: (timer: { minutes: number; seconds: number; isRunning: boolean } | null) => void;
}

const defaultCollections: Collection[] = [
  {
    id: "favorites",
    name: "Favorites",
    icon: "heart",
    color: "#ef4444",
    recipeIds: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: "quick-meals",
    name: "Quick Meals",
    icon: "zap",
    color: "#f59e0b",
    recipeIds: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: "weeknight",
    name: "Weeknight Dinners",
    icon: "moon",
    color: "#6366f1",
    recipeIds: [],
    createdAt: new Date().toISOString(),
  },
];

const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Theme
      themeMode: "system",
      setThemeMode: (mode) => set({ themeMode: mode }),

      // Shopping List
      shoppingList: [],
      addToShoppingList: (items) => {
        const currentList = get().shoppingList;
        const newItems = items.map((item) => ({
          ...item,
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          checked: false,
        }));
        set({ shoppingList: [...currentList, ...newItems] });
      },
      toggleShoppingItem: (id) => {
        set({
          shoppingList: get().shoppingList.map((item) =>
            item.id === id ? { ...item, checked: !item.checked } : item
          ),
        });
      },
      removeShoppingItem: (id) => {
        set({ shoppingList: get().shoppingList.filter((item) => item.id !== id) });
      },
      clearShoppingList: () => set({ shoppingList: [] }),
      clearCheckedItems: () => {
        set({ shoppingList: get().shoppingList.filter((item) => !item.checked) });
      },

      // Collections
      collections: defaultCollections,
      addCollection: (collection) => {
        const newCollection: Collection = {
          ...collection,
          id: `col-${Date.now()}`,
          createdAt: new Date().toISOString(),
        };
        set({ collections: [...get().collections, newCollection] });
      },
      removeCollection: (id) => {
        if (id === "favorites") return; // Protect default collection
        set({ collections: get().collections.filter((c) => c.id !== id) });
      },
      addRecipeToCollection: (collectionId, recipeId) => {
        set({
          collections: get().collections.map((c) =>
            c.id === collectionId && !c.recipeIds.includes(recipeId)
              ? { ...c, recipeIds: [...c.recipeIds, recipeId] }
              : c
          ),
        });
      },
      removeRecipeFromCollection: (collectionId, recipeId) => {
        set({
          collections: get().collections.map((c) =>
            c.id === collectionId
              ? { ...c, recipeIds: c.recipeIds.filter((id) => id !== recipeId) }
              : c
          ),
        });
      },

      // Meal Planning
      mealPlan: [],
      addToMealPlan: (item) => {
        // Remove existing meal for same date/type
        const filtered = get().mealPlan.filter(
          (m) => !(m.date === item.date && m.mealType === item.mealType)
        );
        const newItem: MealPlanItem = {
          ...item,
          id: `meal-${Date.now()}`,
        };
        set({ mealPlan: [...filtered, newItem] });
      },
      removeFromMealPlan: (id) => {
        set({ mealPlan: get().mealPlan.filter((m) => m.id !== id) });
      },
      clearMealPlanForDate: (date) => {
        set({ mealPlan: get().mealPlan.filter((m) => m.date !== date) });
      },

      // Cooking Mode
      isCookingMode: false,
      currentCookingRecipeId: null,
      currentStep: 1,
      completedSteps: [],
      activeTimer: null,
      setCookingMode: (enabled, recipeId) => {
        set({
          isCookingMode: enabled,
          currentCookingRecipeId: enabled ? recipeId ?? null : null,
          currentStep: 1,
          completedSteps: [],
          activeTimer: null,
        });
      },
      setCurrentStep: (step) => set({ currentStep: step }),
      toggleStepComplete: (step) => {
        const { completedSteps } = get();
        set({
          completedSteps: completedSteps.includes(step)
            ? completedSteps.filter((s) => s !== step)
            : [...completedSteps, step],
        });
      },
      setActiveTimer: (timer) => set({ activeTimer: timer }),
    }),
    {
      name: "app-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        themeMode: state.themeMode,
        shoppingList: state.shoppingList,
        collections: state.collections,
        mealPlan: state.mealPlan,
      }),
    }
  )
);

export default useAppStore;
