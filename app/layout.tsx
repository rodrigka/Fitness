import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fitness Dashboard",
  description: "Tableau de bord fitness - suivi poids et composition corporelle",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <meta name="theme-color" content="#0f1117" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="Fitness" />
        <link rel="icon" type="image/jpeg" href="/Fitness/icon.jpg" />
        <link rel="apple-touch-icon" href="/Fitness/icon.jpg" />
        <link rel="manifest" href="/Fitness/manifest.json" />
        <Script
          src="https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js"
          strategy="afterInteractive"
        />
        <Script
          src="https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns@3.0.0/dist/chartjs-adapter-date-fns.bundle.min.js"
          strategy="afterInteractive"
        />
      </head>
      <body className="bg-[#0f1117] text-[#e4e4e7] min-h-screen">
        {children}
      </body>
    </html>
  );
}
