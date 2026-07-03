import type { Metadata, Viewport } from "next";
import Script from "next/script";
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
    startupImage: [
      {
        url: "/assets/splash/splash.png",
        media: "(orientation: portrait)",
      },
    ],
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
        {/* Google Fonts - preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Lora:wght@600&family=Lato:wght@400;500;600&family=Playfair+Display:wght@600&family=IBM+Plex+Sans:wght@400;500;600&family=Literata:wght@400;500;600&family=Inter:wght@400;500;600&family=Nunito+Sans:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        {/* Tabler Icons */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css"
        />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
