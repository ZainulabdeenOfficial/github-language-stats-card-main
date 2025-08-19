export type ThemeName =
  | "light"
  | "dark"
  | "dracula"
  | "nord"
  | "radical"
  | "github"
  | "transparent"
  | "tokyonight"
  | "gruvbox"
  | "monokai"
  | "rose-pine"
  | "catppuccin-mocha"
  | "catppuccin-latte"
  | "night-owl"
  | "ayu-dark";

export type Theme = {
  bg: string;
  fg: string;
  sub: string;
  border: string;
};

export const THEMES: Record<ThemeName, Theme> = {
  light: { bg: "#ffffff", fg: "#111827", sub: "#374151", border: "#e5e7eb" },
  dark: { bg: "#0b1220", fg: "#e5e7eb", sub: "#94a3b8", border: "#1f2937" },
  dracula: { bg: "#282a36", fg: "#f8f8f2", sub: "#bd93f9", border: "#44475a" },
  nord: { bg: "#2e3440", fg: "#e5e9f0", sub: "#88c0d0", border: "#4c566a" },
  radical: { bg: "#141321", fg: "#fe428e", sub: "#a9fef7", border: "#2b2a3b" },
  github: { bg: "#ffffff", fg: "#24292f", sub: "#57606a", border: "#d0d7de" },
  transparent: { bg: "transparent", fg: "#111827", sub: "#6b7280", border: "#00000000" },
  tokyonight: { bg: "#1a1b26", fg: "#c0caf5", sub: "#7aa2f7", border: "#24283b" },
  gruvbox: { bg: "#282828", fg: "#ebdbb2", sub: "#d79921", border: "#3c3836" },
  monokai: { bg: "#272822", fg: "#f8f8f2", sub: "#66d9ef", border: "#3e3d32" },
  "rose-pine": { bg: "#191724", fg: "#e0def4", sub: "#9ccfd8", border: "#26233a" },
  "catppuccin-mocha": { bg: "#1e1e2e", fg: "#cdd6f4", sub: "#94e2d5", border: "#313244" },
  "catppuccin-latte": { bg: "#eff1f5", fg: "#4c4f69", sub: "#179299", border: "#ccd0da" },
  "night-owl": { bg: "#011627", fg: "#d6deeb", sub: "#82aaff", border: "#0b2942" },
  "ayu-dark": { bg: "#0a0e14", fg: "#b3b1ad", sub: "#39bae6", border: "#151a21" }
};

export function resolveTheme(name?: string): Theme {
  const key = (name || "light").toLowerCase() as ThemeName;
  return THEMES[key] || THEMES.light;
}
