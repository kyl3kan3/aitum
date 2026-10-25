import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Check,
  Trash2,
  ShoppingCart,
  CheckCircle,
  Circle,
  X,
} from "lucide-react-native";
import { useTheme } from "@/lib/theme-context";
import useAppStore from "@/lib/state/app-store";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  SlideInRight,
  SlideOutRight,
  Layout,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useCallback, useMemo } from "react";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function ShoppingListScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const shoppingList = useAppStore((s) => s.shoppingList);
  const toggleShoppingItem = useAppStore((s) => s.toggleShoppingItem);
  const removeShoppingItem = useAppStore((s) => s.removeShoppingItem);
  const clearShoppingList = useAppStore((s) => s.clearShoppingList);
  const clearCheckedItems = useAppStore((s) => s.clearCheckedItems);

  // Group items by recipe
  const groupedItems = useMemo(() => {
    const groups: Record<string, typeof shoppingList> = {};
    shoppingList.forEach((item) => {
      const key = item.recipeName;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
    });
    return groups;
  }, [shoppingList]);

  const checkedCount = shoppingList.filter((item) => item.checked).length;
  const totalCount = shoppingList.length;
  const progress = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0;

  const handleToggleItem = useCallback(
    (id: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      toggleShoppingItem(id);
    },
    [toggleShoppingItem]
  );

  const handleRemoveItem = useCallback(
    (id: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      removeShoppingItem(id);
    },
    [removeShoppingItem]
  );

  const handleClearChecked = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    clearCheckedItems();
  }, [clearCheckedItems]);

  const handleClearAll = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    clearShoppingList();
  }, [clearShoppingList]);

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
              Shopping List
            </Text>
            <View className="w-10" />
          </View>

          {/* Progress */}
          {totalCount > 0 && (
            <View className="mb-2">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-sm" style={{ color: colors.textSecondary }}>
                  {checkedCount} of {totalCount} items
                </Text>
                <Text className="text-sm font-semibold" style={{ color: colors.primary }}>
                  {Math.round(progress)}%
                </Text>
              </View>
              <View className="h-2 rounded-full" style={{ backgroundColor: colors.backgroundSecondary }}>
                <Animated.View
                  className="h-2 rounded-full"
                  style={{
                    backgroundColor: colors.primary,
                    width: `${progress}%`,
                  }}
                />
              </View>
            </View>
          )}
        </Animated.View>

        {/* Content */}
        {totalCount === 0 ? (
          <View className="flex-1 items-center justify-center px-8">
            <Animated.View entering={FadeIn} className="items-center">
              <View
                className="w-24 h-24 rounded-full items-center justify-center mb-6"
                style={{ backgroundColor: colors.primaryLight }}
              >
                <ShoppingCart size={48} color={colors.primary} />
              </View>
              <Text className="text-xl font-bold text-center mb-2" style={{ color: colors.text }}>
                Your list is empty
              </Text>
              <Text className="text-base text-center" style={{ color: colors.textSecondary }}>
                Add ingredients from recipes to start building your shopping list
              </Text>
            </Animated.View>
          </View>
        ) : (
          <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
            {Object.entries(groupedItems).map(([recipeName, items], groupIndex) => (
              <Animated.View
                key={recipeName}
                entering={FadeInDown.delay(100 * groupIndex)}
                className="mb-6"
              >
                {/* Recipe Header */}
                <View className="flex-row items-center gap-2 mb-3">
                  <View
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: colors.primary }}
                  />
                  <Text className="text-base font-semibold" style={{ color: colors.text }}>
                    {recipeName}
                  </Text>
                  <Text className="text-sm" style={{ color: colors.textTertiary }}>
                    ({items.length} items)
                  </Text>
                </View>

                {/* Items */}
                <View className="gap-2">
                  {items.map((item, index) => (
                    <ShoppingItem
                      key={item.id}
                      item={item}
                      index={index}
                      colors={colors}
                      onToggle={handleToggleItem}
                      onRemove={handleRemoveItem}
                    />
                  ))}
                </View>
              </Animated.View>
            ))}

            {/* Action Buttons */}
            <Animated.View entering={FadeInDown.delay(300)} className="pb-8 gap-3">
              {checkedCount > 0 && (
                <Pressable
                  onPress={handleClearChecked}
                  className="flex-row items-center justify-center py-4 rounded-2xl"
                  style={{ backgroundColor: colors.success }}
                >
                  <CheckCircle size={20} color="#fff" />
                  <Text className="text-white font-semibold ml-2">
                    Clear {checkedCount} checked items
                  </Text>
                </Pressable>
              )}
              <Pressable
                onPress={handleClearAll}
                className="flex-row items-center justify-center py-4 rounded-2xl border"
                style={{ borderColor: colors.error }}
              >
                <Trash2 size={20} color={colors.error} />
                <Text className="font-semibold ml-2" style={{ color: colors.error }}>
                  Clear all
                </Text>
              </Pressable>
            </Animated.View>
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

interface ShoppingItemProps {
  item: {
    id: string;
    name: string;
    amount: string;
    unit: string;
    checked: boolean;
  };
  index: number;
  colors: ReturnType<typeof useTheme>["colors"];
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}

function ShoppingItem({ item, index, colors, onToggle, onRemove }: ShoppingItemProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <Animated.View
      entering={SlideInRight.delay(50 * index).springify()}
      exiting={SlideOutRight}
      layout={Layout.springify()}
    >
      <AnimatedPressable
        onPress={() => onToggle(item.id)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        className="flex-row items-center p-4 rounded-2xl"
        style={[animatedStyle, { backgroundColor: colors.card }]}
      >
        {/* Checkbox */}
        <View
          className="w-7 h-7 rounded-full items-center justify-center mr-3"
          style={{
            backgroundColor: item.checked ? colors.success : "transparent",
            borderWidth: item.checked ? 0 : 2,
            borderColor: colors.border,
          }}
        >
          {item.checked && <Check size={16} color="#fff" />}
        </View>

        {/* Content */}
        <View className="flex-1">
          <Text
            className={`text-base ${item.checked ? "line-through" : ""}`}
            style={{
              color: item.checked ? colors.textTertiary : colors.text,
              fontWeight: item.checked ? "normal" : "500",
            }}
          >
            {item.name}
          </Text>
          <Text className="text-sm" style={{ color: colors.textTertiary }}>
            {item.amount} {item.unit}
          </Text>
        </View>

        {/* Remove Button */}
        <Pressable
          onPress={() => onRemove(item.id)}
          hitSlop={10}
          className="w-8 h-8 rounded-full items-center justify-center"
          style={{ backgroundColor: colors.backgroundSecondary }}
        >
          <X size={16} color={colors.textTertiary} />
        </Pressable>
      </AnimatedPressable>
    </Animated.View>
  );
}
