import React, { useState, useEffect } from "react";
import { View, Text, Pressable, ActivityIndicator, ScrollView, Alert, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import {
  X,
  Check,
  Crown,
  Sparkles,
  Shield,
  Star,
  Zap,
} from "lucide-react-native";
import { useTheme } from "@/lib/theme-context";
import useOnboardingStore from "@/lib/state/onboarding-store";
import {
  getOfferings,
  purchasePackage,
  restorePurchases,
  isRevenueCatEnabled,
} from "@/lib/revenuecatClient";
import type { PurchasesPackage } from "react-native-purchases";

type PackageOption = {
  identifier: string;
  title: string;
  price: string;
  pricePerMonth?: string;
  duration: string;
  savings?: string;
  popular?: boolean;
  package?: PurchasesPackage;
};

export default function PaywallScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const setOnboardingComplete = useOnboardingStore((s) => s.setOnboardingComplete);

  const [packages, setPackages] = useState<PackageOption[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string>("$rc_annual");
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    loadOfferings();
  }, []);

  const loadOfferings = async () => {
    setIsLoading(true);

    if (!isRevenueCatEnabled()) {
      // Use fallback packages when RevenueCat is not configured
      setPackages([
        {
          identifier: "$rc_weekly",
          title: "Weekly",
          price: "$4.99",
          pricePerMonth: "$19.96/mo",
          duration: "week",
        },
        {
          identifier: "$rc_monthly",
          title: "Monthly",
          price: "$9.99",
          pricePerMonth: "$9.99/mo",
          duration: "month",
        },
        {
          identifier: "$rc_annual",
          title: "Annual",
          price: "$49.99",
          pricePerMonth: "$4.17/mo",
          duration: "year",
          savings: "Save 58%",
          popular: true,
        },
      ]);
      setIsLoading(false);
      return;
    }

    const result = await getOfferings();

    if (result.ok && result.data.current) {
      const availablePackages = result.data.current.availablePackages;
      const formattedPackages: PackageOption[] = availablePackages.map((pkg) => {
        const isWeekly = pkg.identifier === "$rc_weekly";
        const isMonthly = pkg.identifier === "$rc_monthly";
        const isAnnual = pkg.identifier === "$rc_annual";

        let pricePerMonth = "";
        let savings = "";

        if (isWeekly) {
          const weeklyPrice = pkg.product.price;
          pricePerMonth = `$${(weeklyPrice * 4).toFixed(2)}/mo`;
        } else if (isMonthly) {
          pricePerMonth = `${pkg.product.priceString}/mo`;
        } else if (isAnnual) {
          const annualPrice = pkg.product.price;
          pricePerMonth = `$${(annualPrice / 12).toFixed(2)}/mo`;
          savings = "Save 58%";
        }

        return {
          identifier: pkg.identifier,
          title: isWeekly ? "Weekly" : isMonthly ? "Monthly" : "Annual",
          price: pkg.product.priceString,
          pricePerMonth,
          duration: isWeekly ? "week" : isMonthly ? "month" : "year",
          savings,
          popular: isAnnual,
          package: pkg,
        };
      });

      // Sort: Annual first, then Monthly, then Weekly
      formattedPackages.sort((a, b) => {
        const order = ["$rc_annual", "$rc_monthly", "$rc_weekly"];
        return order.indexOf(a.identifier) - order.indexOf(b.identifier);
      });

      setPackages(formattedPackages);
    } else {
      // Fallback packages
      setPackages([
        {
          identifier: "$rc_weekly",
          title: "Weekly",
          price: "$4.99",
          pricePerMonth: "$19.96/mo",
          duration: "week",
        },
        {
          identifier: "$rc_monthly",
          title: "Monthly",
          price: "$9.99",
          pricePerMonth: "$9.99/mo",
          duration: "month",
        },
        {
          identifier: "$rc_annual",
          title: "Annual",
          price: "$49.99",
          pricePerMonth: "$4.17/mo",
          duration: "year",
          savings: "Save 58%",
          popular: true,
        },
      ]);
    }

    setIsLoading(false);
  };

  const handlePurchase = async () => {
    const selected = packages.find((p) => p.identifier === selectedPackage);
    if (!selected?.package) {
      if (Platform.OS === "web") {
        Alert.alert(
          "Web Not Supported",
          "Purchases are only available on the mobile app. Please download the app to subscribe."
        );
        return;
      }
      Alert.alert("Purchase", "RevenueCat is not configured. Continuing as free user.");
      completeOnboarding();
      return;
    }

    setIsPurchasing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const result = await purchasePackage(selected.package);

    setIsPurchasing(false);

    if (result.ok) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      completeOnboarding();
    } else if (result.reason === "sdk_error") {
      // User cancelled or error occurred
      console.log("Purchase cancelled or failed");
    }
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const result = await restorePurchases();

    setIsRestoring(false);

    if (result.ok) {
      const hasActiveEntitlement = Object.keys(result.data.entitlements.active).length > 0;
      if (hasActiveEntitlement) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Success", "Your purchases have been restored!");
        completeOnboarding();
      } else {
        Alert.alert("No Purchases", "No previous purchases found to restore.");
      }
    } else {
      Alert.alert("Error", "Failed to restore purchases. Please try again.");
    }
  };

  const completeOnboarding = () => {
    setOnboardingComplete(true);
    router.replace("/(tabs)");
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    completeOnboarding();
  };

  const features = [
    "Unlimited recipe access",
    "Personalized meal plans",
    "Smart shopping lists",
    "Step-by-step cooking mode",
    "Nutritional tracking",
    "New recipes weekly",
  ];

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="mt-4" style={{ color: colors.textSecondary }}>
          Loading plans...
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: 280 }}
      />
      <SafeAreaView edges={["top"]} className="flex-1">
        {/* Header */}
        <View className="flex-row justify-between items-center px-5 pt-2">
          <Pressable onPress={handleClose} className="w-10 h-10 items-center justify-center">
            <X size={24} color="#fff" />
          </Pressable>
          <View />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
          {/* Hero Section */}
          <Animated.View entering={FadeInDown.delay(100)} className="items-center px-6 pt-4 pb-8">
            <View className="w-20 h-20 rounded-full bg-white/20 items-center justify-center mb-4">
              <Crown size={40} color="#fff" />
            </View>
            <Text className="text-3xl font-bold text-white text-center mb-2">
              Unlock Premium
            </Text>
            <Text className="text-white/80 text-center text-base">
              Transform your cooking with full access
            </Text>
          </Animated.View>

          {/* Pricing Cards */}
          <Animated.View entering={FadeInDown.delay(200)} className="px-5 mb-6">
            <View className="gap-3">
              {packages.map((pkg, index) => {
                const isSelected = selectedPackage === pkg.identifier;
                return (
                  <Pressable
                    key={pkg.identifier}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedPackage(pkg.identifier);
                    }}
                    className="relative rounded-2xl border-2 overflow-hidden"
                    style={{
                      backgroundColor: colors.card,
                      borderColor: isSelected ? colors.primary : colors.border,
                    }}
                  >
                    {pkg.popular && (
                      <View
                        className="absolute top-0 right-0 px-3 py-1 rounded-bl-xl"
                        style={{ backgroundColor: colors.primary }}
                      >
                        <Text className="text-xs text-white font-semibold">BEST VALUE</Text>
                      </View>
                    )}
                    <View className="flex-row items-center p-4">
                      <View
                        className="w-6 h-6 rounded-full border-2 items-center justify-center mr-4"
                        style={{
                          borderColor: isSelected ? colors.primary : colors.border,
                          backgroundColor: isSelected ? colors.primary : "transparent",
                        }}
                      >
                        {isSelected && <Check size={14} color="#fff" strokeWidth={3} />}
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-center">
                          <Text className="text-lg font-semibold" style={{ color: colors.text }}>
                            {pkg.title}
                          </Text>
                          {pkg.savings && (
                            <View
                              className="ml-2 px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: "#10B98120" }}
                            >
                              <Text className="text-xs font-medium" style={{ color: "#10B981" }}>
                                {pkg.savings}
                              </Text>
                            </View>
                          )}
                        </View>
                        {pkg.pricePerMonth && (
                          <Text className="text-sm" style={{ color: colors.textSecondary }}>
                            {pkg.pricePerMonth}
                          </Text>
                        )}
                      </View>
                      <View className="items-end">
                        <Text className="text-xl font-bold" style={{ color: colors.text }}>
                          {pkg.price}
                        </Text>
                        <Text className="text-xs" style={{ color: colors.textTertiary }}>
                          per {pkg.duration}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>

          {/* Features */}
          <Animated.View
            entering={FadeInDown.delay(300)}
            className="mx-5 rounded-2xl p-5 mb-6"
            style={{ backgroundColor: colors.card }}
          >
            <View className="flex-row items-center mb-4">
              <Sparkles size={20} color={colors.primary} />
              <Text className="text-lg font-semibold ml-2" style={{ color: colors.text }}>
                Premium Features
              </Text>
            </View>
            <View className="gap-3">
              {features.map((feature, index) => (
                <Animated.View
                  key={index}
                  entering={FadeInDown.delay(400 + index * 50)}
                  className="flex-row items-center"
                >
                  <View
                    className="w-6 h-6 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: colors.primaryLight }}
                  >
                    <Check size={14} color={colors.primary} />
                  </View>
                  <Text style={{ color: colors.text }}>{feature}</Text>
                </Animated.View>
              ))}
            </View>
          </Animated.View>

          {/* Trust Badges */}
          <Animated.View entering={FadeInDown.delay(500)} className="px-5 mb-6">
            <View className="flex-row justify-center gap-6">
              {[
                { icon: Shield, text: "Secure" },
                { icon: Zap, text: "Instant Access" },
                { icon: Star, text: "4.9 Rating" },
              ].map((badge, index) => (
                <View key={index} className="items-center">
                  <badge.icon size={20} color={colors.textSecondary} />
                  <Text className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                    {badge.text}
                  </Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Bottom Actions */}
          <Animated.View entering={FadeInUp.delay(600)} className="px-5 pb-8">
            <Pressable
              onPress={handlePurchase}
              disabled={isPurchasing}
              className="py-4 rounded-2xl items-center mb-3"
              style={{ backgroundColor: colors.primary, opacity: isPurchasing ? 0.7 : 1 }}
            >
              {isPurchasing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-semibold text-lg">Start Premium Access</Text>
              )}
            </Pressable>

            <View className="flex-row justify-center gap-6">
              <Pressable onPress={handleRestore} disabled={isRestoring}>
                <Text className="text-sm underline" style={{ color: colors.textSecondary }}>
                  {isRestoring ? "Restoring..." : "Restore purchases"}
                </Text>
              </Pressable>
              <Pressable onPress={handleClose}>
                <Text className="text-sm" style={{ color: colors.textTertiary }}>
                  Continue free
                </Text>
              </Pressable>
            </View>

            <Text className="text-xs text-center mt-4" style={{ color: colors.textTertiary }}>
              Cancel anytime. Subscription automatically renews unless{"\n"}
              cancelled at least 24 hours before the end of the period.
            </Text>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
