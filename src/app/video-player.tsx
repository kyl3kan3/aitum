import { View, Text, Pressable, Image, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  X,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize,
} from "lucide-react-native";
import { useState, useCallback, useEffect } from "react";
import { LinearGradient } from "expo-linear-gradient";
import useRecipeStore from "@/lib/state/recipe-store";
import { useTheme } from "@/lib/theme-context";
import Animated, {
  FadeIn,
  FadeOut,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

const { width, height } = Dimensions.get("window");

export default function VideoPlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();

  const videos = useRecipeStore((s) => s.videos);
  const recipes = useRecipeStore((s) => s.recipes);
  const toggleSavedVideo = useRecipeStore((s) => s.toggleSavedVideo);
  const savedVideoIds = useRecipeStore((s) => s.savedVideoIds);

  const video = videos.find((v) => v.id === id);
  const recipe = video?.recipeId ? recipes.find((r) => r.id === video.recipeId) : null;
  const isSaved = video ? savedVideoIds.includes(video.id) : false;

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const progressWidth = useSharedValue(0);

  // Parse duration string to seconds
  useEffect(() => {
    if (video?.duration) {
      const parts = video.duration.split(":");
      const mins = parseInt(parts[0], 10);
      const secs = parseInt(parts[1], 10);
      setDuration(mins * 60 + secs);
    }
  }, [video]);

  // Simulate video progress
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isPlaying && currentTime < duration) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          const newTime = Math.min(prev + 1, duration);
          progressWidth.value = withTiming((newTime / duration) * 100, { duration: 1000 });
          if (newTime >= duration) {
            setIsPlaying(false);
          }
          return newTime;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, currentTime, duration, progressWidth]);

  // Auto-hide controls
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    if (showControls && isPlaying) {
      timeout = setTimeout(() => setShowControls(false), 3000);
    }
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [showControls, isPlaying]);

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const togglePlay = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsPlaying((prev) => !prev);
    setShowControls(true);
  }, []);

  const toggleMute = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsMuted((prev) => !prev);
  }, []);

  const handleSkipBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentTime((prev) => Math.max(0, prev - 10));
    progressWidth.value = withTiming((Math.max(0, currentTime - 10) / duration) * 100);
  }, [currentTime, duration, progressWidth]);

  const handleSkipForward = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentTime((prev) => Math.min(duration, prev + 10));
    progressWidth.value = withTiming((Math.min(duration, currentTime + 10) / duration) * 100);
  }, [currentTime, duration, progressWidth]);

  const handleScreenPress = useCallback(() => {
    setShowControls((prev) => !prev);
  }, []);

  if (!video) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <Text className="text-white">Video not found</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      {/* Video Thumbnail/Player Area */}
      <Pressable onPress={handleScreenPress} className="flex-1">
        <Image
          source={{ uri: video.thumbnail }}
          className="w-full h-full"
          resizeMode="cover"
        />

        {/* Overlay Gradient */}
        {showControls && (
          <Animated.View
            entering={FadeIn}
            exiting={FadeOut}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          >
            <LinearGradient
              colors={["rgba(0,0,0,0.7)", "transparent", "rgba(0,0,0,0.7)"]}
              style={{ flex: 1 }}
            />
          </Animated.View>
        )}

        {/* Top Controls */}
        {showControls && (
          <Animated.View
            entering={FadeInDown}
            exiting={FadeOut}
            className="absolute top-0 left-0 right-0"
          >
            <SafeAreaView edges={["top"]}>
              <View className="flex-row items-center justify-between px-4 py-2">
                <Pressable
                  onPress={() => router.back()}
                  className="w-10 h-10 bg-black/40 rounded-full items-center justify-center"
                >
                  <X size={22} color="#fff" />
                </Pressable>
                <View className="flex-1 mx-4">
                  <Text className="text-white font-semibold text-base" numberOfLines={1}>
                    {video.title}
                  </Text>
                  <Text className="text-white/70 text-sm">{video.source}</Text>
                </View>
              </View>
            </SafeAreaView>
          </Animated.View>
        )}

        {/* Center Play Button */}
        {showControls && (
          <Animated.View
            entering={FadeIn}
            exiting={FadeOut}
            className="absolute inset-0 items-center justify-center"
          >
            <View className="flex-row items-center gap-8">
              <Pressable
                onPress={handleSkipBack}
                className="w-12 h-12 bg-white/20 rounded-full items-center justify-center"
              >
                <SkipBack size={24} color="#fff" fill="#fff" />
              </Pressable>
              <Pressable
                onPress={togglePlay}
                className="w-20 h-20 bg-white rounded-full items-center justify-center"
              >
                {isPlaying ? (
                  <Pause size={36} color="#000" fill="#000" />
                ) : (
                  <Play size={36} color="#000" fill="#000" style={{ marginLeft: 4 }} />
                )}
              </Pressable>
              <Pressable
                onPress={handleSkipForward}
                className="w-12 h-12 bg-white/20 rounded-full items-center justify-center"
              >
                <SkipForward size={24} color="#fff" fill="#fff" />
              </Pressable>
            </View>
          </Animated.View>
        )}

        {/* Bottom Controls */}
        {showControls && (
          <Animated.View
            entering={FadeIn}
            exiting={FadeOut}
            className="absolute bottom-0 left-0 right-0"
          >
            <SafeAreaView edges={["bottom"]}>
              <View className="px-4 pb-4">
                {/* Progress Bar */}
                <View className="mb-4">
                  <View className="h-1.5 bg-white/30 rounded-full overflow-hidden">
                    <Animated.View
                      style={[progressAnimatedStyle, { backgroundColor: colors.primary }]}
                      className="h-full rounded-full"
                    />
                  </View>
                  <View className="flex-row justify-between mt-2">
                    <Text className="text-white/70 text-xs">{formatTime(currentTime)}</Text>
                    <Text className="text-white/70 text-xs">{formatTime(duration)}</Text>
                  </View>
                </View>

                {/* Bottom Actions */}
                <View className="flex-row items-center justify-between">
                  <Pressable
                    onPress={toggleMute}
                    className="w-10 h-10 bg-black/40 rounded-full items-center justify-center"
                  >
                    {isMuted ? (
                      <VolumeX size={20} color="#fff" />
                    ) : (
                      <Volume2 size={20} color="#fff" />
                    )}
                  </Pressable>

                  {recipe && (
                    <Pressable
                      onPress={() => router.push(`/recipe/${recipe.id}`)}
                      className="flex-row items-center bg-white/20 px-4 py-2 rounded-full"
                    >
                      <Text className="text-white text-sm font-medium">View Recipe</Text>
                    </Pressable>
                  )}

                  <Pressable className="w-10 h-10 bg-black/40 rounded-full items-center justify-center">
                    <Maximize size={20} color="#fff" />
                  </Pressable>
                </View>
              </View>
            </SafeAreaView>
          </Animated.View>
        )}
      </Pressable>
    </View>
  );
}
