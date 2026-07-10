import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: { sans: ["var(--font-inter)"], display: ["var(--font-poppins)"] },
      colors: { ink: "#1a1d29", canvas: "#f8f9fc", brand: "#4f46e5" },
      boxShadow: { card: "0 2px 8px rgba(0,0,0,.06)" },
    },
  },
  plugins: [],
} satisfies Config;
