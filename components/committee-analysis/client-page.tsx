"use client"

import { useMemo, useState, useCallback, Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/charts/chart-container";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush, ComposedChart, Area } from "recharts";
import type { CommitteeVsPapersItem, CommitteeVsPapersByYearItem } from "@/lib/data/load-data";

import { Skeleton } from "@/components/ui/skeleton";
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

interface ClientCommitteeAnalysisPageProps {
  initialData: CommitteeVsPapersItem[];
  byYearData: CommitteeVsPapersByYearItem[];
  papersRaw: any[];
  committeeRaw: any[];
  conferences: string[];
  years: number[];
}

const COLORS = {
  papers: '#377eb8',
  committee: '#e41a1c',
  neutral: '#f7f7f7',
};

const getHeatmapColor = (gap: number, minGap: number, maxGap: number): string => {
  const absMax = Math.max(Math.abs(minGap), Math.abs(maxGap));
  if (absMax === 0) return COLORS.neutral;
  
  const normalizedGap = gap / absMax;
  
  if (normalizedGap > 0) {
    const intensity = normalizedGap;
    const r = 228;
    const g = Math.round(26 + (247 - 26) * (1 - intensity));
    const b = Math.round(28 + (247 - 28) * (1 - intensity));
    return `rgb(${r}, ${g}, ${b})`;
  } else if (normalizedGap < 0) {
    const intensity = Math.abs(normalizedGap);
    const r = Math.round(55 + (247 - 55) * (1 - intensity));
    const g = Math.round(126 + (247 - 126) * (1 - intensity));
    const b = Math.round(184 + (247 - 184) * (1 - intensity));
    return `rgb(${r}, ${g}, ${b})`;
  }
  return COLORS.neutral;
};

export function ClientCommitteeAnalysisPage({ 
  initialData, 
  byYearData,
  papersRaw,
  committeeRaw,
  conferences, 
  years 
}: ClientCommitteeAnalysisPageProps) {
  const [selectedContinent, setSelectedContinent] = useState<string>('North America');
  const [selectedContinentForEvolution, setSelectedContinentForEvolution] = useState<string>('North America');
  const handleEvolutionContinentChange = useCallback((cont: string) => {
    setSelectedContinentForEvolution(cont);
    trackEvent({
      action: "committee_evolution_continent_change",
      category: "committee_vs_papers",
      label: cont,
    });
  }, []);
  const [yearRange, setYearRange] = useState<[number, number]>(
    years.length > 0 ? [years[0], years[years.length - 1]] : [2000, 2024]
  );
  const [mode, setMode] = useState<'all' | 'aggregate'>('aggregate');

  const continents = useMemo(() => ['North America', 'Europe', 'Asia', 'Other'], []);
  
  const handleContinentChange = useCallback((cont: string) => {
    setSelectedContinent(cont);
    trackEvent({
      action: "committee_continent_change",
      category: "committee_vs_papers",
      label: cont,
    });
  }, []);
  
  const handleYearRangeChange = useCallback((range: [number, number]) => {
    setYearRange(range);
    trackEvent({
      action: "committee_year_range_change",
      category: "committee_vs_papers",
      label: `${range[0]}-${range[1]}`,
    });
  }, []);
  
  const handleModeChange = useCallback((newMode: 'all' | 'aggregate') => {
    setMode(newMode);
    trackEvent({
      action: "committee_mode_change",
      category: "committee_vs_papers",
      label: newMode,
    });
  }, []);

  const filteredDataByYearRange = useMemo(() => {
    const filteredPapers = papersRaw.filter((r: any) => {
      const year = Number(r.year ?? r.Year);
      return Number.isFinite(year) && year >= yearRange[0] && year <= yearRange[1];
    });
    
    const filteredCommittee = committeeRaw.filter((r: any) => {
      const year = Number(r.year ?? r.Year);
      return Number.isFinite(year) && year >= yearRange[0] && year <= yearRange[1];
    });

    const normalizeCont = (c: string): string => {
      const val = String(c ?? '').trim().toUpperCase();
      if (['NA', 'NORTH AMERICA', 'NORTH_AMERICA', 'AMERICA'].includes(val)) return 'North America';
      if (['EU', 'EUROPE'].includes(val)) return 'Europe';
      if (['AS', 'ASIA'].includes(val)) return 'Asia';
      if (['OC', 'OCEANIA', 'AF', 'AFRICA', 'SA', 'SOUTH AMERICA'].includes(val)) return 'Other';
      if (!val || val === 'UNKNOWN') return 'Unknown';
      return 'Other';
    };

    const papersByConf = new Map<string, Map<string, number>>();
    for (const r of filteredPapers) {
      const conf = String(r.conference ?? r.Conference ?? '').trim().toUpperCase();
      if (!conf) continue;
      const cont = normalizeCont(r.predominant_continent ?? r['Predominant Continent'] ?? r.continent ?? '');
      if (!papersByConf.has(conf)) papersByConf.set(conf, new Map());
      const contMap = papersByConf.get(conf)!;
      contMap.set(cont, (contMap.get(cont) ?? 0) + 1);
    }

    const committeeByConf = new Map<string, Map<string, number>>();
    for (const r of filteredCommittee) {
      const conf = String(r.conference ?? r.Conference ?? '').trim().toUpperCase();
      if (!conf) continue;
      const cont = normalizeCont(r.continent ?? r.Continent ?? '');
      if (!committeeByConf.has(conf)) committeeByConf.set(conf, new Map());
      const contMap = committeeByConf.get(conf)!;
      contMap.set(cont, (contMap.get(cont) ?? 0) + 1);
    }

    const result: Array<{ conference: string; continent: string; gap: number; papersPercent: number; committeePercent: number }> = [];
    const allConfs = new Set([...papersByConf.keys(), ...committeeByConf.keys()]);
    const allContinents = ['North America', 'Europe', 'Asia', 'Other', 'Unknown'];

    for (const conf of allConfs) {
      const pMap = papersByConf.get(conf) ?? new Map();
      const cMap = committeeByConf.get(conf) ?? new Map();
      
      const pTotal = Array.from(pMap.values()).reduce((s, v) => s + v, 0);
      const cTotal = Array.from(cMap.values()).reduce((s, v) => s + v, 0);

      if (pTotal === 0 && cTotal === 0) {
        continue;
      }

      for (const cont of allContinents) {
        const pCount = pMap.get(cont) ?? 0;
        const cCount = cMap.get(cont) ?? 0;
        
        // Calculate percentages - use 0 if no data instead of forcing division
        const pPct = pTotal > 0 ? Number(((pCount / pTotal) * 100).toFixed(2)) : 0;
        const cPct = cTotal > 0 ? Number(((cCount / cTotal) * 100).toFixed(2)) : 0;
        const gap = Number((cPct - pPct).toFixed(2));

        result.push({
          conference: conf,
          continent: cont,
          papersPercent: pPct,
          committeePercent: cPct,
          gap,
        });
      }
    }

    return result;
  }, [papersRaw, committeeRaw, yearRange]);

  const { conferences: sortedConferences, heatmapData, minGap, maxGap } = useMemo(() => {
    const dataToUse = filteredDataByYearRange;
    const confs = Array.from(new Set(dataToUse.map(d => d.conference))).sort();
    const gapByConf = new Map<string, number>();
    
    for (const conf of confs) {
      const items = dataToUse.filter(d => d.conference === conf);
      const totalGap = items.reduce((s, item) => s + Math.abs(item.gap), 0);
      gapByConf.set(conf, totalGap);
    }
    
    const sortedConfs = confs.sort((a, b) => (gapByConf.get(b) ?? 0) - (gapByConf.get(a) ?? 0));
    
    const heatmap = new Map<string, Map<string, { gap: number; papersPercent: number; committeePercent: number }>>();
    let min = Infinity;
    let max = -Infinity;
    
    for (const cont of continents) {
      const confMap = new Map<string, { gap: number; papersPercent: number; committeePercent: number }>();
      for (const conf of sortedConfs) {
        const item = dataToUse.find(d => d.conference === conf && d.continent === cont);
        const gap = item?.gap ?? 0;
        const papersPercent = item?.papersPercent ?? 0;
        const committeePercent = item?.committeePercent ?? 0;
        confMap.set(conf, { gap, papersPercent, committeePercent });
        if (gap < min) min = gap;
        if (gap > max) max = gap;
      }
      heatmap.set(cont, confMap);
    }
    
    // Handle case where no data exists
    if (min === Infinity) min = 0;
    if (max === -Infinity) max = 0;
    
    return { conferences: sortedConfs, heatmapData: heatmap, minGap: min, maxGap: max };
  }, [filteredDataByYearRange, continents]);

  const { chartData, aggregateData, allConferences } = useMemo(() => {
    const filteredData = byYearData.filter(d => d.continent === selectedContinent);
    const allConfs = Array.from(new Set(filteredData.map(d => d.conference))).sort();
    const allYears = Array.from(new Set(filteredData.map(d => d.year))).sort((a, b) => a - b);
    
    const chartDataMap = new Map<number, Record<string, number | null>>();
    for (const year of allYears) {
      const base: Record<string, number | null> = { year };
      for (const conf of allConfs) {
        const item = filteredData.find(d => d.year === year && d.conference === conf);
        base[conf] = item?.gap ?? null;
      }
      chartDataMap.set(year, base);
    }
    
    const aggregateMap = new Map<number, number[]>();
    allYears.forEach(year => {
      const gaps = allConfs.map(conf => {
        const item = filteredData.find(d => d.year === year && d.conference === conf);
        return item?.gap;
      }).filter((gap): gap is number => gap !== null && gap !== undefined);
      if (gaps.length > 0) {
        aggregateMap.set(year, gaps);
      }
    });
    
    const aggregateData = Array.from(aggregateMap.entries()).map(([year, gaps]) => {
      const n = gaps.length || 1;
      const mean = gaps.reduce((s, v) => s + v, 0) / n;
      const variance = gaps.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / n;
      const sd = Math.sqrt(variance);
      return {
        year,
        mean: Number(mean.toFixed(2)),
        upper: Number((mean + sd).toFixed(2)),
        lower: Number((mean - sd).toFixed(2)),
      };
    }).sort((a, b) => a.year - b.year);
    
    return {
      chartData: Array.from(chartDataMap.values()).sort((a, b) => (a.year ?? 0) - (b.year ?? 0)),
      aggregateData,
      allConferences: allConfs,
    };
  }, [byYearData, selectedContinent]);


  const palette = [
    '#1f3b6f', '#1681c5', '#7d7d7d', '#10b981', '#8b5cf6',
    '#ef4444', '#f59e0b', '#22c55e', '#06b6d4', '#a855f7',
    '#64748b', '#84cc16', '#f97316', '#0ea5e9', '#e11d48',
    '#9333ea', '#c026d3', '#db2777', '#e11d48', '#f97316'
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Program Committee vs Papers</h1>
        <p className="text-muted-foreground mt-2">
          Interactive heatmaps showing geographic distribution gaps (Committee % - Papers %) across continents, conferences, and years
        </p>
      </div>

      <Card className="border-none shadow-xl bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
        <CardHeader>
          <CardTitle className="text-2xl">Gap Heatmap: Committee % - Papers %</CardTitle>
          <CardDescription className="text-base">
            Conferences in rows, continents in columns. Values show percentage point difference.
            Conferences ordered by total absolute gap (highest first).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 shadow-sm">
            <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-gray-200 dark:border-gray-800">
              <button
                onClick={() => {
                  const lastYear = years[years.length - 1];
                  handleYearRangeChange([lastYear, lastYear]);
                }}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  yearRange[0] === yearRange[1] && yearRange[0] === years[years.length - 1]
                    ? 'bg-gray-900 text-white shadow-md dark:bg-gray-700'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Last Year ({years[years.length - 1]})
              </button>
              <button
                onClick={() => {
                  const last5 = years[years.length - 1];
                  handleYearRangeChange([Math.max(years[0], last5 - 4), last5]);
                }}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  yearRange[0] === Math.max(years[0], years[years.length - 1] - 4) && yearRange[1] === years[years.length - 1]
                    ? 'bg-gray-900 text-white shadow-md dark:bg-gray-700'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Last 5 Years
              </button>
              <button
                onClick={() => {
                  const last10 = years[years.length - 1];
                  handleYearRangeChange([Math.max(years[0], last10 - 9), last10]);
                }}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  yearRange[0] === Math.max(years[0], years[years.length - 1] - 9) && yearRange[1] === years[years.length - 1]
                    ? 'bg-gray-900 text-white shadow-md dark:bg-gray-700'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Last 10 Years
              </button>
              <button
                onClick={() => handleYearRangeChange([years[0], years[years.length - 1]])}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  yearRange[0] === years[0] && yearRange[1] === years[years.length - 1]
                    ? 'bg-gray-900 text-white shadow-md dark:bg-gray-700'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                All Years
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Custom Range
                </label>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {yearRange[1] - yearRange[0] + 1} {yearRange[1] - yearRange[0] === 0 ? 'year' : 'years'}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">From</label>
                  <select
                    value={yearRange[0]}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val <= yearRange[1]) {
                        handleYearRangeChange([val, yearRange[1]]);
                      }
                    }}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  >
                    {years.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <div className="pt-6 text-gray-400 dark:text-gray-600">→</div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">To</label>
                  <select
                    value={yearRange[1]}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val >= yearRange[0]) {
                        handleYearRangeChange([yearRange[0], val]);
                      }
                    }}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  >
                    {years.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Visual Timeline Slider */}
              <div className="pt-2">
                <div className="relative">
                  <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full">
                    <div 
                      className="absolute h-1.5 bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-200"
                      style={{
                        left: `${((yearRange[0] - years[0]) / (years[years.length - 1] - years[0])) * 100}%`,
                        width: `${((yearRange[1] - yearRange[0]) / (years[years.length - 1] - years[0])) * 100}%`,
                      }}
                    />
                  </div>
                  
                  {/* Min Handle */}
                  <input
                    type="range"
                    min={years[0]}
                    max={years[years.length - 1]}
                    value={yearRange[0]}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val <= yearRange[1]) {
                        handleYearRangeChange([val, yearRange[1]]);
                      }
                    }}
                    className="absolute w-full h-1.5 top-0 bg-transparent appearance-none cursor-pointer z-10"
                    style={{
                      background: 'transparent',
                      WebkitAppearance: 'none',
                    }}
                  />
                  
                  {/* Max Handle */}
                  <input
                    type="range"
                    min={years[0]}
                    max={years[years.length - 1]}
                    value={yearRange[1]}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val >= yearRange[0]) {
                        handleYearRangeChange([yearRange[0], val]);
                      }
                    }}
                    className="absolute w-full h-1.5 top-0 bg-transparent appearance-none cursor-pointer z-10"
                    style={{
                      background: 'transparent',
                      WebkitAppearance: 'none',
                    }}
                  />
                </div>
                
                {/* Year Markers */}
                <div className="flex justify-between mt-2 text-xs text-gray-400 dark:text-gray-600">
                  <span>{years[0]}</span>
                  <span className="font-medium text-blue-600 dark:text-blue-400">
                    {yearRange[0]} - {yearRange[1]}
                  </span>
                  <span>{years[years.length - 1]}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="w-full pb-4">
            <div className="w-full">
              <div className="grid gap-1" style={{ gridTemplateColumns: `minmax(100px, 120px) repeat(${continents.length}, minmax(70px, 1fr))` }}>
                <div className="bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700"></div>
                {continents.map(continent => (
                  <div key={continent} className="text-center py-1 px-1 rounded-t-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30">
                    <span className="text-[9px] sm:text-[10px] font-bold text-gray-700 dark:text-gray-300 break-words">{continent}</span>
                  </div>
                ))}
                
                {sortedConferences.map(conf => {
                  return (
                    <>
                      <div 
                        key={`${conf}-label`} 
                        className="sticky left-0 z-20 flex items-center px-2 py-1.5 bg-gradient-to-r from-slate-100 via-slate-50 to-transparent dark:from-slate-800 dark:via-slate-700 dark:to-transparent rounded-l-lg shadow-sm"
                        role="rowheader"
                      >
                        <span className="text-[10px] sm:text-xs font-semibold text-gray-800 dark:text-gray-200">{conf}</span>
                      </div>
                      {continents.map(continent => {
                        const rowData = heatmapData.get(continent);
                        const cell = rowData?.get(conf);
                        const gap = cell?.gap ?? 0;
                        const papersPercent = cell?.papersPercent ?? 0;
                        const committeePercent = cell?.committeePercent ?? 0;
                        const bgColor = getHeatmapColor(gap, minGap, maxGap);
                        const textColor = Math.abs(gap) > 15 ? '#ffffff' : '#1f2937';
                        
                        return (
                          <div
                            key={`${conf}-${continent}`}
                            className="relative group flex items-center justify-center py-1.5 px-1 rounded cursor-help transition-all duration-200 hover:scale-105 hover:shadow-lg hover:z-10 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2"
                            style={{ backgroundColor: bgColor }}
                            role="gridcell"
                            tabIndex={0}
                          >
                            <span 
                              className="text-[10px] sm:text-xs font-bold transition-transform group-hover:scale-110" 
                              style={{ color: textColor }}
                              aria-label={`${conf} ${continent}: ${gap > 0 ? '+' : ''}${gap.toFixed(1)}pp. Papers ${papersPercent.toFixed(1)}%, Committee ${committeePercent.toFixed(1)}%`}
                            >
                              {gap > 0 ? '+' : ''}{gap.toFixed(1)}
                            </span>
                            <div 
                              className="absolute invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity duration-200 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap z-50"
                              role="tooltip"
                              aria-hidden="true"
                            >
                              <div className="font-semibold mb-1">{conf} - {continent}</div>
                              <div>Papers: {papersPercent.toFixed(1)}%</div>
                              <div>Committee: {committeePercent.toFixed(1)}%</div>
                              <div className="font-bold mt-1">Gap: {gap > 0 ? '+' : ''}{gap.toFixed(1)} pp</div>
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                            </div>
                          </div>
                        );
                      })}
                    </>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 pt-4 border-t">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Color Scale Legend</h4>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded shadow-sm" style={{ backgroundColor: COLORS.papers }}></div>
                <div className="text-sm">
                  <div className="font-semibold text-gray-700 dark:text-gray-300">Papers Dominate</div>
                  <div className="text-xs text-gray-500">Negative Gap</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded shadow-sm" style={{ backgroundColor: COLORS.neutral }}></div>
                <div className="text-sm">
                  <div className="font-semibold text-gray-700 dark:text-gray-300">Balanced</div>
                  <div className="text-xs text-gray-500">Gap ≈ 0</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded shadow-sm" style={{ backgroundColor: COLORS.committee }}></div>
                <div className="text-sm">
                  <div className="font-semibold text-gray-700 dark:text-gray-300">Committee Dominates</div>
                  <div className="text-xs text-gray-500">Positive Gap</div>
                </div>
              </div>
            </div>
            <div className="w-full max-w-md h-3 rounded-full overflow-hidden shadow-inner" style={{
              background: `linear-gradient(to right, ${COLORS.papers} 0%, ${COLORS.neutral} 50%, ${COLORS.committee} 100%)`
            }}>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-xl bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
        <CardHeader>
          <div>
            <CardTitle className="text-2xl">Conference Evolution: Gap by Year</CardTitle>
            <CardDescription className="text-base">
              Years in rows, conferences in columns. Values show percentage point difference (Committee % - Papers %) for the selected continent.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
            {continents.map(continent => (
              <button
                key={continent}
                onClick={() => handleEvolutionContinentChange(continent)}
                className={`px-4 py-2 text-sm font-medium transition-all duration-200 border-b-2 ${
                  selectedContinentForEvolution === continent
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                {continent}
              </button>
            ))}
          </div>

          <div className="w-full pb-4">
            <div className="w-full">
              <div className="grid gap-1.5" style={{ gridTemplateColumns: `minmax(70px, 90px) repeat(${conferences.length}, minmax(65px, 1fr))` }}>
                <div className="bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700"></div>
                {conferences.map(conf => (
                  <div key={conf} className="text-center py-2 px-1 rounded-t-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30">
                    <span className="text-[10px] sm:text-[11px] font-bold text-gray-700 dark:text-gray-300 break-words leading-tight">{conf}</span>
                  </div>
                ))}
                
                {years.map(year => {
                  const confGaps = new Map<string, number>();
                  const confData = new Map<string, { papersPercent: number; committeePercent: number }>();
                  
                  for (const conf of conferences) {
                    const item = byYearData.find(
                      d => d.year === year && 
                           d.conference === conf && 
                           d.continent === selectedContinentForEvolution
                    );
                    if (item) {
                      // Use pre-calculated gap from item to ensure consistency
                      const gap = item.gap;
                      confGaps.set(conf, gap);
                      confData.set(conf, {
                        papersPercent: item.papersPercent,
                        committeePercent: item.committeePercent
                      });
                    }
                  }
                  
                  const allGaps = Array.from(confGaps.values());
                  const yearMinGap = allGaps.length > 0 ? Math.min(...allGaps) : 0;
                  const yearMaxGap = allGaps.length > 0 ? Math.max(...allGaps) : 0;
                  
                  return (
                    <>
                      <div 
                        key={`${year}-label`} 
                        className="sticky left-0 z-20 flex items-center justify-center px-2 py-2.5 bg-gradient-to-r from-slate-100 via-slate-50 to-transparent dark:from-slate-800 dark:via-slate-700 dark:to-transparent rounded-l-lg shadow-sm"
                        role="rowheader"
                      >
                        <span className="text-[11px] sm:text-[12px] font-semibold text-gray-800 dark:text-gray-200">{year}</span>
                      </div>
                      {conferences.map(conf => {
                        const gap = confGaps.get(conf) ?? 0;
                        const bgColor = getHeatmapColor(gap, yearMinGap, yearMaxGap);
                        const absGap = Math.abs(gap);
                        const maxAbs = Math.max(Math.abs(yearMinGap), Math.abs(yearMaxGap));
                        const textColor = (maxAbs > 0 && absGap / maxAbs > 0.6) ? '#ffffff' : '#1f2937';
                        
                        const data = confData.get(conf);
                        const papersPercent = data?.papersPercent ?? 0;
                        const committeePercent = data?.committeePercent ?? 0;
                        
                        return (
                          <div
                            key={`${year}-${conf}`}
                            className="relative group flex items-center justify-center py-2.5 px-1 rounded-md cursor-help transition-all duration-200 hover:scale-105 hover:shadow-lg hover:z-10 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 min-h-[40px]"
                            style={{ backgroundColor: bgColor }}
                            role="gridcell"
                            tabIndex={0}
                          >
                            <span 
                              className="text-[11px] sm:text-[12px] font-bold transition-transform group-hover:scale-110" 
                              style={{ color: textColor }}
                              aria-label={`${year} ${conf} (${selectedContinentForEvolution}): ${gap > 0 ? '+' : ''}${gap.toFixed(1)}pp. Papers ${papersPercent.toFixed(1)}%, Committee ${committeePercent.toFixed(1)}%`}
                            >
                              {gap > 0 ? '+' : ''}{gap.toFixed(1)}
                            </span>
                            <div 
                              className="absolute invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity duration-200 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap z-50"
                              role="tooltip"
                              aria-hidden="true"
                            >
                              <div className="font-semibold mb-1">{year} - {conf}</div>
                              <div className="text-xs mb-1 text-gray-300">{selectedContinentForEvolution}</div>
                              <div>Papers: {papersPercent.toFixed(1)}%</div>
                              <div>Committee: {committeePercent.toFixed(1)}%</div>
                              <div className="font-bold mt-1">Gap: {gap > 0 ? '+' : ''}{gap.toFixed(1)} pp</div>
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                            </div>
                          </div>
                        );
                      })}
                    </>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 pt-4 border-t">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Color Scale Legend</h4>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded shadow-sm" style={{ backgroundColor: COLORS.papers }}></div>
                <div className="text-sm">
                  <div className="font-semibold text-gray-700 dark:text-gray-300">Papers Dominate</div>
                  <div className="text-xs text-gray-500">Negative Gap</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded shadow-sm" style={{ backgroundColor: COLORS.neutral }}></div>
                <div className="text-sm">
                  <div className="font-semibold text-gray-700 dark:text-gray-300">Balanced</div>
                  <div className="text-xs text-gray-500">Gap ≈ 0</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded shadow-sm" style={{ backgroundColor: COLORS.committee }}></div>
                <div className="text-sm">
                  <div className="font-semibold text-gray-700 dark:text-gray-300">Committee Dominates</div>
                  <div className="text-xs text-gray-500">Positive Gap</div>
                </div>
              </div>
            </div>
            <div className="w-full max-w-md h-3 rounded-full overflow-hidden shadow-inner" style={{
              background: `linear-gradient(to right, ${COLORS.papers} 0%, ${COLORS.neutral} 50%, ${COLORS.committee} 100%)`
            }}>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Understanding the Gap</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h4 className="font-semibold text-sm mb-1">What is the Gap?</h4>
            <p className="text-sm text-muted-foreground">
              The gap represents the difference between Committee representation and Papers representation for each continent:
              <span className="font-mono ml-1">Gap = Committee % - Papers %</span>
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-4 mt-3">
            <div className="border rounded-lg p-3 bg-red-50/50">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.committee }}></div>
                <h4 className="font-semibold text-sm">Positive Gap (+X.X pp)</h4>
              </div>
              <p className="text-xs text-muted-foreground">
                The committee has MORE representation than papers from that continent.
                Example: +15 pp means 15% more committee members than papers from that region.
              </p>
            </div>
            <div className="border rounded-lg p-3 bg-blue-50/50">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.papers }}></div>
                <h4 className="font-semibold text-sm">Negative Gap (-X.X pp)</h4>
              </div>
              <p className="text-xs text-muted-foreground">
                Papers have MORE representation than the committee from that continent.
                Example: -10 pp means 10% more papers than committee members from that region.
              </p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t">
            <h4 className="font-semibold text-sm mb-1">Conference Ordering</h4>
            <p className="text-sm text-muted-foreground">
              Conferences are ordered by total absolute gap (sum of |gap| across all continents), 
              showing conferences with the largest differences first.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
