import { loadDatasetStatic, processContinentDistribution } from "@/lib/data/load-data-static";
import { ClientContinentDistributionPage } from "@/components/continent-distribution/client-page";
import type { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  title: "Accepted Papers Distribution",
  description: "Accepted Papers Distribution: Analyze geographic distribution of accepted papers across continents (North America, Europe, Asia, Others) in 13 systems and networks conferences. Filter by conference (OSDI, ASPLOS, NSDI, SIGCOMM, EuroSys, ATC, SOCC, IEEECLOUD, CCGRID, EUROPAR, ICDCS, MIDDLEWARE, IC2E) and year to explore trends from 2000-2024. Interactive bar charts and visualizations.",
  keywords: [
    "geographic distribution",
    "continent distribution",
    "academic papers by continent",
    "North America research",
    "European research",
    "Asian research",
    "conference geography",
    "geographic trends",
    "accepted papers by region",
    "paper distribution analysis",
    "continental research distribution",
    "geographic paper trends",
  ],
  alternates: {
    canonical: "/continent-distribution",
  },
  openGraph: {
    title: "Accepted Papers Distribution - Geographic Analysis of Academic Papers",
    description: "Analyze the geographic distribution of accepted papers across different continents in systems and networks conferences. Interactive visualizations with filtering by conference and year.",
    url: `${baseUrl}/continent-distribution`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Accepted Papers Distribution - Conference Data",
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
