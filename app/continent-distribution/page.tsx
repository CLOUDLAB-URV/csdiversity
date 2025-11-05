import { loadDatasetStatic, processContinentDistribution } from "@/lib/data/load-data-static";
import { ClientContinentDistributionPage } from "@/components/continent-distribution/client-page";
import type { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  title: "Continent Distribution",
  description: "Analyze the geographic distribution of accepted papers across different continents (North America, Europe, Asia, Others) in systems and networks conferences. Filter by conference (OSDI, ASPLOS, NSDI, SIGCOMM, EuroSys, ATC) and year to explore trends from 2000-2024.",
  keywords: [
    "geographic distribution",
    "continent distribution",
    "academic papers by continent",
    "North America research",
    "European research",
    "Asian research",
    "conference geography",
    "geographic trends",
  ],
  alternates: {
    canonical: "/continent-distribution",
  },
  openGraph: {
    title: "Continent Distribution - Geographic Analysis of Academic Papers",
    description: "Analyze the geographic distribution of accepted papers across different continents in systems and networks conferences. Interactive visualizations with filtering by conference and year.",
    url: `${baseUrl}/continent-distribution`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Continent Distribution - Conference Data",
    description: "Analyze the geographic distribution of accepted papers across different continents",
  },
};

export default async function ContinentDistributionPage() {
  const rawData = await loadDatasetStatic('papers');
  const allData = processContinentDistribution(rawData);
  
  const conferences = Array.from(new Set(allData.map(d => d.conference))).sort();
  const years = Array.from(new Set(allData.map(d => d.year))).sort((a, b) => a - b);

  return <ClientContinentDistributionPage initialData={allData} conferences={conferences} years={years} />;
}
