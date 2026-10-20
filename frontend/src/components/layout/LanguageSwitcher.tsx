"use client";

import React, { useEffect, useState } from "react";
import { Globe } from "lucide-react";
import { useLangStore } from "@/stores/langStore";

export const LanguageSwitcher: React.FC = () => {
  const { lang, toggleLang, setLang } = useLangStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("drgame_lang") as "fa" | "en" | null;
    if (saved) {
      setLang(saved);
    }
  }, [setLang]);

  if (!mounted) {
    return (
      <div className="w-16 h-10 rounded-xl bg-white/5 border border-white/10 animate-pulse" />
    );
  }

  return (
    <button
      onClick={toggleLang}
      data-nav-item="true"
      aria-label="Switch Language"
      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 hover:border-cosmic-light transition-all duration-300 bg-white/5 hover:bg-cosmic-primary/20 hover:shadow-cosmic text-xs font-semibold tracking-wider text-white/90"
    >
      <Globe className="w-3.5 h-3.5 text-cosmic-light" />
      <span>{lang === "fa" ? "English" : "فارسی"}</span>
    </button>
  );
};
