/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
    "!./node_modules/**",
    "!./dist/**",
    "!./supabase/**",
  ],
  theme: {
    extend: {
      colors: {
        'mint-black': '#0f1f17',
        'mint-white': '#f0fdf8',
        'mint-green': '#10b981',
        'mint-green-light': '#d1fae5',
      },
    },
  },
  plugins: [],
};
