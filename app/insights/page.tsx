import { loadDatasetStatic } from "@/lib/data/load-data-static";
import { InsightsPage } from "@/components/insights/insights-page";

export const metadata = {
  title: "Deep Insights",
  description: "Additional analytics derived from collaboration and representation data.",
};

export default async function Insights() {
  const [papers, paperCountries, committee, committeeCountries] = await Promise.all([
    loadDatasetStatic("papers"),
    loadDatasetStatic("papers-country"),
    loadDatasetStatic("committee"),
    loadDatasetStatic("committee-country"),
  ]);

  return (
    <InsightsPage
      paperRows={papers}
      paperCountryRows={paperCountries}
      committeeRows={committee}
      committeeCountryRows={committeeCountries}
    />
  );
}








