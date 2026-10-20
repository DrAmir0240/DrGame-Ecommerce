import { create } from "zustand";

interface ThemeState {
  theme: "dark" | "light";
  toggleTheme: () => void;
  setTheme: (theme: "dark" | "light") => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: "dark",
  toggleTheme: () =>
    set((state) => {
      const next = state.theme === "dark" ? "light" : "dark";
      if (typeof window !== "undefined") {
        document.documentElement.setAttribute("data-theme", next);
        localStorage.setItem("drgame_theme", next);
      }
      return { theme: next };
    }),
  setTheme: (theme) => {
    if (typeof window !== "undefined") {
      document.documentElement.setAttribute("data-theme", theme);
      localStorage.setItem("drgame_theme", theme);
    }
    set({ theme });
  },
}));
