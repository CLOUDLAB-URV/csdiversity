import { loadDatasetStatic } from "@/lib/data/load-data-static";
import { processBigTech } from "@/lib/data/load-data";
import { ClientBigTechAnalysisPage } from "@/components/big-tech-analysis/client-page";
import type { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  title: "Big Tech vs Academia",
  description: "Compare contributions from major tech companies (Google, Microsoft, Meta, Amazon, Apple) versus academic institutions in systems and networks conferences. Analyze industry affiliations, trends over time, and the balance between industry and academia in research output from 2000-2024.",
  keywords: [
    "Big Tech research",
    "industry vs academia",
    "Google research",
    "Microsoft research",
    "Meta research",
    "Amazon research",
    "tech company papers",
    "academic institutions",
    "industry contributions",
  ],
  alternates: {
    canonical: "/big-tech-analysis",
  },
  openGraph: {
    title: "Big Tech vs Academia - Industry vs Academic Contributions",
    description: "Compare contributions from major tech companies versus academic institutions in systems and networks conferences. Analyze industry affiliations and trends.",
    url: `${baseUrl}/big-tech-analysis`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Big Tech vs Academia - Conference Data",
    description: "Compare contributions from major tech companies versus academic institutions",
  },
};

export default async function BigTechAnalysisPage() {
  const raw = await loadDatasetStatic('bigtech');
  const allData = processBigTech(raw);
  
  return <ClientBigTechAnalysisPage initialData={allData} />;
}

