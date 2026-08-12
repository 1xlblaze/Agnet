import type { Config } from "tailwindcss";
 const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0b1f1c",
        moss: "#1f6f5b",
        foam: "#e8f3ef",
        sand: "#d9cbb6",
        ember: "#c45c26",
      },
      fontFamily: {
        display: ["\"Fraunces\"", "Georgia", "serif"],
        body: ["\"Source Sans 3\"", "Segoe UI", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
