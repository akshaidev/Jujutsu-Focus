import { Platform } from "react-native";

export const Colors = {
  light: {
    text: "#000000",
    textSecondary: "#475569",
    buttonText: "#FFFFFF",
    tabIconDefault: "#687076",
    tabIconSelected: "#3B82F6",
    link: "#000000",
    backgroundRoot: "#FFFFFF",
    backgroundDefault: "#F9FAFB",
    backgroundSecondary: "#F2F2F7",
    backgroundTertiary: "#E5E7EB",
    cursedEnergy: "#3B82F6",
    cursedEnergyBg: "rgba(59, 130, 246, 0.1)",
    debt: "#EF4444",
    debtBg: "rgba(239, 68, 68, 0.1)",
    success: "#10B981",
    successBg: "rgba(16, 185, 129, 0.1)",
    border: "#E5E7EB",
    glass: "rgba(255, 255, 255, 0.7)",
    glassBorder: "rgba(229, 231, 235, 0.5)",
  },
  dark: {
    text: "#FFFFFF",
    textSecondary: "#94A3B8",
    buttonText: "#000000",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: "#3B82F6",
    link: "#FFFFFF",
    backgroundRoot: "#000000",
    backgroundDefault: "#111111",
    backgroundSecondary: "#1A1A1A",
    backgroundTertiary: "#2A2A2A",
    cursedEnergy: "#3B82F6",
    cursedEnergyBg: "rgba(59, 130, 246, 0.15)",
    debt: "#EF4444",
    debtBg: "rgba(239, 68, 68, 0.15)",
    success: "#10B981",
    successBg: "rgba(16, 185, 129, 0.15)",
    border: "#2A2A2A",
    glass: "rgba(30, 30, 30, 0.7)",
    glassBorder: "rgba(60, 60, 60, 0.5)",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  "6xl": 64,
  inputHeight: 48,
  buttonHeight: 52,
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  "2xl": 32,
  "3xl": 40,
  full: 9999,
};

export const Typography = {
  h1: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "700" as const,
  },
  h2: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "700" as const,
  },
  h3: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "600" as const,
  },
  h4: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
  },
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400" as const,
  },
  link: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
  },
  balance: {
    fontSize: 72,
    lineHeight: 80,
    fontWeight: "700" as const,
    fontVariant: ["tabular-nums" as const],
  },
  statusPill: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500" as const,
  },
};

export const Shadows = {
  soft: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  medium: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
    manuscript: "ui-serif",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
    manuscript: "serif",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    manuscript:
      "'Uncial Antiqua', 'Cinzel Decorative', 'Crimson Text', Georgia, serif",
  },
});

export const CursedTheme = {
  manuscript: {
    fontSize: 18,
    lineHeight: 28,
    fontWeight: "400" as const,
    fontFamily: Fonts.manuscript,
    letterSpacing: 0.5,
    textShadowColor: "rgba(139, 69, 19, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  manuscriptTitle: {
    fontSize: 32,
    lineHeight: 42,
    fontWeight: "700" as const,
    fontFamily: Fonts.manuscript,
    letterSpacing: 1,
    textShadowColor: "rgba(139, 69, 19, 0.4)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
  },
  manuscriptHeading: {
    fontSize: 24,
    lineHeight: 34,
    fontWeight: "600" as const,
    fontFamily: Fonts.manuscript,
    letterSpacing: 0.8,
    textShadowColor: "rgba(139, 69, 19, 0.35)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  cursedColors: {
    manuscript: "#8B4513",
    manuscriptLight: "#A0522D",
    ink: "#2C1810",
    parchment: "#F4E8D0",
    cursedPurple: "#4B0082",
    cursedRed: "#8B0000",
    agedGold: "#DAA520",
  },
};
