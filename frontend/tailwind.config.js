/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        aarogyai: {
          navy: "#0b2239",
          teal: "#0f766e",
          surface: "#f5f8fb",
        },
      },
    },
  },
  plugins: [],
};
