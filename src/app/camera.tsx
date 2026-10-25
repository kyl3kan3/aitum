import { View, Text, Pressable, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRef, useState } from "react";
import { X, RotateCcw, Check, Camera, Zap, ZapOff } from "lucide-react-native";
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import useRecipeStore from "@/lib/state/recipe-store";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function CameraScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<"front" | "back">("back");
  const [flash, setFlash] = useState<"off" | "on">("off");
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const addCapturedPhoto = useRecipeStore((s) => s.addCapturedPhoto);

  const shutterScale = useSharedValue(1);
  const shutterAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: shutterScale.value }],
  }));

  const handleCapture = async () => {
    if (!cameraRef.current || isCapturing) return;

    setIsCapturing(true);
    shutterScale.value = withSequence(
      withTiming(0.9, { duration: 100 }),
      withSpring(1)
    );

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });
      if (photo?.uri) {
        setCapturedPhoto(photo.uri);
      }
    } catch (error) {
      console.log("Error capturing photo:", error);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
  };

  const handleUsePhoto = () => {
    if (capturedPhoto) {
      addCapturedPhoto(capturedPhoto);
      router.back();
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
      <View className="flex-1 bg-black items-center justify-center">
        <Text className="text-white">Loading camera...</Text>
      </View>
    );
  }

  // Permission denied
  if (!permission.granted) {
    return (
      <View className="flex-1 bg-zinc-950 items-center justify-center px-8">
        <SafeAreaView className="items-center">
          <View className="w-20 h-20 bg-zinc-800 rounded-full items-center justify-center mb-6">
            <Camera size={40} color="#71717a" />
          </View>
          <Text className="text-xl font-bold text-white text-center mb-2">
            Camera Access Required
          </Text>
          <Text className="text-zinc-400 text-center mb-8">
            We need camera access to take photos of your dishes and recipes
          </Text>
          <Pressable
            onPress={requestPermission}
            className="bg-orange-500 px-8 py-4 rounded-2xl"
          >
            <Text className="text-white font-semibold text-base">
              Grant Permission
            </Text>
          </Pressable>
          <Pressable onPress={() => router.back()} className="mt-4 py-3">
            <Text className="text-zinc-500">Go Back</Text>
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  // Photo captured - show preview
  if (capturedPhoto) {
    return (
      <View className="flex-1 bg-black">
        <Image
          source={{ uri: capturedPhoto }}
          className="flex-1"
          resizeMode="cover"
        />
        <SafeAreaView
          edges={["top"]}
          className="absolute top-0 left-0 right-0"
        >
          <Pressable
            onPress={handleRetake}
            className="m-4 w-12 h-12 bg-black/50 rounded-full items-center justify-center"
          >
            <X size={24} color="#fff" />
          </Pressable>
        </SafeAreaView>
        <SafeAreaView
          edges={["bottom"]}
          className="absolute bottom-0 left-0 right-0"
        >
          <Animated.View
            entering={FadeIn}
            className="flex-row items-center justify-center gap-8 pb-8 pt-4 bg-gradient-to-t from-black/80 to-transparent"
          >
            <Pressable
              onPress={handleRetake}
              className="items-center"
            >
              <View className="w-16 h-16 bg-white/20 rounded-full items-center justify-center mb-2">
                <RotateCcw size={28} color="#fff" />
              </View>
              <Text className="text-white text-sm">Retake</Text>
            </Pressable>
            <Pressable
              onPress={handleUsePhoto}
              className="items-center"
            >
              <View className="w-16 h-16 bg-orange-500 rounded-full items-center justify-center mb-2">
                <Check size={28} color="#fff" />
              </View>
              <Text className="text-white text-sm">Use Photo</Text>
            </Pressable>
          </Animated.View>
        </SafeAreaView>
      </View>
    );
  }

  // Camera view
  return (
    <View className="flex-1 bg-black">
      <CameraView
        ref={cameraRef}
        style={{ flex: 1 }}
        facing={facing}
        flash={flash}
      >
        {/* Top Controls */}
        <SafeAreaView edges={["top"]} className="absolute top-0 left-0 right-0">
          <View className="flex-row items-center justify-between px-4 py-2">
            <Pressable
              onPress={() => router.back()}
              className="w-12 h-12 bg-black/40 rounded-full items-center justify-center"
            >
              <X size={24} color="#fff" />
            </Pressable>
            <View className="flex-row gap-3">
              <Pressable
                onPress={toggleFlash}
                className="w-12 h-12 bg-black/40 rounded-full items-center justify-center"
              >
                {flash === "on" ? (
                  <Zap size={22} color="#f97316" fill="#f97316" />
                ) : (
                  <ZapOff size={22} color="#fff" />
                )}
              </Pressable>
            </View>
          </View>
        </SafeAreaView>

        {/* Center Guide */}
        <View className="flex-1 items-center justify-center">
          <View className="w-64 h-64 border-2 border-white/30 rounded-3xl" />
          <Text className="text-white/60 text-sm mt-4">
            Position your dish in the frame
          </Text>
        </View>

        {/* Bottom Controls */}
        <SafeAreaView edges={["bottom"]} className="absolute bottom-0 left-0 right-0">
          <View className="flex-row items-center justify-center gap-12 pb-8 pt-4">
            {/* Flip Camera */}
            <Pressable
              onPress={toggleFacing}
              className="w-14 h-14 bg-white/20 rounded-full items-center justify-center"
            >
              <RotateCcw size={24} color="#fff" />
            </Pressable>

            {/* Shutter Button */}
            <AnimatedPressable
              onPress={handleCapture}
              disabled={isCapturing}
              style={shutterAnimatedStyle}
              className="w-20 h-20 bg-white rounded-full items-center justify-center border-4 border-white/50"
            >
              <View className="w-16 h-16 bg-white rounded-full" />
            </AnimatedPressable>

            {/* Placeholder for symmetry */}
            <View className="w-14 h-14" />
          </View>
        </SafeAreaView>
      </CameraView>
    </View>
  );
}
