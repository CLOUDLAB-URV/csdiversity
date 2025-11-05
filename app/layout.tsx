import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { StructuredDataScript } from "@/components/structured-data-script";
import { LayoutClient } from "@/components/layout/layout-client";

const inter = Inter({ subsets: ["latin"] });

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  title: {
    default: "Conference Data Visualizer | Academic Conference Analysis & Visualization",
    template: "%s | Conference Data Visualizer",
  },
  description: "Visualize and analyze academic conference data from top-tier systems and networks conferences (OSDI, ASPLOS, NSDI, SIGCOMM, EuroSys, ATC). Track geographic distribution, Asian trends, diversity metrics, and Big Tech vs Academia contributions. Interactive dashboards with data from 2000-2024.",
  keywords: [
    "academic conferences",
    "systems research",
    "networks research",
    "data visualization",
    "conference analysis",
    "academic trends",
    "OSDI",
    "ASPLOS",
    "NSDI",
    "SIGCOMM",
    "EuroSys",
    "ATC",
    "academic paper analysis",
    "geographic distribution",
    "diversity metrics",
    "program committee analysis",
    "Big Tech research",
    "academic contributions",
    "research trends",
    "conference statistics",
  ],
  authors: [{ name: "Conference Data Visualizer" }],
  creator: "Conference Data Visualizer",
  publisher: "Conference Data Visualizer",
  metadataBase: new URL(baseUrl),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: baseUrl,
    siteName: "Conference Data Visualizer",
    title: "Conference Data Visualizer | Academic Conference Analysis & Visualization",
    description: "Visualize and analyze academic conference data from top-tier systems and networks conferences. Track geographic distribution, trends, and diversity metrics across OSDI, ASPLOS, NSDI, SIGCOMM, EuroSys, and ATC.",
    images: [
      {
        url: `${baseUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Conference Data Visualizer - Academic Conference Analysis Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Conference Data Visualizer | Academic Conference Analysis",
    description: "Visualize and analyze academic conference data from top-tier systems and networks conferences. Track trends, diversity, and geographic distribution.",
    images: [`${baseUrl}/og-image.png`],
    creator: "@conferenceviz",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
    yahoo: process.env.NEXT_PUBLIC_YAHOO_VERIFICATION,
  },
  category: "Education",
  classification: "Academic Research Tool",
  applicationName: "Conference Data Visualizer",
  referrer: "origin-when-cross-origin",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Conference Viz',
  },
};

export const viewport: Viewport = {
  themeColor: '#1f3b6f',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <StructuredDataScript />
        <ThemeProvider defaultTheme="system" storageKey="conference-visualizer-theme">
          <LayoutClient>
            {children}
          </LayoutClient>
        </ThemeProvider>
      </body>
    </html>
  );
}

