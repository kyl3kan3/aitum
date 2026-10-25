import { View, Text, ScrollView, Pressable, Image, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Play, Bookmark, Clock, ChefHat, BookOpen } from "lucide-react-native";
import useRecipeStore from "@/lib/state/recipe-store";
import Animated, {
  FadeInDown,
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");
const videoCardWidth = width * 0.75;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function VideosScreen() {
  const router = useRouter();
  const videos = useRecipeStore((s) => s.videos);
  const savedVideoIds = useRecipeStore((s) => s.savedVideoIds);
  const toggleSavedVideo = useRecipeStore((s) => s.toggleSavedVideo);
  const recipes = useRecipeStore((s) => s.recipes);

  const featuredVideos = videos.slice(0, 2);
  const allVideos = videos;
  const savedVideos = videos.filter((v) => savedVideoIds.includes(v.id));

  const navigateToRecipe = (recipeId?: string) => {
    if (recipeId) {
      router.push(`/recipe/${recipeId}`);
    }
  };

  return (
    <View className="flex-1 bg-zinc-50 dark:bg-zinc-950">
      <SafeAreaView edges={["top"]} className="flex-1">
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <Animated.View entering={FadeInDown.delay(100)} className="px-5 pt-2 pb-4">
            <Text className="text-2xl font-bold text-zinc-900 dark:text-white">
              Video Tutorials
            </Text>
            <Text className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Learn from the best chefs
            </Text>
          </Animated.View>

          {/* Featured Videos */}
          <Animated.View entering={FadeInDown.delay(200)} className="mb-6">
            <Text className="text-lg font-semibold text-zinc-900 dark:text-white mb-3 px-5">
              Featured
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 16 }}
              style={{ flexGrow: 0 }}
              decelerationRate="fast"
              snapToInterval={videoCardWidth + 16}
            >
              {featuredVideos.map((video, index) => {
                const recipe = recipes.find((r) => r.id === video.recipeId);
                const isSaved = savedVideoIds.includes(video.id);

                return (
                  <Animated.View key={video.id} entering={FadeInRight.delay(100 * index)}>
                    <VideoCard
                      video={video}
                      recipe={recipe}
                      isSaved={isSaved}
                      onToggleSave={() => toggleSavedVideo(video.id)}
                      onPress={() => navigateToRecipe(video.recipeId)}
                      variant="featured"
                    />
                  </Animated.View>
                );
              })}
            </ScrollView>
          </Animated.View>

          {/* Saved Videos */}
          {savedVideos.length > 0 && (
            <Animated.View entering={FadeInDown.delay(300)} className="mb-6">
              <View className="flex-row items-center gap-2 mb-3 px-5">
                <Bookmark size={18} color="#f97316" fill="#f97316" />
                <Text className="text-lg font-semibold text-zinc-900 dark:text-white">
                  Saved Videos
                </Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
                style={{ flexGrow: 0 }}
              >
                {savedVideos.map((video, index) => {
                  const recipe = recipes.find((r) => r.id === video.recipeId);
                  return (
                    <Animated.View key={video.id} entering={FadeInRight.delay(50 * index)}>
                      <VideoCard
                        video={video}
                        recipe={recipe}
                        isSaved={true}
                        onToggleSave={() => toggleSavedVideo(video.id)}
                        onPress={() => navigateToRecipe(video.recipeId)}
                        variant="small"
                      />
                    </Animated.View>
                  );
                })}
              </ScrollView>
            </Animated.View>
          )}

          {/* All Videos */}
          <Animated.View entering={FadeInDown.delay(400)} className="px-5 pb-8">
            <Text className="text-lg font-semibold text-zinc-900 dark:text-white mb-3">
              All Videos
            </Text>
            <View className="gap-4">
              {allVideos.map((video, index) => {
                const recipe = recipes.find((r) => r.id === video.recipeId);
                const isSaved = savedVideoIds.includes(video.id);
                return (
                  <Animated.View key={video.id} entering={FadeInDown.delay(50 * index)}>
                    <VideoCard
                      video={video}
                      recipe={recipe}
                      isSaved={isSaved}
                      onToggleSave={() => toggleSavedVideo(video.id)}
                      onPress={() => navigateToRecipe(video.recipeId)}
                      variant="horizontal"
                    />
                  </Animated.View>
                );
              })}
            </View>
          </Animated.View>

          {/* Upload CTA */}
          <Animated.View entering={FadeInDown.delay(500)} className="px-5 pb-8">
            <View className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-5">
              <View className="flex-row items-center gap-3 mb-3">
                <View className="w-12 h-12 bg-white/20 rounded-full items-center justify-center">
                  <BookOpen size={24} color="#fff" />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-bold text-white">
                    Have a Cookbook?
                  </Text>
                  <Text className="text-sm text-white/80">
                    Upload recipes from your collection
                  </Text>
                </View>
              </View>
              <Pressable className="bg-white py-3 rounded-xl">
                <Text className="text-center text-orange-600 font-semibold">
                  Upload Cookbook
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

interface VideoCardProps {
  video: { id: string; title: string; thumbnail: string; duration: string; source: string; recipeId?: string };
  recipe?: { title: string; cookTime: string };
  isSaved: boolean;
  onToggleSave: () => void;
  onPress: () => void;
  variant: "featured" | "small" | "horizontal";
}

function VideoCard({ video, recipe, isSaved, onToggleSave, onPress, variant }: VideoCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  if (variant === "featured") {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[animatedStyle, { width: videoCardWidth }]}
      >
        <View className="relative">
          <Image
            source={{ uri: video.thumbnail }}
            className="w-full h-44 rounded-2xl"
            resizeMode="cover"
          />
          <View className="absolute inset-0 bg-black/20 rounded-2xl items-center justify-center">
            <View className="w-14 h-14 bg-white/90 rounded-full items-center justify-center">
              <Play size={24} color="#f97316" fill="#f97316" />
            </View>
          </View>
          <View className="absolute bottom-3 left-3 bg-black/70 px-2 py-1 rounded">
            <Text className="text-xs text-white font-medium">{video.duration}</Text>
          </View>
          <Pressable
            onPress={onToggleSave}
            className="absolute top-3 right-3 w-9 h-9 bg-black/40 rounded-full items-center justify-center"
            hitSlop={10}
          >
            <Bookmark
              size={18}
              color="#fff"
              fill={isSaved ? "#fff" : "transparent"}
            />
          </Pressable>
        </View>
        <View className="mt-3">
          <Text className="text-base font-semibold text-zinc-900 dark:text-white" numberOfLines={1}>
            {video.title}
          </Text>
          <View className="flex-row items-center gap-2 mt-1">
            <Text className="text-sm text-zinc-500">{video.source}</Text>
            {recipe && (
              <>
                <View className="w-1 h-1 bg-zinc-400 rounded-full" />
                <View className="flex-row items-center gap-1">
                  <Clock size={12} color="#71717a" />
                  <Text className="text-sm text-zinc-500">{recipe.cookTime}</Text>
                </View>
              </>
            )}
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
        className="w-36"
      >
        <View className="relative">
          <Image
            source={{ uri: video.thumbnail }}
            className="w-full h-24 rounded-xl"
            resizeMode="cover"
          />
          <View className="absolute inset-0 bg-black/20 rounded-xl items-center justify-center">
            <View className="w-10 h-10 bg-white/90 rounded-full items-center justify-center">
              <Play size={16} color="#f97316" fill="#f97316" />
            </View>
          </View>
          <View className="absolute bottom-2 right-2 bg-black/70 px-1.5 py-0.5 rounded">
            <Text className="text-[10px] text-white font-medium">{video.duration}</Text>
          </View>
        </View>
        <Text className="text-sm font-medium text-zinc-900 dark:text-white mt-2" numberOfLines={1}>
          {video.title}
        </Text>
      </AnimatedPressable>
    );
  }

  // horizontal variant
  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={animatedStyle}
      className="flex-row bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-sm"
    >
      <View className="relative">
        <Image
          source={{ uri: video.thumbnail }}
          className="w-32 h-24"
          resizeMode="cover"
        />
        <View className="absolute inset-0 bg-black/20 items-center justify-center">
          <View className="w-10 h-10 bg-white/90 rounded-full items-center justify-center">
            <Play size={16} color="#f97316" fill="#f97316" />
          </View>
        </View>
        <View className="absolute bottom-2 right-2 bg-black/70 px-1.5 py-0.5 rounded">
          <Text className="text-[10px] text-white font-medium">{video.duration}</Text>
        </View>
      </View>
      <View className="flex-1 p-3 justify-between">
        <View>
          <Text className="text-base font-medium text-zinc-900 dark:text-white" numberOfLines={1}>
            {video.title}
          </Text>
          <Text className="text-xs text-zinc-500 mt-0.5">{video.source}</Text>
        </View>
        <View className="flex-row items-center justify-between">
          {recipe && (
            <View className="flex-row items-center gap-1">
              <ChefHat size={12} color="#71717a" />
              <Text className="text-xs text-zinc-500" numberOfLines={1}>
                {recipe.title}
              </Text>
            </View>
          )}
          <Pressable onPress={onToggleSave} hitSlop={10}>
            <Bookmark
              size={18}
              color={isSaved ? "#f97316" : "#71717a"}
              fill={isSaved ? "#f97316" : "transparent"}
            />
          </Pressable>
        </View>
      </View>
    </AnimatedPressable>
  );
}
