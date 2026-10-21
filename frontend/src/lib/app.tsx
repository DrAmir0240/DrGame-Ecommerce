"use client";

import { createContext, useContext, useMemo, useState, useEffect, type ReactNode } from "react";

export type Lang = "fa" | "en" | "ar" | "tr" | "ru" | "de" | "es" | "fr";
export type Theme = "dark" | "light";

export interface LanguageInfo {
  code: Lang;
  name: string;
  nativeName: string;
  flag: string;
  dir: "rtl" | "ltr";
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: "fa", name: "Persian", nativeName: "فارسی", flag: "🇮🇷", dir: "rtl" },
  { code: "en", name: "English", nativeName: "English", flag: "🇬🇧", dir: "ltr" },
  { code: "ar", name: "Arabic", nativeName: "العربية", flag: "🇸🇦", dir: "rtl" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe", flag: "🇹🇷", dir: "ltr" },
  { code: "ru", name: "Russian", nativeName: "Русский", flag: "🇷🇺", dir: "ltr" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪", dir: "ltr" },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸", dir: "ltr" },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷", dir: "ltr" },
];

type AppCtx = {
  lang: Lang;
  dir: "rtl" | "ltr";
  theme: Theme;
  languages: LanguageInfo[];
  currentLanguage: LanguageInfo;
  setLang: (l: Lang) => void;
  setTheme: (t: Theme) => void;
  /** Pick the string for the current language. */
  t: (fa: string, en: string) => string;
  /** Localise digits in a number or string (Persian/Arabic digits in fa/ar). */
  n: (v: number | string) => string;
};

const Ctx = createContext<AppCtx | null>(null);

const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
export function toFaDigits(v: number | string): string {
  return String(v)
    .replace(/\d/g, (d) => FA_DIGITS[Number(d)])
    .replace(/\./g, "٫")
    .replace(/,/g, "،");
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("fa");
  const [theme, setThemeState] = useState<Theme>("dark");

  const currentLanguage = useMemo(() => {
    return SUPPORTED_LANGUAGES.find((l) => l.code === lang) ?? SUPPORTED_LANGUAGES[0];
  }, [lang]);

  useEffect(() => {
    const savedLang = localStorage.getItem("drgame_lang") as Lang | null;
    if (savedLang && SUPPORTED_LANGUAGES.some((l) => l.code === savedLang)) {
      setLangState(savedLang);
    }

    const savedTheme = localStorage.getItem("drgame_theme") as Theme | null;
    if (savedTheme) setThemeState(savedTheme);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("drgame_lang", l);
    const target = SUPPORTED_LANGUAGES.find((x) => x.code === l);
    const targetDir = target ? target.dir : "rtl";
    if (typeof document !== "undefined") {
      document.documentElement.lang = l;
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
      t: (fa, en) => (lang === "fa" || lang === "ar" ? fa : en),
      n: (v) => (lang === "fa" || lang === "ar" ? toFaDigits(v) : String(v)),
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
