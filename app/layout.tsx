import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#1b1a17",
};

export const metadata: Metadata = {
  title: "Inkpad — Project Hub",
  description: "Aplikasi nulis & organizer buat light novel",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Inkpad",
  },
  icons: {
    apple: "/assets/icons/icon-192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full">
      <head>
        {/* Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Lora:wght@600&family=Lato:wght@400;500;600&family=Playfair+Display:wght@600&family=IBM+Plex+Sans:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        {/* Tabler Icons */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css"
        />
        {/* Inkpad CSS */}
        <link rel="stylesheet" href="/css/base.css" />
        <link rel="stylesheet" href="/css/layout.css" />
        <link rel="stylesheet" href="/css/components.css" />
        <link rel="stylesheet" href="/css/splash.css" />
        {/* Apple splash */}
        <link
          rel="apple-touch-startup-image"
          href="/assets/splash/splash.png"
          media="(orientation: portrait)"
        />
        {/* Supabase SDK — loaded globally for all pages */}
        <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2" />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}