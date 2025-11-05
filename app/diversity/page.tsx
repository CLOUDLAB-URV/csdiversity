import { loadDatasetStatic } from "@/lib/data/load-data-static";
import { processDiversity } from "@/lib/data/load-data";
import { ClientDiversityPage } from "@/components/diversity/client-page";
import type { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  title: "Diversity Metrics",
  description: "Explore diversity indices (Gini-Simpson Index) across conferences and committees in systems and networks conferences. Analyze geographic diversity and representation patterns. Measure diversity from 0 (homogeneous) to 1 (highly diverse) across OSDI, ASPLOS, NSDI, SIGCOMM, EuroSys, and ATC.",
  keywords: [
    "diversity metrics",
    "Gini-Simpson Index",
    "geographic diversity",
    "conference diversity",
    "committee diversity",
    "representation patterns",
    "diversity analysis",
    "academic diversity",
  ],
  alternates: {
    canonical: "/diversity",
  },
  openGraph: {
    title: "Diversity Metrics - Geographic Diversity Analysis",
    description: "Explore diversity indices (Gini-Simpson Index) across conferences and committees. Analyze geographic diversity and representation patterns.",
    url: `${baseUrl}/diversity`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Diversity Metrics - Conference Data",
    description: "Explore diversity indices across conferences and committees",
  },
};

export default async function DiversityPage() {
  const [papersRaw, committeeRaw] = await Promise.all([
    loadDatasetStatic('papers'),
    loadDatasetStatic('committee'),
  ]);

  const diversityData = processDiversity(papersRaw, committeeRaw);

  return <ClientDiversityPage initialData={diversityData} />;
}
