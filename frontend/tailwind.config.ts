import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        kalindi: {
          gold: "#D4AF37",
          walnut: "#4A3B32",
          cream: "#FFFDD0",
          beige: "#F5F5DC",
          plum: "#4A154B",
        },
      },
      fontFamily: {
        sans: ["var(--font-outfit)"],
      },
    },
  },
  plugins: [],
};
export default config;
