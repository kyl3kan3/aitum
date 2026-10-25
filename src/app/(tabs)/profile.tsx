import { View, Text, ScrollView, Pressable, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Heart,
  Bookmark,
  Settings,
  ChevronRight,
  BookOpen,
  Video,
  Bell,
  HelpCircle,
  LogOut,
  Camera,
  X,
  ShoppingCart,
  Calendar,
  FolderHeart,
  CloudUpload,
  ChefHat,
  Clock,
} from "lucide-react-native";
import useRecipeStore from "@/lib/state/recipe-store";
import useAppStore from "@/lib/state/app-store";
import { useTheme } from "@/lib/theme-context";
import { RecipeCard } from "@/components/RecipeCard";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useCloudRecipes, useScanHistory } from "@/lib/cloud-hooks";

export default function ProfileScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const recipes = useRecipeStore((s) => s.recipes);
  const favoriteIds = useRecipeStore((s) => s.favoriteIds);
  const savedVideoIds = useRecipeStore((s) => s.savedVideoIds);
  const capturedPhotos = useRecipeStore((s) => s.capturedPhotos);
  const removeCapturedPhoto = useRecipeStore((s) => s.removeCapturedPhoto);
  const shoppingListCount = useAppStore((s) => s.shoppingList.length);
  const collectionsCount = useAppStore((s) => s.collections.length);

  // Cloud data
  const { data: cloudRecipes = [] } = useCloudRecipes();
  const { data: scanHistory = [] } = useScanHistory();

  const favoriteRecipes = recipes.filter((r) => favoriteIds.includes(r.id));

  const navigateToRecipe = (recipeId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/recipe/${recipeId}`);
  };

  const navigateToCamera = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/camera");
  };

  const stats = [
    { label: "Saved Recipes", value: cloudRecipes.length, icon: CloudUpload, color: "#10B981" },
    { label: "Favorites", value: favoriteIds.length, icon: Heart, color: "#ef4444" },
    { label: "Scans", value: scanHistory.length, icon: Camera, color: "#8b5cf6" },
  ];

  const menuItems = [
    { label: "Shopping List", icon: ShoppingCart, badge: shoppingListCount > 0 ? String(shoppingListCount) : null, route: "/shopping-list" },
    { label: "Meal Planner", icon: Calendar, badge: null, route: "/meal-planner" },
    { label: "My Collections", icon: FolderHeart, badge: String(collectionsCount), route: "/collections" },
    { label: "My Cookbooks", icon: BookOpen, badge: "3", route: null },
    { label: "Saved Videos", icon: Video, badge: savedVideoIds.length > 0 ? String(savedVideoIds.length) : null, route: null },
    { label: "Notifications", icon: Bell, badge: "2", route: null },
    { label: "Settings", icon: Settings, badge: null, route: "/settings" },
    { label: "Help & Support", icon: HelpCircle, badge: null, route: null },
  ];

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: 200 }}
      />
      <SafeAreaView edges={["top"]} className="flex-1">
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Profile Header */}
          <Animated.View entering={FadeInDown.delay(100)} className="items-center pt-4 pb-8">
            <View className="w-24 h-24 rounded-full bg-white p-1 shadow-lg">
              <Image
                source={{ uri: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200" }}
                className="w-full h-full rounded-full"
              />
            </View>
            <Text className="text-xl font-bold text-white mt-3">Sarah Johnson</Text>
            <Text className="text-white/80 text-sm">Home Chef & Recipe Collector</Text>
          </Animated.View>

          {/* Stats */}
          <Animated.View
            entering={FadeInDown.delay(200)}
            className="mx-5 rounded-2xl p-4 shadow-sm -mt-2"
            style={{ backgroundColor: colors.card }}
          >
            <View className="flex-row justify-around">
              {stats.map((stat) => (
                <View key={stat.label} className="items-center">
                  <View
                    className="w-12 h-12 rounded-full items-center justify-center mb-2"
                    style={{ backgroundColor: `${stat.color}15` }}
                  >
                    <stat.icon size={22} color={stat.color} />
                  </View>
                  <Text className="text-xl font-bold" style={{ color: colors.text }}>
                    {stat.value}
                  </Text>
                  <Text className="text-xs" style={{ color: colors.textTertiary }}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Take Photo Button */}
          <Animated.View entering={FadeInDown.delay(250)} className="mx-5 mt-5">
            <Pressable
              onPress={navigateToCamera}
              className="rounded-2xl py-4 flex-row items-center justify-center shadow-sm"
              style={{ backgroundColor: colors.primary }}
            >
              <Camera size={22} color="#fff" />
              <Text className="text-white font-semibold text-base ml-2">Take Photo</Text>
            </Pressable>
          </Animated.View>

          {/* Cloud Saved Recipes */}
          {cloudRecipes.length > 0 && (
            <Animated.View entering={FadeInDown.delay(290)} className="mt-5">
              <View className="flex-row items-center justify-between px-5 mb-3">
                <View className="flex-row items-center gap-2">
                  <CloudUpload size={18} color="#10B981" />
                  <Text className="text-lg font-semibold" style={{ color: colors.text }}>
                    My Saved Recipes ({cloudRecipes.length})
                  </Text>
                </View>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
                style={{ flexGrow: 0 }}
              >
                {cloudRecipes.slice(0, 10).map((recipe, index) => (
                  <Animated.View key={recipe.id} entering={FadeInRight.delay(50 * index)}>
                    <Pressable
                      onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                      className="w-44 rounded-2xl overflow-hidden"
                      style={{ backgroundColor: colors.card }}
                    >
                      {recipe.sourceImageUri ? (
                        <Image
                          source={{ uri: recipe.sourceImageUri }}
                          className="w-full h-24"
                          resizeMode="cover"
                        />
                      ) : (
                        <View
                          className="w-full h-24 items-center justify-center"
                          style={{ backgroundColor: colors.primaryLight }}
                        >
                          <ChefHat size={32} color={colors.primary} />
                        </View>
                      )}
                      <View className="p-3">
                        <Text
                          className="font-semibold text-sm mb-1"
                          style={{ color: colors.text }}
                          numberOfLines={1}
                        >
                          {recipe.title}
                        </Text>
                        <View className="flex-row items-center">
                          <Clock size={12} color={colors.textTertiary} />
                          <Text className="text-xs ml-1" style={{ color: colors.textTertiary }}>
                            {recipe.cookTime}
                          </Text>
                          <View
                            className="ml-2 px-1.5 py-0.5 rounded"
                            style={{
                              backgroundColor:
                                recipe.difficulty === "Easy"
                                  ? "#22C55E20"
                                  : recipe.difficulty === "Medium"
                                  ? "#EAB30820"
                                  : "#EF444420",
                            }}
                          >
                            <Text
                              className="text-xs"
                              style={{
                                color:
                                  recipe.difficulty === "Easy"
                                    ? "#22C55E"
                                    : recipe.difficulty === "Medium"
                                    ? "#EAB308"
                                    : "#EF4444",
                              }}
                            >
                              {recipe.difficulty}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </Pressable>
                  </Animated.View>
                ))}
              </ScrollView>
            </Animated.View>
          )}

          {/* Captured Photos */}
          {capturedPhotos.length > 0 && (
            <Animated.View entering={FadeInDown.delay(280)} className="mt-5">
              <View className="flex-row items-center justify-between px-5 mb-3">
                <View className="flex-row items-center gap-2">
                  <Camera size={18} color="#8b5cf6" />
                  <Text className="text-lg font-semibold" style={{ color: colors.text }}>
                    My Photos
                  </Text>
                </View>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
                style={{ flexGrow: 0 }}
              >
                {capturedPhotos.map((photo, index) => (
                  <Animated.View key={photo} entering={FadeInRight.delay(50 * index)}>
                    <View className="relative">
                      <Image
                        source={{ uri: photo }}
                        className="w-28 h-28 rounded-2xl"
                        resizeMode="cover"
                      />
                      <Pressable
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                          removeCapturedPhoto(photo);
                        }}
                        className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 rounded-full items-center justify-center shadow-sm"
                      >
                        <X size={14} color="#fff" />
                      </Pressable>
                    </View>
                  </Animated.View>
                ))}
              </ScrollView>
            </Animated.View>
          )}

          {/* Favorite Recipes */}
          {favoriteRecipes.length > 0 && (
            <Animated.View entering={FadeInDown.delay(300)} className="mt-6">
              <View className="flex-row items-center justify-between px-5 mb-3">
                <View className="flex-row items-center gap-2">
                  <Heart size={18} color="#ef4444" fill="#ef4444" />
                  <Text className="text-lg font-semibold" style={{ color: colors.text }}>
                    Favorite Recipes
                  </Text>
                </View>
                <Pressable>
                  <Text className="text-sm font-medium" style={{ color: colors.primary }}>See all</Text>
                </Pressable>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, gap: 16 }}
                style={{ flexGrow: 0 }}
              >
                {favoriteRecipes.slice(0, 5).map((recipe, index) => (
                  <Animated.View key={recipe.id} entering={FadeInRight.delay(50 * index)}>
                    <RecipeCard
                      recipe={recipe}
                      onPress={() => navigateToRecipe(recipe.id)}
                      variant="small"
                    />
                  </Animated.View>
                ))}
              </ScrollView>
            </Animated.View>
          )}

          {/* Empty Favorites State */}
          {favoriteRecipes.length === 0 && (
            <Animated.View entering={FadeInDown.delay(300)} className="mx-5 mt-6">
              <View className="rounded-2xl p-6 items-center" style={{ backgroundColor: colors.card }}>
                <View
                  className="w-16 h-16 rounded-full items-center justify-center mb-3"
                  style={{ backgroundColor: "#fee2e2" }}
                >
                  <Heart size={28} color="#ef4444" />
                </View>
                <Text className="text-base font-medium mb-1" style={{ color: colors.text }}>
                  No favorites yet
                </Text>
                <Text className="text-sm text-center" style={{ color: colors.textSecondary }}>
                  Tap the heart icon on recipes to save them here
                </Text>
              </View>
            </Animated.View>
          )}

          {/* Menu Items */}
          <Animated.View entering={FadeInDown.delay(400)} className="mx-5 mt-6 mb-4">
            <View className="rounded-2xl overflow-hidden" style={{ backgroundColor: colors.card }}>
              {menuItems.map((item, index) => (
                <Pressable
                  key={item.label}
                  onPress={() => {
                    if (item.route) {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push(item.route as never);
                    }
                  }}
                  className={`flex-row items-center px-4 py-4 ${
                    index !== menuItems.length - 1 ? "border-b" : ""
                  }`}
                  style={{ borderColor: colors.border }}
                >
                  <View
                    className="w-10 h-10 rounded-full items-center justify-center"
                    style={{ backgroundColor: colors.backgroundSecondary }}
                  >
                    <item.icon size={20} color={colors.textSecondary} />
                  </View>
                  <Text className="flex-1 ml-3 text-base" style={{ color: colors.text }}>
                    {item.label}
                  </Text>
                  {item.badge && (
                    <View className="px-2.5 py-0.5 rounded-full mr-2" style={{ backgroundColor: colors.primary }}>
                      <Text className="text-xs text-white font-medium">{item.badge}</Text>
                    </View>
                  )}
                  <ChevronRight size={20} color={colors.textTertiary} />
                </Pressable>
              ))}
            </View>
          </Animated.View>

          {/* Sign Out */}
          <Animated.View entering={FadeInDown.delay(500)} className="mx-5 mb-8">
            <Pressable
              className="flex-row items-center justify-center rounded-2xl py-4"
              style={{ backgroundColor: colors.card }}
            >
              <LogOut size={20} color={colors.error} />
              <Text className="ml-2 text-base font-medium" style={{ color: colors.error }}>Sign Out</Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
