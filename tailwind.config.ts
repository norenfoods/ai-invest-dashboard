import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        terminal: {
          bg: "#070B12",
          panel: "#0D1420",
          panelSoft: "#111B2B",
          border: "#213047",
          muted: "#8EA0B8",
          text: "#E6EEF8",
          green: "#19C37D",
          red: "#FF5C7A",
          amber: "#F5B84B",
          cyan: "#45C7E8",
        },
      },
      boxShadow: {
        panel: "0 18px 50px rgba(0, 0, 0, 0.28)",
      },
    },
  },
  plugins: [],
};

export default config;
