"use client";

import React, { useEffect } from "react";
import { useGamepadNavigation } from "@/hooks/useGamepadNavigation";
import { useThemeStore } from "@/stores/themeStore";
import { useLangStore } from "@/stores/langStore";

export const ClientAppWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  useGamepadNavigation();
  const { setTheme } = useThemeStore();
  const { setLang } = useLangStore();

  useEffect(() => {
    const savedTheme = localStorage.getItem("drgame_theme") as "dark" | "light" | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
    const savedLang = localStorage.getItem("drgame_lang") as "fa" | "en" | null;
    if (savedLang) {
      setLang(savedLang);
    }
  }, [setTheme, setLang]);

  return <>{children}</>;
};
