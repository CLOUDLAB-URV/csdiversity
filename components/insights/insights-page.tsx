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
  Legend,
  Line,
  LineChart,
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

  const collaborationEvolution = useMemo(() => {
    // Get top 5 pairs overall
    const top5Pairs = topCountryPairs.slice(0, 5).map(p => p.countries.join("|||"));
    
    // Count papers per year for each top pair AND total multi-country papers
    const yearPairCounts = new Map<number, Map<string, number>>();
    const yearTotalMulti = new Map<number, number>();
    
    for (const row of paperCountryRows) {
      const year = Number(row.year ?? row.Year);
      if (!Number.isFinite(year)) continue;
      
      const countries = Array.from(
        new Set(parseCountries(row.Countries ?? row.countries ?? row.Country ?? row.country))
      );
      if (countries.length < 2) continue;
      
      // Count total multi-country papers
      yearTotalMulti.set(year, (yearTotalMulti.get(year) ?? 0) + 1);
      
      // Get all unique pairs in this paper
      const pairsInPaper = new Set<string>();
      for (let i = 0; i < countries.length; i++) {
        for (let j = i + 1; j < countries.length; j++) {
          const a = countries[i];
          const b = countries[j];
          if (!a || !b) continue;
          const pair = [a, b].sort();
          const key = pair.join("|||");
          if (top5Pairs.includes(key)) {
            pairsInPaper.add(key);
          }
        }
      }
      
      // Count this paper for each unique pair it contains
      if (pairsInPaper.size > 0) {
        if (!yearPairCounts.has(year)) {
          yearPairCounts.set(year, new Map());
        }
        const yearMap = yearPairCounts.get(year)!;
        
        // Each paper counts as 1 for each pair it contains
        for (const pairKey of pairsInPaper) {
          yearMap.set(pairKey, (yearMap.get(pairKey) ?? 0) + 1);
        }
      }
    }
    
    // Convert to chart data
    const allYears = new Set([...yearPairCounts.keys(), ...yearTotalMulti.keys()]);
    const years = Array.from(allYears).sort((a, b) => a - b);
    
    return years.map(year => {
      const yearMap = yearPairCounts.get(year) ?? new Map();
      const dataPoint: any = { 
        year,
        "Total Multi-Country": yearTotalMulti.get(year) ?? 0
      };
      
      top5Pairs.forEach(pairKey => {
        const [a, b] = pairKey.split("|||");
        const pairLabel = `${a} ↔ ${b}`;
        dataPoint[pairLabel] = yearMap.get(pairKey) ?? 0;
      });
      
      return dataPoint;
    });
  }, [paperCountryRows, topCountryPairs]);

  const { turnoverSeries, tenureBuckets, topVeterans } = useMemo(() => {
    const sortedRows = [...committeeRows].sort((a, b) => {
      const yearA = Number(a.year ?? a.Year);
      const yearB = Number(b.year ?? b.Year);
      return yearA - yearB;
    });

    // Deduplicate: same person in multiple conferences same year = count once
    const uniquePersonYears = new Map<string, Set<string>>(); // person -> set of years
    const seenByConference = new Map<string, Set<string>>();
    const yearBuckets = new Map<number, { newcomers: number; returning: number }>();
    const personYearConfs = new Map<string, Set<string>>(); // person+year -> conferences

    // First pass: collect unique person-year combinations
    for (const row of sortedRows) {
      const name = String(row.name ?? row.Name ?? "").trim();
      const conference = normalizeConference(row.conference ?? row.Conference ?? "");
      const year = Number(row.year ?? row.Year);
      if (!name || !conference || !Number.isFinite(year)) continue;

      const nameKey = name.toLowerCase();
      const personYearKey = `${nameKey}|${year}`;
      
      // Track conferences for this person-year
      if (!personYearConfs.has(personYearKey)) {
        personYearConfs.set(personYearKey, new Set());
      }
      personYearConfs.get(personYearKey)!.add(conference);
    }

    // Second pass: count unique person-years (deduplicated)
    for (const [personYearKey, conferences] of personYearConfs.entries()) {
      const [nameKey, yearStr] = personYearKey.split('|');
      const year = Number(yearStr);
      
      // Track which years this person has appeared
      if (!uniquePersonYears.has(nameKey)) {
        uniquePersonYears.set(nameKey, new Set());
      }
      uniquePersonYears.get(nameKey)!.add(yearStr);

      const bucket = yearBuckets.get(year) ?? { newcomers: 0, returning: 0 };
      
      // Check if person appeared in ANY conference in prior years
      let isReturning = false;
      for (const prevYearStr of uniquePersonYears.get(nameKey) ?? []) {
        if (Number(prevYearStr) < year) {
          isReturning = true;
          break;
        }
      }
      
      if (isReturning) {
        bucket.returning += 1;
      } else {
        bucket.newcomers += 1;
      }

      yearBuckets.set(year, bucket);
    }

    const turnoverSeries: TurnoverEntry[] = Array.from(yearBuckets.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([year, { newcomers, returning }]) => ({
        year,
        newcomers,
        returning,
      }));

    // Build tenure histogram from unique person-years
    const personAppearances = new Map<string, { name: string; count: number }>();
    for (const [nameKey, years] of uniquePersonYears.entries()) {
      // Find the original name (with proper capitalization) from the first row
      const originalName = sortedRows.find(r => 
        String(r.name ?? r.Name ?? "").trim().toLowerCase() === nameKey
      )?.name ?? nameKey;
      
      personAppearances.set(nameKey, {
        name: originalName,
        count: years.size  // Count unique years
      });
    }

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

        <Card className="border-none shadow-xl lg:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold">Collaboration Evolution Over Time</CardTitle>
            <CardDescription>
              Number of papers per year containing each of the top 5 country pair collaborations. The dashed line shows the total number of multi-country papers (baseline for comparison). In 2024: 41 multi-country papers total.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={collaborationEvolution}
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
                    label={{ value: "Number of Papers", angle: -90, position: "insideLeft", fill: "#6b7280", fontSize: 13, fontWeight: 500 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.98)",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      padding: "12px"
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
                    iconType="line"
                  />
                  <Line
                    type="monotone"
                    dataKey="Total Multi-Country"
                    stroke="#94a3b8"
                    strokeWidth={3}
                    strokeDasharray="5 5"
                    dot={{ fill: "#94a3b8", r: 4 }}
                    activeDot={{ r: 7 }}
                  />
                  {topCountryPairs.slice(0, 5).map((entry, idx) => {
                    const colors = ["#1f3b6f", "#22c55e", "#ef4444", "#f59e0b", "#8b5cf6"];
                    return (
                      <Line
                        key={entry.pair}
                        type="monotone"
                        dataKey={entry.pair}
                        stroke={colors[idx]}
                        strokeWidth={2.5}
                        dot={{ fill: colors[idx], r: 3 }}
                        activeDot={{ r: 6 }}
                      />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
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
              Computed from {totalCommitteeSeats.toLocaleString("en-US")} committee positions. Each person counted once per year (deduplicated across conferences).
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Committee Tenure</CardTitle>
            <CardDescription>
              Number of unique years each individual has participated in committees (deduplicated: if someone is in multiple conferences in the same year, it counts as 1 year). "6+" groups anyone with six or more years.
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


