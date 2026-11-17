import type { Config } from "tailwindcss";

/**
 * SportMatch design tokens.
 * Colors are CSS variables (see src/app/globals.css) so dark/light themes
 * swap at runtime without re-rendering components.
 */
const c = (v: string) => `rgb(var(--${v}) / <alpha-value>)`;

export default {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    screens: { sm: "640px", md: "768px", lg: "1024px", xl: "1280px", "2xl": "1536px" },
    extend: {
      colors: {
        bg: c("bg"),
        surface: c("surface"),
        "surface-2": c("surface-2"),
        border: c("border"),
        fg: c("fg"),
        muted: c("muted"),
        primary: { DEFAULT: c("primary"), fg: c("primary-fg"), ink: c("primary-ink") },
        success: c("success"),
        warning: c("warning"),
        error: c("error"),
        info: c("info"),
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Manrope", "Inter", "sans-serif"],
      },
      borderRadius: { sm: "6px", DEFAULT: "10px", md: "10px", lg: "14px", xl: "18px", "2xl": "24px" },
      boxShadow: {
        card: "0 1px 0 rgb(var(--shadow) / 0.04), 0 8px 24px -12px rgb(var(--shadow) / 0.25)",
        pop: "0 16px 48px -12px rgb(var(--shadow) / 0.45)",
        ring: "0 0 0 3px rgb(var(--primary) / 0.35)",
      },
      fontSize: {
        "2xs": ["11px", "14px"],
        xs: ["12px", "16px"],
        sm: ["14px", "20px"],
        base: ["15px", "22px"],
        lg: ["17px", "24px"],
        xl: ["20px", "28px"],
        "2xl": ["24px", "30px"],
        "3xl": ["30px", "36px"],
        "4xl": ["38px", "44px"],
        "5xl": ["52px", "56px"],
      },
      keyframes: {
        "fade-up": { from: { opacity: "0", transform: "translateY(6px)" }, to: { opacity: "1", transform: "none" } },
        "slide-in": { from: { transform: "translateX(100%)" }, to: { transform: "none" } },
        "slide-up": { from: { transform: "translateY(100%)" }, to: { transform: "none" } },
        shimmer: { "100%": { transform: "translateX(100%)" } },
        pulse2: { "0%,100%": { opacity: "1" }, "50%": { opacity: ".45" } },
      },
      animation: {
        "fade-up": "fade-up .28s cubic-bezier(.2,.8,.2,1) both",
        "slide-in": "slide-in .28s cubic-bezier(.2,.8,.2,1) both",
        "slide-up": "slide-up .28s cubic-bezier(.2,.8,.2,1) both",
        shimmer: "shimmer 1.4s infinite",
        pulse2: "pulse2 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
