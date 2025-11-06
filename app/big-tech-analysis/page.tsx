import { loadDatasetStatic } from "@/lib/data/load-data-static";
import { processBigTech, processBigTechByRegion } from "@/lib/data/load-data";
import { ClientBigTechAnalysisPage } from "@/components/big-tech-analysis/client-page";
import type { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  title: "Big Tech vs Academia",
  description: "Big Tech vs Academia: Compare contributions from major tech companies (Google, Microsoft, Meta, Amazon, Apple, IBM, Intel, Oracle, Cisco, NVIDIA, Samsung, Huawei, Alibaba, Tencent) versus academic institutions in 13 systems and networks conferences. Analyze industry affiliations, regional Big Tech distribution (North America, Asia, Europe), trends over time, and the balance between industry and academia in research output from 2000-2024.",
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
    "tech company research",
    "industry vs academia research",
    "Big Tech regional distribution",
    "corporate research contributions",
    "academic vs industry papers",
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
  const papersRaw = await loadDatasetStatic('papers');
  const allData = processBigTech(papersRaw);
  const allDataByRegion = processBigTechByRegion([], papersRaw);
  
  return <ClientBigTechAnalysisPage initialData={allData} initialDataByRegion={allDataByRegion} />;
}

