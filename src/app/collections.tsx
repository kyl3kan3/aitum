import { View, Text, ScrollView, Pressable, Image, TextInput, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Plus,
  Heart,
  Zap,
  Moon,
  Star,
  Bookmark,
  Folder,
  X,
  Check,
  ChevronRight,
} from "lucide-react-native";
import { useTheme } from "@/lib/theme-context";
import useAppStore, { Collection } from "@/lib/state/app-store";
import useRecipeStore from "@/lib/state/recipe-store";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useCallback, useState } from "react";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const COLLECTION_ICONS = [
  { key: "heart", icon: Heart, color: "#EF4444" },
  { key: "zap", icon: Zap, color: "#F59E0B" },
  { key: "moon", icon: Moon, color: "#6366F1" },
  { key: "star", icon: Star, color: "#FBBF24" },
  { key: "bookmark", icon: Bookmark, color: "#3B82F6" },
  { key: "folder", icon: Folder, color: "#10B981" },
];

const COLLECTION_COLORS = [
  "#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#6366F1", "#EC4899",
];

export default function CollectionsScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const collections = useAppStore((s) => s.collections);
  const addCollection = useAppStore((s) => s.addCollection);
  const removeCollection = useAppStore((s) => s.removeCollection);
  const recipes = useRecipeStore((s) => s.recipes);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("folder");
  const [selectedColor, setSelectedColor] = useState(COLLECTION_COLORS[0]);

  const getRecipesForCollection = useCallback(
    (recipeIds: string[]) => recipes.filter((r) => recipeIds.includes(r.id)),
    [recipes]
  );

  const handleCreateCollection = useCallback(() => {
    if (!newName.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addCollection({
      name: newName.trim(),
      icon: selectedIcon,
      color: selectedColor,
      recipeIds: [],
    });
    setShowCreateModal(false);
    setNewName("");
    setSelectedIcon("folder");
    setSelectedColor(COLLECTION_COLORS[0]);
  }, [newName, selectedIcon, selectedColor, addCollection]);

  const handleDeleteCollection = useCallback(
    (id: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      removeCollection(id);
    },
    [removeCollection]
  );

  const navigateToCollection = useCallback(
    (collection: Collection) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      // For now, navigate to first recipe in collection or show empty state
      if (collection.recipeIds.length > 0) {
        router.push(`/recipe/${collection.recipeIds[0]}`);
      }
    },
    [router]
  );

  const getIconComponent = (iconKey: string) => {
    const found = COLLECTION_ICONS.find((i) => i.key === iconKey);
    return found?.icon ?? Folder;
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <SafeAreaView edges={["top"]} className="flex-1">
        {/* Header */}
        <Animated.View entering={FadeInDown} className="px-5 pt-2 pb-4">
          <View className="flex-row items-center justify-between">
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.backgroundSecondary }}
            >
              <ArrowLeft size={22} color={colors.text} />
            </Pressable>
            <Text className="text-xl font-bold" style={{ color: colors.text }}>
              Collections
            </Text>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setShowCreateModal(true);
              }}
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.primary }}
            >
              <Plus size={22} color="#fff" />
            </Pressable>
          </View>
        </Animated.View>

        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
          {/* Collections Grid */}
          <View className="pb-8">
            {collections.map((collection, index) => {
              const collectionRecipes = getRecipesForCollection(collection.recipeIds);
              const IconComponent = getIconComponent(collection.icon);

              return (
                <CollectionCard
                  key={collection.id}
                  collection={collection}
                  recipes={collectionRecipes}
                  index={index}
                  colors={colors}
                  IconComponent={IconComponent}
                  onPress={() => navigateToCollection(collection)}
                  onDelete={
                    collection.id !== "favorites"
                      ? () => handleDeleteCollection(collection.id)
                      : undefined
                  }
                />
              );
            })}

            {/* Create New Card */}
            <Animated.View entering={FadeInDown.delay(collections.length * 100)}>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setShowCreateModal(true);
                }}
                className="flex-row items-center justify-center py-8 rounded-2xl border-2 border-dashed mt-4"
                style={{ borderColor: colors.border }}
              >
                <Plus size={24} color={colors.textTertiary} />
                <Text className="ml-2 text-base font-medium" style={{ color: colors.textTertiary }}>
                  Create New Collection
                </Text>
              </Pressable>
            </Animated.View>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Create Collection Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View className="flex-1 justify-end" style={{ backgroundColor: colors.overlay }}>
          <Pressable className="flex-1" onPress={() => setShowCreateModal(false)} />
          <View
            className="rounded-t-3xl p-5 pb-10"
            style={{ backgroundColor: colors.background }}
          >
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-xl font-bold" style={{ color: colors.text }}>
                New Collection
              </Text>
              <Pressable
                onPress={() => setShowCreateModal(false)}
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.backgroundSecondary }}
              >
                <X size={20} color={colors.text} />
              </Pressable>
            </View>

            {/* Name Input */}
            <View className="mb-6">
              <Text className="text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                Name
              </Text>
              <TextInput
                value={newName}
                onChangeText={setNewName}
                placeholder="Collection name"
                placeholderTextColor={colors.textTertiary}
                className="px-4 py-4 rounded-2xl text-base"
                style={{
                  backgroundColor: colors.card,
                  color: colors.text,
                }}
              />
            </View>

            {/* Icon Selection */}
            <View className="mb-6">
              <Text className="text-sm font-medium mb-3" style={{ color: colors.textSecondary }}>
                Icon
              </Text>
              <View className="flex-row gap-3">
                {COLLECTION_ICONS.map((item) => {
                  const Icon = item.icon;
                  const isSelected = selectedIcon === item.key;
                  return (
                    <Pressable
                      key={item.key}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setSelectedIcon(item.key);
                      }}
                      className="w-12 h-12 rounded-xl items-center justify-center"
                      style={{
                        backgroundColor: isSelected ? colors.primary : colors.card,
                      }}
                    >
                      <Icon size={22} color={isSelected ? "#fff" : colors.textSecondary} />
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Color Selection */}
            <View className="mb-8">
              <Text className="text-sm font-medium mb-3" style={{ color: colors.textSecondary }}>
                Color
              </Text>
              <View className="flex-row gap-3">
                {COLLECTION_COLORS.map((color) => {
                  const isSelected = selectedColor === color;
                  return (
                    <Pressable
                      key={color}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setSelectedColor(color);
                      }}
                      className="w-12 h-12 rounded-xl items-center justify-center"
                      style={{ backgroundColor: color }}
                    >
                      {isSelected && <Check size={22} color="#fff" />}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Create Button */}
            <Pressable
              onPress={handleCreateCollection}
              disabled={!newName.trim()}
              className="py-4 rounded-2xl items-center"
              style={{
                backgroundColor: newName.trim() ? colors.primary : colors.backgroundSecondary,
              }}
            >
              <Text
                className="text-base font-bold"
                style={{ color: newName.trim() ? "#fff" : colors.textTertiary }}
              >
                Create Collection
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

interface CollectionCardProps {
  collection: Collection;
  recipes: ReturnType<typeof useRecipeStore.getState>["recipes"];
  index: number;
  colors: ReturnType<typeof useTheme>["colors"];
  IconComponent: React.ComponentType<{ size: number; color: string }>;
  onPress: () => void;
  onDelete?: () => void;
}

function CollectionCard({
  collection,
  recipes,
  index,
  colors,
  IconComponent,
  onPress,
  onDelete,
}: CollectionCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={FadeInRight.delay(100 * index)}>
      <AnimatedPressable
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.98); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        className="p-4 rounded-2xl mb-3"
        style={[animatedStyle, { backgroundColor: colors.card }]}
      >
        <View className="flex-row items-center">
          {/* Icon */}
          <View
            className="w-14 h-14 rounded-2xl items-center justify-center"
            style={{ backgroundColor: `${collection.color}20` }}
          >
            <IconComponent size={28} color={collection.color} />
          </View>

          {/* Content */}
          <View className="flex-1 ml-4">
            <Text className="text-lg font-semibold" style={{ color: colors.text }}>
              {collection.name}
            </Text>
            <Text className="text-sm" style={{ color: colors.textSecondary }}>
              {recipes.length} {recipes.length === 1 ? "recipe" : "recipes"}
            </Text>
          </View>

          {/* Actions */}
          <View className="flex-row items-center gap-2">
            {onDelete && (
              <Pressable
                onPress={onDelete}
                hitSlop={10}
                className="w-8 h-8 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.backgroundSecondary }}
              >
                <X size={16} color={colors.textTertiary} />
              </Pressable>
            )}
            <ChevronRight size={20} color={colors.textTertiary} />
          </View>
        </View>

        {/* Recipe Thumbnails */}
        {recipes.length > 0 && (
          <View className="flex-row mt-3 gap-2">
            {recipes.slice(0, 4).map((recipe, i) => (
              <Image
                key={recipe.id}
                source={{ uri: recipe.image }}
                className="w-16 h-16 rounded-xl"
                style={{
                  opacity: i === 3 && recipes.length > 4 ? 0.5 : 1,
                }}
              />
            ))}
            {recipes.length > 4 && (
              <View
                className="w-16 h-16 rounded-xl items-center justify-center absolute right-0"
                style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
              >
                <Text className="text-white font-bold">+{recipes.length - 4}</Text>
              </View>
            )}
          </View>
        )}
      </AnimatedPressable>
    </Animated.View>
  );
}
