"use client"

import { useMemo, useState, useCallback, Suspense, useEffect, Fragment, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/charts/chart-container";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush, ComposedChart, Area } from "recharts";
import type {
  CommitteeVsPapersCountryItem,
  CommitteeVsPapersByYearCountryItem,
  CommitteeVsPapersItem,
  CommitteeVsPapersByYearItem,
} from "@/lib/data/load-data";
import { normalizeCountryName } from "@/lib/data/load-data";
import { normalizeConferenceName } from "@/lib/data/types";
import { ClientCommitteeAnalysisPage as ContinentAnalysisView } from "@/components/committee-analysis/client-page";

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

interface ClientCountryAnalysisPageProps {
  continentData: CommitteeVsPapersItem[];
  continentByYear: CommitteeVsPapersByYearItem[];
  papersContinentRaw: any[];
  committeeContinentRaw: any[];
  continentConferences: string[];
  continentYears: number[];
  initialData: CommitteeVsPapersCountryItem[];
  byYearData: CommitteeVsPapersByYearCountryItem[];
  papersRaw: any[];
  committeeRaw: any[];
  conferences: string[];
  years: number[];
  countries: string[];
  topCountries: string[];
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

export function ClientCountryAnalysisPage({ 
  continentData,
  continentByYear,
  papersContinentRaw,
  committeeContinentRaw,
  continentConferences,
  continentYears,
  initialData, 
  byYearData,
  papersRaw,
  committeeRaw,
  conferences, 
  years,
  countries,
  topCountries,
}: ClientCountryAnalysisPageProps) {
  const geoMode: 'continent' = 'continent';
  const dedupePreserveOrder = useCallback((list: string[]) => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const item of list) {
      if (seen.has(item)) continue;
      seen.add(item);
      result.push(item);
    }
    return result;
  }, []);

  const normalizedAllCountries = useMemo(() => {
    const mapped = countries.map((country) => normalizeCountryName(country));
    return dedupePreserveOrder(
      mapped.filter((country) => country && country !== 'Unknown' && country !== 'Other')
    );
  }, [countries, dedupePreserveOrder]);

  const normalizedTopCountries = useMemo(() => {
    const mapped = topCountries.map((country) => normalizeCountryName(country));
    return dedupePreserveOrder(
      mapped
        .filter((country) => country && country !== 'Unknown' && country !== 'Other')
        .filter((country) => normalizedAllCountries.includes(country))
    );
  }, [topCountries, normalizedAllCountries, dedupePreserveOrder]);

  const pickDefaultCountry = useCallback(
    (list: string[]) => {
      const prioritized = list.find((country) => country !== 'Unknown');
      if (prioritized) return prioritized;
      const fallback = normalizedAllCountries.find((country) => country !== 'Unknown');
      return fallback ?? normalizedAllCountries[0] ?? 'Unknown';
    },
    [normalizedAllCountries]
  );

  const initialSelection = normalizedTopCountries.length > 0
    ? normalizedTopCountries
    : normalizedAllCountries.slice(0, Math.min(20, normalizedAllCountries.length));
  const initialCountry = pickDefaultCountry(initialSelection);

  const [selectedCountries, setSelectedCountries] = useState<string[]>(initialSelection);
  const [selectedCountry, setSelectedCountry] = useState<string>(initialCountry);
  const [selectedCountryForEvolution, setSelectedCountryForEvolution] = useState<string>(initialCountry);
  const heatmapContainerRef = useRef<HTMLDivElement>(null);
  const evolutionContainerRef = useRef<HTMLDivElement>(null);
  const [heatmapContainerWidth, setHeatmapContainerWidth] = useState(0);
  const [evolutionContainerWidth, setEvolutionContainerWidth] = useState(0);
  const [yearRange, setYearRange] = useState<[number, number]>(
    years.length > 0 ? [years[0], years[years.length - 1]] : [2000, 2024]
  );
  const [mode, setMode] = useState<'all' | 'aggregate'>('aggregate');
  const [countrySearch, setCountrySearch] = useState<string>('');

  const allCountriesSet = useMemo(() => new Set(normalizedAllCountries), [normalizedAllCountries]);
  const allCountriesActive = selectedCountries.length === 0;
  const heatmapCountries = useMemo(() => {
    if (allCountriesActive) {
      return normalizedAllCountries;
    }
    const selectionSet = new Set(selectedCountries);
    return normalizedAllCountries.filter(country => selectionSet.has(country));
  }, [normalizedAllCountries, selectedCountries, allCountriesActive]);

  const selectedCountrySet = useMemo(() => new Set(selectedCountries), [selectedCountries]);
  const filteredCountries = useMemo(() => {
    const search = countrySearch.trim().toLowerCase();
    if (!search) return normalizedAllCountries;
    return normalizedAllCountries.filter(country => country.toLowerCase().includes(search));
  }, [countrySearch, normalizedAllCountries]);

  const handleCountrySearchBlur = useCallback(() => {
    trackEvent({
      action: "country_search",
      category: "country_analysis",
      label: countrySearch.trim() || "(empty)",
    });
  }, [countrySearch]);

  useEffect(() => {
    const updateHeatmapWidth = () => {
      if (heatmapContainerRef.current) {
        const target = heatmapContainerRef.current;
        const width = target.getBoundingClientRect().width || target.clientWidth;
        setHeatmapContainerWidth(Math.floor(width));
      }
    };
    const updateEvolutionWidth = () => {
      if (evolutionContainerRef.current) {
        const target = evolutionContainerRef.current;
        const width = target.getBoundingClientRect().width || target.clientWidth;
        setEvolutionContainerWidth(Math.floor(width));
      }
    };

    updateHeatmapWidth();
    updateEvolutionWidth();

    const resizeObserver = new ResizeObserver(() => {
      updateHeatmapWidth();
      updateEvolutionWidth();
    });

    if (heatmapContainerRef.current) {
      resizeObserver.observe(heatmapContainerRef.current);
    }
    if (evolutionContainerRef.current) {
      resizeObserver.observe(evolutionContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const handleCountryVisibilityChange = useCallback((country: string, nextChecked: boolean) => {
    setSelectedCountries(prev => {
      let baseSet = prev.length === 0 ? new Set(normalizedAllCountries) : new Set(prev);
      if (nextChecked) {
        baseSet.add(country);
      } else {
        baseSet.delete(country);
      }
      let nextSelection: string[];
      if (baseSet.size === 0 || baseSet.size === normalizedAllCountries.length) {
        nextSelection = [];
      } else {
        nextSelection = normalizedAllCountries.filter(item => baseSet.has(item));
      }
      trackEvent({
        action: "country_visibility_toggle",
        category: "country_analysis",
        label: country,
        params: {
          checked: nextChecked,
          selectionSize: nextSelection.length,
        },
      });
      return nextSelection;
    });
  }, [normalizedAllCountries]);

  const handleSelectTopCountries = useCallback(() => {
    const base = normalizedTopCountries.length > 0
      ? normalizedTopCountries
      : normalizedAllCountries.slice(0, Math.min(20, normalizedAllCountries.length));
    setSelectedCountries([...base]);
    trackEvent({
      action: "country_select_top",
      category: "country_analysis",
      value: base.length,
    });
  }, [normalizedTopCountries, normalizedAllCountries]);

  const handleSelectAllCountries = useCallback(() => {
    setSelectedCountries([]);
    trackEvent({
      action: "country_select_all",
      category: "country_analysis",
    });
  }, []);

  useEffect(() => {
    const fallback = pickDefaultCountry(heatmapCountries);
    if (heatmapCountries.length === 0) {
      return;
    }
    const heatmapCountrySet = new Set(heatmapCountries);
    if (!heatmapCountrySet.has(selectedCountry) && fallback !== selectedCountry) {
      setSelectedCountry(fallback);
    }
    if (!heatmapCountrySet.has(selectedCountryForEvolution) && fallback !== selectedCountryForEvolution) {
      setSelectedCountryForEvolution(fallback);
    }
  }, [heatmapCountries, pickDefaultCountry, selectedCountry, selectedCountryForEvolution]);

  const handleContinentChange = useCallback((cont: string) => {
    setSelectedCountry(cont);
    trackEvent({
      action: "country_focus_change",
      category: "country_analysis",
      label: cont,
    });
  }, []);
  
  const handleYearRangeChange = useCallback((range: [number, number]) => {
    setYearRange(range);
    trackEvent({
      action: "country_year_range_change",
      category: "country_analysis",
      label: `${range[0]}-${range[1]}`,
    });
  }, []);
  
  const handleModeChange = useCallback((newMode: 'all' | 'aggregate') => {
    setMode(newMode);
    trackEvent({
      action: "country_mode_change",
      category: "country_analysis",
      label: newMode,
    });
  }, []);

  const handleEvolutionCountryChange = useCallback((country: string) => {
    setSelectedCountryForEvolution(country);
    trackEvent({
      action: "country_evolution_focus_change",
      category: "country_analysis",
      label: country,
    });
  }, []);

  const [filtersCollapsed, setFiltersCollapsed] = useState<boolean>(false);

  const CountryControlPanel = () => {
    const totalCountries = normalizedAllCountries.length;
    const showingCount = heatmapCountries.length;
    const allSelected = allCountriesActive;

    return (
      <div
        className={`space-y-4 md:space-y-5 xl:space-y-6 rounded-2xl xl:rounded-3xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-slate-900/70 shadow-sm transition-all duration-300 ${filtersCollapsed ? 'p-2 md:p-3 xl:p-3' : 'p-4 md:p-5 xl:p-6'} xl:max-h-[calc(100vh-280px)] xl:overflow-y-auto`}
      >
        <div
          className={`flex flex-col sm:flex-row justify-between gap-2 sm:gap-3 ${
            filtersCollapsed ? 'items-stretch sm:items-start sm:flex-wrap' : 'items-center'
          }`}
        >
          {!filtersCollapsed && (
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Countries</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Select which countries to display. Use quick actions to toggle between top conferences or the full list.
              </p>
            </div>
          )}
          <button
            onClick={() => setFiltersCollapsed((prev) => !prev)}
            className={`inline-flex items-center justify-center rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 sm:ml-auto ${filtersCollapsed ? 'w-full sm:w-auto' : ''}`}
            aria-expanded={!filtersCollapsed}
            title={filtersCollapsed ? 'Expand country filters' : 'Collapse country filters'}
          >
            {filtersCollapsed ? '☰' : 'Collapse'}
          </button>
        </div>

        {!filtersCollapsed && (
          <>
            <div className="flex flex-wrap gap-2 md:gap-3">
              <button
                onClick={handleSelectTopCountries}
                className="px-3 py-1.5 text-xs md:text-sm font-medium rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 hover:bg-gray-100 dark:hover:bg-slate-800"
              >
                Top Countries
              </button>
              <button
                onClick={handleSelectAllCountries}
                className="px-3 py-1.5 text-xs md:text-sm font-medium rounded-md border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700"
              >
                Select All
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs md:text-[13px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Search
              </label>
              <input
                type="search"
                value={countrySearch}
                onChange={(e) => setCountrySearch(e.target.value)}
                onBlur={handleCountrySearchBlur}
                placeholder="Filter countries..."
                className="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-gray-900 dark:text-gray-100"
              />
            </div>

            <div className="max-h-48 sm:max-h-56 lg:max-h-64 xl:max-h-80 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-950">
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredCountries.length === 0 ? (
                  <li className="px-3 py-4 text-xs text-gray-500 dark:text-gray-400">
                    No countries match &quot;{countrySearch.trim()}&quot;.
                  </li>
                ) : (
                  filteredCountries.map(country => {
                    const checked = selectedCountries.length === 0 ? true : selectedCountrySet.has(country);
                    return (
                      <li key={country} className="px-3 py-2 text-sm">
                        <label className="flex items-center justify-between gap-3">
                          <span className="flex-1 text-gray-700 dark:text-gray-200 truncate">{country}</span>
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900 dark:text-gray-100 dark:focus:ring-gray-200"
                            checked={checked}
                            onChange={(e) => handleCountryVisibilityChange(country, e.target.checked)}
                          />
                        </label>
                      </li>
                    );
                  })
                )}
              </ul>
            </div>
          </>
        )}

        {!filtersCollapsed && (
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Showing {showingCount} of {totalCountries} countries{allSelected ? ' (all selected)' : ''}
          </div>
        )}
      </div>
    );
  };

  const parseCountriesFromRow = useCallback((row: any): string[] => {
    const candidates = [
      row?.Countries,
      row?.countries,
      row?.Country,
      row?.country,
    ];

    for (const candidate of candidates) {
      if (Array.isArray(candidate)) {
        const normalized = candidate
          .map((value) => String(value ?? '').trim())
          .filter(Boolean);
        if (normalized.length > 0) {
          return normalized;
        }
        continue;
      }

      if (typeof candidate === 'string') {
        const cleaned = candidate.trim();
        if (!cleaned) continue;
        const parts = cleaned
          .replace(/\r?\n/g, ' ')
          .split(';')
          .map(part => part.trim())
          .filter(Boolean);
        if (parts.length > 0) {
          return parts;
        }
      }
    }

    return [];
  }, []);

  const categorizeCountryValue = useCallback((country: string): string | null => {
    const normalized = normalizeCountryName(country);
    return allCountriesSet.has(normalized) ? normalized : null;
  }, [allCountriesSet]);

  const accumulateCountryCounts = useCallback((
    rows: any[],
    target: Map<string, Map<string, number>>
  ) => {
    for (const row of rows) {
      const conf = normalizeConferenceName(row?.conference ?? row?.Conference ?? '');
      if (!conf) continue;
      const rawCountries = parseCountriesFromRow(row);
      let categories = rawCountries
        .map((country) => categorizeCountryValue(country))
        .filter((value): value is string => Boolean(value));

      const uniqueCategories = Array.from(new Set(categories));
      if (uniqueCategories.length === 0) continue;
      const weight = 1 / uniqueCategories.length;

      let bucket = target.get(conf);
      if (!bucket) {
        bucket = new Map<string, number>();
        target.set(conf, bucket);
      }
      for (const category of uniqueCategories) {
        bucket.set(category, (bucket.get(category) ?? 0) + weight);
      }
    }
  }, [categorizeCountryValue, parseCountriesFromRow]);

  const filteredDataByYearRange = useMemo(() => {
    const filteredPapers = papersRaw.filter((r: any) => {
      const year = Number(r.year ?? r.Year);
      return Number.isFinite(year) && year >= yearRange[0] && year <= yearRange[1];
    });
    
    const filteredCommittee = committeeRaw.filter((r: any) => {
      const year = Number(r.year ?? r.Year);
      return Number.isFinite(year) && year >= yearRange[0] && year <= yearRange[1];
    });

    const papersByConf = new Map<string, Map<string, number>>();
    accumulateCountryCounts(filteredPapers, papersByConf);

    const committeeByConf = new Map<string, Map<string, number>>();
    accumulateCountryCounts(filteredCommittee, committeeByConf);

    const result: Array<{ conference: string; country: string; gap: number; papersPercent: number; committeePercent: number }> = [];
    const allConfs = new Set([...papersByConf.keys(), ...committeeByConf.keys()]);

    for (const conf of allConfs) {
      const pMap = papersByConf.get(conf) ?? new Map<string, number>();
      const cMap = committeeByConf.get(conf) ?? new Map<string, number>();
      
      const pTotal = Array.from(pMap.values()).reduce((s, v) => s + v, 0);
      const cTotal = Array.from(cMap.values()).reduce((s, v) => s + v, 0);

      if (pTotal === 0 && cTotal === 0) {
        continue;
      }

      for (const country of normalizedAllCountries) {
        const pCount = pMap.get(country) ?? 0;
        const cCount = cMap.get(country) ?? 0;
        const pPct = pTotal > 0 ? Number(((pCount / pTotal) * 100).toFixed(2)) : 0;
        const cPct = cTotal > 0 ? Number(((cCount / cTotal) * 100).toFixed(2)) : 0;
        const gap = Number((cPct - pPct).toFixed(2));

        result.push({
          conference: conf,
          country,
          papersPercent: pPct,
          committeePercent: cPct,
          gap,
        });
      }
    }

    return result;
  }, [papersRaw, committeeRaw, yearRange, accumulateCountryCounts, normalizedAllCountries]);

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
    
    for (const country of normalizedAllCountries) {
      const confMap = new Map<string, { gap: number; papersPercent: number; committeePercent: number }>();
      for (const conf of sortedConfs) {
        const item = dataToUse.find(d => d.conference === conf && d.country === country);
        const gap = item?.gap ?? 0;
        const papersPercent = item?.papersPercent ?? 0;
        const committeePercent = item?.committeePercent ?? 0;
        confMap.set(conf, { gap, papersPercent, committeePercent });
        if (gap < min) min = gap;
        if (gap > max) max = gap;
      }
      heatmap.set(country, confMap);
    }
    
    // Handle case where no data exists
    if (min === Infinity) min = 0;
    if (max === -Infinity) max = 0;
    
    return { conferences: sortedConfs, heatmapData: heatmap, minGap: min, maxGap: max };
  }, [filteredDataByYearRange, normalizedAllCountries]);

  const heatmapColumnWidths = useMemo(() => {
    const minCountryWidth = 120;
    const minConferenceWidth = 80;
    const conferenceCount = Math.max(sortedConferences.length, 1);
    const minimumTableWidth = minCountryWidth + minConferenceWidth * conferenceCount;

    if (!heatmapContainerWidth) {
      return {
        countryWidth: minCountryWidth,
        conferenceWidth: minConferenceWidth,
        tableWidth: minimumTableWidth,
      };
    }

    if (minimumTableWidth >= heatmapContainerWidth) {
      return {
        countryWidth: minCountryWidth,
        conferenceWidth: minConferenceWidth,
        tableWidth: minimumTableWidth,
      };
    }

    const expandedCountry = Math.min(
      Math.max(minCountryWidth, Math.round(heatmapContainerWidth * 0.18)),
      Math.round(heatmapContainerWidth * 0.3)
    );
    const remainingWidth = Math.max(heatmapContainerWidth - expandedCountry, minConferenceWidth * conferenceCount);
    const expandedConference = Math.max(
      minConferenceWidth,
      Math.floor(remainingWidth / conferenceCount)
    );
    const computedTableWidth = Math.max(
      minimumTableWidth,
      expandedCountry + expandedConference * conferenceCount,
      heatmapContainerWidth
    );

    return {
      countryWidth: expandedCountry,
      conferenceWidth: expandedConference,
      tableWidth: computedTableWidth,
    };
  }, [heatmapContainerWidth, sortedConferences.length]);

  const evolutionColumnWidths = useMemo(() => {
    const minYearWidth = 80;
    const minConferenceWidth = 80;
    const conferenceCount = Math.max(conferences.length, 1);
    const minimumTableWidth = minYearWidth + minConferenceWidth * conferenceCount;

    if (!evolutionContainerWidth) {
      return {
        yearWidth: minYearWidth,
        conferenceWidth: minConferenceWidth,
        tableWidth: minimumTableWidth,
      };
    }

    if (minimumTableWidth >= evolutionContainerWidth) {
      return {
        yearWidth: minYearWidth,
        conferenceWidth: minConferenceWidth,
        tableWidth: minimumTableWidth,
      };
    }

    const expandedYear = Math.min(
      Math.max(minYearWidth, Math.round(evolutionContainerWidth * 0.15)),
      Math.round(evolutionContainerWidth * 0.25)
    );
    const remainingWidth = Math.max(evolutionContainerWidth - expandedYear, minConferenceWidth * conferenceCount);
    const expandedConference = Math.max(
      minConferenceWidth,
      Math.floor(remainingWidth / conferenceCount)
    );
    const computedTableWidth = Math.max(
      minimumTableWidth,
      expandedYear + expandedConference * conferenceCount,
      evolutionContainerWidth
    );

    return {
      yearWidth: expandedYear,
      conferenceWidth: expandedConference,
      tableWidth: computedTableWidth,
    };
  }, [evolutionContainerWidth, conferences.length]);

  const palette = [
    '#1f3b6f', '#1681c5', '#7d7d7d', '#10b981', '#8b5cf6',
    '#ef4444', '#f59e0b', '#22c55e', '#06b6d4', '#a855f7',
    '#64748b', '#84cc16', '#f97316', '#0ea5e9', '#e11d48',
    '#9333ea', '#c026d3', '#db2777', '#e11d48', '#f97316'
  ];

  const countryContent = (
    <div className="space-y-6 w-full px-3 sm:px-4 md:px-6 lg:px-8">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Program Committee vs Papers</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Interactive heatmaps showing geographic distribution gaps (Committee % - Papers %) across countries, conferences, and years
        </p>
      </div>

      <Card className="w-full border-none shadow-xl bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 overflow-hidden">
        <CardHeader className="pb-4 px-4 sm:px-6" style={{ boxSizing: 'content-box' }}>
          <CardTitle className="text-xl sm:text-2xl">Gap Heatmap: Committee % - Papers %</CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Conferences in rows, countries in columns. Values show percentage point difference.
            Conferences ordered by total absolute gap (highest first).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 lg:space-y-6 px-4 sm:px-6 pb-6" style={{ boxSizing: 'content-box' }}>
          <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(200px,240px)_1fr] lg:gap-6 lg:items-start">
            <div
              className="w-full shrink-0 transition-all duration-300 lg:col-span-1 lg:sticky lg:top-2"
            >
              <CountryControlPanel />
            </div>
            <div className="flex-1 min-w-0 space-y-4 lg:col-span-1">
              {/* Compact Year Range Selector */}
              <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-2 md:p-3 shadow-sm">
                <div className="flex items-center gap-1.5 md:gap-2.5 flex-wrap">
                  <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Year:</span>
                  <button
                    onClick={() => {
                      const lastYear = years[years.length - 1];
                      handleYearRangeChange([lastYear, lastYear]);
                    }}
                    className={`px-2 py-1 text-[10px] font-medium rounded transition-all ${
                      yearRange[0] === yearRange[1] && yearRange[0] === years[years.length - 1]
                        ? 'bg-gray-900 text-white shadow-sm hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {years[years.length - 1]}
                  </button>
                  <button
                    onClick={() => {
                      const last5 = years[years.length - 1];
                      handleYearRangeChange([Math.max(years[0], last5 - 4), last5]);
                    }}
                    className={`px-2 py-1 text-[10px] font-medium rounded transition-all ${
                      yearRange[0] === Math.max(years[0], years[years.length - 1] - 4) && yearRange[1] === years[years.length - 1]
                        ? 'bg-gray-900 text-white shadow-sm hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    5Y
                  </button>
                  <button
                    onClick={() => {
                      const last10 = years[years.length - 1];
                      handleYearRangeChange([Math.max(years[0], last10 - 9), last10]);
                    }}
                    className={`px-2 py-1 text-[10px] font-medium rounded transition-all ${
                      yearRange[0] === Math.max(years[0], years[years.length - 1] - 9) && yearRange[1] === years[years.length - 1]
                        ? 'bg-gray-900 text-white shadow-sm hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    10Y
                  </button>
                  <button
                    onClick={() => handleYearRangeChange([years[0], years[years.length - 1]])}
                    className={`px-2 py-1 text-[10px] font-medium rounded transition-all ${
                      yearRange[0] === years[0] && yearRange[1] === years[years.length - 1]
                        ? 'bg-gray-900 text-white shadow-sm hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    All
                  </button>
                  <div className="h-4 w-px bg-gray-300 dark:bg-gray-700 mx-1"></div>
                  <select
                    value={yearRange[0]}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val <= yearRange[1]) {
                        handleYearRangeChange([val, yearRange[1]]);
                      }
                    }}
                    className="px-1.5 py-0.5 text-[10px] md:text-[11px] border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-gray-900"
                  >
                    {years.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                  <span className="text-[10px] text-gray-400">→</span>
                  <select
                    value={yearRange[1]}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val >= yearRange[0]) {
                        handleYearRangeChange([yearRange[0], val]);
                      }
                    }}
                    className="px-1.5 py-0.5 text-[10px] md:text-[11px] border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-gray-900"
                  >
                    {years.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                  <span className="text-[9px] text-gray-500 dark:text-gray-400 ml-auto">
                    ({yearRange[1] - yearRange[0] + 1} {yearRange[1] - yearRange[0] === 0 ? 'year' : 'years'})
                  </span>
                </div>
              </div>

          <div className="w-full" ref={heatmapContainerRef}>
            <div
              className="relative w-full max-w-full overflow-x-auto overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm max-h-[500px] md:max-h-[600px] lg:max-h-[650px] xl:max-h-[700px]"
              style={{ boxSizing: 'content-box' }}
            >
              <table
                className="border-collapse w-full"
                style={{ tableLayout: "auto", minWidth: `${heatmapColumnWidths.tableWidth}px` }}
              >
                <colgroup>
                  <col
                    style={{
                      width: `${heatmapColumnWidths.countryWidth}px`,
                      minWidth: `${heatmapColumnWidths.countryWidth}px`,
                    }}
                  />
                  {sortedConferences.map((conf, idx) => (
                    <col
                      key={idx}
                      style={{
                        width: `${heatmapColumnWidths.conferenceWidth}px`,
                        minWidth: `${heatmapColumnWidths.conferenceWidth}px`,
                      }}
                    />
                  ))}
                </colgroup>
                <thead className="sticky top-0 z-30 bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-700">
                  <tr>
                    <th className="sticky left-0 z-40 bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700 px-2 py-1.5 text-left border-r border-gray-200 dark:border-gray-700">
                      <span className="text-[10px] font-semibold text-gray-700 dark:text-gray-300">Country</span>
                    </th>
                    {sortedConferences.map(conf => (
                      <th key={conf} className="px-1 py-1.5 text-center border-r border-gray-100 dark:border-gray-800">
                        <span className="text-[9px] font-semibold text-gray-700 dark:text-gray-300 block truncate" title={conf}>{conf}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {heatmapCountries.map(country => {
                    const rowData = heatmapData.get(country);
                    return (
                      <tr key={country} className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50">
                        <td className="sticky left-0 z-20 bg-gradient-to-r from-slate-100 via-slate-50 to-slate-50/95 dark:from-slate-800 dark:via-slate-700 dark:to-slate-700/95 px-2 py-1 border-r border-gray-200 dark:border-gray-700">
                          <span className="text-[10px] font-semibold text-gray-800 dark:text-gray-200 truncate block" title={country}>{country}</span>
                        </td>
                        {sortedConferences.map(conf => {
                          const cell = rowData?.get(conf);
                          const gap = cell?.gap ?? 0;
                          const papersPercent = cell?.papersPercent ?? 0;
                          const committeePercent = cell?.committeePercent ?? 0;
                          const bgColor = getHeatmapColor(gap, minGap, maxGap);
                          const textColor = Math.abs(gap) > 15 ? '#ffffff' : '#1f2937';

                          return (
                            <td
                              key={conf}
                              className="relative group text-center py-1 px-0.5 cursor-help transition-all duration-150 hover:ring-2 hover:ring-gray-300/70 dark:hover:ring-gray-500/60 hover:z-10 border-r border-gray-100 dark:border-gray-800"
                              style={{ backgroundColor: bgColor }}
                              tabIndex={0}
                              title={`${country} ${conf}: ${gap > 0 ? '+' : ''}${gap.toFixed(1)}pp. Papers ${papersPercent.toFixed(1)}%, Committee ${committeePercent.toFixed(1)}%`}
                            >
                              <span
                                className="text-[9px] font-semibold"
                                style={{ color: textColor }}
                              >
                                {gap > 0 ? '+' : ''}{gap.toFixed(1)}
                              </span>
                              <div className="absolute invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity duration-200 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap z-50 pointer-events-none">
                                <div className="font-semibold mb-1">{country} - {conf}</div>
                                <div>Papers: {papersPercent.toFixed(1)}%</div>
                                <div>Committee: {committeePercent.toFixed(1)}%</div>
                                <div className="font-bold mt-1">Gap: {gap > 0 ? '+' : ''}{gap.toFixed(1)} pp</div>
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

              <div className="flex flex-col items-center gap-3 pt-3 border-t">
                <h4 className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">Color Scale Legend</h4>
                <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded shadow-sm" style={{ backgroundColor: COLORS.papers }}></div>
                    <div className="text-xs">
                      <div className="font-semibold text-gray-700 dark:text-gray-300">Papers Dominate</div>
                      <div className="text-[10px] text-gray-500">Negative Gap</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded shadow-sm" style={{ backgroundColor: COLORS.neutral }}></div>
                    <div className="text-xs">
                      <div className="font-semibold text-gray-700 dark:text-gray-300">Balanced</div>
                      <div className="text-[10px] text-gray-500">Gap ≈ 0</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded shadow-sm" style={{ backgroundColor: COLORS.committee }}></div>
                    <div className="text-xs">
                      <div className="font-semibold text-gray-700 dark:text-gray-300">Committee Dominates</div>
                      <div className="text-[10px] text-gray-500">Positive Gap</div>
                    </div>
                  </div>
                </div>
                <div className="w-full h-2.5 rounded-full overflow-hidden shadow-inner" style={{
                  background: `linear-gradient(to right, ${COLORS.papers} 0%, ${COLORS.neutral} 50%, ${COLORS.committee} 100%)`
                }}>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="w-full border-none shadow-xl bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
        <CardHeader className="pb-4">
          <div>
            <CardTitle className="text-xl sm:text-2xl">Conference Evolution: Gap by Year</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Years in rows, conferences in columns. Values show percentage point difference (Committee % - Papers %) for the selected country.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
            <div className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400">
              Showing top {Math.min(10, normalizedTopCountries.length)} countries
            </div>
            <div className="w-full overflow-x-auto">
              <div className="flex gap-1.5 sm:gap-2 min-w-max">
                {normalizedTopCountries.slice(0, 10).map(country => (
                  <button
                    key={country}
                    onClick={() => handleEvolutionCountryChange(country)}
                    className={`px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium transition-all duration-200 border-b-2 whitespace-nowrap ${
                      selectedCountryForEvolution === country
                        ? 'border-gray-900 text-gray-900 dark:text-gray-100 dark:border-gray-100'
                        : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    {country}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div
            ref={evolutionContainerRef}
            className="relative w-full max-w-full overflow-x-auto overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm max-h-[500px] md:max-h-[600px] lg:max-h-[650px]"
          >
            <table
              className="border-collapse min-w-full"
              style={{ tableLayout: "auto", minWidth: `${evolutionColumnWidths.tableWidth}px` }}
            >
                <colgroup>
                  <col
                    style={{
                      width: `${evolutionColumnWidths.yearWidth}px`,
                      minWidth: `${evolutionColumnWidths.yearWidth}px`,
                    }}
                  />
                  {conferences.map((conf, idx) => (
                    <col
                      key={idx}
                      style={{
                        width: `${evolutionColumnWidths.conferenceWidth}px`,
                        minWidth: `${evolutionColumnWidths.conferenceWidth}px`,
                      }}
                    />
                  ))}
                </colgroup>
                <thead className="sticky top-0 z-30 bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-700">
                  <tr>
                    <th className="sticky left-0 z-40 bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700 px-2 py-1.5 text-center border-r border-gray-200 dark:border-gray-700">
                      <span className="text-[10px] font-semibold text-gray-700 dark:text-gray-300">Year</span>
                    </th>
                    {conferences.map(conf => (
                      <th key={conf} className="px-1 py-1.5 text-center border-r border-gray-100 dark:border-gray-800">
                        <span className="text-[9px] font-semibold text-gray-700 dark:text-gray-300 block truncate" title={conf}>{conf}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {years.map(year => {
                    const confGaps = new Map<string, number>();
                    const confData = new Map<string, { papersPercent: number; committeePercent: number }>();

                    for (const conf of conferences) {
                      const item = byYearData.find(
                        d => d.year === year &&
                             d.conference === conf &&
                             d.country === selectedCountryForEvolution
                      );
                      if (item) {
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
                      <tr key={year} className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50">
                        <td className="sticky left-0 z-20 bg-gradient-to-r from-slate-100 via-slate-50 to-slate-50/95 dark:from-slate-800 dark:via-slate-700 dark:to-slate-700/95 px-2 py-1 text-center border-r border-gray-200 dark:border-gray-700">
                          <span className="text-[10px] font-semibold text-gray-800 dark:text-gray-200">{year}</span>
                        </td>
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
                            <td
                              key={conf}
                              className="relative group text-center py-1 px-0.5 cursor-help transition-all duration-150 hover:ring-2 hover:ring-gray-300/70 dark:hover:ring-gray-500/60 hover:z-10 border-r border-gray-100 dark:border-gray-800"
                              style={{ backgroundColor: bgColor }}
                              tabIndex={0}
                              title={`${year} ${conf} (${selectedCountryForEvolution}): ${gap > 0 ? '+' : ''}${gap.toFixed(1)}pp. Papers ${papersPercent.toFixed(1)}%, Committee ${committeePercent.toFixed(1)}%`}
                            >
                              <span
                                className="text-[9px] font-semibold"
                                style={{ color: textColor }}
                              >
                                {gap > 0 ? '+' : ''}{gap.toFixed(1)}
                              </span>
                              <div className="absolute invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity duration-200 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap z-50 pointer-events-none">
                                <div className="font-semibold mb-1">{year} - {conf}</div>
                                <div className="text-xs mb-1 text-gray-300">{selectedCountryForEvolution}</div>
                                <div>Papers: {papersPercent.toFixed(1)}%</div>
                                <div>Committee: {committeePercent.toFixed(1)}%</div>
                                <div className="font-bold mt-1">Gap: {gap > 0 ? '+' : ''}{gap.toFixed(1)} pp</div>
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
            </table>
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
            <div className="w-full h-3 rounded-full overflow-hidden shadow-inner" style={{
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
              The gap represents the difference between Committee representation and Papers representation for each country:
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
                The committee has MORE representation than papers from that country.
                Example: +15 pp means 15% more committee members than papers from that country.
              </p>
            </div>
            <div className="border rounded-lg p-3 bg-gray-100/70 dark:bg-gray-800/60">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.papers }}></div>
                <h4 className="font-semibold text-sm">Negative Gap (-X.X pp)</h4>
              </div>
              <p className="text-xs text-muted-foreground">
                Papers have MORE representation than the committee from that country.
                Example: -10 pp means 10% more papers than committee members from that country.
              </p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t">
            <h4 className="font-semibold text-sm mb-1">Conference Ordering</h4>
            <p className="text-sm text-muted-foreground">
              Conferences are ordered by total absolute gap (sum of |gap| across all countries), 
              showing conferences with the largest differences first.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      {geoMode === 'continent' ? (
        <ContinentAnalysisView
          initialData={continentData}
          byYearData={continentByYear}
          papersRaw={papersContinentRaw}
          committeeRaw={committeeContinentRaw}
          conferences={continentConferences}
          years={continentYears}
        />
      ) : (
        countryContent
      )}
    </div>
  );
}
