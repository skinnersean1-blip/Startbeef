import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans:    ["var(--font-inter)", "system-ui", "sans-serif"],
        courier: ["var(--font-courier)", "Courier New", "monospace"],
      },
      colors: {
        // Beef color palette - dark brown/gold aesthetic
        beef: {
          bg: "#0A0806",           // Very dark brown, almost black
          "bg-light": "#1A1410",   // Slightly lighter brown
          "bg-card": "#2A1F18",    // Card background
          gold: "#D4A574",         // Muted gold
          "gold-light": "#E8C9A1", // Light gold
          orange: "#FF6B47",       // Bright orange (CTA)
          "orange-dark": "#E55A3C",// Darker orange
          text: "#F5F1ED",         // Off-white text
          "text-muted": "#A89885", // Muted text
          border: "#3A2F28",       // Border color
        },
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "3rem",
      },
      boxShadow: {
        glow: "0 0 20px rgba(212, 165, 116, 0.15)",
        "orange-glow": "0 0 30px rgba(255, 107, 71, 0.3)",
      },
    },
  },
  plugins: [],
};

export default config;
