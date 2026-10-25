import { View, Text, Pressable, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  Timer,
  Play,
  Pause,
  RotateCcw,
  Volume2,
} from "lucide-react-native";
import { useState, useEffect, useCallback, useRef } from "react";
import { LinearGradient } from "expo-linear-gradient";
import useRecipeStore from "@/lib/state/recipe-store";
import { useTheme } from "@/lib/theme-context";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInLeft,
  SlideInRight,
  SlideOutLeft,
  SlideOutRight,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";

const { width, height } = Dimensions.get("window");

export default function CookingModeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const recipes = useRecipeStore((s) => s.recipes);
  const recipe = recipes.find((r) => r.id === id);

  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pulseScale = useSharedValue(1);
  const progressWidth = useSharedValue(0);

  const currentInstruction = recipe?.instructions[currentStep];
  const totalSteps = recipe?.instructions.length ?? 0;
  const progress = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0;

  useEffect(() => {
    progressWidth.value = withTiming(progress, { duration: 300 });
  }, [progress, progressWidth]);

  // Timer logic
  useEffect(() => {
    if (isTimerRunning && timerSeconds > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isTimerRunning, timerSeconds]);

  // Pulse animation for timer
  useEffect(() => {
    if (isTimerRunning) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 500, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      pulseScale.value = withTiming(1);
    }
  }, [isTimerRunning, pulseScale]);

  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const startTimer = useCallback((minutes: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTimerSeconds(minutes * 60);
    setIsTimerRunning(true);
  }, []);

  const toggleTimer = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsTimerRunning((prev) => !prev);
  }, []);

  const resetTimer = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsTimerRunning(false);
    if (currentInstruction?.timer) {
      setTimerSeconds(currentInstruction.timer * 60);
    } else {
      setTimerSeconds(0);
    }
  }, [currentInstruction]);

  const speakInstruction = useCallback(async () => {
    if (!currentInstruction) return;

    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
      return;
    }

    setIsSpeaking(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    await Speech.speak(currentInstruction.text, {
      language: "en-US",
      pitch: 1.0,
      rate: 0.9,
      onDone: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  }, [currentInstruction, isSpeaking]);

  const goToNextStep = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setCompletedSteps((prev) => [...prev, currentStep]);
      setCurrentStep((prev) => prev + 1);
      setIsTimerRunning(false);
      Speech.stop();
      setIsSpeaking(false);

      // Auto-set timer for next step if available
      const nextInstruction = recipe?.instructions[currentStep + 1];
      if (nextInstruction?.timer) {
        setTimerSeconds(nextInstruction.timer * 60);
      } else {
        setTimerSeconds(0);
      }
    }
  }, [currentStep, totalSteps, recipe]);

  const goToPrevStep = useCallback(() => {
    if (currentStep > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setCurrentStep((prev) => prev - 1);
      setIsTimerRunning(false);
      Speech.stop();
      setIsSpeaking(false);

      const prevInstruction = recipe?.instructions[currentStep - 1];
      if (prevInstruction?.timer) {
        setTimerSeconds(prevInstruction.timer * 60);
      } else {
        setTimerSeconds(0);
      }
    }
  }, [currentStep, recipe]);

  const handleClose = useCallback(() => {
    Speech.stop();
    router.back();
  }, [router]);

  const handleFinish = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Speech.stop();
    router.back();
  }, [router]);

  // Initialize timer for first step
  useEffect(() => {
    if (currentInstruction?.timer && timerSeconds === 0 && !isTimerRunning) {
      setTimerSeconds(currentInstruction.timer * 60);
    }
  }, [currentInstruction, timerSeconds, isTimerRunning]);

  if (!recipe) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.background }}>
        <Text style={{ color: colors.textSecondary }}>Recipe not found</Text>
      </View>
    );
  }

  const isLastStep = currentStep === totalSteps - 1;

  return (
    <View className="flex-1" style={{ backgroundColor: isDark ? "#0C0A09" : "#1C1917" }}>
      <LinearGradient
        colors={isDark ? ["#1C1917", "#0C0A09"] : ["#292524", "#1C1917"]}
        style={{ flex: 1 }}
      >
        <SafeAreaView className="flex-1">
          {/* Header */}
          <Animated.View entering={FadeInDown} className="px-5 pt-2 pb-4">
            <View className="flex-row items-center justify-between mb-4">
              <Pressable
                onPress={handleClose}
                className="w-10 h-10 bg-white/10 rounded-full items-center justify-center"
              >
                <X size={22} color="#fff" />
              </Pressable>
              <View className="flex-row items-center gap-2">
                <View className="bg-white/10 px-4 py-2 rounded-full">
                  <Text className="text-white font-semibold">
                    Step {currentStep + 1} of {totalSteps}
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={speakInstruction}
                className={`w-10 h-10 rounded-full items-center justify-center ${
                  isSpeaking ? "bg-orange-500" : "bg-white/10"
                }`}
              >
                <Volume2 size={20} color="#fff" />
              </Pressable>
            </View>

            {/* Progress Bar */}
            <View className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <Animated.View
                style={[progressAnimatedStyle, { backgroundColor: colors.primary }]}
                className="h-full rounded-full"
              />
            </View>
          </Animated.View>

          {/* Main Content */}
          <View className="flex-1 px-5 justify-center">
            <Animated.View
              key={currentStep}
              entering={SlideInRight.springify()}
              exiting={SlideOutLeft}
              className="items-center"
            >
              {/* Step Number */}
              <View
                className="w-20 h-20 rounded-full items-center justify-center mb-8"
                style={{ backgroundColor: colors.primary }}
              >
                <Text className="text-4xl font-bold text-white">
                  {currentStep + 1}
                </Text>
              </View>

              {/* Instruction Text */}
              <Text className="text-2xl font-semibold text-white text-center leading-relaxed mb-8 px-4">
                {currentInstruction?.text}
              </Text>

              {/* Timer Section */}
              {(currentInstruction?.timer || timerSeconds > 0) && (
                <Animated.View
                  entering={FadeInUp.delay(200)}
                  style={pulseAnimatedStyle}
                  className="items-center mb-8"
                >
                  <View
                    className="px-8 py-6 rounded-3xl"
                    style={{ backgroundColor: isTimerRunning ? colors.primary + "30" : "rgba(255,255,255,0.1)" }}
                  >
                    <Text
                      className="text-6xl font-bold text-center mb-4"
                      style={{ color: isTimerRunning ? colors.primary : "#fff" }}
                    >
                      {formatTime(timerSeconds)}
                    </Text>
                    <View className="flex-row items-center justify-center gap-4">
                      <Pressable
                        onPress={resetTimer}
                        className="w-12 h-12 bg-white/10 rounded-full items-center justify-center"
                      >
                        <RotateCcw size={20} color="#fff" />
                      </Pressable>
                      <Pressable
                        onPress={toggleTimer}
                        className="w-16 h-16 rounded-full items-center justify-center"
                        style={{ backgroundColor: isTimerRunning ? "#EF4444" : colors.primary }}
                      >
                        {isTimerRunning ? (
                          <Pause size={28} color="#fff" fill="#fff" />
                        ) : (
                          <Play size={28} color="#fff" fill="#fff" />
                        )}
                      </Pressable>
                      {currentInstruction?.timer && (
                        <Pressable
                          onPress={() => startTimer(currentInstruction.timer!)}
                          className="px-4 py-3 bg-white/10 rounded-xl"
                        >
                          <Text className="text-white font-medium">
                            {currentInstruction.timer}m
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                </Animated.View>
              )}
            </Animated.View>
          </View>

          {/* Navigation */}
          <Animated.View entering={FadeInUp} className="px-5 pb-4">
            <View className="flex-row items-center justify-between gap-4">
              <Pressable
                onPress={goToPrevStep}
                disabled={currentStep === 0}
                className={`flex-1 flex-row items-center justify-center py-5 rounded-2xl ${
                  currentStep === 0 ? "bg-white/5" : "bg-white/10"
                }`}
              >
                <ChevronLeft size={24} color={currentStep === 0 ? "#666" : "#fff"} />
                <Text
                  className="font-semibold ml-2"
                  style={{ color: currentStep === 0 ? "#666" : "#fff" }}
                >
                  Previous
                </Text>
              </Pressable>

              {isLastStep ? (
                <Pressable
                  onPress={handleFinish}
                  className="flex-1 flex-row items-center justify-center py-5 rounded-2xl"
                  style={{ backgroundColor: colors.success }}
                >
                  <Check size={24} color="#fff" />
                  <Text className="text-white font-semibold ml-2">Done!</Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={goToNextStep}
                  className="flex-1 flex-row items-center justify-center py-5 rounded-2xl"
                  style={{ backgroundColor: colors.primary }}
                >
                  <Text className="text-white font-semibold mr-2">Next</Text>
                  <ChevronRight size={24} color="#fff" />
                </Pressable>
              )}
            </View>

            {/* Step Dots */}
            <View className="flex-row items-center justify-center gap-2 mt-4">
              {recipe.instructions.map((_, index) => (
                <View
                  key={index}
                  className="rounded-full"
                  style={{
                    width: index === currentStep ? 24 : 8,
                    height: 8,
                    backgroundColor:
                      completedSteps.includes(index)
                        ? colors.success
                        : index === currentStep
                        ? colors.primary
                        : "rgba(255,255,255,0.2)",
                  }}
                />
              ))}
            </View>
          </Animated.View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
