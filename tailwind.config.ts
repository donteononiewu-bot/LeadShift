import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#d9e6ff",
          200: "#bcd2ff",
          300: "#8eb3ff",
          400: "#5a8bff",
          500: "#3563ff",
          600: "#2044f2",
          700: "#1c34d6",
          800: "#1e2ead",
          900: "#1e2b89",
          950: "#161c54",
        },
      },
    },
  },
  plugins: [],
};

export default config;
