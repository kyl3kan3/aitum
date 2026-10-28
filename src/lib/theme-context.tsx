import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useColorScheme as useSystemColorScheme } from "react-native";
import useAppStore from "@/lib/state/app-store";

type ThemeColors = {
  // Backgrounds
  background: string;
  backgroundSecondary: string;
  backgroundTertiary: string;
  card: string;

  // Text
  text: string;
  textSecondary: string;
  textTertiary: string;

  // Accents - Warm cooking theme
  primary: string;
  primaryLight: string;
  primaryDark: string;
  accent: string;
  accentLight: string;

  // Status
  success: string;
  error: string;
  warning: string;

  // Borders
  border: string;
  borderLight: string;

  // Overlays
  overlay: string;
  overlayLight: string;
};

const lightColors: ThemeColors = {
  // Warm cream backgrounds
  background: "#FFFBF5",
  backgroundSecondary: "#FFF8ED",
  backgroundTertiary: "#FFF3E0",
  card: "#FFFFFF",

  // Rich dark text
  text: "#1C1917",
  textSecondary: "#57534E",
  textTertiary: "#A8A29E",

  // Warm orange primary
  primary: "#EA580C",
  primaryLight: "#FFEDD5",
  primaryDark: "#C2410C",
  accent: "#F59E0B",
  accentLight: "#FEF3C7",

  // Status
  success: "#16A34A",
  error: "#DC2626",
  warning: "#F59E0B",

  // Borders
  border: "#E7E5E4",
  borderLight: "#F5F5F4",

  // Overlays
  overlay: "rgba(28, 25, 23, 0.5)",
  overlayLight: "rgba(28, 25, 23, 0.2)",
};

const darkColors: ThemeColors = {
  // Rich dark backgrounds
  background: "#0C0A09",
  backgroundSecondary: "#1C1917",
  backgroundTertiary: "#292524",
  card: "#1C1917",

  // Light text
  text: "#FAFAF9",
  textSecondary: "#A8A29E",
  textTertiary: "#78716C",

  // Vibrant orange primary
  primary: "#F97316",
  primaryLight: "#431407",
  primaryDark: "#FB923C",
  accent: "#FBBF24",
  accentLight: "#451A03",

  // Status
  success: "#22C55E",
  error: "#EF4444",
  warning: "#FBBF24",

  // Borders
  border: "#292524",
  borderLight: "#1C1917",

  // Overlays
  overlay: "rgba(0, 0, 0, 0.7)",
  overlayLight: "rgba(0, 0, 0, 0.4)",
};

interface ThemeContextType {
  isDark: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
  setThemeMode: (mode: "light" | "dark" | "system") => void;
  themeMode: "light" | "dark" | "system";
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useSystemColorScheme();
  const themeMode = useAppStore((s) => s.themeMode);
  const setStoredThemeMode = useAppStore((s) => s.setThemeMode);

  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (themeMode === "system") {
      setIsDark(systemColorScheme === "dark");
    } else {
      setIsDark(themeMode === "dark");
    }
  }, [themeMode, systemColorScheme]);

  const toggleTheme = () => {
    const newMode = isDark ? "light" : "dark";
    setStoredThemeMode(newMode);
  };

  const setThemeMode = (mode: "light" | "dark" | "system") => {
    setStoredThemeMode(mode);
  };

  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ isDark, colors, toggleTheme, setThemeMode, themeMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

export { lightColors, darkColors };
export type { ThemeColors };
