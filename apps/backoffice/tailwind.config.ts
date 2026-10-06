import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}", "../../packages/ui/src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eff8f5",
          100: "#d8eee6",
          600: "#16836a",
          700: "#116b57",
          900: "#123e36"
        }
      }
    }
  },
  plugins: []
};

export default config;