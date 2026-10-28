import React, { useCallback, useMemo } from "react";
import { View, Text, Pressable, Dimensions, ScrollView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import {
  ChefHat,
  Clock,
  Target,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  Star,
  Heart,
  Zap,
  BookOpen,
  ShoppingCart,
  Calendar,
  Camera,
  Play,
  Users,
  TrendingUp,
  Award,
  Shield,
} from "lucide-react-native";
import useOnboardingStore from "@/lib/state/onboarding-store";
import { useTheme } from "@/lib/theme-context";

const { width, height } = Dimensions.get("window");

// Onboarding steps enum
const STEPS = {
  INTRO: 0,
  QUIZ_LEVEL: 1,
  QUIZ_GOALS: 2,
  QUIZ_TIME: 3,
  RESULTS: 4,
  SYMPTOMS: 5,
  HOW_APP_HELPS: 6,
  REVIEWS: 7,
  FEATURES: 8,
  CUSTOM_PLAN: 9,
  PAYWALL: 10,
} as const;

const TOTAL_STEPS = 11;

export default function OnboardingScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const currentStep = useOnboardingStore((s) => s.currentStep);
  const nextStep = useOnboardingStore((s) => s.nextStep);
  const previousStep = useOnboardingStore((s) => s.previousStep);
  const setQuizAnswer = useOnboardingStore((s) => s.setQuizAnswer);
  const quizAnswers = useOnboardingStore((s) => s.quizAnswers);
  const setOnboardingComplete = useOnboardingStore((s) => s.setOnboardingComplete);

  const handleNext = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    nextStep();
  }, [nextStep]);

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    previousStep();
  }, [previousStep]);

  const handleComplete = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setOnboardingComplete(true);
    router.replace("/(tabs)");
  }, [router, setOnboardingComplete]);

  const handleSelectAnswer = useCallback(
    (questionId: string, answer: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setQuizAnswer({ questionId, answer });
      // Auto-advance after selection
      setTimeout(() => {
        nextStep();
      }, 300);
    },
    [setQuizAnswer, nextStep]
  );

  const handleSelectMultiple = useCallback(
    (questionId: string, answer: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const existing = quizAnswers.find((a) => a.questionId === questionId);
      const currentAnswers = Array.isArray(existing?.answer) ? existing.answer : [];
      const newAnswers = currentAnswers.includes(answer)
        ? currentAnswers.filter((a) => a !== answer)
        : [...currentAnswers, answer];
      setQuizAnswer({ questionId, answer: newAnswers });
    },
    [quizAnswers, setQuizAnswer]
  );

  const getSelectedAnswers = useCallback(
    (questionId: string): string[] => {
      const answer = quizAnswers.find((a) => a.questionId === questionId);
      if (!answer) return [];
      return Array.isArray(answer.answer) ? answer.answer : [answer.answer];
    },
    [quizAnswers]
  );

  const progressPercent = useMemo(() => {
    return ((currentStep + 1) / TOTAL_STEPS) * 100;
  }, [currentStep]);

  const renderStep = () => {
    switch (currentStep) {
      case STEPS.INTRO:
        return <IntroStep onNext={handleNext} colors={colors} />;
      case STEPS.QUIZ_LEVEL:
        return (
          <QuizLevelStep
            onSelect={(answer) => handleSelectAnswer("cooking_level", answer)}
            colors={colors}
          />
        );
      case STEPS.QUIZ_GOALS:
        return (
          <QuizGoalsStep
            selectedAnswers={getSelectedAnswers("cooking_goals")}
            onSelect={(answer) => handleSelectMultiple("cooking_goals", answer)}
            onNext={handleNext}
            colors={colors}
          />
        );
      case STEPS.QUIZ_TIME:
        return (
          <QuizTimeStep
            onSelect={(answer) => handleSelectAnswer("cooking_time", answer)}
            colors={colors}
          />
        );
      case STEPS.RESULTS:
        return <ResultsStep onNext={handleNext} quizAnswers={quizAnswers} colors={colors} />;
      case STEPS.SYMPTOMS:
        return (
          <SymptomsStep
            selectedAnswers={getSelectedAnswers("challenges")}
            onSelect={(answer) => handleSelectMultiple("challenges", answer)}
            onNext={handleNext}
            colors={colors}
          />
        );
      case STEPS.HOW_APP_HELPS:
        return <HowAppHelpsStep onNext={handleNext} colors={colors} />;
      case STEPS.REVIEWS:
        return <ReviewsStep onNext={handleNext} colors={colors} />;
      case STEPS.FEATURES:
        return <FeaturesStep onNext={handleNext} colors={colors} />;
      case STEPS.CUSTOM_PLAN:
        return <CustomPlanStep onNext={handleNext} quizAnswers={quizAnswers} colors={colors} />;
      case STEPS.PAYWALL:
        return <PaywallStep onComplete={handleComplete} onRestore={handleComplete} colors={colors} />;
      default:
        return null;
    }
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <SafeAreaView edges={["top"]} className="flex-1">
        {/* Progress Bar */}
        {currentStep > 0 && (
          <Animated.View entering={FadeIn} className="px-5 pt-2">
            <View
              className="h-1.5 rounded-full overflow-hidden"
              style={{ backgroundColor: colors.backgroundSecondary }}
            >
              <Animated.View
                style={{
                  width: `${progressPercent}%`,
                  height: "100%",
                  backgroundColor: colors.primary,
                  borderRadius: 4,
                }}
              />
            </View>
            <View className="flex-row justify-between mt-2">
              <Pressable onPress={handleBack} className="flex-row items-center">
                <ArrowLeft size={18} color={colors.textSecondary} />
                <Text className="ml-1 text-sm" style={{ color: colors.textSecondary }}>
                  Back
                </Text>
              </Pressable>
              <Text className="text-sm" style={{ color: colors.textTertiary }}>
                {currentStep}/{TOTAL_STEPS - 1}
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Content */}
        <Animated.View
          key={currentStep}
          entering={SlideInRight.springify().damping(20)}
          exiting={SlideOutLeft.springify().damping(20)}
          className="flex-1"
        >
          {renderStep()}
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

// Step Components
interface StepProps {
  colors: ReturnType<typeof useTheme>["colors"];
}

interface IntroStepProps extends StepProps {
  onNext: () => void;
}

function IntroStep({ onNext, colors }: IntroStepProps) {
  return (
    <View className="flex-1 px-6 justify-center">
      <Animated.View entering={FadeInDown.delay(200)} className="items-center mb-8">
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          style={{
            width: 120,
            height: 120,
            borderRadius: 30,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ChefHat size={60} color="#fff" strokeWidth={1.5} />
        </LinearGradient>
      </Animated.View>

      <Animated.Text
        entering={FadeInDown.delay(400)}
        className="text-3xl font-bold text-center mb-4"
        style={{ color: colors.text }}
      >
        Transform Your{"\n"}Home Cooking
      </Animated.Text>

      <Animated.Text
        entering={FadeInDown.delay(500)}
        className="text-lg text-center mb-8 leading-7"
        style={{ color: colors.textSecondary }}
      >
        Feel energized. Sleep better.{"\n"}Optimize your body through{"\n"}the food you cook.
      </Animated.Text>

      <Animated.View entering={FadeInUp.delay(600)} className="gap-3 mb-10">
        {[
          { icon: Target, text: "Personalized meal plans" },
          { icon: Clock, text: "Save 5+ hours weekly" },
          { icon: Sparkles, text: "Cook with confidence" },
        ].map((item, index) => (
          <View key={index} className="flex-row items-center">
            <View
              className="w-10 h-10 rounded-full items-center justify-center mr-3"
              style={{ backgroundColor: colors.primaryLight }}
            >
              <item.icon size={20} color={colors.primary} />
            </View>
            <Text className="text-base" style={{ color: colors.text }}>
              {item.text}
            </Text>
          </View>
        ))}
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(700)}>
        <Pressable
          onPress={onNext}
          className="py-4 rounded-2xl flex-row items-center justify-center"
          style={{ backgroundColor: colors.primary }}
        >
          <Text className="text-white font-semibold text-lg mr-2">Get Started</Text>
          <ArrowRight size={20} color="#fff" />
        </Pressable>
      </Animated.View>
    </View>
  );
}

interface QuizLevelStepProps extends StepProps {
  onSelect: (answer: string) => void;
}

function QuizLevelStep({ onSelect, colors }: QuizLevelStepProps) {
  const levels = [
    { id: "beginner", label: "Beginner", desc: "I'm just starting out", emoji: "🌱" },
    { id: "intermediate", label: "Intermediate", desc: "I cook a few times a week", emoji: "🍳" },
    { id: "advanced", label: "Advanced", desc: "I cook most of my meals", emoji: "👨‍🍳" },
    { id: "expert", label: "Expert", desc: "Cooking is my passion", emoji: "⭐" },
  ];

  return (
    <View className="flex-1 px-6 pt-8">
      <Animated.Text
        entering={FadeInDown.delay(100)}
        className="text-2xl font-bold text-center mb-2"
        style={{ color: colors.text }}
      >
        What's your cooking level?
      </Animated.Text>
      <Animated.Text
        entering={FadeInDown.delay(200)}
        className="text-base text-center mb-8"
        style={{ color: colors.textSecondary }}
      >
        This helps us personalize your experience
      </Animated.Text>

      <View className="gap-3">
        {levels.map((level, index) => (
          <Animated.View key={level.id} entering={FadeInDown.delay(300 + index * 100)}>
            <Pressable
              onPress={() => onSelect(level.id)}
              className="flex-row items-center p-4 rounded-2xl border-2"
              style={{
                backgroundColor: colors.card,
                borderColor: colors.border,
              }}
            >
              <Text className="text-3xl mr-4">{level.emoji}</Text>
              <View className="flex-1">
                <Text className="text-lg font-semibold" style={{ color: colors.text }}>
                  {level.label}
                </Text>
                <Text className="text-sm" style={{ color: colors.textSecondary }}>
                  {level.desc}
                </Text>
              </View>
              <ArrowRight size={20} color={colors.textTertiary} />
            </Pressable>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

interface QuizGoalsStepProps extends StepProps {
  selectedAnswers: string[];
  onSelect: (answer: string) => void;
  onNext: () => void;
}

function QuizGoalsStep({ selectedAnswers, onSelect, onNext, colors }: QuizGoalsStepProps) {
  const goals = [
    { id: "healthy", label: "Eat Healthier", emoji: "🥗" },
    { id: "save_time", label: "Save Time", emoji: "⏱️" },
    { id: "save_money", label: "Save Money", emoji: "💰" },
    { id: "learn_skills", label: "Learn New Skills", emoji: "📚" },
    { id: "impress", label: "Impress Others", emoji: "✨" },
    { id: "variety", label: "More Variety", emoji: "🌈" },
  ];

  return (
    <View className="flex-1 px-6 pt-8">
      <Animated.Text
        entering={FadeInDown.delay(100)}
        className="text-2xl font-bold text-center mb-2"
        style={{ color: colors.text }}
      >
        What are your cooking goals?
      </Animated.Text>
      <Animated.Text
        entering={FadeInDown.delay(200)}
        className="text-base text-center mb-8"
        style={{ color: colors.textSecondary }}
      >
        Select all that apply
      </Animated.Text>

      <View className="flex-row flex-wrap gap-3 justify-center mb-8">
        {goals.map((goal, index) => {
          const isSelected = selectedAnswers.includes(goal.id);
          return (
            <Animated.View key={goal.id} entering={FadeInDown.delay(300 + index * 50)}>
              <Pressable
                onPress={() => onSelect(goal.id)}
                className="px-5 py-3 rounded-full flex-row items-center border-2"
                style={{
                  backgroundColor: isSelected ? colors.primaryLight : colors.card,
                  borderColor: isSelected ? colors.primary : colors.border,
                }}
              >
                <Text className="text-xl mr-2">{goal.emoji}</Text>
                <Text
                  className="font-medium"
                  style={{ color: isSelected ? colors.primary : colors.text }}
                >
                  {goal.label}
                </Text>
                {isSelected && (
                  <View className="ml-2">
                    <Check size={16} color={colors.primary} />
                  </View>
                )}
              </Pressable>
            </Animated.View>
          );
        })}
      </View>

      {selectedAnswers.length > 0 && (
        <Animated.View entering={FadeInUp}>
          <Pressable
            onPress={onNext}
            className="py-4 rounded-2xl flex-row items-center justify-center"
            style={{ backgroundColor: colors.primary }}
          >
            <Text className="text-white font-semibold text-lg mr-2">Continue</Text>
            <ArrowRight size={20} color="#fff" />
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}

interface QuizTimeStepProps extends StepProps {
  onSelect: (answer: string) => void;
}

function QuizTimeStep({ onSelect, colors }: QuizTimeStepProps) {
  const times = [
    { id: "15min", label: "Under 15 minutes", desc: "Quick & easy meals", emoji: "⚡" },
    { id: "30min", label: "15-30 minutes", desc: "Simple recipes", emoji: "🕐" },
    { id: "60min", label: "30-60 minutes", desc: "Moderate time investment", emoji: "🍲" },
    { id: "unlimited", label: "1 hour+", desc: "I enjoy cooking projects", emoji: "🎯" },
  ];

  return (
    <View className="flex-1 px-6 pt-8">
      <Animated.Text
        entering={FadeInDown.delay(100)}
        className="text-2xl font-bold text-center mb-2"
        style={{ color: colors.text }}
      >
        How much time do you have?
      </Animated.Text>
      <Animated.Text
        entering={FadeInDown.delay(200)}
        className="text-base text-center mb-8"
        style={{ color: colors.textSecondary }}
      >
        For cooking on a typical day
      </Animated.Text>

      <View className="gap-3">
        {times.map((time, index) => (
          <Animated.View key={time.id} entering={FadeInDown.delay(300 + index * 100)}>
            <Pressable
              onPress={() => onSelect(time.id)}
              className="flex-row items-center p-4 rounded-2xl border-2"
              style={{
                backgroundColor: colors.card,
                borderColor: colors.border,
              }}
            >
              <Text className="text-3xl mr-4">{time.emoji}</Text>
              <View className="flex-1">
                <Text className="text-lg font-semibold" style={{ color: colors.text }}>
                  {time.label}
                </Text>
                <Text className="text-sm" style={{ color: colors.textSecondary }}>
                  {time.desc}
                </Text>
              </View>
              <ArrowRight size={20} color={colors.textTertiary} />
            </Pressable>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

interface ResultsStepProps extends StepProps {
  onNext: () => void;
  quizAnswers: { questionId: string; answer: string | string[] }[];
}

function ResultsStep({ onNext, quizAnswers, colors }: ResultsStepProps) {
  const levelAnswer = quizAnswers.find((a) => a.questionId === "cooking_level");
  const level = typeof levelAnswer?.answer === "string" ? levelAnswer.answer : "beginner";

  const levelLabels: Record<string, string> = {
    beginner: "Aspiring Chef",
    intermediate: "Home Cook",
    advanced: "Kitchen Pro",
    expert: "Culinary Expert",
  };

  return (
    <View className="flex-1 px-6 pt-8">
      <Animated.View entering={FadeInDown.delay(100)} className="items-center mb-6">
        <LinearGradient
          colors={["#10B981", "#059669"]}
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Check size={40} color="#fff" strokeWidth={3} />
        </LinearGradient>
      </Animated.View>

      <Animated.Text
        entering={FadeInDown.delay(200)}
        className="text-2xl font-bold text-center mb-2"
        style={{ color: colors.text }}
      >
        Great news!
      </Animated.Text>

      <Animated.Text
        entering={FadeInDown.delay(300)}
        className="text-base text-center mb-8"
        style={{ color: colors.textSecondary }}
      >
        Based on your answers, you're a{"\n"}
        <Text className="font-bold" style={{ color: colors.primary }}>
          {levelLabels[level] || "Home Cook"}
        </Text>
      </Animated.Text>

      <Animated.View
        entering={FadeInDown.delay(400)}
        className="rounded-2xl p-5 mb-6"
        style={{ backgroundColor: colors.card }}
      >
        <Text className="text-lg font-semibold mb-4" style={{ color: colors.text }}>
          Your Personalized Insights:
        </Text>
        {[
          { icon: TrendingUp, text: "You can improve cooking skills by 85%" },
          { icon: Clock, text: "Save up to 5 hours per week" },
          { icon: Heart, text: "Eat healthier with less effort" },
        ].map((insight, index) => (
          <View key={index} className="flex-row items-center mb-3 last:mb-0">
            <View
              className="w-8 h-8 rounded-full items-center justify-center mr-3"
              style={{ backgroundColor: colors.primaryLight }}
            >
              <insight.icon size={16} color={colors.primary} />
            </View>
            <Text className="flex-1 text-base" style={{ color: colors.textSecondary }}>
              {insight.text}
            </Text>
          </View>
        ))}
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(500)}>
        <Pressable
          onPress={onNext}
          className="py-4 rounded-2xl flex-row items-center justify-center"
          style={{ backgroundColor: colors.primary }}
        >
          <Text className="text-white font-semibold text-lg mr-2">Continue</Text>
          <ArrowRight size={20} color="#fff" />
        </Pressable>
      </Animated.View>
    </View>
  );
}

interface SymptomsStepProps extends StepProps {
  selectedAnswers: string[];
  onSelect: (answer: string) => void;
  onNext: () => void;
}

function SymptomsStep({ selectedAnswers, onSelect, onNext, colors }: SymptomsStepProps) {
  const challenges = [
    { id: "no_ideas", label: "Don't know what to cook", emoji: "🤔" },
    { id: "no_time", label: "Too busy to cook", emoji: "⏰" },
    { id: "wasted_food", label: "Food goes to waste", emoji: "🗑️" },
    { id: "boring_meals", label: "Meals are repetitive", emoji: "😐" },
    { id: "unhealthy", label: "Eating too much takeout", emoji: "🍔" },
    { id: "complex_recipes", label: "Recipes are too complex", emoji: "😵" },
    { id: "shopping", label: "Hate grocery shopping", emoji: "🛒" },
    { id: "meal_planning", label: "Can't plan meals ahead", emoji: "📅" },
  ];

  return (
    <View className="flex-1 px-6 pt-8">
      <Animated.Text
        entering={FadeInDown.delay(100)}
        className="text-2xl font-bold text-center mb-2"
        style={{ color: colors.text }}
      >
        What challenges do you face?
      </Animated.Text>
      <Animated.Text
        entering={FadeInDown.delay(200)}
        className="text-base text-center mb-6"
        style={{ color: colors.textSecondary }}
      >
        Most people quit because generic plans don't{"\n"}work for their body
      </Animated.Text>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <View className="gap-3 pb-4">
          {challenges.map((challenge, index) => {
            const isSelected = selectedAnswers.includes(challenge.id);
            return (
              <Animated.View key={challenge.id} entering={FadeInDown.delay(300 + index * 50)}>
                <Pressable
                  onPress={() => onSelect(challenge.id)}
                  className="flex-row items-center p-4 rounded-xl border-2"
                  style={{
                    backgroundColor: isSelected ? colors.primaryLight : colors.card,
                    borderColor: isSelected ? colors.primary : colors.border,
                  }}
                >
                  <Text className="text-2xl mr-3">{challenge.emoji}</Text>
                  <Text
                    className="flex-1 text-base font-medium"
                    style={{ color: isSelected ? colors.primary : colors.text }}
                  >
                    {challenge.label}
                  </Text>
                  {isSelected && <Check size={20} color={colors.primary} />}
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>

      {selectedAnswers.length > 0 && (
        <Animated.View entering={FadeInUp} className="pt-4">
          <Pressable
            onPress={onNext}
            className="py-4 rounded-2xl flex-row items-center justify-center"
            style={{ backgroundColor: colors.primary }}
          >
            <Text className="text-white font-semibold text-lg mr-2">Continue</Text>
            <ArrowRight size={20} color="#fff" />
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}

interface HowAppHelpsStepProps extends StepProps {
  onNext: () => void;
}

function HowAppHelpsStep({ onNext, colors }: HowAppHelpsStepProps) {
  const solutions = [
    {
      icon: Camera,
      title: "Snap & Cook",
      desc: "Take a photo of ingredients, get instant recipe ideas",
    },
    {
      icon: BookOpen,
      title: "Step-by-Step Guides",
      desc: "Follow along with timers and voice instructions",
    },
    {
      icon: ShoppingCart,
      title: "Smart Shopping Lists",
      desc: "Auto-generated from your meal plan",
    },
    {
      icon: Calendar,
      title: "Meal Planning",
      desc: "Plan your week in minutes, not hours",
    },
  ];

  return (
    <View className="flex-1 px-6 pt-8">
      <Animated.Text
        entering={FadeInDown.delay(100)}
        className="text-2xl font-bold text-center mb-2"
        style={{ color: colors.text }}
      >
        Here's how we help
      </Animated.Text>
      <Animated.Text
        entering={FadeInDown.delay(200)}
        className="text-base text-center mb-8"
        style={{ color: colors.textSecondary }}
      >
        The Aitum Kitchen gives you everything{"\n"}you need to succeed
      </Animated.Text>

      <View className="gap-4 mb-8">
        {solutions.map((solution, index) => (
          <Animated.View
            key={index}
            entering={FadeInDown.delay(300 + index * 100)}
            className="flex-row items-start p-4 rounded-2xl"
            style={{ backgroundColor: colors.card }}
          >
            <View
              className="w-12 h-12 rounded-2xl items-center justify-center mr-4"
              style={{ backgroundColor: colors.primaryLight }}
            >
              <solution.icon size={24} color={colors.primary} />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-semibold mb-1" style={{ color: colors.text }}>
                {solution.title}
              </Text>
              <Text className="text-sm" style={{ color: colors.textSecondary }}>
                {solution.desc}
              </Text>
            </View>
          </Animated.View>
        ))}
      </View>

      <Animated.View entering={FadeInUp.delay(700)}>
        <Pressable
          onPress={onNext}
          className="py-4 rounded-2xl flex-row items-center justify-center"
          style={{ backgroundColor: colors.primary }}
        >
          <Text className="text-white font-semibold text-lg mr-2">See What Others Say</Text>
          <ArrowRight size={20} color="#fff" />
        </Pressable>
      </Animated.View>
    </View>
  );
}

interface ReviewsStepProps extends StepProps {
  onNext: () => void;
}

function ReviewsStep({ onNext, colors }: ReviewsStepProps) {
  const reviews = [
    {
      name: "Sarah M.",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100",
      text: "I went from ordering takeout 5x a week to cooking almost every night. My grocery bill dropped by $300/month!",
      rating: 5,
    },
    {
      name: "Michael T.",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
      text: "The step-by-step cooking mode is a game changer. It's like having a personal chef guide me through every recipe.",
      rating: 5,
    },
    {
      name: "Emma K.",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100",
      text: "Finally, an app that understands I'm busy! The meal planning feature saves me hours every week.",
      rating: 5,
    },
  ];

  return (
    <View className="flex-1 px-6 pt-8">
      <Animated.View entering={FadeInDown.delay(100)} className="flex-row items-center justify-center mb-2">
        <Users size={24} color={colors.primary} />
        <Text className="text-lg font-semibold ml-2" style={{ color: colors.primary }}>
          50,000+ Happy Home Chefs
        </Text>
      </Animated.View>

      <Animated.Text
        entering={FadeInDown.delay(200)}
        className="text-2xl font-bold text-center mb-6"
        style={{ color: colors.text }}
      >
        Loved by home cooks{"\n"}everywhere
      </Animated.Text>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <View className="gap-4 pb-4">
          {reviews.map((review, index) => (
            <Animated.View
              key={index}
              entering={FadeInDown.delay(300 + index * 150)}
              className="p-4 rounded-2xl"
              style={{ backgroundColor: colors.card }}
            >
              <View className="flex-row items-center mb-3">
                <Image
                  source={{ uri: review.avatar }}
                  className="w-10 h-10 rounded-full mr-3"
                />
                <View className="flex-1">
                  <Text className="font-semibold" style={{ color: colors.text }}>
                    {review.name}
                  </Text>
                  <View className="flex-row">
                    {Array.from({ length: review.rating }).map((_, i) => (
                      <Star key={i} size={14} color="#F59E0B" fill="#F59E0B" />
                    ))}
                  </View>
                </View>
              </View>
              <Text className="text-sm leading-5" style={{ color: colors.textSecondary }}>
                "{review.text}"
              </Text>
            </Animated.View>
          ))}
        </View>
      </ScrollView>

      <Animated.View entering={FadeInUp.delay(700)} className="pt-4">
        <Pressable
          onPress={onNext}
          className="py-4 rounded-2xl flex-row items-center justify-center"
          style={{ backgroundColor: colors.primary }}
        >
          <Text className="text-white font-semibold text-lg mr-2">See All Features</Text>
          <ArrowRight size={20} color="#fff" />
        </Pressable>
      </Animated.View>
    </View>
  );
}

interface FeaturesStepProps extends StepProps {
  onNext: () => void;
}

function FeaturesStep({ onNext, colors }: FeaturesStepProps) {
  const features = [
    { icon: Camera, title: "Photo-to-Recipe", color: "#8B5CF6" },
    { icon: BookOpen, title: "Guided Cooking", color: "#EC4899" },
    { icon: Calendar, title: "Meal Planner", color: "#10B981" },
    { icon: ShoppingCart, title: "Shopping Lists", color: "#F59E0B" },
    { icon: Play, title: "Video Tutorials", color: "#EF4444" },
    { icon: Heart, title: "Saved Recipes", color: "#EC4899" },
  ];

  return (
    <View className="flex-1 px-6 pt-8">
      <Animated.Text
        entering={FadeInDown.delay(100)}
        className="text-2xl font-bold text-center mb-2"
        style={{ color: colors.text }}
      >
        Everything you need
      </Animated.Text>
      <Animated.Text
        entering={FadeInDown.delay(200)}
        className="text-base text-center mb-8"
        style={{ color: colors.textSecondary }}
      >
        All-in-one cooking companion
      </Animated.Text>

      <View className="flex-row flex-wrap justify-center gap-4 mb-8">
        {features.map((feature, index) => (
          <Animated.View
            key={index}
            entering={FadeInDown.delay(300 + index * 100)}
            className="w-[45%] items-center p-4 rounded-2xl"
            style={{ backgroundColor: colors.card }}
          >
            <View
              className="w-14 h-14 rounded-2xl items-center justify-center mb-3"
              style={{ backgroundColor: `${feature.color}20` }}
            >
              <feature.icon size={28} color={feature.color} />
            </View>
            <Text className="text-sm font-medium text-center" style={{ color: colors.text }}>
              {feature.title}
            </Text>
          </Animated.View>
        ))}
      </View>

      <Animated.View entering={FadeInUp.delay(900)}>
        <Pressable
          onPress={onNext}
          className="py-4 rounded-2xl flex-row items-center justify-center"
          style={{ backgroundColor: colors.primary }}
        >
          <Text className="text-white font-semibold text-lg mr-2">See Your Plan</Text>
          <ArrowRight size={20} color="#fff" />
        </Pressable>
      </Animated.View>
    </View>
  );
}

interface CustomPlanStepProps extends StepProps {
  onNext: () => void;
  quizAnswers: { questionId: string; answer: string | string[] }[];
}

function CustomPlanStep({ onNext, quizAnswers, colors }: CustomPlanStepProps) {
  const goalsAnswer = quizAnswers.find((a) => a.questionId === "cooking_goals");
  const goals = Array.isArray(goalsAnswer?.answer) ? goalsAnswer.answer : [];
  const timeAnswer = quizAnswers.find((a) => a.questionId === "cooking_time");
  const timeValue = typeof timeAnswer?.answer === "string" ? timeAnswer.answer : "30min";

  const timeLabels: Record<string, string> = {
    "15min": "15-minute",
    "30min": "30-minute",
    "60min": "45-minute",
    unlimited: "Gourmet",
  };

  const goalLabels: Record<string, string> = {
    healthy: "Health-focused",
    save_time: "Quick & Easy",
    save_money: "Budget-friendly",
    learn_skills: "Skill-building",
    impress: "Impressive dishes",
    variety: "Diverse cuisines",
  };

  return (
    <View className="flex-1 px-6 pt-8">
      <Animated.View entering={FadeInDown.delay(100)} className="items-center mb-4">
        <View
          className="w-16 h-16 rounded-full items-center justify-center"
          style={{ backgroundColor: colors.primaryLight }}
        >
          <Award size={32} color={colors.primary} />
        </View>
      </Animated.View>

      <Animated.Text
        entering={FadeInDown.delay(200)}
        className="text-2xl font-bold text-center mb-2"
        style={{ color: colors.text }}
      >
        Your Custom Plan is Ready!
      </Animated.Text>

      <Animated.Text
        entering={FadeInDown.delay(300)}
        className="text-base text-center mb-6"
        style={{ color: colors.textSecondary }}
      >
        Based on your preferences, here's what{"\n"}we've prepared for you
      </Animated.Text>

      <Animated.View
        entering={FadeInDown.delay(400)}
        className="rounded-2xl p-5 mb-6"
        style={{ backgroundColor: colors.card }}
      >
        <View className="flex-row items-center mb-4">
          <Sparkles size={20} color={colors.primary} />
          <Text className="text-lg font-semibold ml-2" style={{ color: colors.text }}>
            Your Plan Includes:
          </Text>
        </View>

        <View className="gap-3">
          <View className="flex-row items-center">
            <Check size={18} color="#10B981" />
            <Text className="ml-2" style={{ color: colors.textSecondary }}>
              {timeLabels[timeValue] || "30-minute"} recipes tailored to your schedule
            </Text>
          </View>
          {goals.slice(0, 2).map((goal) => (
            <View key={goal} className="flex-row items-center">
              <Check size={18} color="#10B981" />
              <Text className="ml-2" style={{ color: colors.textSecondary }}>
                {goalLabels[goal] || goal} meal recommendations
              </Text>
            </View>
          ))}
          <View className="flex-row items-center">
            <Check size={18} color="#10B981" />
            <Text className="ml-2" style={{ color: colors.textSecondary }}>
              Weekly meal plans with shopping lists
            </Text>
          </View>
          <View className="flex-row items-center">
            <Check size={18} color="#10B981" />
            <Text className="ml-2" style={{ color: colors.textSecondary }}>
              Step-by-step cooking guidance
            </Text>
          </View>
        </View>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(500)}
        className="flex-row items-center justify-center p-3 rounded-xl mb-6"
        style={{ backgroundColor: "#10B98115" }}
      >
        <Shield size={18} color="#10B981" />
        <Text className="ml-2 text-sm font-medium" style={{ color: "#10B981" }}>
          Cancel anytime. No commitment.
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(600)}>
        <Pressable
          onPress={onNext}
          className="py-4 rounded-2xl flex-row items-center justify-center"
          style={{ backgroundColor: colors.primary }}
        >
          <Text className="text-white font-semibold text-lg mr-2">Unlock Your Plan</Text>
          <ArrowRight size={20} color="#fff" />
        </Pressable>
      </Animated.View>
    </View>
  );
}

interface PaywallStepProps extends StepProps {
  onComplete: () => void;
  onRestore: () => void;
}

function PaywallStep({ onComplete, onRestore, colors }: PaywallStepProps) {
  const router = useRouter();

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/paywall");
  };

  return (
    <View className="flex-1 px-6 pt-8">
      <Animated.Text
        entering={FadeInDown.delay(100)}
        className="text-2xl font-bold text-center mb-2"
        style={{ color: colors.text }}
      >
        Start Your Journey
      </Animated.Text>

      <Animated.Text
        entering={FadeInDown.delay(200)}
        className="text-base text-center mb-8"
        style={{ color: colors.textSecondary }}
      >
        Join thousands of home cooks who've{"\n"}transformed their kitchens
      </Animated.Text>

      <Animated.View
        entering={FadeInDown.delay(300)}
        className="rounded-2xl p-5 mb-6"
        style={{ backgroundColor: colors.card }}
      >
        <View className="items-center mb-4">
          <View className="flex-row items-baseline">
            <Text className="text-4xl font-bold" style={{ color: colors.text }}>
              $9.99
            </Text>
            <Text className="text-lg ml-1" style={{ color: colors.textSecondary }}>
              /month
            </Text>
          </View>
          <Text className="text-sm" style={{ color: colors.textTertiary }}>
            or $49.99/year (save 58%)
          </Text>
        </View>

        <View className="gap-3">
          {[
            "Unlimited recipe access",
            "Personalized meal plans",
            "Smart shopping lists",
            "Step-by-step cooking mode",
            "Nutritional tracking",
            "Priority support",
          ].map((feature, index) => (
            <View key={index} className="flex-row items-center">
              <Check size={18} color={colors.primary} />
              <Text className="ml-3" style={{ color: colors.text }}>
                {feature}
              </Text>
            </View>
          ))}
        </View>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(400)} className="gap-3">
        <Pressable
          onPress={handleContinue}
          className="py-4 rounded-2xl items-center"
          style={{ backgroundColor: colors.primary }}
        >
          <Text className="text-white font-semibold text-lg">Continue to Subscribe</Text>
        </Pressable>

        <Pressable
          onPress={onComplete}
          className="py-3 items-center"
        >
          <Text className="text-sm" style={{ color: colors.textTertiary }}>
            Maybe later
          </Text>
        </Pressable>

        <Pressable onPress={onRestore} className="items-center">
          <Text className="text-sm underline" style={{ color: colors.textSecondary }}>
            Restore purchases
          </Text>
        </Pressable>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(500)} className="mt-4 items-center">
        <Text className="text-xs text-center" style={{ color: colors.textTertiary }}>
          By subscribing, you agree to our Terms of Service{"\n"}and Privacy Policy
        </Text>
      </Animated.View>
    </View>
  );
}
