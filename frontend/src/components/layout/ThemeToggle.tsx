"use client";

import React, { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useThemeStore } from "@/stores/themeStore";

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme, setTheme } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("drgame_theme") as "dark" | "light" | null;
    if (saved) {
      setTheme(saved);
    }
  }, [setTheme]);

  if (!mounted) {
    return (
      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 animate-pulse" />
    );
  }

  return (
    <button
      onClick={toggleTheme}
      data-nav-item="true"
      aria-label="Toggle Theme"
      className="relative p-2.5 rounded-xl border border-white/10 dark:border-white/10 light:border-black/10 hover:border-cosmic-light transition-all duration-300 bg-white/5 hover:bg-cosmic-primary/20 hover:shadow-cosmic text-white/90 dark:text-white/90 light:text-zinc-800"
    >
      {theme === "dark" ? (
        <Sun className="w-4 h-4 text-amber-300 transition-transform duration-300 hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 text-cosmic-primary transition-transform duration-300 hover:-rotate-12" />
      )}
    </button>
  );
};
