import { loadDatasetStatic } from "@/lib/data/load-data-static";
import { processAsianTrends } from "@/lib/data/load-data";
import { ClientAsianTrendsPage } from "@/components/asian-trends/client-page";
import type { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  title: "Asian Trends",
  description: "Track the evolution of Asian academic contributions over time in systems and networks conferences (OSDI, ASPLOS, NSDI, SIGCOMM, EuroSys, ATC). View trends by conference with aggregate and individual line visualizations from 2000-2024. Analyze the growth of Asian research output.",
  keywords: [
    "Asian academic trends",
    "Asian research contributions",
    "Asian papers",
    "academic trends",
    "conference trends",
    "research evolution",
    "Asian institutions",
    "academic growth",
  ],
  alternates: {
    canonical: "/asian-trends",
  },
  openGraph: {
    title: "Asian Trends - Evolution of Asian Academic Contributions",
    description: "Track the evolution of Asian academic contributions over time in systems and networks conferences. Interactive trend visualizations by conference.",
    url: `${baseUrl}/asian-trends`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Asian Trends - Conference Data",
    description: "Track the evolution of Asian academic contributions over time in systems and networks conferences",
  },
};

export default async function AsianTrendsPage() {
  const raw = await loadDatasetStatic('papers');
  const allData = processAsianTrends(raw);
  
  return <ClientAsianTrendsPage initialData={allData} />;
}

