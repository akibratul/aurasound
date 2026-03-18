/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "SF Pro Display", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(147, 197, 253, 0.08), 0 24px 80px rgba(17, 24, 39, 0.45)",
        soft: "0 14px 50px rgba(15, 23, 42, 0.28)",
      },
      screens: {
        xs: "480px",
      },
    },
  },
  plugins: [],
};
