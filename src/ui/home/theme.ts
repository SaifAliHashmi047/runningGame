import { Platform } from "react-native";

export const colors = {
  // Deep navy base with soft gradient depth
  bgTop: "#0b1020",
  bgMid: "#14213d",
  // Electric cyan highlight + magenta support
  accent: "#00e5ff",
  accentMuted: "rgba(0,229,255,0.35)",
  accentAlt: "#ff4ddb",
  // Vibrant CTA (neon amber)
  cta: "#ffb300",
  // Text
  textPrimary: "#FFFFFF",
  textSecondary: "rgba(255,255,255,0.78)",
  textTertiary: "rgba(255,255,255,0.56)",
  textMuted: "rgba(255,255,255,0.42)",
  // Premium card surface
  card: "rgba(16,22,38,0.92)",
  cardBorder: "rgba(255,255,255,0.09)",
  /** Elevated panels (game over, modals) */
  surfaceElevated: "rgba(12,16,28,0.96)",
  surfaceRow: "rgba(255,255,255,0.055)",
  borderSubtle: "rgba(255,255,255,0.08)",
  borderGlow: "rgba(56,189,248,0.42)",
  // Utility accents
  gold: "#ffd54f",
  green: "#22c55e",
  greenMuted: "rgba(34,197,94,0.28)",
  red: "#ef4444",
  purple: "#a78bfa",
  ice: "#e0f2fe",
  sky: "#7dd3fc",
};

/** Full-screen scrims and HUD chrome (game + modals). */
export const overlay = {
  scrim: "rgba(5,8,18,0.78)",
  scrimSoft: "rgba(5,8,18,0.55)",
  modalScrim: "rgba(4,7,16,0.62)",
};

/** Splash + home arcade atmosphere (navy → indigo → violet). */
export const arcadeGradients = {
  splash: ["#050814", "#0c1530", "#151040", "#1a0f38"] as const,
  splashAccent: ["rgba(0,229,255,0.15)", "rgba(139,92,246,0.12)", "transparent"] as const,
  homeVignette: ["transparent", "rgba(6,8,22,0.55)", "rgba(4,6,18,0.92)"] as const,
  homeTopWash: ["rgba(56,189,248,0.08)", "transparent"] as const,
};

export const gameCopy = {
  title: "THE GALAXY RUNNER",
  tagline: "ARCADE RUNNER",
  introLabel: "READY TO FLY",
  introSub: "Steer through the lanes · dodge · chase the high score",
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
};

export const shadow = {
  light: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  heavy: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 14,
  },
};

export const assets = {
  // Replace these URIs with real assets in your project:
  // Example: require("../../../assets/logo.png")
  logo: { uri: "https://placehold.co/600x200/png?text=Game+Logo" },
  character: { uri: "https://placehold.co/400x400/png?text=Hero" },
  coin: { uri: "https://placehold.co/64x64/png?text=%E2%82%B9" },
};

export const baselineWidth = 375;

/** Monospace stack for HUD / stats (iOS Menlo, Android monospace). */
export const fontUi = {
  mono: Platform.select({ ios: "Menlo", default: "monospace" }) as string,
};
