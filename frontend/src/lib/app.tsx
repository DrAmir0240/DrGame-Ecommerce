"use client";

import { createContext, useContext, useMemo, useState, useEffect, type ReactNode } from "react";

export type Lang = "fa" | "en";
export type Theme = "dark" | "light";

export interface LanguageInfo {
  code: Lang;
  name: string;
  nativeName: string;
  flag: string;
  dir: "rtl" | "ltr";
}

/**
 * Normalizes any language code:
 * Right-to-Left languages (Persian, Arabic, etc.) map to 'fa'.
 * Left-to-Right languages (English, Turkish, German, etc.) map to 'en'.
 */
export function normalizeLanguage(code: string | null | undefined): Lang {
  if (!code) return "fa";
  const c = code.toLowerCase();
  if (c === "fa" || c === "ar" || c.startsWith("fa-") || c.startsWith("ar-")) {
    return "fa";
  }
  return "en";
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: "fa", name: "Persian", nativeName: "فارسی", flag: "🇮🇷", dir: "rtl" },
  { code: "en", name: "English", nativeName: "English", flag: "🇬🇧", dir: "ltr" },
];

type AppCtx = {
  lang: Lang;
  dir: "rtl" | "ltr";
  theme: Theme;
  languages: LanguageInfo[];
  currentLanguage: LanguageInfo;
  setLang: (l: string) => void;
  setTheme: (t: Theme) => void;
  /** Pick the string for the current language. */
  t: (fa: string, en: string) => string;
  /** Localise digits in a number or string (Persian digits in fa). */
  n: (v: number | string) => string;
};

const Ctx = createContext<AppCtx | null>(null);

const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
export function toFaDigits(v: number | string): string {
  return String(v)
    .replace(/\d/g, (d) => FA_DIGITS[Number(d)])
    .replace(/\./g, "٫");
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("fa");
  const [theme, setThemeState] = useState<Theme>("dark");

  const currentLanguage = useMemo(() => {
    return SUPPORTED_LANGUAGES.find((l) => l.code === lang) ?? SUPPORTED_LANGUAGES[0];
  }, [lang]);

  useEffect(() => {
    const savedLang = localStorage.getItem("drgame_lang");
    if (savedLang) {
      setLangState(normalizeLanguage(savedLang));
    }

    const savedTheme = localStorage.getItem("drgame_theme") as Theme | null;
    if (savedTheme) setThemeState(savedTheme);
  }, []);

  const setLang = (l: string) => {
    const normalized = normalizeLanguage(l);
    setLangState(normalized);
    localStorage.setItem("drgame_lang", normalized);
    const target = SUPPORTED_LANGUAGES.find((x) => x.code === normalized);
    const targetDir = target ? target.dir : "rtl";
    if (typeof document !== "undefined") {
      document.documentElement.lang = normalized;
      document.documentElement.dir = targetDir;
    }
  };

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem("drgame_theme", t);
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", t);
    }
  };

  const value = useMemo<AppCtx>(
    () => ({
      lang,
      dir: currentLanguage.dir,
      theme,
      languages: SUPPORTED_LANGUAGES,
      currentLanguage,
      setLang,
      setTheme,
      t: (fa, en) => (lang === "fa" ? fa : en),
      n: (v) => (lang === "fa" ? toFaDigits(v) : String(v)),
    }),
    [lang, theme, currentLanguage]
  );

  return (
    <Ctx.Provider value={value}>
      <div
        dir={value.dir}
        lang={lang}
        data-theme={theme}
        className="min-h-screen bg-bg font-sans text-fg"
      >
        {children}
      </div>
    </Ctx.Provider>
  );
}

export function useApp(): AppCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useApp must be used inside AppProvider");
  return c;
}
