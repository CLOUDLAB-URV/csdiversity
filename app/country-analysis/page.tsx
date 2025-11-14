import { ClientCountryAnalysisPage } from "@/components/country-analysis/client-page";
import { loadDatasetStatic } from "@/lib/data/load-data-static";
import {
  calculateTopCountries,
  processCommitteeVsPapers,
  processCommitteeVsPapersByYear,
  processCommitteeVsPapersByYearCountry,
  processCommitteeVsPapersCountry,
} from "@/lib/data/load-data";
import type { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  title: "Committee vs Papers by Country",
  description:
    "Compare the geographic distribution between program committees and accepted papers by country. Explore representation gaps across conferences and years with interactive heatmaps and time evolution views.",
  keywords: [
    "committee vs papers",
    "representation gap",
    "country distribution",
    "committee diversity",
    "conference analysis",
    "geographic representation",
    "accepted papers",
  ],
  alternates: {
    canonical: "/country-analysis",
  },
  openGraph: {
    title: "Committee vs Papers - Country Representation Gap Analysis",
    description:
      "Analyze how program committees and accepted papers compare across countries. Identify over- and under-representation across conferences and years.",
    url: `${baseUrl}/country-analysis`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Committee vs Papers - Country Distribution",
    description: "Compare program committees and accepted papers by country.",
  },
};

export default async function CountryAnalysisPage() {
  const [papersRaw, committeeRaw, papersCountryRaw, committeeCountryRaw] = await Promise.all([
    loadDatasetStatic("papers"),
    loadDatasetStatic("committee"),
    loadDatasetStatic("papers-country"),
    loadDatasetStatic("committee-country"),
  ]);

  const topCountries = calculateTopCountries(papersCountryRaw, committeeCountryRaw, {
    limit: 14,
  });

  const sanitizedTopCountries = topCountries.filter(
    (country) => country !== "Unknown" && country !== "Other"
  );

  const continentGapData = processCommitteeVsPapers(papersRaw, committeeRaw);
  const continentGapByYear = processCommitteeVsPapersByYear(papersRaw, committeeRaw);

  const { data: countryGapData, countries: countryOrder } = processCommitteeVsPapersCountry(
    papersCountryRaw,
    committeeCountryRaw,
    {
      focusCountries: sanitizedTopCountries,
      includeOtherBucket: false,
      includeUnknownBucket: false,
    }
  );

  const { data: countryGapByYear, countries: countryOrderByYear } = processCommitteeVsPapersByYearCountry(
    papersCountryRaw,
    committeeCountryRaw,
    {
      focusCountries: sanitizedTopCountries,
      includeOtherBucket: false,
      includeUnknownBucket: false,
    }
  );

  const combinedCountries = Array.from(new Set([...countryOrder, ...countryOrderByYear])).filter(
    (country) => country !== "Unknown" && country !== "Other"
  );
  const effectiveTopCountries =
    sanitizedTopCountries.length > 0 ? sanitizedTopCountries : combinedCountries;

  const continentConferences = Array.from(new Set(continentGapData.map((item) => item.conference))).sort();
  const continentYears = Array.from(new Set(continentGapByYear.map((item) => item.year))).sort((a, b) => a - b);
  const conferences = Array.from(new Set(countryGapData.map((item) => item.conference))).sort();
  const years = Array.from(new Set(countryGapByYear.map((item) => item.year))).sort((a, b) => a - b);

  return (
    <ClientCountryAnalysisPage
      continentData={continentGapData}
      continentByYear={continentGapByYear}
      papersContinentRaw={papersRaw}
      committeeContinentRaw={committeeRaw}
      continentConferences={continentConferences}
      continentYears={continentYears}
      initialData={countryGapData}
      byYearData={countryGapByYear}
      papersRaw={papersCountryRaw}
      committeeRaw={committeeCountryRaw}
      conferences={conferences}
      years={years}
      countries={combinedCountries}
      topCountries={effectiveTopCountries}
    />
  );
}

