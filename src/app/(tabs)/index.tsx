import { View, Text, ScrollView, Pressable, Image, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search, Clock, ChevronRight, ShoppingCart, Calendar, FolderHeart, Settings } from "lucide-react-native";
import { useRouter } from "expo-router";
import useRecipeStore, { Recipe } from "@/lib/state/recipe-store";
import useAppStore from "@/lib/state/app-store";
import { useTheme } from "@/lib/theme-context";
import Animated, {
  FadeInDown,
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
  useAnimatedScrollHandler,
  SharedValue,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 60;
const CARD_SPACING = 16;

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const recipes = useRecipeStore((s) => s.recipes);
  const shoppingListCount = useAppStore((s) => s.shoppingList.length);

  const featuredRecipes = recipes.slice(0, 4);
  const scrollX = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const navigateToRecipe = (recipeId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/recipe/${recipeId}`);
  };

  const navigateToSearch = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/search");
  };

  const quickActions = [
    { key: "shopping", label: "Shopping", icon: ShoppingCart, route: "/shopping-list", badge: shoppingListCount },
    { key: "planner", label: "Meal Plan", icon: Calendar, route: "/meal-planner", badge: 0 },
    { key: "collections", label: "Collections", icon: FolderHeart, route: "/collections", badge: 0 },
    { key: "settings", label: "Settings", icon: Settings, route: "/settings", badge: 0 },
  ];

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <SafeAreaView edges={["top"]} className="flex-1">
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <Animated.View entering={FadeInDown.delay(100)} className="px-5 pt-4 pb-6">
            <Text className="text-3xl font-bold" style={{ color: colors.text }}>
              The Altum Connection
            </Text>
            <Text className="text-base mt-1" style={{ color: colors.textSecondary }}>
              Discover delicious recipes
            </Text>
          </Animated.View>

          {/* Search Bar */}
          <Animated.View entering={FadeInDown.delay(200)} className="px-5 mb-6">
            <Pressable onPress={navigateToSearch}>
              <View
                className="flex-row items-center rounded-2xl px-4 py-4 border"
                style={{ backgroundColor: colors.card, borderColor: colors.border }}
              >
                <Search size={22} color={colors.primary} />
                <Text className="ml-3 flex-1 text-base" style={{ color: colors.textTertiary }}>
                  Search recipes...
                </Text>
              </View>
            </Pressable>
          </Animated.View>

          {/* Quick Actions */}
          <Animated.View entering={FadeInDown.delay(250)} className="px-5 mb-6">
            <View className="flex-row gap-3">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Animated.View key={action.key} entering={FadeInRight.delay(100 * index)} className="flex-1">
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.push(action.route as never);
                      }}
                      className="items-center py-4 rounded-2xl relative"
                      style={{ backgroundColor: colors.card }}
                    >
                      <View
                        className="w-12 h-12 rounded-xl items-center justify-center mb-2"
                        style={{ backgroundColor: colors.primaryLight }}
                      >
                        <Icon size={22} color={colors.primary} />
                      </View>
                      <Text className="text-xs font-medium" style={{ color: colors.text }}>
                        {action.label}
                      </Text>
                      {action.badge > 0 && (
                        <View
                          className="absolute top-2 right-2 w-5 h-5 rounded-full items-center justify-center"
                          style={{ backgroundColor: colors.primary }}
                        >
                          <Text className="text-[10px] text-white font-bold">{action.badge}</Text>
                        </View>
                      )}
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>
          </Animated.View>

          {/* Featured Recipes Carousel */}
          <Animated.View entering={FadeInDown.delay(300)}>
            <View className="flex-row items-center justify-between px-5 mb-4">
              <Text className="text-xl font-bold" style={{ color: colors.text }}>
                Featured Recipes
              </Text>
              <Pressable onPress={navigateToSearch} className="flex-row items-center">
                <Text className="font-medium mr-1" style={{ color: colors.primary }}>See all</Text>
                <ChevronRight size={18} color={colors.primary} />
              </Pressable>
            </View>

            <Animated.ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: CARD_SPACING }}
              style={{ flexGrow: 0 }}
              decelerationRate="fast"
              snapToInterval={CARD_WIDTH + CARD_SPACING}
              onScroll={scrollHandler}
              scrollEventThrottle={16}
            >
              {featuredRecipes.map((recipe, index) => (
                <FeaturedCard
                  key={recipe.id}
                  recipe={recipe}
                  index={index}
                  scrollX={scrollX}
                  colors={colors}
                  onPress={() => navigateToRecipe(recipe.id)}
                />
              ))}
            </Animated.ScrollView>

            {/* Carousel Dots */}
            <View className="flex-row justify-center mt-4 gap-2">
              {featuredRecipes.map((_, index) => (
                <CarouselDot key={index} index={index} scrollX={scrollX} colors={colors} />
              ))}
            </View>
          </Animated.View>

          {/* All Recipes Section */}
          <Animated.View entering={FadeInDown.delay(400)} className="px-5 mt-8 pb-8">
            <Text className="text-xl font-bold mb-4" style={{ color: colors.text }}>
              All Recipes
            </Text>
            <View className="gap-4">
              {recipes.map((recipe, index) => (
                <Animated.View key={recipe.id} entering={FadeInDown.delay(50 * index)}>
                  <RecipeListItem
                    recipe={recipe}
                    colors={colors}
                    onPress={() => navigateToRecipe(recipe.id)}
                  />
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

interface FeaturedCardProps {
  recipe: Recipe;
  index: number;
  scrollX: SharedValue<number>;
  colors: ReturnType<typeof useTheme>["colors"];
  onPress: () => void;
}

function FeaturedCard({ recipe, index, scrollX, colors, onPress }: FeaturedCardProps) {
  const inputRange = [
    (index - 1) * (CARD_WIDTH + CARD_SPACING),
    index * (CARD_WIDTH + CARD_SPACING),
    (index + 1) * (CARD_WIDTH + CARD_SPACING),
  ];

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(scrollX.value, inputRange, [0.95, 1, 0.95], "clamp");
    const opacity = interpolate(scrollX.value, inputRange, [0.7, 1, 0.7], "clamp");
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  return (
    <Animated.View style={[{ width: CARD_WIDTH }, animatedStyle]}>
      <Pressable onPress={onPress} className="relative">
        <Image
          source={{ uri: recipe.image }}
          className="w-full h-56 rounded-3xl"
          resizeMode="cover"
        />
        {/* Overlay gradient */}
        <View className="absolute inset-0 bg-black/40 rounded-3xl" />

        {/* Content */}
        <View className="absolute bottom-0 left-0 right-0 p-5">
          {/* Category badge */}
          <View className="flex-row mb-2">
            <View className="px-3 py-1 rounded-full" style={{ backgroundColor: colors.primary }}>
              <Text className="text-xs font-semibold text-white">{recipe.category}</Text>
            </View>
          </View>

          {/* Title */}
          <Text className="text-2xl font-bold text-white mb-2" numberOfLines={2}>
            {recipe.title}
          </Text>

          {/* Cook time */}
          <View className="flex-row items-center mb-4">
            <Clock size={16} color="#fff" />
            <Text className="text-white ml-2 text-sm">{recipe.cookTime}</Text>
          </View>

          {/* View Recipe Button */}
          <Pressable
            onPress={onPress}
            className="bg-white py-3 px-6 rounded-xl self-start"
          >
            <Text className="font-semibold text-base" style={{ color: colors.primary }}>View Recipe</Text>
          </Pressable>
        </View>
      </Pressable>
    </Animated.View>
  );
}

interface CarouselDotProps {
  index: number;
  scrollX: SharedValue<number>;
  colors: ReturnType<typeof useTheme>["colors"];
}

function CarouselDot({ index, scrollX, colors }: CarouselDotProps) {
  const inputRange = [
    (index - 1) * (CARD_WIDTH + CARD_SPACING),
    index * (CARD_WIDTH + CARD_SPACING),
    (index + 1) * (CARD_WIDTH + CARD_SPACING),
  ];

  const animatedStyle = useAnimatedStyle(() => {
    const w = interpolate(scrollX.value, inputRange, [8, 24, 8], "clamp");
    const opacity = interpolate(scrollX.value, inputRange, [0.4, 1, 0.4], "clamp");
    return {
      width: w,
      opacity,
    };
  });

  return (
    <Animated.View
      style={[animatedStyle, { backgroundColor: colors.primary }]}
      className="h-2 rounded-full"
    />
  );
}

interface RecipeListItemProps {
  recipe: Recipe;
  colors: ReturnType<typeof useTheme>["colors"];
  onPress: () => void;
}

function RecipeListItem({ recipe, colors, onPress }: RecipeListItemProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.98); }}
      onPressOut={() => { scale.value = withSpring(1); }}
    >
      <Animated.View
        style={[animatedStyle, { backgroundColor: colors.card }]}
        className="flex-row rounded-2xl overflow-hidden shadow-sm"
      >
        <Image
          source={{ uri: recipe.image }}
          className="w-28 h-28"
          resizeMode="cover"
        />
        <View className="flex-1 p-4 justify-between">
          <View>
            <Text className="text-base font-semibold" style={{ color: colors.text }} numberOfLines={1}>
              {recipe.title}
            </Text>
            <Text className="text-sm mt-1" style={{ color: colors.textSecondary }} numberOfLines={2}>
              {recipe.description}
            </Text>
          </View>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-1">
              <Clock size={14} color={colors.primary} />
              <Text className="text-sm font-medium" style={{ color: colors.primary }}>{recipe.cookTime}</Text>
            </View>
            <View className="px-3 py-1 rounded-full" style={{ backgroundColor: colors.primaryLight }}>
              <Text className="text-xs font-medium" style={{ color: colors.primary }}>
                {recipe.category}
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}
