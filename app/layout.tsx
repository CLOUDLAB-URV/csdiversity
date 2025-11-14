import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { StructuredDataScript } from "@/components/structured-data-script";
import { LayoutClient } from "@/components/layout/layout-client";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export const metadata: Metadata = {
  title: {
    default: "CSdiversity | Academic Conference Analysis & Visualization",
    template: "%s | CSdiversity",
  },
  description: "CSdiversity: Comprehensive academic conference data analysis and visualization platform. Explore geographic distribution, Asian trends, Big Tech vs Academia contributions, committee diversity, and research patterns across OSDI, ASPLOS, NSDI, SIGCOMM, EuroSys, ATC, SOCC, IEEECLOUD, CCGRID, EUROPAR, ICDCS, MIDDLEWARE, and IC2E. Interactive dashboards with data spanning 2000-2024.",
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
    "SOCC",
    "IEEECLOUD",
    "CCGRID",
    "EUROPAR",
    "ICDCS",
    "MIDDLEWARE",
    "IC2E",
    "research diversity",
    "academic collaboration",
    "geographic research trends",
  ],
  authors: [{ name: "CSdiversity" }],
  creator: "CSdiversity",
  publisher: "CSdiversity",
  metadataBase: new URL(baseUrl),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: baseUrl,
    siteName: "CSdiversity",
    title: "CSdiversity | Academic Conference Analysis & Visualization",
    description: "CSdiversity: Comprehensive academic conference data analysis platform. Explore geographic distribution, Asian trends, Big Tech vs Academia contributions, committee diversity, and research patterns across 13 top-tier systems and networks conferences from 2000-2024.",
    images: [
      {
        url: `${baseUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "CSdiversity - Academic Conference Analysis Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CSdiversity | Academic Conference Analysis",
    description: "CSdiversity: Comprehensive academic conference data analysis platform. Explore geographic distribution, trends, diversity metrics, and Big Tech vs Academia contributions across 13 top-tier systems and networks conferences.",
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
  applicationName: "CSdiversity",
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
    title: 'CSdiversity',
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
        {GA_ID ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="gtag-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}', {
                  page_path: window.location.pathname,
                });
              `}
            </Script>
          </>
        ) : null}
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
