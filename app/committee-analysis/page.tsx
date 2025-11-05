import { loadDatasetStatic } from "@/lib/data/load-data-static";
import { processCommitteeVsPapers, processCommitteeVsPapersByYear } from "@/lib/data/load-data";
import { ClientCommitteeAnalysisPage } from "@/components/committee-analysis/client-page";
import type { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  title: "Committee vs Papers",
  description: "Compare geographic distribution between program committees and accepted papers in systems and networks conferences. Analyze gaps in representation across continents (North America, Europe, Asia) and conferences over time. Identify over-representation and under-representation patterns.",
  keywords: [
    "program committee",
    "committee diversity",
    "committee representation",
    "geographic gap analysis",
    "committee vs papers",
    "representation gap",
    "committee composition",
    "diversity analysis",
  ],
  alternates: {
    canonical: "/committee-analysis",
  },
  openGraph: {
    title: "Committee vs Papers - Representation Gap Analysis",
    description: "Compare geographic distribution between program committees and accepted papers. Analyze gaps in representation across continents and conferences.",
    url: `${baseUrl}/committee-analysis`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Committee vs Papers - Conference Data",
    description: "Compare geographic distribution between program committees and accepted papers",
  },
};

export default async function CommitteeAnalysisPage() {
  const [papersRaw, committeeRaw] = await Promise.all([
    loadDatasetStatic('papers'),
    loadDatasetStatic('committee'),
  ]);

  const allData = processCommitteeVsPapers(papersRaw, committeeRaw);
  const byYearData = processCommitteeVsPapersByYear(papersRaw, committeeRaw);
  
  const conferences = Array.from(new Set(allData.map(d => d.conference))).sort();
  const years = Array.from(new Set(byYearData.map(d => d.year))).sort((a, b) => a - b);

  return (
    <ClientCommitteeAnalysisPage 
      initialData={allData} 
      byYearData={byYearData}
      papersRaw={papersRaw}
      committeeRaw={committeeRaw}
      conferences={conferences} 
      years={years} 
    />
  );
}

