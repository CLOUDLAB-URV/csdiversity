import { loadDatasetStatic } from "@/lib/data/load-data-static";
import { processCommitteeContinentDistribution } from "@/lib/data/load-data";
import { ClientProgramCommitteeDistributionPage } from "@/components/program-committee-distribution/client-page";
import type { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  title: "Program Committee Distribution",
  description: "Analyze the geographic distribution of program committee members across different continents (North America, Europe, Asia, Others) in systems and networks conferences. Filter by conference (OSDI, ASPLOS, NSDI, SIGCOMM, EuroSys, ATC) and year to explore trends from 2000-2024.",
  keywords: [
    "program committee distribution",
    "committee geographic distribution",
    "committee members by continent",
    "North America committee",
    "European committee",
    "Asian committee",
    "conference committee geography",
    "committee trends",
  ],
  alternates: {
    canonical: "/program-committee-distribution",
  },
  openGraph: {
    title: "Program Committee Distribution - Geographic Analysis of Committee Members",
    description: "Analyze the geographic distribution of program committee members across different continents in systems and networks conferences. Interactive visualizations with filtering by conference and year.",
    url: `${baseUrl}/program-committee-distribution`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Program Committee Distribution - Conference Data",
    description: "Analyze the geographic distribution of program committee members across different continents",
  },
};

export default async function ProgramCommitteeDistributionPage() {
  const rawData = await loadDatasetStatic('committee');
  const allData = processCommitteeContinentDistribution(rawData);
  
  const conferences = Array.from(new Set(allData.map(d => d.conference))).sort();
  const years = Array.from(new Set(allData.map(d => d.year))).sort((a, b) => a - b);

  return <ClientProgramCommitteeDistributionPage initialData={allData} conferences={conferences} years={years} />;
}

