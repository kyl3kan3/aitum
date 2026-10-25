import { View, Text, ScrollView, Pressable, Image, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Coffee,
  Sun,
  Moon,
  Cookie,
} from "lucide-react-native";
import { useTheme } from "@/lib/theme-context";
import useAppStore from "@/lib/state/app-store";
import useRecipeStore from "@/lib/state/recipe-store";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInRight,
  SlideInRight,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useCallback, useMemo, useState } from "react";

const { width } = Dimensions.get("window");
const DAY_WIDTH = (width - 40) / 7;

const MEAL_TYPES = [
  { key: "breakfast" as const, label: "Breakfast", icon: Coffee, color: "#F59E0B" },
  { key: "lunch" as const, label: "Lunch", icon: Sun, color: "#3B82F6" },
  { key: "dinner" as const, label: "Dinner", icon: Moon, color: "#8B5CF6" },
  { key: "snack" as const, label: "Snack", icon: Cookie, color: "#EC4899" },
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getWeekDates(date: Date): Date[] {
  const current = new Date(date);
  const day = current.getDay();
  const diff = current.getDate() - day;
  const week: Date[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(current);
    d.setDate(diff + i);
    week.push(d);
  }

  return week;
}

export default function MealPlannerScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const mealPlan = useAppStore((s) => s.mealPlan);
  const addToMealPlan = useAppStore((s) => s.addToMealPlan);
  const removeFromMealPlan = useAppStore((s) => s.removeFromMealPlan);
  const recipes = useRecipeStore((s) => s.recipes);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(formatDate(new Date()));
  const [showRecipePicker, setShowRecipePicker] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<typeof MEAL_TYPES[0]["key"] | null>(null);

  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate]);

  const getMealsForDate = useCallback(
    (date: string) => mealPlan.filter((m) => m.date === date),
    [mealPlan]
  );

  const selectedDateMeals = useMemo(
    () => getMealsForDate(selectedDate),
    [getMealsForDate, selectedDate]
  );

  const goToPrevWeek = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  }, [currentDate]);

  const goToNextWeek = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  }, [currentDate]);

  const selectDate = useCallback((date: Date) => {
    Haptics.selectionAsync();
    setSelectedDate(formatDate(date));
  }, []);

  const openRecipePicker = useCallback((mealType: typeof MEAL_TYPES[0]["key"]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedMealType(mealType);
    setShowRecipePicker(true);
  }, []);

  const handleSelectRecipe = useCallback(
    (recipeId: string) => {
      if (!selectedMealType) return;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      addToMealPlan({
        recipeId,
        date: selectedDate,
        mealType: selectedMealType,
      });
      setShowRecipePicker(false);
      setSelectedMealType(null);
    },
    [selectedMealType, selectedDate, addToMealPlan]
  );

  const handleRemoveMeal = useCallback(
    (mealId: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      removeFromMealPlan(mealId);
    },
    [removeFromMealPlan]
  );

  const today = formatDate(new Date());
  const selectedDateObj = new Date(selectedDate);
  const isToday = selectedDate === today;

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <SafeAreaView edges={["top"]} className="flex-1">
        {/* Header */}
        <Animated.View entering={FadeInDown} className="px-5 pt-2 pb-4">
          <View className="flex-row items-center justify-between mb-4">
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.backgroundSecondary }}
            >
              <ArrowLeft size={22} color={colors.text} />
            </Pressable>
            <Text className="text-xl font-bold" style={{ color: colors.text }}>
              Meal Planner
            </Text>
            <View className="w-10" />
          </View>

          {/* Month Navigation */}
          <View className="flex-row items-center justify-between mb-4">
            <Pressable
              onPress={goToPrevWeek}
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.backgroundSecondary }}
            >
              <ChevronLeft size={22} color={colors.text} />
            </Pressable>
            <Text className="text-lg font-semibold" style={{ color: colors.text }}>
              {MONTHS[weekDates[3].getMonth()]} {weekDates[3].getFullYear()}
            </Text>
            <Pressable
              onPress={goToNextWeek}
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.backgroundSecondary }}
            >
              <ChevronRight size={22} color={colors.text} />
            </Pressable>
          </View>

          {/* Week Days */}
          <View className="flex-row">
            {weekDates.map((date, index) => {
              const dateStr = formatDate(date);
              const isSelected = dateStr === selectedDate;
              const isTodayDate = dateStr === today;
              const hasMeals = getMealsForDate(dateStr).length > 0;

              return (
                <Pressable
                  key={dateStr}
                  onPress={() => selectDate(date)}
                  className="items-center"
                  style={{ width: DAY_WIDTH }}
                >
                  <Text
                    className="text-xs mb-1"
                    style={{ color: colors.textTertiary }}
                  >
                    {DAYS[index]}
                  </Text>
                  <View
                    className="w-10 h-10 rounded-full items-center justify-center"
                    style={{
                      backgroundColor: isSelected
                        ? colors.primary
                        : isTodayDate
                        ? colors.primaryLight
                        : "transparent",
                    }}
                  >
                    <Text
                      className="text-base font-semibold"
                      style={{
                        color: isSelected
                          ? "#fff"
                          : isTodayDate
                          ? colors.primary
                          : colors.text,
                      }}
                    >
                      {date.getDate()}
                    </Text>
                  </View>
                  {hasMeals && !isSelected && (
                    <View
                      className="w-1.5 h-1.5 rounded-full mt-1"
                      style={{ backgroundColor: colors.primary }}
                    />
                  )}
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Selected Date Header */}
          <Animated.View entering={FadeIn} className="px-5 mb-4">
            <Text className="text-2xl font-bold" style={{ color: colors.text }}>
              {isToday
                ? "Today"
                : selectedDateObj.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })}
            </Text>
          </Animated.View>

          {/* Meal Slots */}
          <View className="px-5 pb-8">
            {MEAL_TYPES.map((mealType, index) => {
              const meal = selectedDateMeals.find((m) => m.mealType === mealType.key);
              const recipe = meal ? recipes.find((r) => r.id === meal.recipeId) : null;
              const Icon = mealType.icon;

              return (
                <Animated.View
                  key={mealType.key}
                  entering={FadeInRight.delay(100 * index)}
                  className="mb-4"
                >
                  <View className="flex-row items-center gap-2 mb-2">
                    <View
                      className="w-8 h-8 rounded-lg items-center justify-center"
                      style={{ backgroundColor: `${mealType.color}20` }}
                    >
                      <Icon size={18} color={mealType.color} />
                    </View>
                    <Text className="text-base font-semibold" style={{ color: colors.text }}>
                      {mealType.label}
                    </Text>
                  </View>

                  {recipe ? (
                    <Pressable
                      onPress={() => router.push(`/recipe/${recipe.id}`)}
                      className="flex-row p-3 rounded-2xl"
                      style={{ backgroundColor: colors.card }}
                    >
                      <Image
                        source={{ uri: recipe.image }}
                        className="w-20 h-20 rounded-xl"
                      />
                      <View className="flex-1 ml-3 justify-center">
                        <Text
                          className="text-base font-semibold"
                          style={{ color: colors.text }}
                          numberOfLines={1}
                        >
                          {recipe.title}
                        </Text>
                        <Text
                          className="text-sm mt-1"
                          style={{ color: colors.textSecondary }}
                        >
                          {recipe.cookTime} • {recipe.servings} servings
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => handleRemoveMeal(meal!.id)}
                        className="w-8 h-8 rounded-full items-center justify-center self-center"
                        style={{ backgroundColor: colors.backgroundSecondary }}
                      >
                        <X size={16} color={colors.textTertiary} />
                      </Pressable>
                    </Pressable>
                  ) : (
                    <Pressable
                      onPress={() => openRecipePicker(mealType.key)}
                      className="flex-row items-center justify-center py-6 rounded-2xl border-2 border-dashed"
                      style={{ borderColor: colors.border }}
                    >
                      <Plus size={20} color={colors.textTertiary} />
                      <Text className="ml-2" style={{ color: colors.textTertiary }}>
                        Add {mealType.label.toLowerCase()}
                      </Text>
                    </Pressable>
                  )}
                </Animated.View>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Recipe Picker Modal */}
      {showRecipePicker && (
        <Animated.View
          entering={FadeIn}
          className="absolute inset-0"
          style={{ backgroundColor: colors.overlay }}
        >
          <Pressable className="flex-1" onPress={() => setShowRecipePicker(false)} />
          <Animated.View
            entering={SlideInRight}
            className="rounded-t-3xl p-5 pb-10"
            style={{
              backgroundColor: colors.background,
              maxHeight: "70%",
            }}
          >
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold" style={{ color: colors.text }}>
                Choose Recipe
              </Text>
              <Pressable
                onPress={() => setShowRecipePicker(false)}
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.backgroundSecondary }}
              >
                <X size={20} color={colors.text} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {recipes.map((recipe, index) => (
                <Animated.View key={recipe.id} entering={FadeInDown.delay(50 * index)}>
                  <Pressable
                    onPress={() => handleSelectRecipe(recipe.id)}
                    className="flex-row items-center p-3 rounded-2xl mb-2"
                    style={{ backgroundColor: colors.card }}
                  >
                    <Image
                      source={{ uri: recipe.image }}
                      className="w-16 h-16 rounded-xl"
                    />
                    <View className="flex-1 ml-3">
                      <Text
                        className="text-base font-semibold"
                        style={{ color: colors.text }}
                        numberOfLines={1}
                      >
                        {recipe.title}
                      </Text>
                      <Text className="text-sm" style={{ color: colors.textSecondary }}>
                        {recipe.cookTime}
                      </Text>
                    </View>
                    <Plus size={20} color={colors.primary} />
                  </Pressable>
                </Animated.View>
              ))}
            </ScrollView>
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
}
