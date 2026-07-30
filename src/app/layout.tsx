import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
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
