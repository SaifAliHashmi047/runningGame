export const colors = {
  // Deep navy base with soft gradient depth
  bgTop: "#0b1020",
  bgMid: "#14213d",
  // Electric cyan highlight + magenta support
  accent: "#00e5ff",
  accentAlt: "#ff4ddb",
  // Vibrant CTA (neon amber)
  cta: "#ffb300",
  // Text
  textPrimary: "#FFFFFF",
  textSecondary: "rgba(255,255,255,0.78)",
  textTertiary: "rgba(255,255,255,0.56)",
  // Premium card surface
  card: "rgba(16,22,38,0.92)",
  cardBorder: "rgba(255,255,255,0.09)",
  // Utility accents
  gold: "#ffd54f",
  green: "#22c55e",
  red: "#ef4444",
  purple: "#a78bfa",
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
