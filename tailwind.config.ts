import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#142B4A",
        brand: "#1D4ED8",
        teal: "#0F766E",
        ink: "#172033",
        muted: "#64748B",
        line: "#E2E8F0",
        canvas: "#F8FAFC"
      },
      fontFamily: { sans: ["Raleway", "ui-sans-serif", "system-ui", "sans-serif"] },
      boxShadow: { panel: "0 12px 32px rgba(20,43,74,.08)" }
    }
  },
  plugins: []
} satisfies Config;
