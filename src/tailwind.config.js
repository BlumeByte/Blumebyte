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
        'mint-black': '#111111',
        'mint-white': '#fafafa',
        'mint-green': '#111111',
        'mint-green-light': '#f3f4f6',
      },
    },
  },
  plugins: [],
};
