/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        white: "white",
        none: "none",
      },
      borderWidth : {
        1: "1px",
      },
      fontFamily: {
        ubuntu: ["Ubuntu", "serif"],
      }
    },
  },
  plugins: [],
}