import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#26251e",
        body: "#5a5852",
        muted: "#807d72",
        hairline: "#e6e5e0",
        "hairline-soft": "#efeee8",
        canvas: "#f7f7f4",
        "canvas-soft": "#fafaf7",
        "surface-card": "#ffffff",
        primary: "#f54e00",
        "primary-active": "#d04200",
        success: "#1f8a65",
        danger: "#cf2d56",
        timeline: {
          thinking: "#dfa88f",
          grep: "#9fc9a2",
          read: "#9fbbe0",
          edit: "#c0a8dd",
          done: "#c08532",
        },
      },
      fontFamily: {
        display: ['"IBM Plex Serif"', "Georgia", "serif"],
        body: ['"IBM Plex Sans"', "Segoe UI", "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      boxShadow: {
        card: "0 1px 0 rgba(38,37,30,0.04), 0 8px 24px rgba(38,37,30,0.04)",
      },
    },
  },
  plugins: [],
};
export default config;
