"use client"

import { useMemo, useState, useCallback, Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FilterPanel } from "@/components/filters/filter-panel";
import { ChartContainer } from "@/components/charts/chart-container";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { ContinentDistributionItem } from "@/lib/data/load-data-static";

import { Skeleton } from "@/components/ui/skeleton";
import { CountryTooltip } from "@/components/charts/country-tooltip";
import { trackEvent } from "@/lib/analytics";

const ChartSkeleton = () => (
  <div className="h-[600px] w-full space-y-4 p-4">
    <div className="flex items-center justify-between">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-4 w-24" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-4/6" />
    </div>
    <div className="flex-1 space-y-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
    <div className="flex items-center justify-center gap-2">
      <Skeleton className="h-3 w-3 rounded-full" />
      <Skeleton className="h-3 w-3 rounded-full" />
      <Skeleton className="h-3 w-3 rounded-full" />
    </div>
  </div>
);

const COLORS = {
  'North America': '#1f3b6f',
  'Europe': '#1681c5',
  'Asia': '#7d7d7d',
  'Others': '#c5c5c5',
  'Unmapped': 'transparent',
};

const COUNTRY_COLORS = [
  '#1f3b6f', '#1681c5', '#7d7d7d', '#10b981', '#8b5cf6',
  '#ef4444', '#f59e0b', '#22c55e', '#06b6d4', '#a855f7',
  '#64748b', '#84cc16', '#f97316', '#0ea5e9', '#e11d48'
];

const OTHER_COUNTRY_COLOR = '#d1d5db';

const COUNTRY_ALIASES: Record<string, string> = {
  'usa': 'United States',
  'u.s.a.': 'United States',
  'u.s.': 'United States',
  'united states of america': 'United States',
  'united states': 'United States',
  'the united states': 'United States',
  'uk': 'United Kingdom',
  'u.k.': 'United Kingdom',
  'great britain': 'United Kingdom',
  'united kingdom of great britain and northern ireland': 'United Kingdom',
  'south korea': 'South Korea',
  'republic of korea': 'South Korea',
  'korea, republic of': 'South Korea',
  'korea, south': 'South Korea',
  'korea (south)': 'South Korea',
  'north korea': 'North Korea',
  'peoples republic of china': 'China',
  "people's republic of china": 'China',
  'p.r. china': 'China',
  'mainland china': 'China',
  'hong kong sar': 'Hong Kong',
  'hong kong s.a.r.': 'Hong Kong',
  'czech republic': 'Czechia',
  'the netherlands': 'Netherlands',
  'russian federation': 'Russia',
  'uae': 'United Arab Emirates',
  'u.a.e.': 'United Arab Emirates',
  'iran, islamic republic of': 'Iran',
  'islamic republic of iran': 'Iran',
  'venezuela, bolivarian republic of': 'Venezuela',
  'bolivarian republic of venezuela': 'Venezuela',
};

type CustomLegendEntry = {
  id: string;
  value: string;
  type: 'rect';
  color: string;
  payload?: Record<string, unknown>;
};

const normalizeCountryName = (country: string | null | undefined): string => {
  if (!country) return 'Unknown';
  const trimmed = country.trim();
  if (!trimmed) return 'Unknown';

  const lower = trimmed.toLowerCase();
  if (COUNTRY_ALIASES[lower]) {
    return COUNTRY_ALIASES[lower];
  }

  if (lower === 'unknown' || lower === 'n/a') return 'Unknown';
  if (lower === 'other') return 'Other';

  if (lower.startsWith("republic of")) {
    const rest = trimmed.substring("Republic of".length).trim();
    if (rest) {
      return `Republic of ${rest
        .split(" ")
        .map((part) => {
          if (!part) return part;
          if (part.length === 1) return part.toUpperCase();
          return part[0].toUpperCase() + part.slice(1).toLowerCase();
        })
        .join(" ")}`;
    }
    return "Republic Of";
  }

  return trimmed
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((part, index, array) => {
      if (!part) return part;
      if (part.toLowerCase() === "of" && index > 0 && index < array.length - 1) {
        return "of";
      }
      if (part.length === 1) return part.toUpperCase();
      return part[0].toUpperCase() + part.slice(1).toLowerCase();
    })
    .join(' ');
};

const normalizeConferenceLabel = (conf: string): string => {
  const normalized = String(conf ?? '').trim().toUpperCase();
  const map: Record<string, string> = {
    'CLOUD': 'SOCC',
    'IEEE CLOUD': 'IEEECLOUD',
  };
  return map[normalized] ?? normalized;
};

const parseCountriesFromValue = (value: unknown): string[] => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .flatMap(item => parseCountriesFromValue(item))
      .map(item => normalizeCountryName(item))
      .filter(Boolean)
      .filter(country => country !== 'Unknown' && country !== 'Other');
  }

  if (typeof value === 'string') {
    const cleaned = value.replace(/\r?\n/g, ' ').trim();
    if (!cleaned) return [];
    
    const parts: string[] = [];
    const separators = /[;,]/g;
    let lastIndex = 0;
    let match;
    
    while ((match = separators.exec(cleaned)) !== null) {
      const before = cleaned.substring(lastIndex, match.index).trim();
      const after = cleaned.substring(match.index + 1).trim();
      
      const afterLower = after.toLowerCase();
      if (afterLower.startsWith("republic of") || afterLower.startsWith("islamic republic of") || afterLower.startsWith("bolivarian republic of")) {
        continue;
      }
      
      if (before.trim()) {
        parts.push(before.trim());
      }
      lastIndex = match.index + 1;
    }
    
    const remaining = cleaned.substring(lastIndex).trim();
    if (remaining) {
      parts.push(remaining);
    }
    
    const finalParts = parts.length > 0 ? parts : cleaned.split(/[;,]/).map(p => p.trim()).filter(Boolean);
    
    return finalParts
      .map(part => normalizeCountryName(part))
      .filter(Boolean)
      .filter(country => country !== 'Unknown' && country !== 'Other');
  }

  return [];
};

interface ClientProgramCommitteeDistributionPageProps {
  initialData: ContinentDistributionItem[];
  conferences: string[];
  years: number[];
  committeeCountryRaw: any[];
}

export function ClientProgramCommitteeDistributionPage({
  initialData,
  conferences,
  years,
  committeeCountryRaw,
}: ClientProgramCommitteeDistributionPageProps) {
  const [geoMode, setGeoMode] = useState<'continent' | 'country'>('continent');
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);
  const [selectedConferences, setSelectedConferences] = useState<string[]>([]);
  
  const handleYearChange = useCallback((year: number | undefined) => {
    setSelectedYear(year);
    trackEvent({
      action: "committee_year_change",
      category: "committee_distribution",
      label: year ? year.toString() : "all",
    });
  }, []);
  
  const handleConferencesChange = useCallback((list: string[]) => {
    setSelectedConferences(list);
    trackEvent({
      action: "committee_conference_filter",
      category: "committee_distribution",
      value: list.length,
    });
  }, []);

  const handleGeoModeChange = useCallback((mode: 'continent' | 'country') => {
    setGeoMode(mode);
    trackEvent({
      action: "committee_geo_mode_change",
      category: "committee_distribution",
      label: mode,
      params: {
        conferences: selectedConferences.length,
        year: selectedYear ?? "all",
      },
    });
  }, [selectedConferences.length, selectedYear]);
  
  const isSingleConferenceView = selectedConferences.length === 1 && !selectedYear;

  const filteredData = useMemo(() => {
    let data = initialData;
    if (selectedConferences.length > 0) {
      data = data.filter(d => selectedConferences.includes(d.conference));
    }
    if (selectedYear) {
      data = data.filter(d => d.year === selectedYear);
    }
    return data;
  }, [initialData, selectedYear, selectedConferences]);
  
  const chartData = useMemo(() => {
    if (filteredData.length === 0) return [];
    
    if (isSingleConferenceView) {
      const grouped = new Map<number, { na: number; eu: number; asia: number; other: number; total: number }>();
      filteredData.forEach(d => {
        const g = grouped.get(d.year) || { na: 0, eu: 0, asia: 0, other: 0, total: 0 };
        g.na += d['North America'];
        g.eu += d['Europe'];
        g.asia += d['Asia'];
        g.other += d['Others'];
        g.total += d.total;
        grouped.set(d.year, g);
      });
      const rows = Array.from(grouped.entries())
        .map(([year, v]) => {
          const total = v.total || 1;
          const mapped = v.na + v.eu + v.asia + v.other;
          const unmapped = total - mapped;
          const pNA = Number(((v.na / total) * 100).toFixed(2));
          const pEU = Number(((v.eu / total) * 100).toFixed(2));
          const pAS = Number(((v.asia / total) * 100).toFixed(2));
          const pOT = Number(((v.other / total) * 100).toFixed(2));
          const pUnmapped = Number(((unmapped / total) * 100).toFixed(2));
          return {
            conference: String(year),
            'North America': pNA,
            'Europe': pEU,
            'Asia': pAS,
            'Others': pOT,
            'Unmapped': pUnmapped,
          };
        })
        .sort((a, b) => Number(a.conference) - Number(b.conference));
      return rows;
    } else {
      const grouped = new Map<string, { na: number; eu: number; asia: number; other: number; total: number }>();
      filteredData.forEach(d => {
        const g = grouped.get(d.conference) || { na: 0, eu: 0, asia: 0, other: 0, total: 0 };
        g.na += d['North America'];
        g.eu += d['Europe'];
        g.asia += d['Asia'];
        g.other += d['Others'];
        g.total += d.total;
        grouped.set(d.conference, g);
      });
      const rows = Array.from(grouped.entries()).map(([conf, v]) => {
        const total = v.total || 1;
        const mapped = v.na + v.eu + v.asia + v.other;
        const unmapped = total - mapped;
        const pNA = Number(((v.na / total) * 100).toFixed(2));
        const pEU = Number(((v.eu / total) * 100).toFixed(2));
        const pAS = Number(((v.asia / total) * 100).toFixed(2));
        const pOT = Number(((v.other / total) * 100).toFixed(2));
        const pUnmapped = Number(((unmapped / total) * 100).toFixed(2));
        return {
          conference: conf,
          'North America': pNA,
          'Europe': pEU,
          'Asia': pAS,
          'Others': pOT,
          'Unmapped': pUnmapped,
        };
      });
      rows.sort((a, b) => b['North America'] - a['North America']);
      return rows;
    }
  }, [filteredData, isSingleConferenceView]);

  const filteredCountryRows = useMemo(() => {
    if (!committeeCountryRaw || committeeCountryRaw.length === 0) {
      return [];
    }

    return committeeCountryRaw.filter((row) => {
      const conf = normalizeConferenceLabel(row?.conference ?? row?.Conference ?? '');
      const yearVal = Number(row?.year ?? row?.Year);

      if (!conf || Number.isNaN(yearVal)) {
        return false;
      }

      if (selectedConferences.length > 0 && !selectedConferences.includes(conf)) {
        return false;
      }

      if (selectedYear && yearVal !== selectedYear) {
        return false;
      }

      return true;
    });
  }, [committeeCountryRaw, selectedConferences, selectedYear]);

  const countryChart = useMemo(() => {
    const topCountryLimit = 10;
    const aggregated = new Map<string, Map<string, number>>();
    const totals = new Map<string, { rows: number; unmapped: number }>();
    const overall = new Map<string, number>();

    filteredCountryRows.forEach((row: any) => {
      const conf = normalizeConferenceLabel(row?.conference ?? row?.Conference ?? '');
      const yearVal = Number(row?.year ?? row?.Year);
      if (!conf || Number.isNaN(yearVal)) {
        return;
      }

      const key = isSingleConferenceView ? String(yearVal) : conf;

      const rawCountries = parseCountriesFromValue(row?.countries ?? row?.Countries ?? row?.country ?? row?.Country);
      const normalizedCountries = Array.from(new Set(rawCountries));

      const totalsEntry = totals.get(key) ?? { rows: 0, unmapped: 0 };
      totalsEntry.rows += 1;
      if (normalizedCountries.length === 0) {
        totalsEntry.unmapped += 1;
        totals.set(key, totalsEntry);
        return;
      }
      totals.set(key, totalsEntry);

      let bucket = aggregated.get(key);
      if (!bucket) {
        bucket = new Map<string, number>();
        aggregated.set(key, bucket);
      }

      const weight = 1 / normalizedCountries.length;
      normalizedCountries.forEach((country) => {
        bucket!.set(country, (bucket!.get(country) ?? 0) + weight);
        overall.set(country, (overall.get(country) ?? 0) + weight);
      });
    });

    if (totals.size === 0) {
      return {
        data: [] as Array<Record<string, number | string>>,
        countries: [] as string[],
        colorMap: new Map<string, string>(),
        legendPayload: [] as CustomLegendEntry[],
        includesOther: false,
        includesUnmapped: false,
      };
    }

    const rowTopSelections = new Map<string, string[]>();
    const globalCountrySet = new Set<string>();

    const keys = Array.from(totals.keys());
    keys.forEach((key) => {
      const bucket = aggregated.get(key) ?? new Map<string, number>();
      const rowSorted = Array.from(bucket.entries()).sort((a, b) => b[1] - a[1]);
      const rowTop = rowSorted.slice(0, topCountryLimit).map(([country]) => country);
      rowTopSelections.set(key, rowTop);
      rowTop.forEach((country) => globalCountrySet.add(country));
    });

    const sortedTopCountries = Array.from(globalCountrySet).sort((a, b) => {
      const aTotal = overall.get(a) ?? 0;
      const bTotal = overall.get(b) ?? 0;
      return bTotal - aTotal;
    });

    let includesOther = false;
    let includesUnmapped = false;

    const rows = keys.map((key) => {
      const totalsEntry = totals.get(key) ?? { rows: 0, unmapped: 0 };
      const totalRows = totalsEntry.rows;
      const bucket = aggregated.get(key) ?? new Map<string, number>();
      const rowTop = rowTopSelections.get(key) ?? [];
      const rowTopSet = new Set(rowTop);

      const rowData: Record<string, number | string> = { conference: key };
      sortedTopCountries.forEach((country) => {
        rowData[country] = 0;
      });

      let otherSum = 0;
      bucket.forEach((value, country) => {
        const pct = totalRows > 0 ? Number(((value / totalRows) * 100).toFixed(2)) : 0;
        if (rowTopSet.has(country)) {
          rowData[country] = Number((((rowData[country] as number) ?? 0) + pct).toFixed(2));
        } else {
          otherSum += pct;
        }
      });

      if (otherSum > 0) {
        includesOther = true;
        rowData['Other Countries'] = Number(otherSum.toFixed(2));
      }

      if (totalsEntry.unmapped > 0) {
        const unmappedPct = totalRows > 0 ? Number(((totalsEntry.unmapped / totalRows) * 100).toFixed(2)) : 0;
        if (unmappedPct > 0) {
          includesUnmapped = true;
          rowData['Unmapped'] = unmappedPct;
        }
      }

      return rowData;
    });

    if (isSingleConferenceView) {
      rows.sort((a, b) => Number(a.conference) - Number(b.conference));
    } else {
      const primaryCountry = sortedTopCountries[0];
      rows.sort((a, b) => {
        const valueFor = (row: Record<string, number | string>, country?: string) => {
          if (!country) return 0;
          const raw = row[country];
          return typeof raw === 'number' ? raw : 0;
        };

        const diff = valueFor(b, primaryCountry) - valueFor(a, primaryCountry);
        if (diff !== 0) {
          return diff;
        }

        return String(a.conference).localeCompare(String(b.conference));
      });
    }

    const colorMap = new Map<string, string>();
    sortedTopCountries.forEach((country, index) => {
      colorMap.set(country, COUNTRY_COLORS[index % COUNTRY_COLORS.length]);
    });
    if (includesOther) {
      colorMap.set('Other Countries', OTHER_COUNTRY_COLOR);
    }
    if (includesUnmapped) {
      colorMap.set('Unmapped', 'transparent');
    }

    const legendPayload: CustomLegendEntry[] = sortedTopCountries.map((country) => ({
      id: country,
      value: country,
      type: 'rect',
      color: colorMap.get(country) ?? '#94a3b8',
      payload: { country },
    }));

    if (includesOther) {
      legendPayload.push({
        id: 'other-countries',
        value: 'Other Countries',
        type: 'rect',
        color: colorMap.get('Other Countries') ?? OTHER_COUNTRY_COLOR,
        payload: { country: 'Other Countries' },
      });
    }

    if (includesUnmapped) {
      legendPayload.push({
        id: 'unmapped',
        value: 'Unmapped',
        type: 'rect',
        color: '#ffffff',
        payload: { country: 'Unmapped', stroke: '#9ca3af' },
      });
    }

    return {
      data: rows,
      countries: sortedTopCountries,
      colorMap,
      legendPayload,
      includesOther,
      includesUnmapped,
    };
  }, [filteredCountryRows, isSingleConferenceView]);

  const countryChartDataRows = countryChart.data;
  const countryLegendPayload = countryChart.legendPayload;
  const countryColorMap = countryChart.colorMap;
  const countryKeys = countryChart.countries;
  const includesOtherCountries = countryChart.includesOther;
  const includesUnmappedCountries = countryChart.includesUnmapped;

  const renderLegendContent = useCallback(
    ({ payload }: { payload?: CustomLegendEntry[] }) => {
      if (!payload) return null;
      return (
        <ul className="flex flex-wrap justify-center gap-4">
          {payload.map((entry, index) => {
            const label = String(entry.value ?? '');
            const color = entry.color ?? '#94a3b8';
            const stroke = (entry.payload as any)?.stroke ?? '#9ca3af';
            return (
              <li key={index} className="flex items-center gap-2">
                {label === 'Unmapped' ? (
                  <svg width="14" height="14" className="inline-block">
                    <rect
                      x="1"
                      y="1"
                      width="12"
                      height="12"
                      fill="transparent"
                      stroke={stroke}
                      strokeWidth="1"
                      strokeDasharray="3 3"
                    />
                  </svg>
                ) : (
                  <span
                    className="inline-block w-3.5 h-3.5 rounded-sm"
                    style={{ backgroundColor: color }}
                  />
                )}
                <span>{label}</span>
              </li>
            );
          })}
        </ul>
      );
    },
    []
  );

  const GeoModeToggle = () => (
    <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-900/70 px-2 py-1 shadow-sm">
      <button
        onClick={() => handleGeoModeChange('continent')}
        className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all ${
          geoMode === 'continent'
            ? 'bg-gray-900 text-white shadow-sm hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200'
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/70'
        }`}
        aria-pressed={geoMode === 'continent'}
      >
        Continents
      </button>
      <button
        onClick={() => handleGeoModeChange('country')}
        className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all ${
          geoMode === 'country'
            ? 'bg-gray-900 text-white shadow-sm hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200'
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/70'
        }`}
        aria-pressed={geoMode === 'country'}
      >
        Countries
      </button>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent dark:from-gray-100 dark:via-gray-200 dark:to-gray-300">
          Program Committee Distribution
        </h1>
        <p className="text-lg text-muted-foreground">
          Distribution of program committee members across different continents and conferences
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <FilterPanel
            conferences={conferences}
            years={years}
            selectedYear={selectedYear}
            onYearChange={handleYearChange}
            selectedConferences={selectedConferences}
            onConferencesChange={handleConferencesChange}
          />
        </div>

        <div className="lg:col-span-3">
          <Card className="border-none shadow-xl">
            <CardHeader className="pb-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl font-semibold">
                    {geoMode === 'continent' ? 'Committee Members by Continent' : 'Committee Members by Country'}
                  </CardTitle>
                  <CardDescription>
                    {geoMode === 'continent'
                      ? (isSingleConferenceView
                          ? "Stacked bar chart showing distribution by year for the selected conference."
                          : "Stacked bar chart showing distribution across conferences.")
                      : (isSingleConferenceView
                          ? "Top countries share of committee members by year for the selected conference."
                          : "Top countries share of committee members across selected conferences.")}
                  </CardDescription>
                </div>
                <div className="hidden sm:block">
                  <GeoModeToggle />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="sm:hidden pb-4">
                <GeoModeToggle />
              </div>
              <ChartContainer config={{}} className="h-[600px]">
                <Suspense fallback={<ChartSkeleton />}>
                  <ResponsiveContainer width="100%" height="100%">
                    {geoMode === 'continent' ? (
                      <BarChart
                        data={chartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                        role="img"
                        aria-label={`Committee distribution by continent ${selectedConferences.length > 0 ? 'for selected conferences' : selectedYear ? `for ${selectedYear}` : ''}`}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                        <XAxis
                          dataKey="conference"
                          angle={isSingleConferenceView ? 0 : -45}
                          textAnchor={isSingleConferenceView ? 'middle' : 'end'}
                          height={isSingleConferenceView ? 40 : 80}
                          tick={{ fill: '#6b7280', fontSize: 12 }}
                        />
                        <YAxis
                          domain={[0, 100]}
                          tick={{ fill: '#6b7280', fontSize: 12 }}
                          label={{ value: 'Percentage', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6b7280' } }}
                          tickFormatter={(v: number) => `${Math.min(100, Math.max(0, Number(Number(v).toFixed(0))))}%`}
                        />
                        <Tooltip
                          cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
                          content={<CountryTooltip colorMap={countryColorMap} labelFormatter={(value) => value} title={isSingleConferenceView ? 'Year' : 'Conference'} />}
                          allowEscapeViewBox={{ x: true, y: true }}
                          wrapperStyle={{ pointerEvents: 'none' }}
                        />
                        <Legend
                          iconType="rect"
                          wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }}
                          payload={[
                            { value: 'North America', type: 'rect', color: COLORS['North America'] },
                            { value: 'Europe', type: 'rect', color: COLORS['Europe'] },
                            { value: 'Asia', type: 'rect', color: COLORS['Asia'] },
                            { value: 'Others', type: 'rect', color: COLORS['Others'] },
                            { value: 'Unmapped', type: 'rect', color: 'transparent' },
                          ]}
                          content={renderLegendContent as any}
                        />
                        <Bar dataKey="North America" stackId="a" fill={COLORS['North America']} radius={[0, 0, 0, 0]} />
                        <Bar dataKey="Europe" stackId="a" fill={COLORS['Europe']} radius={[0, 0, 0, 0]} />
                        <Bar dataKey="Asia" stackId="a" fill={COLORS['Asia']} radius={[0, 0, 0, 0]} />
                        <Bar dataKey="Others" stackId="a" fill={COLORS['Others']} radius={[0, 0, 0, 0]} />
                        <Bar dataKey="Unmapped" stackId="a" fill={COLORS['Unmapped']} radius={[4, 4, 0, 0]} hide={true} />
                      </BarChart>
                    ) : (
                      <BarChart
                        data={countryChartDataRows}
                        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                        role="img"
                        aria-label={`Committee distribution by country ${selectedConferences.length > 0 ? 'for selected conferences' : selectedYear ? `for ${selectedYear}` : ''}`}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                        <XAxis
                          dataKey="conference"
                          angle={isSingleConferenceView ? 0 : -45}
                          textAnchor={isSingleConferenceView ? 'middle' : 'end'}
                          height={isSingleConferenceView ? 40 : 80}
                          tick={{ fill: '#6b7280', fontSize: 12 }}
                        />
                        <YAxis
                          domain={[0, 100]}
                          tick={{ fill: '#6b7280', fontSize: 12 }}
                          label={{ value: 'Percentage', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6b7280' } }}
                          tickFormatter={(v: number) => `${Math.min(100, Math.max(0, Number(Number(v).toFixed(0))))}%`}
                        />
                        <Tooltip
                          cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
                          content={<CountryTooltip colorMap={countryColorMap} labelFormatter={(value) => value} title={isSingleConferenceView ? 'Year' : 'Conference'} />}
                          allowEscapeViewBox={{ x: true, y: true }}
                          wrapperStyle={{ pointerEvents: 'none' }}
                        />
                        <Legend
                          iconType="rect"
                          wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }}
                          payload={countryLegendPayload as any}
                          content={renderLegendContent as any}
                        />
                        {countryKeys.map((country) => (
                          <Bar
                            key={country}
                            dataKey={country}
                            stackId="a"
                            fill={countryColorMap.get(country) ?? '#94a3b8'}
                            radius={[0, 0, 0, 0]}
                          />
                        ))}
                        {includesOtherCountries && (
                          <Bar
                            dataKey="Other Countries"
                            stackId="a"
                            fill={countryColorMap.get('Other Countries') ?? OTHER_COUNTRY_COLOR}
                            radius={[0, 0, 0, 0]}
                          />
                        )}
                        {includesUnmappedCountries && (
                          <Bar
                            dataKey="Unmapped"
                            stackId="a"
                            fill="transparent"
                            stroke="#d1d5db"
                            strokeDasharray="4 4"
                            radius={[4, 4, 0, 0]}
                          />
                        )}
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </Suspense>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

