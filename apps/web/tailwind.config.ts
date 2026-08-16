import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#060b0a",
        surface: {
          DEFAULT: "#0f1614",
          raised: "#141f1c",
          overlay: "#1a2824",
        },
        border: {
          DEFAULT: "rgba(255,255,255,0.08)",
          strong: "rgba(255,255,255,0.14)",
        },
        accent: {
          DEFAULT: "#34d399",
          dim: "#1f6f5b",
          glow: "rgba(52,211,153,0.15)",
        },
        text: {
          primary: "#f0faf6",
          secondary: "#94b8aa",
          muted: "#5f7a70",
        },
        warn: "#fbbf24",
        danger: "#f87171",
        // legacy aliases
        ink: "#0f1614",
        moss: "#34d399",
        foam: "#f0faf6",
        sand: "#94b8aa",
        ember: "#f87171",
      },
      fontFamily: {
        sans: ['"Inter"', "system-ui", "sans-serif"],
        display: ['"Fraunces"', "Georgia", "serif"],
      },
      boxShadow: {
        card: "0 0 0 1px rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.4)",
        glow: "0 0 40px rgba(52,211,153,0.12)",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
      },
      animation: {
        "fade-up": "fadeUp 0.5s ease forwards",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
