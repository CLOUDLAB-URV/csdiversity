import { loadDatasetStatic } from "@/lib/data/load-data-static";
import { CountryRankingPage } from "@/components/country-ranking/country-ranking-page";

export const metadata = {
  title: "Country Ranking",
  description: "Global ranking of countries by share of accepted papers and program committee members.",
};

export default async function CountryRanking() {
  const papersCountryRaw = await loadDatasetStatic("papers-country");
  const committeeCountryRaw = await loadDatasetStatic("committee-country");

  return (
    <CountryRankingPage papersCountryRaw={papersCountryRaw} committeeCountryRaw={committeeCountryRaw} />
  );
}






