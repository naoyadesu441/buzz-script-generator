import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Meiryo UI'", "'Noto Sans JP'", "sans-serif"],
        display: ["Inter", "'Meiryo UI'", "sans-serif"],
      },
      colors: {
        bg: {
          DEFAULT: "#0A0A1E",
          deep: "#050511",
          card: "#13132A",
          elevated: "#1A1A38",
        },
        neon: {
          purple: "#A855F7",
          purpleLight: "#C084FC",
          purpleDeep: "#7E22CE",
          cyan: "#06B6D4",
          pink: "#EC4899",
          green: "#10B981",
          amber: "#F59E0B",
          red: "#EF4444",
        },
        text: {
          primary: "#F8FAFC",
          secondary: "#CBD5E1",
          muted: "#64748B",
        },
        border: {
          DEFAULT: "#2D2D5A",
          subtle: "#1E1E40",
        },
      },
      backgroundImage: {
        "mesh-gradient":
          "radial-gradient(at 20% 30%, rgba(168, 85, 247, 0.3) 0%, transparent 50%), radial-gradient(at 80% 70%, rgba(6, 182, 212, 0.2) 0%, transparent 50%), radial-gradient(at 50% 100%, rgba(236, 72, 153, 0.2) 0%, transparent 50%)",
        "neon-gradient":
          "linear-gradient(135deg, #A855F7 0%, #06B6D4 100%)",
      },
      boxShadow: {
        "neon-purple": "0 0 20px rgba(168, 85, 247, 0.5), 0 0 40px rgba(168, 85, 247, 0.3)",
        "neon-cyan": "0 0 20px rgba(6, 182, 212, 0.5), 0 0 40px rgba(6, 182, 212, 0.3)",
        glass: "0 8px 32px rgba(0, 0, 0, 0.4)",
      },
    },
  },
  plugins: [],
};

export default config;
