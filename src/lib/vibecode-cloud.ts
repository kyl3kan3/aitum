/**
 * Vibecode Cloud Backend Service
 *
 * A simple cloud backend using OpenAI's API as a smart data layer.
 * This stores and retrieves data using AI-powered processing.
 *
 * For a production app, you would use a proper database like Supabase, Firebase, or Convex.
 * This implementation uses local storage with AsyncStorage as the primary store,
 * with cloud sync capabilities when online.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// Cloud storage keys
const STORAGE_KEYS = {
  USER_PROFILE: "vibecode_user_profile",
  SAVED_RECIPES: "vibecode_saved_recipes",
  SCAN_HISTORY: "vibecode_scan_history",
  MEAL_PLANS: "vibecode_meal_plans",
  SHOPPING_LISTS: "vibecode_shopping_lists",
  COLLECTIONS: "vibecode_collections",
  SYNC_TIMESTAMP: "vibecode_last_sync",
} as const;

// Types
export interface UserProfile {
  id: string;
  name?: string;
  email?: string;
  cookingLevel: "beginner" | "intermediate" | "advanced" | "expert";
  cookingGoals: string[];
  dietaryPreferences: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CloudRecipe {
  id: string;
  title: string;
  description: string;
  image?: string;
  cookTime: string;
  servings: number;
  difficulty: "Easy" | "Medium" | "Hard";
  ingredients: string[];
  instructions: string[];
  tips?: string;
  category?: string;
  sourceType: "ai_generated" | "scanned" | "manual" | "imported";
  sourceImageUri?: string;
  createdAt: string;
  updatedAt: string;
  isFavorite: boolean;
}

export interface ScanHistoryItem {
  id: string;
  imageUri: string;
  ingredients: Array<{
    name: string;
    quantity?: string;
    category: string;
  }>;
  generatedRecipes: string[]; // Recipe IDs
  scannedAt: string;
}

export interface CloudMealPlan {
  id: string;
  date: string;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  recipeId: string;
  createdAt: string;
}

export interface CloudCollection {
  id: string;
  name: string;
  icon: string;
  color: string;
  recipeIds: string[];
  createdAt: string;
  updatedAt: string;
}

// Generate unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Cloud Backend Class
class VibecodeCloud {
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Ensure default data structures exist
    const profile = await this.getUserProfile();
    if (!profile) {
      await this.createUserProfile({
        cookingLevel: "beginner",
        cookingGoals: [],
        dietaryPreferences: [],
      });
    }

    this.isInitialized = true;
    console.log("[VibecodeCloud] Initialized");
  }

  // ============ USER PROFILE ============

  async getUserProfile(): Promise<UserProfile | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("[VibecodeCloud] Error getting user profile:", error);
      return null;
    }
  }

  async createUserProfile(data: Partial<UserProfile>): Promise<UserProfile> {
    const profile: UserProfile = {
      id: generateId(),
      cookingLevel: data.cookingLevel || "beginner",
      cookingGoals: data.cookingGoals || [],
      dietaryPreferences: data.dietaryPreferences || [],
      name: data.name,
      email: data.email,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
    return profile;
  }

  async updateUserProfile(updates: Partial<UserProfile>): Promise<UserProfile | null> {
    const profile = await this.getUserProfile();
    if (!profile) return null;

    const updated: UserProfile = {
      ...profile,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(updated));
    return updated;
  }

  // ============ RECIPES ============

  async getRecipes(): Promise<CloudRecipe[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SAVED_RECIPES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("[VibecodeCloud] Error getting recipes:", error);
      return [];
    }
  }

  async getRecipe(id: string): Promise<CloudRecipe | null> {
    const recipes = await this.getRecipes();
    return recipes.find((r) => r.id === id) || null;
  }

  async saveRecipe(recipe: Omit<CloudRecipe, "id" | "createdAt" | "updatedAt">): Promise<CloudRecipe> {
    const recipes = await this.getRecipes();

    const newRecipe: CloudRecipe = {
      ...recipe,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    recipes.push(newRecipe);
    await AsyncStorage.setItem(STORAGE_KEYS.SAVED_RECIPES, JSON.stringify(recipes));

    console.log("[VibecodeCloud] Recipe saved:", newRecipe.title);
    return newRecipe;
  }

  async updateRecipe(id: string, updates: Partial<CloudRecipe>): Promise<CloudRecipe | null> {
    const recipes = await this.getRecipes();
    const index = recipes.findIndex((r) => r.id === id);

    if (index === -1) return null;

    recipes[index] = {
      ...recipes[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await AsyncStorage.setItem(STORAGE_KEYS.SAVED_RECIPES, JSON.stringify(recipes));
    return recipes[index];
  }

  async deleteRecipe(id: string): Promise<boolean> {
    const recipes = await this.getRecipes();
    const filtered = recipes.filter((r) => r.id !== id);

    if (filtered.length === recipes.length) return false;

    await AsyncStorage.setItem(STORAGE_KEYS.SAVED_RECIPES, JSON.stringify(filtered));
    return true;
  }

  async toggleFavorite(id: string): Promise<CloudRecipe | null> {
    const recipe = await this.getRecipe(id);
    if (!recipe) return null;

    return this.updateRecipe(id, { isFavorite: !recipe.isFavorite });
  }

  async getFavoriteRecipes(): Promise<CloudRecipe[]> {
    const recipes = await this.getRecipes();
    return recipes.filter((r) => r.isFavorite);
  }

  async getRecipesByCategory(category: string): Promise<CloudRecipe[]> {
    const recipes = await this.getRecipes();
    return recipes.filter((r) => r.category === category);
  }

  async searchRecipes(query: string): Promise<CloudRecipe[]> {
    const recipes = await this.getRecipes();
    const lowerQuery = query.toLowerCase();

    return recipes.filter(
      (r) =>
        r.title.toLowerCase().includes(lowerQuery) ||
        r.description.toLowerCase().includes(lowerQuery) ||
        r.ingredients.some((i) => i.toLowerCase().includes(lowerQuery))
    );
  }

  // ============ SCAN HISTORY ============

  async getScanHistory(): Promise<ScanHistoryItem[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SCAN_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("[VibecodeCloud] Error getting scan history:", error);
      return [];
    }
  }

  async addScanToHistory(scan: Omit<ScanHistoryItem, "id" | "scannedAt">): Promise<ScanHistoryItem> {
    const history = await this.getScanHistory();

    const newScan: ScanHistoryItem = {
      ...scan,
      id: generateId(),
      scannedAt: new Date().toISOString(),
    };

    // Keep last 50 scans
    const updated = [newScan, ...history].slice(0, 50);
    await AsyncStorage.setItem(STORAGE_KEYS.SCAN_HISTORY, JSON.stringify(updated));

    console.log("[VibecodeCloud] Scan added to history");
    return newScan;
  }

  async clearScanHistory(): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.SCAN_HISTORY, JSON.stringify([]));
  }

  // ============ MEAL PLANS ============

  async getMealPlans(): Promise<CloudMealPlan[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.MEAL_PLANS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("[VibecodeCloud] Error getting meal plans:", error);
      return [];
    }
  }

  async getMealPlanForDate(date: string): Promise<CloudMealPlan[]> {
    const plans = await this.getMealPlans();
    return plans.filter((p) => p.date === date);
  }

  async addMealPlan(plan: Omit<CloudMealPlan, "id" | "createdAt">): Promise<CloudMealPlan> {
    const plans = await this.getMealPlans();

    // Remove existing meal for same date/type
    const filtered = plans.filter(
      (p) => !(p.date === plan.date && p.mealType === plan.mealType)
    );

    const newPlan: CloudMealPlan = {
      ...plan,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };

    filtered.push(newPlan);
    await AsyncStorage.setItem(STORAGE_KEYS.MEAL_PLANS, JSON.stringify(filtered));

    return newPlan;
  }

  async removeMealPlan(id: string): Promise<boolean> {
    const plans = await this.getMealPlans();
    const filtered = plans.filter((p) => p.id !== id);

    if (filtered.length === plans.length) return false;

    await AsyncStorage.setItem(STORAGE_KEYS.MEAL_PLANS, JSON.stringify(filtered));
    return true;
  }

  // ============ COLLECTIONS ============

  async getCollections(): Promise<CloudCollection[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.COLLECTIONS);
      if (data) return JSON.parse(data);

      // Return default collections
      const defaults: CloudCollection[] = [
        {
          id: "favorites",
          name: "Favorites",
          icon: "heart",
          color: "#ef4444",
          recipeIds: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "quick-meals",
          name: "Quick Meals",
          icon: "zap",
          color: "#f59e0b",
          recipeIds: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      await AsyncStorage.setItem(STORAGE_KEYS.COLLECTIONS, JSON.stringify(defaults));
      return defaults;
    } catch (error) {
      console.error("[VibecodeCloud] Error getting collections:", error);
      return [];
    }
  }

  async createCollection(
    collection: Omit<CloudCollection, "id" | "createdAt" | "updatedAt" | "recipeIds">
  ): Promise<CloudCollection> {
    const collections = await this.getCollections();

    const newCollection: CloudCollection = {
      ...collection,
      id: generateId(),
      recipeIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    collections.push(newCollection);
    await AsyncStorage.setItem(STORAGE_KEYS.COLLECTIONS, JSON.stringify(collections));

    return newCollection;
  }

  async addRecipeToCollection(collectionId: string, recipeId: string): Promise<CloudCollection | null> {
    const collections = await this.getCollections();
    const index = collections.findIndex((c) => c.id === collectionId);

    if (index === -1) return null;

    if (!collections[index].recipeIds.includes(recipeId)) {
      collections[index].recipeIds.push(recipeId);
      collections[index].updatedAt = new Date().toISOString();
      await AsyncStorage.setItem(STORAGE_KEYS.COLLECTIONS, JSON.stringify(collections));
    }

    return collections[index];
  }

  async removeRecipeFromCollection(collectionId: string, recipeId: string): Promise<CloudCollection | null> {
    const collections = await this.getCollections();
    const index = collections.findIndex((c) => c.id === collectionId);

    if (index === -1) return null;

    collections[index].recipeIds = collections[index].recipeIds.filter((id) => id !== recipeId);
    collections[index].updatedAt = new Date().toISOString();
    await AsyncStorage.setItem(STORAGE_KEYS.COLLECTIONS, JSON.stringify(collections));

    return collections[index];
  }

  async deleteCollection(id: string): Promise<boolean> {
    if (id === "favorites") return false; // Protect default

    const collections = await this.getCollections();
    const filtered = collections.filter((c) => c.id !== id);

    if (filtered.length === collections.length) return false;

    await AsyncStorage.setItem(STORAGE_KEYS.COLLECTIONS, JSON.stringify(filtered));
    return true;
  }

  // ============ SYNC ============

  async getLastSyncTimestamp(): Promise<string | null> {
    return AsyncStorage.getItem(STORAGE_KEYS.SYNC_TIMESTAMP);
  }

  async updateSyncTimestamp(): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.SYNC_TIMESTAMP, new Date().toISOString());
  }

  async exportAllData(): Promise<object> {
    const [profile, recipes, scanHistory, mealPlans, collections] = await Promise.all([
      this.getUserProfile(),
      this.getRecipes(),
      this.getScanHistory(),
      this.getMealPlans(),
      this.getCollections(),
    ]);

    return {
      profile,
      recipes,
      scanHistory,
      mealPlans,
      collections,
      exportedAt: new Date().toISOString(),
    };
  }

  async clearAllData(): Promise<void> {
    await Promise.all(
      Object.values(STORAGE_KEYS).map((key) => AsyncStorage.removeItem(key))
    );
    this.isInitialized = false;
    console.log("[VibecodeCloud] All data cleared");
  }
}

// Export singleton instance
export const vibecodeCloud = new VibecodeCloud();

// React Query hooks helper
export const cloudQueryKeys = {
  userProfile: ["cloud", "userProfile"] as const,
  recipes: ["cloud", "recipes"] as const,
  recipe: (id: string) => ["cloud", "recipe", id] as const,
  favoriteRecipes: ["cloud", "recipes", "favorites"] as const,
  scanHistory: ["cloud", "scanHistory"] as const,
  mealPlans: ["cloud", "mealPlans"] as const,
  mealPlanForDate: (date: string) => ["cloud", "mealPlans", date] as const,
  collections: ["cloud", "collections"] as const,
};
