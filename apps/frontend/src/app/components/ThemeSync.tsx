import { useEffect } from "react";
import { useTheme } from "../context/ThemeContext";

/** Synchronise les thèmes et applique les variables CSS sur <html> */
export default function ThemeSync() {
  const { currentTheme } = useTheme();

  useEffect(() => {
    // Applique la classe CSS pour les thèmes dark
    const isDark = currentTheme.includes('dark') || currentTheme === 'charcoal' || currentTheme === 'obsidian';
    document.documentElement.classList.toggle("dark", isDark);
  }, [currentTheme]);

  return null;
}
