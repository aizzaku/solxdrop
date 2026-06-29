import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#05070b",
          900: "#030407",
          800: "#05070b",
          700: "#090c12",
          600: "#0e131b",
          500: "#141a24",
        },
        neon: {
          DEFAULT: "#39ff14",
          soft: "#7dff63",
          dim: "#26b80f",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        neon: "0 0 0 1px rgba(57,255,20,0.5), 0 0 22px rgba(57,255,20,0.28)",
        "neon-lg": "0 0 0 1px rgba(57,255,20,0.6), 0 0 40px rgba(57,255,20,0.4)",
        glass:
          "0 1px 0 0 rgba(255,255,255,0.08) inset, 0 20px 50px -20px rgba(0,0,0,0.8)",
      },
      backgroundImage: {
        "grid-fade":
          "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(14px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.85", filter: "brightness(1)" },
          "50%": { opacity: "1", filter: "brightness(1.25)" },
        },
        drift: {
          "0%, 100%": { transform: "translate3d(0,0,0) scale(1)" },
          "50%": { transform: "translate3d(3%, -4%, 0) scale(1.08)" },
        },
        spin: { to: { transform: "rotate(360deg)" } },
      },
      animation: {
        "fade-up": "fade-up 0.5s cubic-bezier(0.16,1,0.3,1) both",
        "fade-in": "fade-in 0.3s ease-out both",
        "pulse-glow": "pulse-glow 3.5s ease-in-out infinite",
        drift: "drift 22s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
