import { View, Text, ScrollView, Pressable, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Search, X, Clock, TrendingUp, ArrowLeft } from "lucide-react-native";
import { useState, useMemo } from "react";
import useRecipeStore from "@/lib/state/recipe-store";
import { RecipeCard } from "@/components/RecipeCard";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";

const popularSearches = [
  "Chicken", "Pasta", "Salmon", "Tacos", "Pizza", "Curry", "Salad", "Soup"
];

export default function SearchScreen() {
  const router = useRouter();
  const recipes = useRecipeStore((s) => s.recipes);
  const searchHistory = useRecipeStore((s) => s.searchHistory);
  const addSearchTerm = useRecipeStore((s) => s.addSearchTerm);
  const clearSearchHistory = useRecipeStore((s) => s.clearSearchHistory);

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return recipes.filter(
      (recipe) =>
        recipe.title.toLowerCase().includes(query) ||
        recipe.description.toLowerCase().includes(query) ||
        recipe.category.toLowerCase().includes(query) ||
        recipe.ingredients.some((ing) => ing.name.toLowerCase().includes(query))
    );
  }, [searchQuery, recipes]);

  const handleSearch = (term: string) => {
    setSearchQuery(term);
    setIsSearching(true);
    if (term.trim()) {
      addSearchTerm(term.trim());
    }
  };

  const navigateToRecipe = (recipeId: string) => {
    router.push(`/recipe/${recipeId}`);
  };

  return (
    <View className="flex-1 bg-zinc-50 dark:bg-zinc-950">
      <SafeAreaView edges={["top"]} className="flex-1">
        {/* Search Header */}
        <View className="px-5 pt-2 pb-4">
          <View className="flex-row items-center gap-3">
            <Pressable onPress={() => router.back()} className="p-1">
              <ArrowLeft size={24} color="#71717a" />
            </Pressable>
            <View className="flex-1 flex-row items-center bg-white dark:bg-zinc-900 rounded-xl px-4 py-3 border border-zinc-200 dark:border-zinc-800">
              <Search size={20} color="#71717a" />
              <TextInput
                className="flex-1 ml-3 text-base text-zinc-900 dark:text-white"
                placeholder="Search recipes, ingredients..."
                placeholderTextColor="#a1a1aa"
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  setIsSearching(text.length > 0);
                }}
                onSubmitEditing={() => handleSearch(searchQuery)}
                returnKeyType="search"
                autoFocus
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => {
                  setSearchQuery("");
                  setIsSearching(false);
                }}>
                  <X size={20} color="#71717a" />
                </Pressable>
              )}
            </View>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
          {isSearching && searchQuery.length > 0 ? (
            // Search Results
            <View className="px-5 pb-8">
              <Text className="text-sm text-zinc-500 mb-4">
                {searchResults.length} result{searchResults.length !== 1 ? "s" : ""} for "{searchQuery}"
              </Text>
              {searchResults.length > 0 ? (
                <View className="gap-3">
                  {searchResults.map((recipe, index) => (
                    <Animated.View
                      key={recipe.id}
                      entering={FadeInDown.delay(50 * index)}
                    >
                      <RecipeCard
                        recipe={recipe}
                        onPress={() => navigateToRecipe(recipe.id)}
                        variant="horizontal"
                      />
                    </Animated.View>
                  ))}
                </View>
              ) : (
                <View className="items-center py-12">
                  <View className="w-20 h-20 bg-zinc-200 dark:bg-zinc-800 rounded-full items-center justify-center mb-4">
                    <Search size={32} color="#71717a" />
                  </View>
                  <Text className="text-lg font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    No recipes found
                  </Text>
                  <Text className="text-sm text-zinc-500 text-center">
                    Try searching for a different ingredient or dish
                  </Text>
                </View>
              )}
            </View>
          ) : (
            // Initial State
            <>
              {/* Search History */}
              {searchHistory.length > 0 && (
                <Animated.View entering={FadeIn.delay(100)} className="px-5 mb-6">
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center gap-2">
                      <Clock size={16} color="#71717a" />
                      <Text className="text-base font-semibold text-zinc-900 dark:text-white">
                        Recent Searches
                      </Text>
                    </View>
                    <Pressable onPress={clearSearchHistory}>
                      <Text className="text-sm text-orange-500 font-medium">Clear</Text>
                    </Pressable>
                  </View>
                  <View className="flex-row flex-wrap gap-2">
                    {searchHistory.map((term, index) => (
                      <Animated.View key={term} entering={FadeInDown.delay(30 * index)}>
                        <Pressable
                          onPress={() => handleSearch(term)}
                          className="bg-white dark:bg-zinc-900 px-4 py-2 rounded-full border border-zinc-200 dark:border-zinc-800"
                        >
                          <Text className="text-sm text-zinc-700 dark:text-zinc-300">{term}</Text>
                        </Pressable>
                      </Animated.View>
                    ))}
                  </View>
                </Animated.View>
              )}

              {/* Popular Searches */}
              <Animated.View entering={FadeIn.delay(200)} className="px-5 mb-6">
                <View className="flex-row items-center gap-2 mb-3">
                  <TrendingUp size={16} color="#f97316" />
                  <Text className="text-base font-semibold text-zinc-900 dark:text-white">
                    Popular Searches
                  </Text>
                </View>
                <View className="flex-row flex-wrap gap-2">
                  {popularSearches.map((term, index) => (
                    <Animated.View key={term} entering={FadeInDown.delay(30 * index)}>
                      <Pressable
                        onPress={() => handleSearch(term)}
                        className="bg-orange-50 dark:bg-orange-900/20 px-4 py-2.5 rounded-full"
                      >
                        <Text className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                          {term}
                        </Text>
                      </Pressable>
                    </Animated.View>
                  ))}
                </View>
              </Animated.View>

              {/* Browse All */}
              <Animated.View entering={FadeIn.delay(300)} className="px-5 pb-8">
                <Text className="text-base font-semibold text-zinc-900 dark:text-white mb-3">
                  Browse All Recipes
                </Text>
                <View className="gap-3">
                  {recipes.map((recipe, index) => (
                    <Animated.View
                      key={recipe.id}
                      entering={FadeInDown.delay(30 * index)}
                    >
                      <RecipeCard
                        recipe={recipe}
                        onPress={() => navigateToRecipe(recipe.id)}
                        variant="horizontal"
                      />
                    </Animated.View>
                  ))}
                </View>
              </Animated.View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
