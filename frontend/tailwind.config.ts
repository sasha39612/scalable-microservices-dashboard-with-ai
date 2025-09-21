import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";
import type { PluginAPI } from "tailwindcss/types/config";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./ui/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: 'var(--font-heading)',
        body: 'var(--font-body)',
      },
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.5rem',
        '5xl': '3rem',
        '6xl': '3.75rem',
        '7xl': '4.5rem',
      },
      colors: {
        background: 'var(--background)',          // "#1A1919"
      },
      lineHeight: {
        "extra-loose": "2.5",
        "12": "13rem",
      },
      container: {
        center: true,
        padding: {
        DEFAULT: "1rem", // 16px
        sm: "1.5rem",    // 24px
        md: "3rem",      // 48px
        lg: "4rem",      // 64px
        xl: "6rem",      // 96px
      },
      },
      screens: {
        sm: "375px",
        md: "768px",
        lg: "1024px",
        xl: "1440px",
      },
      gridTemplateColumns: {
        // Simple 3 column grid
        "3": "repeat(3, minmax(270px, 1fr))",
      },
      aspectRatio: {
        "1": "2 / 2",
      },
      spacing: {
        "6": "48px",
        "20": "20px",
        "25": "25px",
        "32": "32px",
        "40": "40px",
        "56": "56px",
        "72": "72px",
        "80": "80px",
        "112": "112px",
      },
    },
  },
  plugins: [
    plugin(function ({ addVariant }: PluginAPI) {
      addVariant("hocus", ["&:hover", "&:focus"]);
    }),
  ],
};
export default config;
