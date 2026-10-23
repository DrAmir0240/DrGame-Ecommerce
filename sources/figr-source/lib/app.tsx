import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type Lang = "fa" | "en";
export type Theme = "dark" | "light";

type AppCtx = {
  lang: Lang;
  dir: "rtl" | "ltr";
  theme: Theme;
  setLang: (l: Lang) => void;
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
    .replace(/\./g, "٫")
    .replace(/,/g, "،");
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("fa");
  const [theme, setTheme] = useState<Theme>("dark");
  const value = useMemo<AppCtx>(
    () => ({
      lang,
      dir: lang === "fa" ? "rtl" : "ltr",
      theme,
      setLang,
      setTheme,
      t: (fa, en) => (lang === "fa" ? fa : en),
      n: (v) => (lang === "fa" ? toFaDigits(v) : String(v)),
    }),
    [lang, theme],
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
