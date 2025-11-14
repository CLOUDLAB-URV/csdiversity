"use client";

import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartContainer } from "@/components/charts/chart-container";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type InsightsPageProps = {
  paperRows: any[];
  paperCountryRows: any[];
  committeeRows: any[];
  committeeCountryRows: any[];
};

type CountryPairEntry = {
  pair: string;
  countries: [string, string];
  weight: number;
  share: number;
};

type TurnoverEntry = {
  year: number;
  newcomers: number;
  returning: number;
};

type TenureBucket = {
  label: string;
  people: number;
};

const parseDelimitedValues = (value: unknown): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.flatMap((item) => parseDelimitedValues(item));
  }
  const cleaned = String(value).replace(/\r?\n/g, " ").trim();
  if (!cleaned) return [];
  return cleaned
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean);
};

const parseCountries = (value: unknown): string[] => {
  return parseDelimitedValues(value)
    .map((item) =>
      item
        .replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9\s\-\(\)]+$/g, "")
        .split(" ")
        .filter(Boolean)
        .map((part) =>
          part.length <= 2 ? part.toUpperCase() : part[0].toUpperCase() + part.slice(1).toLowerCase()
        )
        .join(" ")
    )
    .filter(Boolean);
};

const normalizeConference = (value: string): string => {
  const trimmed = String(value ?? "").trim().toUpperCase();
  if (!trimmed) return "";
  const map: Record<string, string> = {
    CLOUD: "SOCC",
    "IEEE CLOUD": "IEEECLOUD",
  };
  return map[trimmed] ?? trimmed;
};

const formatPercent = (value: number) => `${value.toFixed(2)}%`;

export function InsightsPage({
  paperCountryRows,
  committeeRows,
  committeeCountryRows,
}: InsightsPageProps) {
  const topCountryPairs = useMemo<CountryPairEntry[]>(() => {
    const pairWeights = new Map<string, number>();
    let totalWeight = 0;

    for (const row of paperCountryRows) {
      const countries = Array.from(
        new Set(parseCountries(row.Countries ?? row.countries ?? row.Country ?? row.country))
      );
      if (countries.length < 2) continue;
      const combos: [string, string][] = [];
      for (let i = 0; i < countries.length; i++) {
        for (let j = i + 1; j < countries.length; j++) {
          const a = countries[i];
          const b = countries[j];
          if (!a || !b) continue;
          const pair = [a, b].sort() as [string, string];
          combos.push(pair);
        }
      }
      if (!combos.length) continue;
      const weightPerPair = 1 / combos.length;
      totalWeight += 1;
      for (const pair of combos) {
        const key = pair.join("|||");
        pairWeights.set(key, (pairWeights.get(key) ?? 0) + weightPerPair);
      }
    }

    const entries = Array.from(pairWeights.entries())
      .map(([key, weight]) => {
        const [a, b] = key.split("|||") as [string, string];
        return {
          pair: `${a} ↔ ${b}`,
          countries: [a, b] as [string, string],
          weight,
          share: totalWeight > 0 ? Number(((weight / totalWeight) * 100).toFixed(2)) : 0,
        };
      })
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 25);

    return entries;
  }, [paperCountryRows]);

  const { turnoverSeries, tenureBuckets, topVeterans } = useMemo(() => {
    const sortedRows = [...committeeRows].sort((a, b) => {
      const yearA = Number(a.year ?? a.Year);
      const yearB = Number(b.year ?? b.Year);
      return yearA - yearB;
    });

    const seenByConference = new Map<string, Set<string>>();
    const yearBuckets = new Map<number, { newcomers: number; returning: number }>();
    const personAppearances = new Map<string, { name: string; count: number }>();

    for (const row of sortedRows) {
      const name = String(row.name ?? row.Name ?? "").trim();
      const conference = normalizeConference(row.conference ?? row.Conference ?? "");
      const year = Number(row.year ?? row.Year);
      if (!name || !conference || !Number.isFinite(year)) continue;

      const nameKey = name.toLowerCase();

      const confSet = seenByConference.get(conference) ?? new Set<string>();
      const bucket = yearBuckets.get(year) ?? { newcomers: 0, returning: 0 };

      if (confSet.has(nameKey)) {
        bucket.returning += 1;
      } else {
        bucket.newcomers += 1;
        confSet.add(nameKey);
        seenByConference.set(conference, confSet);
      }

      yearBuckets.set(year, bucket);
      personAppearances.set(nameKey, {
        name,
        count: (personAppearances.get(nameKey)?.count ?? 0) + 1,
      });
    }

    const turnoverSeries: TurnoverEntry[] = Array.from(yearBuckets.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([year, { newcomers, returning }]) => ({
        year,
        newcomers,
        returning,
      }));

    const histogram = new Map<number, number>();
    for (const { count } of personAppearances.values()) {
      const bucket = count >= 6 ? 6 : count;
      histogram.set(bucket, (histogram.get(bucket) ?? 0) + 1);
    }
    const tenureBuckets: TenureBucket[] = [1, 2, 3, 4, 5, 6].map((bucket) => ({
      label: bucket === 6 ? "6+" : `${bucket}`,
      people: histogram.get(bucket) ?? 0,
    }));

    const topVeterans = Array.from(personAppearances.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);

    return { turnoverSeries, tenureBuckets, topVeterans };
  }, [committeeRows]);

  const totalCommitteeSeats = useMemo(() => {
    const counts = committeeCountryRows.length;
    return counts;
  }, [committeeCountryRows]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Deep Insights</h1>
        <p className="text-muted-foreground mt-2 max-w-3xl">
          Collaboration hotspots and committee dynamics derived from multi-country records and longitudinal
          membership data.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-none shadow-xl lg:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold">Top Cross-Country Collaborations</CardTitle>
            <CardDescription>
              Weighted frequency of country pairs appearing together in accepted papers. Each paper that spans
              multiple countries distributes a single point across all its pairs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[360px] rounded-lg border border-slate-200 dark:border-slate-800">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                  <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3">Pair</th>
                    <th className="px-4 py-3">Countries</th>
                    <th className="px-4 py-3 text-right">
                      <span
                        className="inline-flex items-center gap-1.5 justify-end"
                        title="Each multi-country paper distributes 1 point across all unique country pairs; this column shows the cumulative weighted count."
                      >
                        Weighted Count
                        <span aria-hidden="true" className="text-muted-foreground/70">ⓘ</span>
                      </span>
                    </th>
                    <th className="px-4 py-3 text-right">
                      <span
                        className="inline-flex items-center gap-1.5 justify-end"
                        title="Percentage of all multi-country collaborations accounted for by this pair (using the same weighting)."
                      >
                        Share of Collabs
                        <span aria-hidden="true" className="text-muted-foreground/70">ⓘ</span>
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {topCountryPairs.map((entry) => (
                    <tr
                      key={entry.pair}
                      className="border-b border-slate-100 dark:border-slate-800/70 last:border-0"
                    >
                      <td className="px-4 py-3 font-medium text-foreground">{entry.pair}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          {entry.countries.map((country) => (
                            <Badge key={country} variant="secondary">
                              {country}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">{entry.weight.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-sky-600 dark:text-sky-400">
                        {formatPercent(entry.share)}
                      </td>
                    </tr>
                  ))}
                  {topCountryPairs.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                        No multi-country collaborations detected.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Committee Turnover</CardTitle>
            <CardDescription>
              Aggregated newcomers versus returning committee members each year (all conferences). Highlights how
              quickly the committee ecosystem renews itself.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={turnoverSeries}
                  margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.4} />
                  <XAxis
                    dataKey="year"
                    tick={{ fill: "#6b7280", fontSize: 12 }}
                    allowDecimals={false}
                    label={{ value: "Year", position: "insideBottom", offset: -10, fill: "#6b7280", fontSize: 13, fontWeight: 500 }}
                  />
                  <YAxis 
                    tick={{ fill: "#6b7280", fontSize: 12 }}
                    label={{ value: "Number of Members", angle: -90, position: "insideLeft", fill: "#6b7280", fontSize: 13, fontWeight: 500 }}
                  />
                  <Tooltip
                    formatter={(value: number, name, props) => [
                      value.toLocaleString("en-US"),
                      (props?.dataKey ?? name) === "newcomers" ? "New members" : "Returning members",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="newcomers"
                    stackId="a"
                    stroke="#22c55e"
                    fill="#22c55e"
                    fillOpacity={0.4}
                    name="New members"
                  />
                  <Area
                    type="monotone"
                    dataKey="returning"
                    stackId="a"
                    stroke="#1f3b6f"
                    fill="#1f3b6f"
                    fillOpacity={0.5}
                    name="Returning members"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
            <p className="text-xs text-muted-foreground mt-3">
              Totals computed across {totalCommitteeSeats.toLocaleString("en-US")} committee seats in the dataset.
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Committee Tenure</CardTitle>
            <CardDescription>
              How many different years each individual has appeared on a committee. “6+” groups anyone with six or
              more participations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tenureBuckets} margin={{ top: 10, right: 20, left: 20, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.4} />
                  <XAxis 
                    dataKey="label" 
                    tick={{ fill: "#6b7280", fontSize: 12 }}
                    label={{ value: "Years of Participation", position: "insideBottom", offset: -10, fill: "#6b7280", fontSize: 13, fontWeight: 500 }}
                  />
                  <YAxis 
                    tick={{ fill: "#6b7280", fontSize: 12 }}
                    label={{ value: "Number of People", angle: -90, position: "insideLeft", fill: "#6b7280", fontSize: 13, fontWeight: 500 }}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value.toLocaleString("en-US")} people`, "Appearances"]}
                  />
                  <Bar dataKey="people" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
            <ScrollArea className="mt-4 h-32 rounded-md border border-slate-200 dark:border-slate-800">
              <ul className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                {topVeterans.map((entry) => (
                  <li key={entry.name} className="flex items-center justify-between px-4 py-2">
                    <span className="font-medium text-foreground truncate">{entry.name}</span>
                    <Badge variant="outline">{entry.count}×</Badge>
                  </li>
                ))}
                {topVeterans.length === 0 && (
                  <li className="px-4 py-6 text-center text-muted-foreground">No committee data available.</li>
                )}
              </ul>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


