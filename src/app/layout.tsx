import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const plusJakarta = localFont({
  src: "./fonts/plus-jakarta-sans-latin.woff2",
  variable: "--font-jakarta",
  weight: "300 700",
  style: "normal",
  display: "swap",
  fallback: ["Arial", "sans-serif"],
});

export const metadata: Metadata = {
  title: "SIBATIK IDB Bali",
  description: "SIBATIK - Sistem Support Ticket Kampus IDB Bali",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "SIBATIK IDB Bali",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#044C71",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${plusJakarta.variable} min-h-full antialiased`}>
      <body className="flex min-h-[100dvh] flex-col font-sans">{children}</body>
    </html>
  );
}
