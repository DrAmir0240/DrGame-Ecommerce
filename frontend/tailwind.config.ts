import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: ["class", '[data-theme="light"]'],
  theme: {
    extend: {
      colors: {
        /* OLED Dark & Glassmorphism Backgrounds */
        oled: "#070709",
        "card-dark": "#101116",
        "card-inner": "#181920",
        
        /* Cosmic Purple Theme Tokens */
        "cosmic-purple": "#7C3AED",
        "nebula-violet": "#A855F7",
        "galaxy-indigo": "#4C1D95",
        "cosmic-pink": "#EC4899",

        /* Text colors */
        "text-primary": "#FFFFFF",
        "text-secondary": "#9496A1",
        "text-muted": "#5A5D6A",

        /* Borders */
        "border-glass": "rgba(255, 255, 255, 0.07)",
        "border-glass-hover": "rgba(168, 85, 247, 0.4)",

        /* Tier Colors */
        "tier-gold": "#FBBF24",
        "tier-silver": "#E2E8F0",
        "tier-bronze": "#CD7F32",
        "tier-free": "#94A3B8",

        /* Statuses */
        success: "#10B981",
        warning: "#F59E0B",
        danger: "#EF4444",
      },
      fontFamily: {
        sans: ["Roboto", "Vazirmatn", "sans-serif"],
        display: ["Roboto", "Vazirmatn", "sans-serif"],
        mono: ["Roboto", "Vazirmatn", "sans-serif"],
        vazir: ["Vazirmatn", "sans-serif"],
        roboto: ["Roboto", "sans-serif"],
      },
      boxShadow: {
        "cosmic-glow": "0 0 20px rgba(139, 92, 246, 0.45)",
        "cosmic-focus": "0 0 0 2px #A855F7, 0 0 25px rgba(168, 85, 247, 0.6)",
        "glass-card": "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
      },
      backgroundImage: {
        "cosmic-gradient": "linear-gradient(135deg, #6D28D9 0%, #A855F7 50%, #EC4899 100%)",
        "dark-radial": "radial-gradient(circle at 50% 0%, rgba(124, 58, 237, 0.15) 0%, transparent 60%)",
      },
    },
  },
  plugins: [],
};

export default config;
