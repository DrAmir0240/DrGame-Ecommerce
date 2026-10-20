import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        cosmic: {
          primary: "#7C3AED",
          light: "#A855F7",
          dark: "#4C1D95",
          accent: "#EC4899",
        },
        oled: {
          bg: "#070709",
          card: "#101116",
          surface: "#181920",
        },
        light: {
          bg: "#F8F9FA",
          card: "#FFFFFF",
          surface: "#F1F3F5",
        },
        tier: {
          free: "#94A3B8",
          bronze: "#CD7F32",
          silver: "#E2E8F0",
          gold: "#FBBF24",
        },
      },
      boxShadow: {
        cosmic: "0 0 20px rgba(139, 92, 246, 0.45)",
        "cosmic-lg": "0 0 35px rgba(168, 85, 247, 0.65)",
        "cosmic-card": "0 8px 32px 0 rgba(124, 58, 237, 0.12)",
      },
      backgroundImage: {
        "cosmic-gradient": "linear-gradient(135deg, #6D28D9 0%, #A855F7 50%, #EC4899 100%)",
        "cosmic-dark-gradient": "linear-gradient(180deg, rgba(76, 29, 149, 0.25) 0%, rgba(7, 7, 9, 0.95) 100%)",
      },
      animation: {
        "pulse-glow": "pulseGlow 2.5s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { opacity: "0.8", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.02)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
