import { View, Text, ScrollView, Pressable, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Sun,
  Moon,
  Smartphone,
  ChevronRight,
  Bell,
  Shield,
  HelpCircle,
  Star,
  Share2,
  Info,
} from "lucide-react-native";
import { useTheme } from "@/lib/theme-context";
import useAppStore from "@/lib/state/app-store";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useCallback } from "react";

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, isDark, setThemeMode, themeMode } = useTheme();
  const clearShoppingList = useAppStore((s) => s.clearShoppingList);

  const handleThemeChange = useCallback(
    (mode: "light" | "dark" | "system") => {
      Haptics.selectionAsync();
      setThemeMode(mode);
    },
    [setThemeMode]
  );

  const themeOptions = [
    { key: "light" as const, label: "Light", icon: Sun },
    { key: "dark" as const, label: "Dark", icon: Moon },
    { key: "system" as const, label: "System", icon: Smartphone },
  ];

  const settingsSections = [
    {
      title: "Preferences",
      items: [
        {
          key: "notifications",
          label: "Push Notifications",
          icon: Bell,
          type: "toggle" as const,
          value: true,
        },
      ],
    },
    {
      title: "Support",
      items: [
        { key: "help", label: "Help Center", icon: HelpCircle, type: "link" as const },
        { key: "privacy", label: "Privacy Policy", icon: Shield, type: "link" as const },
        { key: "rate", label: "Rate the App", icon: Star, type: "link" as const },
        { key: "share", label: "Share with Friends", icon: Share2, type: "link" as const },
      ],
    },
    {
      title: "About",
      items: [
        { key: "version", label: "Version", icon: Info, type: "info" as const, value: "1.0.0" },
      ],
    },
  ];

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
              Settings
            </Text>
            <View className="w-10" />
          </View>
        </Animated.View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Theme Selection */}
          <Animated.View entering={FadeInDown.delay(100)} className="px-5 mb-6">
            <Text className="text-sm font-semibold mb-3" style={{ color: colors.textSecondary }}>
              Appearance
            </Text>
            <View className="flex-row gap-3">
              {themeOptions.map((option) => {
                const isSelected = themeMode === option.key;
                const Icon = option.icon;
                return (
                  <Pressable
                    key={option.key}
                    onPress={() => handleThemeChange(option.key)}
                    className="flex-1 items-center py-4 rounded-2xl"
                    style={{
                      backgroundColor: isSelected ? colors.primary : colors.card,
                    }}
                  >
                    <Icon size={24} color={isSelected ? "#fff" : colors.textSecondary} />
                    <Text
                      className="text-sm font-medium mt-2"
                      style={{ color: isSelected ? "#fff" : colors.text }}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>

          {/* Settings Sections */}
          {settingsSections.map((section, sectionIndex) => (
            <Animated.View
              key={section.title}
              entering={FadeInDown.delay(150 + sectionIndex * 50)}
              className="px-5 mb-6"
            >
              <Text className="text-sm font-semibold mb-3" style={{ color: colors.textSecondary }}>
                {section.title}
              </Text>
              <View className="rounded-2xl overflow-hidden" style={{ backgroundColor: colors.card }}>
                {section.items.map((item, itemIndex) => {
                  const Icon = item.icon;
                  return (
                    <Pressable
                      key={item.key}
                      className={`flex-row items-center px-4 py-4 ${
                        itemIndex < section.items.length - 1 ? "border-b" : ""
                      }`}
                      style={{ borderColor: colors.border }}
                    >
                      <View
                        className="w-10 h-10 rounded-xl items-center justify-center"
                        style={{ backgroundColor: colors.primaryLight }}
                      >
                        <Icon size={20} color={colors.primary} />
                      </View>
                      <Text className="flex-1 ml-3 text-base" style={{ color: colors.text }}>
                        {item.label}
                      </Text>
                      {item.type === "toggle" && (
                        <Switch
                          value={item.value as boolean}
                          onValueChange={() => Haptics.selectionAsync()}
                          trackColor={{ false: colors.border, true: colors.primary }}
                          thumbColor="#fff"
                        />
                      )}
                      {item.type === "link" && (
                        <ChevronRight size={20} color={colors.textTertiary} />
                      )}
                      {item.type === "info" && (
                        <Text style={{ color: colors.textTertiary }}>{item.value as string}</Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </Animated.View>
          ))}

          {/* Danger Zone */}
          <Animated.View entering={FadeInDown.delay(400)} className="px-5 pb-8">
            <Text className="text-sm font-semibold mb-3" style={{ color: colors.textSecondary }}>
              Data
            </Text>
            <View className="rounded-2xl overflow-hidden" style={{ backgroundColor: colors.card }}>
              <Pressable
                onPress={() => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                  clearShoppingList();
                }}
                className="flex-row items-center px-4 py-4"
              >
                <Text className="flex-1 text-base" style={{ color: colors.error }}>
                  Clear Shopping List
                </Text>
                <ChevronRight size={20} color={colors.error} />
              </Pressable>
            </View>
          </Animated.View>

          {/* App Info */}
          <Animated.View entering={FadeInDown.delay(500)} className="items-center pb-8">
            <Text className="text-2xl font-bold" style={{ color: colors.primary }}>
              The Altum Connection
            </Text>
            <Text className="text-sm mt-1" style={{ color: colors.textTertiary }}>
              Made with love for home cooks
            </Text>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
