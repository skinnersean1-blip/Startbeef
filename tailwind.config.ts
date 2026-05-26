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
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        // Beef color palette - dark brown/gold aesthetic
        beef: {
          bg: "#0A0806",
          "bg-light": "#1A1410",
          "bg-card": "#2A1F18",
          gold: "#D4A574",
          "gold-light": "#E8C9A1",
          orange: "#FF6B47",
          "orange-dark": "#E55A3C",
          text: "#F5F1ED",
          "text-muted": "#A89885",
          border: "#3A2F28",
        },
        // Shoe-Shoe palette - pale blue / cream
        shoe: {
          bg: "#BDD5E2",           // pale blue page background
          "bg-deep": "#2C5E78",    // deep blue header/footer
          panel: "#4A7B93",        // medium blue card panels
          "panel-lite": "#5C8EA8", // lighter panel variant
          cream: "#FFF8DC",        // pale cream/yellow — main text
          "cream-dim": "#C0B070",  // muted cream for secondary text
          border: "#7AAEC4",       // fine border lines
          accent: "#FFD45C",       // warm yellow for highlights/credits
          "tier-new": "#5DBF82",   // NEW — fresh green
          "tier-likenew": "#F0C050", // LIKE NEW — warm amber
          "tier-loved": "#E08858", // LOVED — warm orange
          "tier-wellloved": "#A880C8", // WELL LOVED — soft purple
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
