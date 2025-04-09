/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          blue: "#2C3E50", // Deep Blue (Main)
          light: "#1A73E8", // Royal Blue
          dark: "#1B2B3A", // Darker shade for depth
        },
        secondary: {
          teal: "#009688", // Teal
          light: "#4CAF50", // Green for progress/success
          dark: "#00796B", // Darker Teal
        },
        alert: {
          success: "#28A745", // Green
          error: "#DC3545", // Red
          warning: "#FFC107", // Amber
          info: "#17A2B8", // Cyan
        },
        background: "#F5F5F5", // Light Gray
        text: {
          DEFAULT: "#333333", // Dark Gray for text
          light: "#555555", // Lighter text
        },
      },
    },
  },
  plugins: [],
};
