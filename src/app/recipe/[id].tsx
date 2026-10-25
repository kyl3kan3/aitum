import { View, Text, ScrollView, Pressable, Image, Share } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Heart,
  Clock,
  Users,
  Play,
  Check,
  ShoppingCart,
  Share2,
  Flame,
  Timer,
  Droplets,
  Wheat,
  Beef,
  ChefHat,
} from "lucide-react-native";
import { useState, useCallback } from "react";
import { LinearGradient } from "expo-linear-gradient";
import useRecipeStore from "@/lib/state/recipe-store";
import useAppStore, { recipeNutrition } from "@/lib/state/app-store";
import { useTheme } from "@/lib/theme-context";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
  SlideInRight,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();

  const recipes = useRecipeStore((s) => s.recipes);
  const favoriteIds = useRecipeStore((s) => s.favoriteIds);
  const toggleFavorite = useRecipeStore((s) => s.toggleFavorite);
  const videos = useRecipeStore((s) => s.videos);

  const addToShoppingList = useAppStore((s) => s.addToShoppingList);

  const recipe = recipes.find((r) => r.id === id);
  const relatedVideo = videos.find((v) => v.recipeId === id);
  const isFavorite = recipe ? favoriteIds.includes(recipe.id) : false;
  const nutrition = recipe ? recipeNutrition[recipe.id] : null;

  const [activeTab, setActiveTab] = useState<"ingredients" | "instructions" | "nutrition">("ingredients");
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [showAddedToast, setShowAddedToast] = useState(false);

  const heartScale = useSharedValue(1);

  const heartAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const handleFavorite = useCallback(() => {
    if (!recipe) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    heartScale.value = withSequence(
      withTiming(1.4, { duration: 150 }),
      withSpring(1)
    );
    toggleFavorite(recipe.id);
  }, [recipe, toggleFavorite, heartScale]);

  const toggleStep = useCallback((step: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCompletedSteps((prev) =>
      prev.includes(step) ? prev.filter((s) => s !== step) : [...prev, step]
    );
  }, []);

  const handleAddToShoppingList = useCallback(() => {
    if (!recipe) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const items = recipe.ingredients.map((ing) => ({
      name: ing.name,
      amount: ing.amount,
      unit: ing.unit,
      recipeId: recipe.id,
      recipeName: recipe.title,
    }));
    addToShoppingList(items);
    setShowAddedToast(true);
    setTimeout(() => setShowAddedToast(false), 2000);
  }, [recipe, addToShoppingList]);

  const handleShare = useCallback(async () => {
    if (!recipe) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: `Check out this recipe: ${recipe.title}\n\n${recipe.description}\n\nFrom The Altum Connection`,
        title: recipe.title,
      });
    } catch (error) {
      console.log("Error sharing:", error);
    }
  }, [recipe]);

  const handleStartCooking = useCallback(() => {
    if (!recipe) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/cooking-mode?id=${recipe.id}`);
  }, [recipe, router]);

  const handleWatchVideo = useCallback(() => {
    if (!relatedVideo) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/video-player?id=${relatedVideo.id}`);
  }, [relatedVideo, router]);

  if (!recipe) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.background }}>
        <Text style={{ color: colors.textSecondary }}>Recipe not found</Text>
      </View>
    );
  }

  const progress = recipe.instructions.length > 0
    ? (completedSteps.length / recipe.instructions.length) * 100
    : 0;

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Hero Image */}
      <View className="relative">
        <Image
          source={{ uri: recipe.image }}
          className="w-full h-96"
          resizeMode="cover"
        />
        <LinearGradient
          colors={["rgba(0,0,0,0.5)", "transparent", "rgba(0,0,0,0.7)"]}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        />

        {/* Header */}
        <SafeAreaView edges={["top"]} className="absolute top-0 left-0 right-0">
          <View className="flex-row items-center justify-between px-4 pt-2">
            <Pressable
              onPress={() => router.back()}
              className="w-11 h-11 bg-black/30 rounded-full items-center justify-center"
            >
              <ArrowLeft size={22} color="#fff" />
            </Pressable>
            <View className="flex-row gap-3">
              <Pressable
                onPress={handleShare}
                className="w-11 h-11 bg-black/30 rounded-full items-center justify-center"
              >
                <Share2 size={20} color="#fff" />
              </Pressable>
              <AnimatedPressable
                onPress={handleFavorite}
                className="w-11 h-11 bg-black/30 rounded-full items-center justify-center"
                style={heartAnimatedStyle}
              >
                <Heart
                  size={22}
                  color="#fff"
                  fill={isFavorite ? "#ef4444" : "transparent"}
                />
              </AnimatedPressable>
            </View>
          </View>
        </SafeAreaView>

        {/* Recipe Info Overlay */}
        <View className="absolute bottom-0 left-0 right-0 p-5">
          <Animated.View entering={FadeInUp.delay(100)} className="flex-row items-center gap-2 mb-3">
            <View className="px-3 py-1.5 rounded-full" style={{ backgroundColor: colors.primary }}>
              <Text className="text-xs font-bold text-white">{recipe.category}</Text>
            </View>
            <View className="bg-white/25 px-3 py-1.5 rounded-full">
              <Text className="text-xs font-semibold text-white">{recipe.difficulty}</Text>
            </View>
          </Animated.View>
          <Animated.Text entering={FadeInUp.delay(200)} className="text-3xl font-bold text-white">
            {recipe.title}
          </Animated.Text>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Quick Stats Card */}
        <Animated.View
          entering={FadeInDown.delay(100)}
          className="mx-5 -mt-6 rounded-3xl shadow-lg p-5"
          style={{ backgroundColor: colors.card }}
        >
          <View className="flex-row justify-around">
            {[
              { icon: Clock, label: "Prep", value: recipe.prepTime, color: colors.primary },
              { icon: Flame, label: "Cook", value: recipe.cookTime, color: "#F59E0B" },
              { icon: Users, label: "Serves", value: String(recipe.servings), color: "#8B5CF6" },
            ].map((stat) => (
              <View key={stat.label} className="items-center">
                <View
                  className="w-12 h-12 rounded-2xl items-center justify-center mb-2"
                  style={{ backgroundColor: `${stat.color}15` }}
                >
                  <stat.icon size={22} color={stat.color} />
                </View>
                <Text className="text-xs" style={{ color: colors.textTertiary }}>{stat.label}</Text>
                <Text className="text-sm font-bold" style={{ color: colors.text }}>{stat.value}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View entering={FadeInDown.delay(200)} className="flex-row gap-3 px-5 mt-5">
          <Pressable
            onPress={handleStartCooking}
            className="flex-1 flex-row items-center justify-center py-4 rounded-2xl"
            style={{ backgroundColor: colors.primary }}
          >
            <ChefHat size={20} color="#fff" />
            <Text className="text-white font-bold ml-2">Start Cooking</Text>
          </Pressable>
          <Pressable
            onPress={handleAddToShoppingList}
            className="w-14 h-14 rounded-2xl items-center justify-center border-2"
            style={{ borderColor: colors.primary }}
          >
            <ShoppingCart size={22} color={colors.primary} />
          </Pressable>
        </Animated.View>

        {/* Progress Bar */}
        {completedSteps.length > 0 && (
          <Animated.View entering={FadeIn} className="mx-5 mt-5">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-sm font-medium" style={{ color: colors.text }}>
                Cooking Progress
              </Text>
              <Text className="text-sm font-bold" style={{ color: colors.primary }}>
                {Math.round(progress)}%
              </Text>
            </View>
            <View className="h-2 rounded-full" style={{ backgroundColor: colors.borderLight }}>
              <View
                className="h-2 rounded-full"
                style={{
                  backgroundColor: colors.primary,
                  width: `${progress}%`,
                }}
              />
            </View>
          </Animated.View>
        )}

        {/* Description */}
        <Animated.View entering={FadeInDown.delay(300)} className="px-5 mt-5">
          <Text className="text-base leading-relaxed" style={{ color: colors.textSecondary }}>
            {recipe.description}
          </Text>
          {recipe.source && (
            <View className="flex-row items-center mt-3">
              <Text className="text-sm" style={{ color: colors.textTertiary }}>Source: </Text>
              <Text className="text-sm font-medium" style={{ color: colors.primary }}>{recipe.source.name}</Text>
            </View>
          )}
        </Animated.View>

        {/* Video Section */}
        {relatedVideo && (
          <Animated.View entering={FadeInDown.delay(350)} className="px-5 mt-6">
            <Pressable onPress={handleWatchVideo} className="relative rounded-2xl overflow-hidden">
              <Image
                source={{ uri: relatedVideo.thumbnail }}
                className="w-full h-48"
                resizeMode="cover"
              />
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.7)"]}
                style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
              />
              <View className="absolute inset-0 items-center justify-center">
                <View className="w-16 h-16 bg-white rounded-full items-center justify-center shadow-lg">
                  <Play size={28} color={colors.primary} fill={colors.primary} />
                </View>
              </View>
              <View className="absolute bottom-4 left-4 right-4 flex-row items-center justify-between">
                <View>
                  <Text className="text-white font-bold text-base">{relatedVideo.title}</Text>
                  <Text className="text-white/70 text-sm">{relatedVideo.source}</Text>
                </View>
                <View className="bg-black/60 px-3 py-1.5 rounded-full">
                  <Text className="text-white text-sm font-medium">{relatedVideo.duration}</Text>
                </View>
              </View>
            </Pressable>
          </Animated.View>
        )}

        {/* Tabs */}
        <Animated.View entering={FadeInDown.delay(400)} className="px-5 mt-6">
          <View className="flex-row rounded-2xl p-1.5" style={{ backgroundColor: colors.backgroundSecondary }}>
            {(["ingredients", "instructions", "nutrition"] as const).map((tab) => (
              <Pressable
                key={tab}
                onPress={() => {
                  Haptics.selectionAsync();
                  setActiveTab(tab);
                }}
                className={`flex-1 py-3 rounded-xl ${activeTab === tab ? "shadow-sm" : ""}`}
                style={activeTab === tab ? { backgroundColor: colors.card } : {}}
              >
                <Text
                  className="text-center text-sm font-semibold capitalize"
                  style={{ color: activeTab === tab ? colors.primary : colors.textTertiary }}
                >
                  {tab}
                </Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        {/* Tab Content */}
        <View className="px-5 mt-5 pb-32">
          {activeTab === "ingredients" && (
            <View className="gap-3">
              {recipe.ingredients.map((ingredient, index) => (
                <Animated.View
                  key={ingredient.id}
                  entering={SlideInRight.delay(50 * index).springify()}
                  className="flex-row items-center p-4 rounded-2xl"
                  style={{ backgroundColor: colors.card }}
                >
                  <View
                    className="w-12 h-12 rounded-xl items-center justify-center"
                    style={{ backgroundColor: colors.primaryLight }}
                  >
                    <Text className="font-bold" style={{ color: colors.primary }}>{index + 1}</Text>
                  </View>
                  <View className="flex-1 ml-4">
                    <Text className="text-base font-semibold" style={{ color: colors.text }}>
                      {ingredient.name}
                    </Text>
                    <Text className="text-sm mt-0.5" style={{ color: colors.textSecondary }}>
                      {ingredient.amount} {ingredient.unit}
                    </Text>
                  </View>
                </Animated.View>
              ))}
            </View>
          )}

          {activeTab === "instructions" && (
            <View className="gap-4">
              {recipe.instructions.map((instruction, index) => {
                const isCompleted = completedSteps.includes(instruction.step);
                return (
                  <Animated.View
                    key={instruction.step}
                    entering={SlideInRight.delay(50 * index).springify()}
                  >
                    <Pressable
                      onPress={() => toggleStep(instruction.step)}
                      className="flex-row p-4 rounded-2xl"
                      style={{
                        backgroundColor: colors.card,
                        opacity: isCompleted ? 0.6 : 1,
                      }}
                    >
                      <View
                        className="w-10 h-10 rounded-xl items-center justify-center"
                        style={{
                          backgroundColor: isCompleted ? colors.success : colors.primaryLight,
                        }}
                      >
                        {isCompleted ? (
                          <Check size={18} color="#fff" />
                        ) : (
                          <Text className="font-bold" style={{ color: colors.primary }}>
                            {instruction.step}
                          </Text>
                        )}
                      </View>
                      <View className="flex-1 ml-4">
                        <Text
                          className={`text-base leading-relaxed ${isCompleted ? "line-through" : ""}`}
                          style={{ color: isCompleted ? colors.textTertiary : colors.text }}
                        >
                          {instruction.text}
                        </Text>
                        {instruction.timer && (
                          <View className="flex-row items-center mt-3 gap-2">
                            <View
                              className="flex-row items-center px-3 py-1.5 rounded-full"
                              style={{ backgroundColor: colors.accentLight }}
                            >
                              <Timer size={14} color={colors.accent} />
                              <Text className="ml-1.5 text-sm font-semibold" style={{ color: colors.accent }}>
                                {instruction.timer} min
                              </Text>
                            </View>
                          </View>
                        )}
                      </View>
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>
          )}

          {activeTab === "nutrition" && nutrition && (
            <Animated.View entering={FadeIn} className="gap-4">
              {/* Calories Card */}
              <View className="p-5 rounded-2xl" style={{ backgroundColor: colors.card }}>
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3">
                    <View
                      className="w-14 h-14 rounded-2xl items-center justify-center"
                      style={{ backgroundColor: "#FEF3C7" }}
                    >
                      <Flame size={28} color="#F59E0B" />
                    </View>
                    <View>
                      <Text className="text-sm" style={{ color: colors.textTertiary }}>Calories</Text>
                      <Text className="text-2xl font-bold" style={{ color: colors.text }}>
                        {nutrition.calories}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-sm" style={{ color: colors.textTertiary }}>per serving</Text>
                </View>
              </View>

              {/* Macros Grid */}
              <View className="flex-row gap-3">
                {[
                  { label: "Protein", value: nutrition.protein, unit: "g", icon: Beef, color: "#EF4444", bg: "#FEE2E2" },
                  { label: "Carbs", value: nutrition.carbs, unit: "g", icon: Wheat, color: "#F59E0B", bg: "#FEF3C7" },
                  { label: "Fat", value: nutrition.fat, unit: "g", icon: Droplets, color: "#3B82F6", bg: "#DBEAFE" },
                ].map((macro) => (
                  <View
                    key={macro.label}
                    className="flex-1 p-4 rounded-2xl"
                    style={{ backgroundColor: colors.card }}
                  >
                    <View
                      className="w-10 h-10 rounded-xl items-center justify-center mb-2"
                      style={{ backgroundColor: macro.bg }}
                    >
                      <macro.icon size={20} color={macro.color} />
                    </View>
                    <Text className="text-xs" style={{ color: colors.textTertiary }}>{macro.label}</Text>
                    <Text className="text-lg font-bold" style={{ color: colors.text }}>
                      {macro.value}{macro.unit}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Other Nutrients */}
              <View className="p-4 rounded-2xl" style={{ backgroundColor: colors.card }}>
                {[
                  { label: "Fiber", value: `${nutrition.fiber}g` },
                  { label: "Sodium", value: `${nutrition.sodium}mg` },
                ].map((item, index) => (
                  <View
                    key={item.label}
                    className={`flex-row items-center justify-between py-3 ${
                      index > 0 ? "border-t" : ""
                    }`}
                    style={{ borderColor: colors.border }}
                  >
                    <Text style={{ color: colors.textSecondary }}>{item.label}</Text>
                    <Text className="font-semibold" style={{ color: colors.text }}>{item.value}</Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          )}
        </View>
      </ScrollView>

      {/* Toast Notification */}
      {showAddedToast && (
        <Animated.View
          entering={FadeInDown}
          className="absolute bottom-28 left-5 right-5"
        >
          <View
            className="flex-row items-center justify-center py-4 px-6 rounded-2xl"
            style={{ backgroundColor: colors.success }}
          >
            <Check size={20} color="#fff" />
            <Text className="text-white font-semibold ml-2">Added to shopping list!</Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
}
