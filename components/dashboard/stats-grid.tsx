"use client"

import { useMemo, useState, useCallback, memo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/charts/chart-container";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import type { ContinentDistributionItem, AsianTrendItem, BigTechItem } from "@/lib/data/load-data";
import { CountryTooltip } from "@/components/charts/country-tooltip";
import { trackEvent } from "@/lib/analytics";

const COLORS = {
  'North America': '#1f3b6f',
  'Europe': '#1681c5',
  'Asia': '#7d7d7d',
  'Others': '#c5c5c5',
  'Unmapped': '#ffffff',
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
  type: 'circle';
  color: string;
  payload?: Record<string, unknown>;
};

const formatNumber = (num: number): string => {
  return num.toLocaleString('en-US');
};

interface GeoModeToggleProps {
  geoMode: 'continent' | 'country';
  onChange: (mode: 'continent' | 'country') => void;
}

function GeoModeToggle({ geoMode, onChange }: GeoModeToggleProps) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-900/70 px-2 py-1 shadow-sm">
      <button
        onClick={() => onChange('continent')}
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
        onClick={() => onChange('country')}
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
}

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

interface StatsGridProps {
  continentData: ContinentDistributionItem[];
  asianTrends: AsianTrendItem[];
  bigTechData: BigTechItem[];
  papersCountryRaw: any[];
}

export const StatsGrid = memo(function StatsGrid({ continentData, asianTrends, bigTechData, papersCountryRaw }: StatsGridProps) {
  const [geoMode, setGeoMode] = useState<'continent' | 'country'>('continent');

  const handleGeoModeChange = useCallback((mode: 'continent' | 'country') => {
    setGeoMode(mode);
    trackEvent({
      action: 'dashboard_geo_mode_change',
      category: 'dashboard',
      label: mode,
    });
  }, []);

  const { data, topContinent, asianGrowth, bigTechAvg, recentYearPapers, avgPapersPerYear } = useMemo(() => {
    const totals = { na: 0, eu: 0, asia: 0, other: 0 };
    for (const d of continentData) {
      totals.na += d['North America'];
      totals.eu += d['Europe'];
      totals.asia += d['Asia'];
      totals.other += d['Others'];
    }
    
    const sum = totals.na + totals.eu + totals.asia + totals.other || 1;
    const rows = [
      { name: 'North America' as const, value: Number(((totals.na / sum) * 100).toFixed(2)) },
      { name: 'Europe' as const, value: Number(((totals.eu / sum) * 100).toFixed(2)) },
      { name: 'Asia' as const, value: Number(((totals.asia / sum) * 100).toFixed(2)) },
      { name: 'Others' as const, value: Number(((totals.other / sum) * 100).toFixed(2)) },
    ];
    const top = [...rows].sort((a, b) => b.value - a.value)[0];
    
    const years = Array.from(new Set(asianTrends.map(t => t.year))).sort((a, b) => a - b);
    let ag: { growth: number; since: number } | null = null;
    if (years.length > 0) {
      const first = years[0];
      const last = years[years.length - 1];
      const getYearAvg = (year: number) => {
        const items = asianTrends.filter(t => t.year === year);
        if (!items.length) return 0;
        return Number((items.reduce((s, t) => s + t.percentage, 0) / items.length).toFixed(2));
      };
      const pFirst = getYearAvg(first);
      const pLast = getYearAvg(last);
      ag = { growth: Number((pLast - pFirst).toFixed(2)), since: first };
    }
    
    const btAvg = bigTechData.length > 0 
      ? Number((bigTechData.reduce((s, d) => s + d.bigTech, 0) / bigTechData.length).toFixed(2))
      : null;

    const papersByYear = new Map<number, number>();
    for (const d of continentData) {
      const year = d.year;
      if (year) {
        papersByYear.set(year, (papersByYear.get(year) || 0) + (d.total || 0));
      }
    }
    
    const sortedYears = Array.from(papersByYear.keys()).sort((a, b) => b - a);
    const lastYear = sortedYears[0];
    const recentPapers = lastYear ? papersByYear.get(lastYear) || 0 : 0;
    
    const totalPapers = Array.from(papersByYear.values()).reduce((s, v) => s + v, 0);
    const avgPerYear = papersByYear.size > 0 ? Number((totalPapers / papersByYear.size).toFixed(0)) : 0;
    
    return { 
      data: rows, 
      topContinent: top, 
      asianGrowth: ag, 
      bigTechAvg: btAvg,
      recentYearPapers: { year: lastYear, count: recentPapers },
      avgPapersPerYear: avgPerYear
    };
  }, [continentData, asianTrends, bigTechData]);

  const countryChart = useMemo(() => {
    if (!papersCountryRaw || papersCountryRaw.length === 0) {
      return {
        data: [] as Array<{ name: string; value: number }>,
        colorMap: new Map<string, string>(),
        totals: new Map<string, number>(),
        totalCount: 0,
      };
    }

    const totals = new Map<string, number>();
    let unmapped = 0;

    papersCountryRaw.forEach((row: any) => {
      const countries = parseCountriesFromValue(row?.Countries ?? row?.countries ?? row?.Country ?? row?.country);
      const unique = Array.from(new Set(countries));
      if (unique.length === 0) {
        unmapped += 1;
        return;
      }
      const weight = 1 / unique.length;
      unique.forEach(country => {
        totals.set(country, (totals.get(country) ?? 0) + weight);
      });
    });

    const entries = Array.from(totals.entries()).sort((a, b) => b[1] - a[1]);
    const topEntries = entries.slice(0, 10);
    const total = entries.reduce((sum, [, value]) => sum + value, 0);

    if (total === 0) {
      return {
        data: [] as Array<{ name: string; value: number }>,
        colorMap: new Map<string, string>(),
        totals,
        totalCount: total,
      };
    }

    const colorMap = new Map<string, string>();
    const chartData: Array<{ name: string; value: number }> = topEntries.map(([country, value], index) => {
      const percent = Number(((value / total) * 100).toFixed(2));
      colorMap.set(country, COUNTRY_COLORS[index % COUNTRY_COLORS.length]);
      return { name: country, value: percent };
    });

    return { data: chartData, colorMap, totals, totalCount: total };
  }, [papersCountryRaw]);

  const pieData = geoMode === 'continent' ? data : countryChart.data;

  const pieLegendPayload = useMemo(() => {
    return pieData.map((entry, index) => {
      const color = geoMode === 'continent'
        ? (COLORS[entry.name as keyof typeof COLORS] ?? '#94a3b8')
        : (countryChart.colorMap.get(entry.name) ?? (entry.name === 'Other Countries'
            ? OTHER_COUNTRY_COLOR
            : entry.name === 'Unmapped'
              ? COLORS.Unmapped
              : COUNTRY_COLORS[index % COUNTRY_COLORS.length]));
      const stroke = entry.name === 'Unmapped' ? '#9ca3af' : undefined;
      return {
        id: entry.name,
        value: entry.name,
        type: 'circle' as const,
        color,
        payload: { stroke },
      } satisfies CustomLegendEntry;
    });
  }, [pieData, geoMode, countryChart.colorMap]);

  const countryChartHeight = useMemo(() => Math.max(360, countryChart.data.length * 36), [countryChart.data.length]);
  const chartHeight = geoMode === 'continent' ? 420 : countryChartHeight;

  const renderCountryLegend = useCallback(({ payload }: { payload?: CustomLegendEntry[] }) => {
    if (!payload) return null;
    return (
      <div className="max-h-40 overflow-y-auto pr-2">
        <ul className="flex flex-col gap-2">
          {payload.map((entry, index) => {
            const stroke = (entry.payload as any)?.stroke ?? '#9ca3af';
            return (
              <li key={index} className="flex items-center gap-2">
                {entry.value === 'Unmapped' ? (
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
                    style={{ backgroundColor: entry.color }}
                  />
                )}
                <span className="text-sm truncate">{entry.value}</span>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }, []);

  const getPieColor = (name: string, index: number) => {
    if (geoMode === 'continent') {
      return COLORS[name as keyof typeof COLORS] ?? '#94a3b8';
    }
    return countryChart.colorMap.get(name)
      ?? (name === 'Other Countries'
        ? OTHER_COUNTRY_COLOR
        : name === 'Unmapped'
          ? COLORS.Unmapped
          : COUNTRY_COLORS[index % COUNTRY_COLORS.length]);
  };

  const getPieStroke = (name: string) => (name === 'Unmapped' ? '#9ca3af' : undefined);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none shadow-lg bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Top Continent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold tracking-tight bg-gradient-to-br from-blue-600 to-blue-800 bg-clip-text text-transparent">{topContinent.value}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {topContinent.name} leads
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-background">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Asian Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold tracking-tight bg-gradient-to-br from-emerald-600 to-green-600 bg-clip-text text-transparent">{asianGrowth ? `${asianGrowth.growth >= 0 ? '+' : ''}${asianGrowth.growth}%` : '—'}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {asianGrowth ? `growth since ${asianGrowth.since}` : '—'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-background">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Big Tech</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold tracking-tight bg-gradient-to-br from-purple-600 to-pink-600 bg-clip-text text-transparent">{bigTechAvg !== null ? `${bigTechAvg}%` : '—'}</div>
            <p className="text-xs text-muted-foreground mt-1">
              industry affiliations
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/20 dark:to-background">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold tracking-tight bg-gradient-to-br from-orange-600 to-red-600 bg-clip-text text-transparent">{recentYearPapers.count > 0 ? formatNumber(recentYearPapers.count) : '—'}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {recentYearPapers.year ? `papers in ${recentYearPapers.year}` : '—'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-xl overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl font-semibold">
                {geoMode === 'continent' ? 'Accepted Papers by Continent' : 'Accepted Papers by Country'}
              </CardTitle>
              <CardDescription>
                {geoMode === 'continent'
                  ? 'Overall breakdown of accepted papers across conferences by continent.'
                  : 'Top countries share of accepted papers across all conferences (top 10 shown).'}
              </CardDescription>
            </div>
            <div className="hidden sm:block">
              <GeoModeToggle geoMode={geoMode} onChange={handleGeoModeChange} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="sm:hidden pb-4">
            <GeoModeToggle geoMode={geoMode} onChange={handleGeoModeChange} />
          </div>
          <ChartContainer config={{}} style={{ height: chartHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              {geoMode === 'continent' ? (
                <PieChart
                  role="img"
                  aria-label="Accepted Papers Distribution by Continent pie chart showing percentage breakdown of accepted papers across conferences"
                >
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={120}
                    innerRadius={40}
                    fill="#8884d8"
                    dataKey="value"
                    animationBegin={0}
                    animationDuration={800}
                    paddingAngle={2}
                  >
                    {data.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[entry.name as keyof typeof COLORS] ?? '#94a3b8'}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.98)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      padding: '12px'
                    }}
                    formatter={(value: any) => `${Number(value).toFixed(2)}%`}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    wrapperStyle={{ paddingTop: '20px' }}
                  />
                </PieChart>
              ) : (
                <BarChart
                  data={countryChart.data}
                  layout="vertical"
                  margin={{ top: 20, right: 40, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    tickFormatter={(v: number) => `${Math.min(100, Math.max(0, Number(v.toFixed(0))))}%`}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={140}
                    tick={{ fill: '#374151', fontSize: 12 }}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
                    content={<CountryTooltip colorMap={countryChart.colorMap} title="Conference" />}
                    allowEscapeViewBox={{ x: true, y: true }}
                    wrapperStyle={{ 
                      pointerEvents: 'none',
                      transform: 'translateX(0)',
                      maxWidth: '100vw'
                    }}
                    contentStyle={{
                      maxWidth: 'min(320px, calc(100vw - 20px))',
                      right: 'auto',
                      left: 'auto'
                    }}
                    // @ts-expect-error - Recharts Tooltip position accepts function but types are incomplete
                    position={(props: any) => {
                      const { coordinate, viewBox } = props;
                      if (!coordinate || !viewBox) return coordinate;
                      
                      const tooltipWidth = 320;
                      const margin = 15;
                      const chartWidth = viewBox.width;
                      
                      if (coordinate.x > chartWidth * 0.55) {
                        const newX = coordinate.x - tooltipWidth - margin;
                        return { x: Math.max(viewBox.x + 5, newX), y: coordinate.y };
                      }
                      
                      return coordinate;
                    }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 4, 4]}>
                    {countryChart.data.map((entry, index) => (
                      <Cell
                        key={`country-bar-${entry.name}-${index}`}
                        fill={getPieColor(entry.name, index)}
                      />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
});