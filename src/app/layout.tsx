import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SportMatch — Find your game. Book your sport. Manage your events.",
  description: "Prototype interactif SportMatch (données fictives).",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#101A17" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Manrope:wght@600;700;800&display=swap"
        />
        <style>{`:root{--font-sans:Inter;--font-display:Manrope}`}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
