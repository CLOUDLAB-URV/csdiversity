import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Conference Data Visualizer",
  description: "Visualize and analyze academic conference data from systems and networks conferences",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex min-h-screen flex-col">
          <Header />
          <div className="flex flex-1 overflow-hidden">
            <Sidebar />
            <div className="flex flex-col flex-1 lg:ml-72">
              <main className="flex-1 overflow-auto p-6 lg:p-8">
                {children}
              </main>
            </div>
          </div>
          <Footer />
        </div>
      </body>
    </html>
  );
}

