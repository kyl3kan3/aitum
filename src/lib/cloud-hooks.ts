/**
 * React Query hooks for Vibecode Cloud
 *
 * These hooks provide easy access to cloud data with automatic caching,
 * refetching, and optimistic updates.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  vibecodeCloud,
  cloudQueryKeys,
  type UserProfile,
  type CloudRecipe,
  type ScanHistoryItem,
  type CloudMealPlan,
  type CloudCollection,
} from "./vibecode-cloud";

// ============ USER PROFILE ============

export function useUserProfile() {
  return useQuery({
    queryKey: cloudQueryKeys.userProfile,
    queryFn: () => vibecodeCloud.getUserProfile(),
  });
}

export function useUpdateUserProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: Partial<UserProfile>) => vibecodeCloud.updateUserProfile(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cloudQueryKeys.userProfile });
    },
  });
}

// ============ RECIPES ============

export function useCloudRecipes() {
  return useQuery({
    queryKey: cloudQueryKeys.recipes,
    queryFn: () => vibecodeCloud.getRecipes(),
  });
}

export function useCloudRecipe(id: string) {
  return useQuery({
    queryKey: cloudQueryKeys.recipe(id),
    queryFn: () => vibecodeCloud.getRecipe(id),
    enabled: !!id,
  });
}

export function useFavoriteRecipes() {
  return useQuery({
    queryKey: cloudQueryKeys.favoriteRecipes,
    queryFn: () => vibecodeCloud.getFavoriteRecipes(),
  });
}

export function useSearchRecipes(query: string) {
  return useQuery({
    queryKey: [...cloudQueryKeys.recipes, "search", query],
    queryFn: () => vibecodeCloud.searchRecipes(query),
    enabled: query.length > 0,
  });
}

export function useSaveRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (recipe: Omit<CloudRecipe, "id" | "createdAt" | "updatedAt">) =>
      vibecodeCloud.saveRecipe(recipe),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cloudQueryKeys.recipes });
    },
  });
}

export function useUpdateRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CloudRecipe> }) =>
      vibecodeCloud.updateRecipe(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: cloudQueryKeys.recipes });
      queryClient.invalidateQueries({ queryKey: cloudQueryKeys.recipe(variables.id) });
    },
  });
}

export function useDeleteRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => vibecodeCloud.deleteRecipe(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cloudQueryKeys.recipes });
      queryClient.invalidateQueries({ queryKey: cloudQueryKeys.favoriteRecipes });
    },
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => vibecodeCloud.toggleFavorite(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cloudQueryKeys.recipes });
      queryClient.invalidateQueries({ queryKey: cloudQueryKeys.favoriteRecipes });
    },
  });
}

// ============ SCAN HISTORY ============

export function useScanHistory() {
  return useQuery({
    queryKey: cloudQueryKeys.scanHistory,
    queryFn: () => vibecodeCloud.getScanHistory(),
  });
}

export function useAddScanToHistory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (scan: Omit<ScanHistoryItem, "id" | "scannedAt">) =>
      vibecodeCloud.addScanToHistory(scan),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cloudQueryKeys.scanHistory });
    },
  });
}

export function useClearScanHistory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => vibecodeCloud.clearScanHistory(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cloudQueryKeys.scanHistory });
    },
  });
}

// ============ MEAL PLANS ============

export function useMealPlans() {
  return useQuery({
    queryKey: cloudQueryKeys.mealPlans,
    queryFn: () => vibecodeCloud.getMealPlans(),
  });
}

export function useMealPlanForDate(date: string) {
  return useQuery({
    queryKey: cloudQueryKeys.mealPlanForDate(date),
    queryFn: () => vibecodeCloud.getMealPlanForDate(date),
    enabled: !!date,
  });
}

export function useAddMealPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (plan: Omit<CloudMealPlan, "id" | "createdAt">) =>
      vibecodeCloud.addMealPlan(plan),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cloudQueryKeys.mealPlans });
    },
  });
}

export function useRemoveMealPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => vibecodeCloud.removeMealPlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cloudQueryKeys.mealPlans });
    },
  });
}

// ============ COLLECTIONS ============

export function useCollections() {
  return useQuery({
    queryKey: cloudQueryKeys.collections,
    queryFn: () => vibecodeCloud.getCollections(),
  });
}

export function useCreateCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (collection: Omit<CloudCollection, "id" | "createdAt" | "updatedAt" | "recipeIds">) =>
      vibecodeCloud.createCollection(collection),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cloudQueryKeys.collections });
    },
  });
}

export function useAddRecipeToCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ collectionId, recipeId }: { collectionId: string; recipeId: string }) =>
      vibecodeCloud.addRecipeToCollection(collectionId, recipeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cloudQueryKeys.collections });
    },
  });
}

export function useRemoveRecipeFromCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ collectionId, recipeId }: { collectionId: string; recipeId: string }) =>
      vibecodeCloud.removeRecipeFromCollection(collectionId, recipeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cloudQueryKeys.collections });
    },
  });
}

export function useDeleteCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => vibecodeCloud.deleteCollection(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cloudQueryKeys.collections });
    },
  });
}

// ============ DATA MANAGEMENT ============

export function useExportData() {
  return useMutation({
    mutationFn: () => vibecodeCloud.exportAllData(),
  });
}

export function useClearAllData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => vibecodeCloud.clearAllData(),
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

// ============ INITIALIZATION ============

export function useInitializeCloud() {
  return useQuery({
    queryKey: ["cloud", "initialize"],
    queryFn: () => vibecodeCloud.initialize(),
    staleTime: Infinity,
  });
}
