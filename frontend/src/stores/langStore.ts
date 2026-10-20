import { create } from "zustand";

interface LangState {
  lang: "fa" | "en";
  dir: "rtl" | "ltr";
  toggleLang: () => void;
  setLang: (lang: "fa" | "en") => void;
}

export const useLangStore = create<LangState>((set) => ({
  lang: "fa",
  dir: "rtl",
  toggleLang: () =>
    set((state) => {
      const nextLang = state.lang === "fa" ? "en" : "fa";
      const nextDir = nextLang === "fa" ? "rtl" : "ltr";
      if (typeof window !== "undefined") {
        document.documentElement.lang = nextLang;
        document.documentElement.dir = nextDir;
        localStorage.setItem("drgame_lang", nextLang);
      }
      return { lang: nextLang, dir: nextDir };
    }),
  setLang: (lang) => {
    const dir = lang === "fa" ? "rtl" : "ltr";
    if (typeof window !== "undefined") {
      document.documentElement.lang = lang;
      document.documentElement.dir = dir;
      localStorage.setItem("drgame_lang", lang);
    }
    set({ lang, dir });
  },
}));
