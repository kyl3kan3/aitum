import { View, Text, Pressable, Image } from "react-native";
import { Heart, Clock, Users } from "lucide-react-native";
import { cn } from "@/lib/cn";
import useRecipeStore, { Recipe } from "@/lib/state/recipe-store";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming
} from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface RecipeCardProps {
  recipe: Recipe;
  onPress: () => void;
  variant?: "large" | "small" | "horizontal";
}

export function RecipeCard({ recipe, onPress, variant = "large" }: RecipeCardProps) {
  const toggleFavorite = useRecipeStore((s) => s.toggleFavorite);
  const favoriteIds = useRecipeStore((s) => s.favoriteIds);
  const isFavorite = favoriteIds.includes(recipe.id);

  const scale = useSharedValue(1);
  const heartScale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const heartAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const handleFavorite = () => {
    heartScale.value = withSequence(
      withTiming(1.3, { duration: 150 }),
      withSpring(1)
    );
    toggleFavorite(recipe.id);
  };

  if (variant === "horizontal") {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={animatedStyle}
        className="flex-row bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-sm"
      >
        <Image
          source={{ uri: recipe.image }}
          className="w-28 h-28"
          resizeMode="cover"
        />
        <View className="flex-1 p-3 justify-between">
          <View>
            <Text className="text-base font-semibold text-zinc-900 dark:text-white" numberOfLines={1}>
              {recipe.title}
            </Text>
            <Text className="text-xs text-zinc-500 dark:text-zinc-400 mt-1" numberOfLines={2}>
              {recipe.description}
            </Text>
          </View>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <View className="flex-row items-center gap-1">
                <Clock size={12} color="#71717a" />
                <Text className="text-xs text-zinc-500">{recipe.cookTime}</Text>
              </View>
              <View className="flex-row items-center gap-1">
                <Users size={12} color="#71717a" />
                <Text className="text-xs text-zinc-500">{recipe.servings}</Text>
              </View>
            </View>
            <Pressable onPress={handleFavorite} hitSlop={10}>
              <Animated.View style={heartAnimatedStyle}>
                <Heart
                  size={18}
                  color={isFavorite ? "#ef4444" : "#71717a"}
                  fill={isFavorite ? "#ef4444" : "transparent"}
                />
              </Animated.View>
            </Pressable>
          </View>
        </View>
      </AnimatedPressable>
    );
  }

  if (variant === "small") {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={animatedStyle}
        className="w-40"
      >
        <View className="relative">
          <Image
            source={{ uri: recipe.image }}
            className="w-full h-32 rounded-2xl"
            resizeMode="cover"
          />
          <Pressable
            onPress={handleFavorite}
            className="absolute top-2 right-2 w-8 h-8 bg-black/30 rounded-full items-center justify-center"
            hitSlop={10}
          >
            <Animated.View style={heartAnimatedStyle}>
              <Heart
                size={16}
                color="#fff"
                fill={isFavorite ? "#ef4444" : "transparent"}
              />
            </Animated.View>
          </Pressable>
        </View>
        <Text className="text-sm font-medium text-zinc-900 dark:text-white mt-2" numberOfLines={1}>
          {recipe.title}
        </Text>
        <Text className="text-xs text-zinc-500 dark:text-zinc-400">{recipe.cookTime}</Text>
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={animatedStyle}
      className="w-full"
    >
      <View className="relative">
        <Image
          source={{ uri: recipe.image }}
          className="w-full h-48 rounded-3xl"
          resizeMode="cover"
        />
        <View className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-3xl" />
        <Pressable
          onPress={handleFavorite}
          className="absolute top-3 right-3 w-10 h-10 bg-white/20 backdrop-blur rounded-full items-center justify-center"
          hitSlop={10}
        >
          <Animated.View style={heartAnimatedStyle}>
            <Heart
              size={20}
              color="#fff"
              fill={isFavorite ? "#ef4444" : "transparent"}
            />
          </Animated.View>
        </Pressable>
        <View className="absolute bottom-4 left-4 right-4">
          <View className="flex-row items-center gap-2 mb-1">
            <View className="bg-amber-500 px-2 py-0.5 rounded-full">
              <Text className="text-xs font-medium text-white">{recipe.category}</Text>
            </View>
            <View className="bg-white/20 px-2 py-0.5 rounded-full">
              <Text className="text-xs font-medium text-white">{recipe.difficulty}</Text>
            </View>
          </View>
          <Text className="text-xl font-bold text-white" numberOfLines={1}>
            {recipe.title}
          </Text>
          <View className="flex-row items-center gap-4 mt-1">
            <View className="flex-row items-center gap-1">
              <Clock size={14} color="#fff" />
              <Text className="text-sm text-white/90">{recipe.cookTime}</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Users size={14} color="#fff" />
              <Text className="text-sm text-white/90">{recipe.servings} servings</Text>
            </View>
          </View>
        </View>
      </View>
    </AnimatedPressable>
  );
}
