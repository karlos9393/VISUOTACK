import type { Config } from "tailwindcss";

// Palette CYGA (versant clair) — centralisée ici.
// Accent signature : corail #E8564B. On remappe aussi l'échelle `blue` sur le corail
// pour que TOUS les accents bleus historiques (boutons, nav active, focus, liens)
// deviennent corail sans toucher chaque composant.
const coral = {
  50: "#FDECEA",
  100: "#FBD9D5",
  200: "#F7B8B1",
  300: "#F2938A",
  400: "#ED6E63",
  500: "#E8564B",
  600: "#E8564B",
  700: "#D4453A",
  800: "#B23A30",
  900: "#8F2E26",
};

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // App
        app: "#F8F9FA",
        // Accent signature CYGA
        primary: {
          DEFAULT: "#E8564B",
          hover: "#D4453A",
          soft: "#FDECEA",
          ...coral,
        },
        coral,
        // Remap de l'ancien bleu → corail (cohérence globale)
        blue: coral,
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
