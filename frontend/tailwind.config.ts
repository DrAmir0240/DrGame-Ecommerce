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
        /* Design System Tokens */
        "bg-primary": "var(--bg-primary)",
        "bg-secondary": "var(--bg-secondary)",
        "bg-tertiary": "var(--bg-tertiary)",
        "bg-card": "var(--bg-card)",
        "bg-card-hover": "var(--bg-card-hover)",
        "bg-input": "var(--bg-input)",

        "accent-orange": "var(--accent-orange)",
        "accent-orange-light": "var(--accent-orange-light)",
        "accent-orange-glow": "var(--accent-orange-glow)",
        "accent-blue": "var(--accent-blue)",
        "accent-green": "var(--accent-green)",
        "accent-yellow": "var(--accent-yellow)",
        "accent-purple": "var(--accent-purple)",
        "accent-red": "var(--accent-red)",
        "accent-cyan": "var(--accent-cyan)",

        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-muted": "var(--text-muted)",

        "border-color": "var(--border-color)",
        "border-light": "var(--border-light)",

        /* Compatibility variables */
        bg: "var(--color-bg)",
        surface: "var(--color-surface)",
        "surface-2": "var(--color-surface-2)",
        "surface-3": "var(--color-surface-3)",
        fg: "var(--color-fg)",
        "fg-2": "var(--color-fg-2)",
        muted: "var(--color-muted)",
        line: "var(--color-line)",
        "line-strong": "var(--color-line-strong)",
        scrim: "var(--color-scrim)",

        accent: "var(--color-accent)",
        "accent-2": "var(--color-accent-2)",
        "accent-deep": "var(--color-accent-deep)",
        "accent-soft": "var(--color-accent-soft)",
        pink: "var(--color-pink)",
        "on-accent": "var(--color-on-accent)",

        psn: "var(--color-psn)",
        "psn-soft": "var(--color-psn-soft)",

        success: "var(--color-success)",
        "success-soft": "var(--color-success-soft)",
        warning: "var(--color-warning)",
        "warning-soft": "var(--color-warning-soft)",
        danger: "var(--color-danger)",
        "danger-soft": "var(--color-danger-soft)",

        bronze: "var(--color-bronze)",
        "bronze-2": "var(--color-bronze-2)",
        silver: "var(--color-silver)",
        "silver-2": "var(--color-silver-2)",
        gold: "var(--color-gold)",
        "gold-2": "var(--color-gold-2)",
      },
      fontFamily: {
        sans: ["Vazirmatn", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        latin: ["Inter", "Vazirmatn", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["Vazirmatn", "Oxanium", "ui-monospace", "monospace"],
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
        tile: "12px",
        card: "16px",
        panel: "20px",
      },
      boxShadow: {
        "sm-dark": "var(--shadow-sm)",
        "md-dark": "var(--shadow-md)",
        "lg-dark": "var(--shadow-lg)",
        "neon-orange": "var(--shadow-orange)",
        glow: "0 0 20px rgba(255, 87, 34, 0.45)",
        "glow-sm": "0 0 12px rgba(255, 87, 34, 0.35)",
        focus: "0 0 0 2px #ff5722, 0 0 28px rgba(255, 87, 34, 0.55)",
        card: "0 1px 0 rgba(255, 255, 255, 0.04) inset, 0 8px 24px rgba(0, 0, 0, 0.35)",
      },
      backgroundImage: {
        "linear-135": "linear-gradient(135deg, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};

export default config;
