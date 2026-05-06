/** @type {import("tailwindcss").Config} */
const config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        csp: {
          background: "#F5F5F5",
          primary: "#3A2E89",
          accent: "#0BAA9F",
          soft: "#EFF4FE",
          blue: "#455CE9",
          neutral: "#A39481",
          black: "#010101",
          white: "#FFFFFF",
          error: "#BA1A1A",
          warning: "#F59E0B",
        },
      },
      boxShadow: {
        csp: "0px 4px 20px rgba(58, 46, 137, 0.08)",
        "csp-lg": "0px 12px 40px rgba(58, 46, 137, 0.14)",
      },
    },
  },
};

export default config;
