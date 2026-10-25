import { View, Text, Pressable, Image, ScrollView, Dimensions, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRef, useState } from "react";
import {
  X,
  RotateCcw,
  Check,
  Camera,
  Zap,
  ZapOff,
  ImagePlus,
  Utensils,
  Sparkles,
  ChefHat,
  Clock,
  Users,
  ArrowRight,
  Leaf,
  Beef,
  Apple,
  Milk,
  Wheat,
  Flame,
  Package,
} from "lucide-react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
  withRepeat,
  Easing,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import useRecipeStore from "@/lib/state/recipe-store";
import { useTheme } from "@/lib/theme-context";
import {
  analyzeAndGenerateRecipes,
  isAIServiceAvailable,
  type AnalyzedIngredient,
  type GeneratedRecipe,
} from "@/lib/ai-service";
import { useSaveRecipe, useAddScanToHistory } from "@/lib/cloud-hooks";
import { BookmarkPlus, BookmarkCheck } from "lucide-react-native";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const { width } = Dimensions.get("window");

type ScanState = "camera" | "preview" | "analyzing" | "results";

const categoryIcons: Record<string, typeof Leaf> = {
  protein: Beef,
  vegetable: Leaf,
  fruit: Apple,
  dairy: Milk,
  grain: Wheat,
  spice: Flame,
  other: Package,
};

const categoryColors: Record<string, string> = {
  protein: "#EF4444",
  vegetable: "#22C55E",
  fruit: "#F97316",
  dairy: "#3B82F6",
  grain: "#EAB308",
  spice: "#EC4899",
  other: "#6B7280",
};

export default function ScanScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<"front" | "back">("back");
  const [flash, setFlash] = useState<"off" | "on">("off");
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [scanState, setScanState] = useState<ScanState>("camera");
  const [ingredients, setIngredients] = useState<AnalyzedIngredient[]>([]);
  const [recipes, setRecipes] = useState<GeneratedRecipe[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [savedRecipeIds, setSavedRecipeIds] = useState<Set<string>>(new Set());

  const addCapturedPhoto = useRecipeStore((s) => s.addCapturedPhoto);
  const capturedPhotos = useRecipeStore((s) => s.capturedPhotos);

  // Cloud hooks
  const saveRecipeMutation = useSaveRecipe();
  const addScanMutation = useAddScanToHistory();

  const shutterScale = useSharedValue(1);
  const pulseScale = useSharedValue(1);

  // Pulse animation for the capture button
  useState(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  });

  const shutterAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: shutterScale.value }],
  }));

  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const handleCapture = async () => {
    if (!cameraRef.current || isCapturing) return;

    setIsCapturing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    shutterScale.value = withSequence(
      withTiming(0.85, { duration: 100 }),
      withSpring(1, { damping: 10 })
    );

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });
      if (photo?.uri) {
        setCapturedPhoto(photo.uri);
        setScanState("preview");
      }
    } catch (err) {
      console.log("Error capturing photo:", err);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
    setScanState("camera");
    setIngredients([]);
    setRecipes([]);
    setError(null);
    setSavedRecipeIds(new Set());
  };

  const handleAnalyze = async () => {
    if (!capturedPhoto) return;

    setScanState("analyzing");
    setError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const result = await analyzeAndGenerateRecipes(capturedPhoto);
      setIngredients(result.ingredients);
      setRecipes(result.recipes);
      setScanState("results");

      if (result.ingredients.length === 0) {
        setError("No food items detected. Try taking a clearer photo.");
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Save scan to cloud history
        addScanMutation.mutate({
          imageUri: capturedPhoto,
          ingredients: result.ingredients,
          generatedRecipes: result.recipes.map((r) => r.id),
        });
      }
    } catch (err) {
      console.error("Analysis error:", err);
      setError("Failed to analyze image. Please try again.");
      setScanState("preview");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleSaveRecipeToCloud = async (recipe: GeneratedRecipe) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await saveRecipeMutation.mutateAsync({
        title: recipe.title,
        description: recipe.description,
        cookTime: recipe.cookTime,
        servings: recipe.servings,
        difficulty: recipe.difficulty,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        tips: recipe.tips,
        sourceType: "ai_generated",
        sourceImageUri: capturedPhoto || undefined,
        isFavorite: false,
      });

      setSavedRecipeIds((prev) => new Set(prev).add(recipe.id));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      console.error("Error saving recipe:", err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleSavePhoto = () => {
    if (capturedPhoto) {
      addCapturedPhoto(capturedPhoto);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const toggleFacing = () => {
    setFacing((prev) => (prev === "back" ? "front" : "back"));
  };

  const toggleFlash = () => {
    setFlash((prev) => (prev === "off" ? "on" : "off"));
  };

  // Permission not determined yet
  if (!permission) {
    return (
      <View className="flex-1 bg-zinc-950 items-center justify-center">
        <Text className="text-white">Loading camera...</Text>
      </View>
    );
  }

  // Permission denied - show compelling permission request
  if (!permission.granted) {
    return (
      <View className="flex-1 bg-zinc-950">
        <LinearGradient colors={["#18181b", "#09090b"]} style={{ flex: 1 }}>
          <SafeAreaView className="flex-1 items-center justify-center px-8">
            <Animated.View entering={FadeInDown.delay(100)} className="items-center">
              <View className="w-28 h-28 bg-orange-500/20 rounded-full items-center justify-center mb-6">
                <View className="w-20 h-20 bg-orange-500/30 rounded-full items-center justify-center">
                  <Camera size={40} color="#f97316" />
                </View>
              </View>

              <Text className="text-2xl font-bold text-white text-center mb-3">
                Snap Your Ingredients
              </Text>
              <Text className="text-zinc-400 text-center mb-8 leading-6">
                Take photos of your ingredients and get instant recipe suggestions powered by AI
              </Text>

              <View className="flex-row gap-4 mb-8">
                <View className="items-center">
                  <View className="w-14 h-14 bg-zinc-800 rounded-2xl items-center justify-center mb-2">
                    <Camera size={24} color="#f97316" />
                  </View>
                  <Text className="text-zinc-500 text-xs">Scan</Text>
                </View>
                <View className="items-center">
                  <View className="w-14 h-14 bg-zinc-800 rounded-2xl items-center justify-center mb-2">
                    <Sparkles size={24} color="#f97316" />
                  </View>
                  <Text className="text-zinc-500 text-xs">Analyze</Text>
                </View>
                <View className="items-center">
                  <View className="w-14 h-14 bg-zinc-800 rounded-2xl items-center justify-center mb-2">
                    <ChefHat size={24} color="#f97316" />
                  </View>
                  <Text className="text-zinc-500 text-xs">Cook</Text>
                </View>
              </View>

              <Pressable onPress={requestPermission} className="bg-orange-500 px-10 py-4 rounded-2xl">
                <Text className="text-white font-semibold text-base">Enable Camera</Text>
              </Pressable>
            </Animated.View>
          </SafeAreaView>
        </LinearGradient>
      </View>
    );
  }

  // Results view
  if (scanState === "results" && capturedPhoto) {
    return (
      <View className="flex-1" style={{ backgroundColor: colors.background }}>
        <SafeAreaView edges={["top"]} className="flex-1">
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 py-3">
            <Pressable onPress={handleRetake} className="flex-row items-center">
              <ArrowRight size={20} color={colors.text} style={{ transform: [{ rotate: "180deg" }] }} />
              <Text className="ml-2 font-medium" style={{ color: colors.text }}>
                New Scan
              </Text>
            </Pressable>
            <Pressable
              onPress={handleSavePhoto}
              className="px-4 py-2 rounded-full"
              style={{ backgroundColor: colors.primaryLight }}
            >
              <Text className="font-medium" style={{ color: colors.primary }}>
                Save Photo
              </Text>
            </Pressable>
          </View>

          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            {/* Scanned Image Preview */}
            <View className="px-5 mb-4">
              <Image
                source={{ uri: capturedPhoto }}
                className="w-full h-48 rounded-2xl"
                resizeMode="cover"
              />
            </View>

            {/* Error State */}
            {error && (
              <Animated.View entering={FadeIn} className="mx-5 mb-4 p-4 rounded-xl bg-red-500/10">
                <Text className="text-red-500 text-center">{error}</Text>
              </Animated.View>
            )}

            {/* Detected Ingredients */}
            {ingredients.length > 0 && (
              <Animated.View entering={FadeInDown.delay(100)} className="px-5 mb-6">
                <Text className="text-lg font-semibold mb-3" style={{ color: colors.text }}>
                  Detected Ingredients ({ingredients.length})
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {ingredients.map((ingredient, index) => {
                    const IconComponent = categoryIcons[ingredient.category] || Package;
                    const bgColor = categoryColors[ingredient.category] || "#6B7280";
                    return (
                      <Animated.View
                        key={`${ingredient.name}-${index}`}
                        entering={FadeInDown.delay(150 + index * 50)}
                        className="flex-row items-center px-3 py-2 rounded-full"
                        style={{ backgroundColor: `${bgColor}15` }}
                      >
                        <IconComponent size={14} color={bgColor} />
                        <Text className="ml-1.5 text-sm font-medium" style={{ color: bgColor }}>
                          {ingredient.name}
                        </Text>
                        {ingredient.quantity && (
                          <Text className="ml-1 text-xs opacity-70" style={{ color: bgColor }}>
                            ({ingredient.quantity})
                          </Text>
                        )}
                      </Animated.View>
                    );
                  })}
                </View>
              </Animated.View>
            )}

            {/* Recipe Suggestions */}
            {recipes.length > 0 && (
              <Animated.View entering={FadeInDown.delay(300)} className="px-5 pb-8">
                <Text className="text-lg font-semibold mb-4" style={{ color: colors.text }}>
                  Recipe Suggestions
                </Text>
                <View className="gap-4">
                  {recipes.map((recipe, index) => (
                    <Animated.View
                      key={recipe.id}
                      entering={FadeInDown.delay(400 + index * 100)}
                    >
                      <Pressable
                        className="rounded-2xl overflow-hidden"
                        style={{ backgroundColor: colors.card }}
                        onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                      >
                        <LinearGradient
                          colors={[colors.primary, colors.primaryDark]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={{ padding: 16 }}
                        >
                          <View className="flex-row items-center justify-between">
                            <View className="flex-1">
                              <Text className="text-white font-bold text-lg mb-1">
                                {recipe.title}
                              </Text>
                              <Text className="text-white/80 text-sm" numberOfLines={2}>
                                {recipe.description}
                              </Text>
                            </View>
                            <View className="w-12 h-12 bg-white/20 rounded-full items-center justify-center ml-3">
                              <ChefHat size={24} color="#fff" />
                            </View>
                          </View>
                        </LinearGradient>

                        <View className="p-4">
                          {/* Meta info */}
                          <View className="flex-row items-center gap-4 mb-4">
                            <View className="flex-row items-center">
                              <Clock size={14} color={colors.textSecondary} />
                              <Text className="ml-1 text-sm" style={{ color: colors.textSecondary }}>
                                {recipe.cookTime}
                              </Text>
                            </View>
                            <View className="flex-row items-center">
                              <Users size={14} color={colors.textSecondary} />
                              <Text className="ml-1 text-sm" style={{ color: colors.textSecondary }}>
                                {recipe.servings} servings
                              </Text>
                            </View>
                            <View
                              className="px-2 py-0.5 rounded-full"
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
                                className="text-xs font-medium"
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

                          {/* Ingredients preview */}
                          <Text className="font-medium mb-2" style={{ color: colors.text }}>
                            Ingredients:
                          </Text>
                          <View className="mb-3">
                            {recipe.ingredients.slice(0, 4).map((ing, i) => (
                              <Text key={i} className="text-sm mb-1" style={{ color: colors.textSecondary }}>
                                • {ing}
                              </Text>
                            ))}
                            {recipe.ingredients.length > 4 && (
                              <Text className="text-sm italic" style={{ color: colors.textTertiary }}>
                                +{recipe.ingredients.length - 4} more
                              </Text>
                            )}
                          </View>

                          {/* Instructions preview */}
                          <Text className="font-medium mb-2" style={{ color: colors.text }}>
                            Instructions:
                          </Text>
                          <View>
                            {recipe.instructions.slice(0, 3).map((step, i) => (
                              <View key={i} className="flex-row mb-2">
                                <View
                                  className="w-5 h-5 rounded-full items-center justify-center mr-2"
                                  style={{ backgroundColor: colors.primaryLight }}
                                >
                                  <Text className="text-xs font-bold" style={{ color: colors.primary }}>
                                    {i + 1}
                                  </Text>
                                </View>
                                <Text className="flex-1 text-sm" style={{ color: colors.textSecondary }}>
                                  {step}
                                </Text>
                              </View>
                            ))}
                            {recipe.instructions.length > 3 && (
                              <Text className="text-sm italic ml-7" style={{ color: colors.textTertiary }}>
                                +{recipe.instructions.length - 3} more steps
                              </Text>
                            )}
                          </View>

                          {/* Tips */}
                          {recipe.tips && (
                            <View className="mt-3 p-3 rounded-xl" style={{ backgroundColor: colors.primaryLight }}>
                              <View className="flex-row items-start">
                                <Sparkles size={14} color={colors.primary} />
                                <Text className="ml-2 flex-1 text-sm" style={{ color: colors.primary }}>
                                  {recipe.tips}
                                </Text>
                              </View>
                            </View>
                          )}

                          {/* Save to Cloud Button */}
                          <Pressable
                            onPress={() => handleSaveRecipeToCloud(recipe)}
                            disabled={savedRecipeIds.has(recipe.id) || saveRecipeMutation.isPending}
                            className="mt-4 py-3 rounded-xl flex-row items-center justify-center"
                            style={{
                              backgroundColor: savedRecipeIds.has(recipe.id)
                                ? "#22C55E20"
                                : colors.primary,
                            }}
                          >
                            {saveRecipeMutation.isPending ? (
                              <ActivityIndicator size="small" color="#fff" />
                            ) : savedRecipeIds.has(recipe.id) ? (
                              <>
                                <BookmarkCheck size={18} color="#22C55E" />
                                <Text className="ml-2 font-semibold" style={{ color: "#22C55E" }}>
                                  Saved to Recipes
                                </Text>
                              </>
                            ) : (
                              <>
                                <BookmarkPlus size={18} color="#fff" />
                                <Text className="ml-2 font-semibold text-white">
                                  Save Recipe
                                </Text>
                              </>
                            )}
                          </Pressable>
                        </View>
                      </Pressable>
                    </Animated.View>
                  ))}
                </View>
              </Animated.View>
            )}
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // Analyzing view
  if (scanState === "analyzing") {
    return (
      <View className="flex-1 bg-zinc-950 items-center justify-center">
        <Animated.View entering={FadeIn} className="items-center px-8">
          <View className="w-24 h-24 bg-orange-500/20 rounded-full items-center justify-center mb-6">
            <ActivityIndicator size="large" color="#f97316" />
          </View>
          <Text className="text-white text-xl font-semibold mb-2">Analyzing...</Text>
          <Text className="text-zinc-400 text-center">
            AI is identifying ingredients and generating recipe suggestions
          </Text>
        </Animated.View>
      </View>
    );
  }

  // Photo captured - show preview
  if (scanState === "preview" && capturedPhoto) {
    return (
      <View className="flex-1 bg-black">
        <Image source={{ uri: capturedPhoto }} className="flex-1" resizeMode="cover" />
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.8)"]}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 200,
          }}
        />
        <SafeAreaView edges={["top"]} className="absolute top-0 left-0 right-0">
          <Pressable
            onPress={handleRetake}
            className="m-4 w-12 h-12 bg-black/50 rounded-full items-center justify-center"
          >
            <X size={24} color="#fff" />
          </Pressable>
        </SafeAreaView>
        <SafeAreaView edges={["bottom"]} className="absolute bottom-0 left-0 right-0">
          <Animated.View entering={FadeInUp} className="items-center pb-8 pt-4">
            <Text className="text-white/80 text-sm mb-6">What would you like to do?</Text>
            <View className="flex-row items-center gap-6">
              <Pressable onPress={handleRetake} className="items-center">
                <View className="w-16 h-16 bg-white/20 rounded-full items-center justify-center mb-2">
                  <RotateCcw size={28} color="#fff" />
                </View>
                <Text className="text-white text-sm">Retake</Text>
              </Pressable>

              {isAIServiceAvailable() ? (
                <Pressable onPress={handleAnalyze} className="items-center">
                  <View className="w-20 h-20 bg-orange-500 rounded-full items-center justify-center mb-2 shadow-lg">
                    <Sparkles size={36} color="#fff" />
                  </View>
                  <Text className="text-white text-sm font-medium">Analyze</Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={() => {
                    if (capturedPhoto) {
                      addCapturedPhoto(capturedPhoto);
                      handleRetake();
                    }
                  }}
                  className="items-center"
                >
                  <View className="w-20 h-20 bg-orange-500 rounded-full items-center justify-center mb-2 shadow-lg">
                    <Check size={36} color="#fff" />
                  </View>
                  <Text className="text-white text-sm font-medium">Save</Text>
                </Pressable>
              )}

              <Pressable
                onPress={() => {
                  if (capturedPhoto) {
                    addCapturedPhoto(capturedPhoto);
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  }
                }}
                className="items-center"
              >
                <View className="w-16 h-16 bg-white/20 rounded-full items-center justify-center mb-2">
                  <ImagePlus size={28} color="#fff" />
                </View>
                <Text className="text-white text-sm">Save</Text>
              </Pressable>
            </View>
          </Animated.View>
        </SafeAreaView>
      </View>
    );
  }

  // Camera view
  return (
    <View className="flex-1 bg-black">
      <CameraView ref={cameraRef} style={{ flex: 1 }} facing={facing} flash={flash}>
        {/* Top Controls */}
        <SafeAreaView edges={["top"]} className="absolute top-0 left-0 right-0 z-10">
          <View className="flex-row items-center justify-between px-5 py-3">
            <View className="flex-row items-center gap-2">
              <Sparkles size={20} color="#f97316" />
              <Text className="text-white font-semibold">AI Food Scanner</Text>
            </View>
            <View className="flex-row gap-3">
              <Pressable
                onPress={toggleFlash}
                className="w-11 h-11 bg-black/40 rounded-full items-center justify-center"
              >
                {flash === "on" ? (
                  <Zap size={20} color="#f97316" fill="#f97316" />
                ) : (
                  <ZapOff size={20} color="#fff" />
                )}
              </Pressable>
              <Pressable
                onPress={toggleFacing}
                className="w-11 h-11 bg-black/40 rounded-full items-center justify-center"
              >
                <RotateCcw size={20} color="#fff" />
              </Pressable>
            </View>
          </View>
        </SafeAreaView>

        {/* Center Guide */}
        <View className="flex-1 items-center justify-center">
          <View className="w-72 h-72 relative">
            {/* Corner brackets */}
            <View className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-orange-500 rounded-tl-2xl" />
            <View className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-orange-500 rounded-tr-2xl" />
            <View className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-orange-500 rounded-bl-2xl" />
            <View className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-orange-500 rounded-br-2xl" />
          </View>
          <Text className="text-white/70 text-sm mt-6 font-medium">
            Point at your ingredients
          </Text>
        </View>

        {/* Recent Photos Preview */}
        {capturedPhotos.length > 0 && (
          <View className="absolute left-5 bottom-36">
            <Pressable onPress={() => router.push("/(tabs)/profile")} className="relative">
              <Image
                source={{ uri: capturedPhotos[capturedPhotos.length - 1] }}
                className="w-14 h-14 rounded-xl border-2 border-white"
              />
              {capturedPhotos.length > 1 && (
                <View className="absolute -top-2 -right-2 w-6 h-6 bg-orange-500 rounded-full items-center justify-center">
                  <Text className="text-white text-xs font-bold">{capturedPhotos.length}</Text>
                </View>
              )}
            </Pressable>
          </View>
        )}

        {/* Bottom Controls */}
        <SafeAreaView edges={["bottom"]} className="absolute bottom-0 left-0 right-0">
          <View className="items-center pb-6 pt-4">
            {/* Capture Button */}
            <Animated.View style={pulseAnimatedStyle}>
              <AnimatedPressable onPress={handleCapture} disabled={isCapturing} style={shutterAnimatedStyle}>
                <View className="w-20 h-20 rounded-full bg-white/20 items-center justify-center">
                  <View className="w-16 h-16 rounded-full bg-white items-center justify-center border-4 border-orange-500">
                    <View className="w-12 h-12 rounded-full bg-orange-500" />
                  </View>
                </View>
              </AnimatedPressable>
            </Animated.View>

            <Text className="text-white/60 text-xs mt-4">Tap to scan ingredients</Text>
          </View>
        </SafeAreaView>
      </CameraView>
    </View>
  );
}
