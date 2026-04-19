// Professional Color Palettes - Inspired by Real Websites
export type ThemeName = "apple-light" | "stripe-purple" | "github-dark" | "spotify-green" | "notion-light" | "figma-dark" | "airbnb-pink" | "netflix-red" | "vercel-dark" | "telegram-blue" | "discord-dark" | "tesla-minimal";

export interface Theme {
  name: ThemeName;
  label: string;
  description: string;
  colors: {
    primary: string;
    primaryDark: string;
    secondary: string;
    accent: string;
    accentLight: string;
    background: string;
    foreground: string;
    card: string;
    border: string;
    muted: string;
    destructive: string;
    success: string;
  };
}

export const themes: Record<ThemeName, Theme> = {
  // LIGHT THEMES - Real Website Inspired
  "apple-light": {
    name: "apple-light",
    label: "SmartSite Construction",
    description: "Default professional palette for construction operations",
    colors: {
      primary: "#1E4E8C",
      primaryDark: "#173D6F",
      secondary: "#5F6B7A",
      accent: "#F4A300",
      accentLight: "#FFD166",
      background: "#F6F8FB",
      foreground: "#16202A",
      card: "#FFFFFF",
      border: "#D4DCE7",
      muted: "#7A8798",
      destructive: "#D14343",
      success: "#2E8B57",
    },
  },
  "stripe-purple": {
    name: "stripe-purple",
    label: "Blueprint Indigo",
    description: "Technical and modern palette inspired by blueprints",
    colors: {
      primary: "#3559C7",
      primaryDark: "#2A469D",
      secondary: "#6D7FCC",
      accent: "#5BC0EB",
      accentLight: "#8BD8F0",
      background: "#F8FAFF",
      foreground: "#1D2633",
      card: "#FFFFFF",
      border: "#DCE3F5",
      muted: "#8794B2",
      destructive: "#CF3D3D",
      success: "#2FA66A",
    },
  },
  "airbnb-pink": {
    name: "airbnb-pink",
    label: "Safety Orange",
    description: "High-visibility palette for alerts and site safety",
    colors: {
      primary: "#E67E22",
      primaryDark: "#C76814",
      secondary: "#B66A2A",
      accent: "#FFB347",
      accentLight: "#FFD089",
      background: "#FFF9F3",
      foreground: "#2A231B",
      card: "#FFFFFF",
      border: "#F1D9C2",
      muted: "#9C8B7C",
      destructive: "#C73A3A",
      success: "#2D9C63",
    },
  },
  "notion-light": {
    name: "notion-light",
    label: "Concrete Light",
    description: "Neutral enterprise palette for daily project management",
    colors: {
      primary: "#4B5563",
      primaryDark: "#374151",
      secondary: "#6B7280",
      accent: "#1F7A8C",
      accentLight: "#4CA5B5",
      background: "#F7F8FA",
      foreground: "#111827",
      card: "#FFFFFF",
      border: "#E5E7EB",
      muted: "#9CA3AF",
      destructive: "#B93838",
      success: "#2F855A",
    },
  },
  "telegram-blue": {
    name: "telegram-blue",
    label: "Site Sky",
    description: "Clean blue-green palette for planning and collaboration",
    colors: {
      primary: "#0E7490",
      primaryDark: "#0B5E75",
      secondary: "#2E8CA8",
      accent: "#3A86FF",
      accentLight: "#75A9FF",
      background: "#F4FAFC",
      foreground: "#10242E",
      card: "#FFFFFF",
      border: "#CFE5EC",
      muted: "#6F8792",
      destructive: "#C44343",
      success: "#2C9A68",
    },
  },

  // DARK THEMES - Real Website Inspired
  "github-dark": {
    name: "github-dark",
    label: "Control Room Dark",
    description: "Dark professional UI for monitoring dashboards",
    colors: {
      primary: "#4C8BF5",
      primaryDark: "#3D73CC",
      secondary: "#5B6B7E",
      accent: "#F4A300",
      accentLight: "#FFD166",
      background: "#0F1724",
      foreground: "#DCE4EE",
      card: "#172133",
      border: "#2A3B55",
      muted: "#8C9DB3",
      destructive: "#E35A5A",
      success: "#3FAF75",
    },
  },
  "spotify-green": {
    name: "spotify-green",
    label: "Field Green Dark",
    description: "Dark green palette for operations and sustainability",
    colors: {
      primary: "#2E8B57",
      primaryDark: "#256F46",
      secondary: "#3F9D67",
      accent: "#7ED957",
      accentLight: "#A3E77D",
      background: "#111A16",
      foreground: "#E6F0EA",
      card: "#18241E",
      border: "#2D4238",
      muted: "#90A79A",
      destructive: "#D45555",
      success: "#52C27A",
    },
  },
  "figma-dark": {
    name: "figma-dark",
    label: "Steel Graphite",
    description: "Balanced graphite theme for professional workflows",
    colors: {
      primary: "#6B7C93",
      primaryDark: "#566476",
      secondary: "#7D8EA3",
      accent: "#3FA7D6",
      accentLight: "#6CC3E6",
      background: "#141A22",
      foreground: "#E5ECF5",
      card: "#1C2430",
      border: "#2E3B4E",
      muted: "#8A97A8",
      destructive: "#D45B5B",
      success: "#41B37A",
    },
  },
  "netflix-red": {
    name: "netflix-red",
    label: "Executive Alert",
    description: "High-contrast dark palette for risk and incident control",
    colors: {
      primary: "#C0392B",
      primaryDark: "#992D22",
      secondary: "#9E3A32",
      accent: "#E67E22",
      accentLight: "#F2A65A",
      background: "#171312",
      foreground: "#F3EDEA",
      card: "#241B1A",
      border: "#3B2B29",
      muted: "#9E8A85",
      destructive: "#E15555",
      success: "#3DA874",
    },
  },
  "vercel-dark": {
    name: "vercel-dark",
    label: "Midnight Blueprint",
    description: "Minimal dark palette for executive dashboards",
    colors: {
      primary: "#2563EB",
      primaryDark: "#1E4FB8",
      secondary: "#51627A",
      accent: "#22C55E",
      accentLight: "#4ADE80",
      background: "#0B1020",
      foreground: "#E6ECF7",
      card: "#121A2E",
      border: "#26324D",
      muted: "#8B97AC",
      destructive: "#D96464",
      success: "#40B973",
    },
  },
  "discord-dark": {
    name: "discord-dark",
    label: "Navy Operations",
    description: "Deep navy palette for PMO and planning teams",
    colors: {
      primary: "#1D4E89",
      primaryDark: "#173F6E",
      secondary: "#2A5C9A",
      accent: "#00A3A3",
      accentLight: "#39C7C7",
      background: "#101827",
      foreground: "#DCE6F3",
      card: "#172235",
      border: "#293A54",
      muted: "#8798AE",
      destructive: "#D55A5A",
      success: "#3FAE7A",
    },
  },
  "tesla-minimal": {
    name: "tesla-minimal",
    label: "Architect Mono",
    description: "Monochrome professional style with green status accents",
    colors: {
      primary: "#E5E7EB",
      primaryDark: "#C7CCD4",
      secondary: "#8B929C",
      accent: "#BFC5CE",
      accentLight: "#D7DCE3",
      background: "#0D0F12",
      foreground: "#F3F4F6",
      card: "#151920",
      border: "#2E3440",
      muted: "#8E96A2",
      destructive: "#D05B5B",
      success: "#39B86C",
    },
  },
};

export function applyTheme(theme: Theme | undefined) {
  if (!theme || !theme.colors) {
    console.warn('Theme is undefined or invalid, using default');
    return;
  }
  const root = document.documentElement;
  root.style.setProperty("--primary", theme.colors.primary);
  root.style.setProperty("--primary-dark", theme.colors.primaryDark);
  root.style.setProperty("--secondary", theme.colors.secondary);
  root.style.setProperty("--accent", theme.colors.accent);
  root.style.setProperty("--accent-light", theme.colors.accentLight);
  root.style.setProperty("--background", theme.colors.background);
  root.style.setProperty("--foreground", theme.colors.foreground);
  root.style.setProperty("--card", theme.colors.card);
  root.style.setProperty("--border", theme.colors.border);
  root.style.setProperty("--muted", theme.colors.muted);
  root.style.setProperty("--destructive", theme.colors.destructive);
  root.style.setProperty("--success", theme.colors.success);
}
