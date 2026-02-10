import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", ...fontFamily.sans],
        mono: ["var(--font-jetbrains)", ...fontFamily.mono]
      },
      colors: {
        primary: {
          DEFAULT: "#3B82F6",
          foreground: "#0B1120"
        },
        surface: {
          DEFAULT: "#0F172A",
          muted: "#1E293B",
          subtle: "#1E293B80"
        }
      },
      boxShadow: {
        ambient: "0 20px 60px -35px rgba(59,130,246,0.65)"
      },
      animation: {
        "pulse-strong": "pulseStrong 3s ease-in-out infinite"
      },
      keyframes: {
        pulseStrong: {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" }
        }
      }
    }
  },
  plugins: []
};

export default config;
