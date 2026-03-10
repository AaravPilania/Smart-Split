import { useState, useEffect } from "react";

// Each preset: gradient colors (for inline style) + Tailwind classes (all listed as full strings so Tailwind picks them up at build time)
export const ACCENT_PRESETS = {
  pink: {
    key: "pink",
    label: "Pink",
    gradFrom: "#ec4899",
    gradTo: "#f59e0b",
    // Tailwind classes
    text: "text-pink-500",
    textBtn: "text-pink-600",
    bgLight: "bg-pink-50",
    bgActive: "bg-pink-100",
    border: "border-pink-300",
    ring: "focus:ring-pink-400",
    spinner: "border-pink-500",
    activeDot: "bg-pink-500",
    bgHover: "hover:bg-pink-50",
  },
  violet: {
    key: "violet",
    label: "Violet",
    gradFrom: "#7c3aed",
    gradTo: "#ec4899",
    text: "text-violet-600",
    textBtn: "text-violet-700",
    bgLight: "bg-violet-50",
    bgActive: "bg-violet-100",
    border: "border-violet-300",
    ring: "focus:ring-violet-400",
    spinner: "border-violet-500",
    activeDot: "bg-violet-500",
    bgHover: "hover:bg-violet-50",
  },
  ocean: {
    key: "ocean",
    label: "Ocean",
    gradFrom: "#0ea5e9",
    gradTo: "#6366f1",
    text: "text-sky-500",
    textBtn: "text-sky-600",
    bgLight: "bg-sky-50",
    bgActive: "bg-sky-100",
    border: "border-sky-300",
    ring: "focus:ring-sky-400",
    spinner: "border-sky-500",
    activeDot: "bg-sky-500",
    bgHover: "hover:bg-sky-50",
  },
  emerald: {
    key: "emerald",
    label: "Emerald",
    gradFrom: "#10b981",
    gradTo: "#0ea5e9",
    text: "text-emerald-600",
    textBtn: "text-emerald-700",
    bgLight: "bg-emerald-50",
    bgActive: "bg-emerald-100",
    border: "border-emerald-300",
    ring: "focus:ring-emerald-400",
    spinner: "border-emerald-500",
    activeDot: "bg-emerald-500",
    bgHover: "hover:bg-emerald-50",
  },
  sunset: {
    key: "sunset",
    label: "Sunset",
    gradFrom: "#f59e0b",
    gradTo: "#ef4444",
    text: "text-amber-500",
    textBtn: "text-amber-600",
    bgLight: "bg-amber-50",
    bgActive: "bg-amber-100",
    border: "border-amber-300",
    ring: "focus:ring-amber-400",
    spinner: "border-amber-500",
    activeDot: "bg-amber-500",
    bgHover: "hover:bg-amber-50",
  },
  night: {
    key: "night",
    label: "Night",
    gradFrom: "#06b6d4",
    gradTo: "#818cf8",
    text: "text-cyan-500",
    textBtn: "text-cyan-600",
    bgLight: "bg-cyan-50",
    bgActive: "bg-cyan-100",
    border: "border-cyan-300",
    ring: "focus:ring-cyan-400",
    spinner: "border-cyan-500",
    activeDot: "bg-cyan-500",
    bgHover: "hover:bg-cyan-50",
  },
};

export const getGradientStyle = (theme, direction = "to right") => ({
  background: `linear-gradient(${direction}, ${theme.gradFrom}, ${theme.gradTo})`,
});

export const getPageBgStyle = (theme, isDark = false) => {
  if (isDark) return { background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)" };
  return { background: `linear-gradient(135deg, ${theme.gradFrom}18 0%, ${theme.gradTo}10 50%, #f9fafb 100%)` };
};

export function toggleDarkMode() {
  const isDark = localStorage.getItem("darkMode") === "true";
  const next = !isDark;
  document.documentElement.classList.toggle("dark", next);
  localStorage.setItem("darkMode", next ? "true" : "false");
  window.dispatchEvent(new Event("darkmode-changed"));
}

export function useTheme() {
  const [accentKey, setAccentKey] = useState(
    () => localStorage.getItem("accentColor") || "pink"
  );
  const [isDark, setIsDark] = useState(
    () => localStorage.getItem("darkMode") === "true"
  );

  useEffect(() => {
    const handler = () => {
      setAccentKey(localStorage.getItem("accentColor") || "pink");
      setIsDark(localStorage.getItem("darkMode") === "true");
    };
    window.addEventListener("theme-changed", handler);
    window.addEventListener("darkmode-changed", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("theme-changed", handler);
      window.removeEventListener("darkmode-changed", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const theme = ACCENT_PRESETS[accentKey] || ACCENT_PRESETS.pink;
  return { theme, accentKey, isDark };
}
