/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        pitch: {
          DEFAULT: "#15803d",
          dark: "#166534",
          light: "#22c55e",
        },
      },
      fontFamily: {
        display: ["'Trebuchet MS'", "Verdana", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
