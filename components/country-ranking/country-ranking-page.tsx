"use client";

import { useMemo, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Info } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trackEvent } from "@/lib/analytics";

const COUNTRY_ALIASES: Record<string, string> = {
  "usa": "United States",
  "u.s.a.": "United States",
  "u.s.": "United States",
  "united states of america": "United States",
  "united states": "United States",
  "the united states": "United States",
  "uk": "United Kingdom",
  "u.k.": "United Kingdom",
  "great britain": "United Kingdom",
  "united kingdom of great britain and northern ireland": "United Kingdom",
  "south korea": "South Korea",
  "republic of korea": "South Korea",
  "korea, south": "South Korea",
  "korea (south)": "South Korea",
  "north korea": "North Korea",
  "peoples republic of china": "China",
  "people's republic of china": "China",
  "p.r. china": "China",
  "mainland china": "China",
  "hong kong sar": "Hong Kong",
  "hong kong s.a.r.": "Hong Kong",
  "czech republic": "Czechia",
  "the netherlands": "Netherlands",
  "russian federation": "Russia",
  "uae": "United Arab Emirates",
  "u.a.e.": "United Arab Emirates",
};

const normalizeCountryName = (country: string | null | undefined): string => {
  if (!country) return "Unknown";
  const trimmed = country.trim();
  if (!trimmed) return "Unknown";

  const lower = trimmed.toLowerCase();
  if (COUNTRY_ALIASES[lower]) {
    return COUNTRY_ALIASES[lower];
  }

  if (lower === "unknown" || lower === "n/a") return "Unknown";
  if (lower === "other") return "Other";

  return trimmed
    .replace(/\s+/g, " ")
    .split(" ")
    .map((part) => {
      if (!part) return part;
      if (part.length === 1) return part.toUpperCase();
      return part[0].toUpperCase() + part.slice(1).toLowerCase();
    })
    .join(" ");
};

const parseCountriesFromValue = (value: unknown): string[] => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .flatMap((item) => parseCountriesFromValue(item))
      .map((item) => normalizeCountryName(item))
      .filter(Boolean)
      .filter((country) => country !== "Unknown" && country !== "Other");
  }

  if (typeof value === "string") {
    const cleaned = value.replace(/\r?\n/g, " ").trim();
    if (!cleaned) return [];
    return cleaned
      .split(/[;,]/)
      .map((part) => normalizeCountryName(part))
      .filter(Boolean)
      .filter((country) => country !== "Unknown" && country !== "Other");
  }

  return [];
};

interface InstitutionToken {
  institution: string;
  country?: string;
}

const parseInstitutionsFromValue = (value: unknown): InstitutionToken[] => {
  if (!value) return [];
  const cleaned = String(value).replace(/\r?\n/g, " ");
  if (!cleaned.trim()) return [];
  return cleaned
    .split(/;/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((entry) => {
      const match = entry.match(/^(.*?)(?:\s*\(([^)]+)\))?$/);
      const name = match && match[1] ? match[1].trim() : entry;
      const country = match && match[2] ? normalizeCountryName(match[2]) : undefined;
      return {
        institution: name,
        country: country && country !== "Other" ? country : undefined,
      };
    });
};

type RankingEntry =
  | {
      type: "country";
      country: string;
      percent: number;
      totalWeight: number;
      rank: number;
    }
  | {
      type: "institution";
      institution: string;
      country?: string;
      percent: number;
      totalWeight: number;
      rank: number;
    };

interface RankingSummary {
  type: "country" | "institution";
  entries: RankingEntry[];
  totalRows: number;
  unmappedCount: number;
  availableCountries?: string[];
}

const computeCountryRanking = (rows: any[]): RankingSummary => {
  if (!rows || rows.length === 0) {
    return { type: "country", entries: [], totalRows: 0, unmappedCount: 0 };
  }

  const totals = new Map<string, number>();
  let unmapped = 0;

  rows.forEach((row) => {
    const countries = parseCountriesFromValue(row?.countries ?? row?.Countries ?? row?.country ?? row?.Country);
    const unique = Array.from(new Set(countries));
    if (unique.length === 0) {
      unmapped += 1;
      return;
    }
    const weight = 1 / unique.length;
    unique.forEach((country) => {
      totals.set(country, (totals.get(country) ?? 0) + weight);
    });
  });

  const totalWeight = Array.from(totals.values()).reduce((sum, value) => sum + value, 0);
  if (totalWeight === 0) {
    return { type: "country", entries: [], totalRows: rows.length, unmappedCount: unmapped };
  }

  const entries: RankingEntry[] = Array.from(totals.entries())
    .map(([country, weight]) => ({
      type: "country" as const,
      country,
      percent: Number(((weight / totalWeight) * 100).toFixed(2)),
      totalWeight: Number(weight.toFixed(2)),
      rank: 0,
    }))
    .sort((a, b) => b.percent - a.percent || a.country.localeCompare(b.country))
    .map((entry, index) => ({ ...entry, rank: index + 1 }));

  return {
    type: "country",
    entries,
    totalRows: rows.length,
    unmappedCount: unmapped,
  };
};

const computeInstitutionRanking = (rows: any[]): RankingSummary => {
  if (!rows || rows.length === 0) {
    return { type: "institution", entries: [], totalRows: 0, unmappedCount: 0, availableCountries: [] };
  }

  const totals = new Map<string, { institution: string; country?: string; weight: number }>();
  const countrySet = new Set<string>();
  let unmapped = 0;

  rows.forEach((row) => {
    const tokens = parseInstitutionsFromValue(row?.institutions ?? row?.Institutions ?? "");
    if (tokens.length === 0) {
      unmapped += 1;
      return;
    }

    const weight = 1 / tokens.length;
    tokens.forEach((token) => {
      const key = `${token.institution}||${token.country ?? "Unknown"}`;
      const entry = totals.get(key) ?? { institution: token.institution, country: token.country, weight: 0 };
      entry.weight += weight;
      totals.set(key, entry);
      if (token.country) {
        countrySet.add(token.country);
      }
    });
  });

  const totalWeight = Array.from(totals.values()).reduce((sum, entry) => sum + entry.weight, 0);
  if (totalWeight === 0) {
    return {
      type: "institution",
      entries: [],
      totalRows: rows.length,
      unmappedCount: unmapped,
      availableCountries: Array.from(countrySet).sort(),
    };
  }

  const entries: RankingEntry[] = Array.from(totals.values())
    .map((entry) => ({
      type: "institution" as const,
      institution: entry.institution,
      country: entry.country,
      percent: Number(((entry.weight / totalWeight) * 100).toFixed(2)),
      totalWeight: Number(entry.weight.toFixed(2)),
      rank: 0,
    }))
    .sort(
      (a, b) =>
        b.percent - a.percent ||
        (a.institution + (a.country ?? "")).localeCompare(b.institution + (b.country ?? ""))
    )
    .map((entry, index) => ({ ...entry, rank: index + 1 }));

  const availableCountries = Array.from(countrySet).sort((a, b) => a.localeCompare(b));

  return {
    type: "institution",
    entries,
    totalRows: rows.length,
    unmappedCount: unmapped,
    availableCountries,
  };
};

interface CountryRankingPageProps {
  papersCountryRaw: any[];
  committeeCountryRaw: any[];
}

export function CountryRankingPage({ papersCountryRaw, committeeCountryRaw }: CountryRankingPageProps) {
  const [activeTab, setActiveTab] = useState<"papers" | "committee">("papers");
  const [rankingMode, setRankingMode] = useState<"country" | "institution">("country");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCountryFilter, setSelectedCountryFilter] = useState<string>("all");

  const papersCountryRanking = useMemo(() => computeCountryRanking(papersCountryRaw), [papersCountryRaw]);
  const papersInstitutionRanking = useMemo(() => computeInstitutionRanking(papersCountryRaw), [papersCountryRaw]);
  const committeeCountryRanking = useMemo(() => computeCountryRanking(committeeCountryRaw), [committeeCountryRaw]);
  const committeeInstitutionRanking = useMemo(() => computeInstitutionRanking(committeeCountryRaw), [committeeCountryRaw]);

  const getRankingFor = useCallback(
    (tab: "papers" | "committee", mode: "country" | "institution"): RankingSummary => {
      if (tab === "papers") {
        return mode === "country" ? papersCountryRanking : papersInstitutionRanking;
      }
      return mode === "country" ? committeeCountryRanking : committeeInstitutionRanking;
    },
    [papersCountryRanking, papersInstitutionRanking, committeeCountryRanking, committeeInstitutionRanking]
  );

  const activeRanking = getRankingFor(activeTab, rankingMode);
  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredEntries = useMemo(() => {
    let entries = activeRanking.entries;
    if (rankingMode === "institution" && selectedCountryFilter !== "all") {
      entries = entries.filter((entry) => entry.type === "institution" && entry.country === selectedCountryFilter);
    }
    if (!normalizedSearch) {
      return entries;
    }
    return entries.filter((entry) => {
      if (entry.type === "country") {
        return entry.country.toLowerCase().includes(normalizedSearch);
      }
      return entry.institution.toLowerCase().includes(normalizedSearch);
    });
  }, [activeRanking.entries, normalizedSearch, rankingMode, selectedCountryFilter]);

  const highlightedEntry = useMemo(() => {
    if (!normalizedSearch) return null;
    return activeRanking.entries.find((entry) => {
      if (entry.type === "country") {
        return entry.country.toLowerCase() === normalizedSearch;
      }
      return entry.institution.toLowerCase() === normalizedSearch;
    }) ?? null;
  }, [activeRanking.entries, normalizedSearch]);

  const handleTabChange = (value: string) => {
    const nextTab = value as "papers" | "committee";
    setActiveTab(nextTab);
    setSearchTerm("");
    setSelectedCountryFilter("all");
    trackEvent({
      action: "ranking_tab_change",
      category: "country_ranking",
      label: nextTab,
    });
  };

  const handleModeChange = (mode: "country" | "institution") => {
    setRankingMode(mode);
    setSearchTerm("");
    setSelectedCountryFilter("all");
    trackEvent({
      action: "ranking_mode_change",
      category: "country_ranking",
      label: mode,
      params: { tab: activeTab },
    });
  };

  const handleCountryFilterChange = useCallback((value: string) => {
    setSelectedCountryFilter(value);
    trackEvent({
      action: "ranking_country_filter",
      category: "country_ranking",
      label: value,
      params: { tab: activeTab, mode: rankingMode },
    });
  }, [activeTab, rankingMode]);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Country & Institution Ranking</h1>
        <p className="text-muted-foreground max-w-3xl">
          Explore global rankings for countries and institutions based on their share of accepted papers and program committee members.
          Percentages use per-record weighting, distributing credit evenly when multiple countries or institutions appear.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="w-full grid grid-cols-1 sm:grid-cols-2">
          <TabsTrigger value="papers">Accepted Papers</TabsTrigger>
          <TabsTrigger value="committee">Program Committee</TabsTrigger>
        </TabsList>

        <TabsContent value="papers">
          <RankingCard
            title="Accepted Papers Ranking"
            description="Toggle between top countries and institutions contributing to accepted papers across all conferences."
            ranking={getRankingFor("papers", rankingMode)}
            entries={activeTab === "papers" ? filteredEntries : getRankingFor("papers", rankingMode).entries}
            mode={rankingMode}
            onModeChange={handleModeChange}
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            highlightedEntry={highlightedEntry}
            availableCountries={papersInstitutionRanking.availableCountries}
            selectedCountryFilter={selectedCountryFilter}
            onCountryFilterChange={handleCountryFilterChange}
          />
        </TabsContent>
        <TabsContent value="committee">
          <RankingCard
            title="Program Committee Ranking"
            description="Assess geographic and institutional representation within program committees."
            ranking={getRankingFor("committee", rankingMode)}
            entries={activeTab === "committee" ? filteredEntries : getRankingFor("committee", rankingMode).entries}
            mode={rankingMode}
            onModeChange={handleModeChange}
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            highlightedEntry={highlightedEntry}
            availableCountries={committeeInstitutionRanking.availableCountries}
            selectedCountryFilter={selectedCountryFilter}
            onCountryFilterChange={handleCountryFilterChange}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface RankingCardProps {
  title: string;
  description: string;
  ranking: RankingSummary;
  entries: RankingEntry[];
  mode: "country" | "institution";
  onModeChange: (mode: "country" | "institution") => void;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  highlightedEntry: RankingEntry | null;
  availableCountries?: string[];
  selectedCountryFilter: string;
  onCountryFilterChange: (value: string) => void;
}

function RankingCard({
  title,
  description,
  ranking,
  entries,
  mode,
  onModeChange,
  searchTerm,
  onSearchTermChange,
  highlightedEntry,
  availableCountries,
  selectedCountryFilter,
  onCountryFilterChange,
}: RankingCardProps) {
  const isInstitutionMode = mode === "institution";
  const shareTooltip = isInstitutionMode
    ? "Percentage of the total weighted records attributed to this institution."
    : "Percentage of the total weighted records attributed to this country.";
  const weightedTooltip = "Weighted sum of records: each paper or committee member counts as 1 and is split evenly across every country or institution listed.";

  const handleSearchBlur = useCallback(() => {
    const trimmed = searchTerm.trim();
    trackEvent({
      action: "ranking_search",
      category: "country_ranking",
      label: trimmed || "(empty)",
      params: {
        mode,
        rankingType: ranking.type,
      },
    });
  }, [searchTerm, mode, ranking.type]);

  return (
    <Card className="border-none shadow-xl">
      <CardHeader className="space-y-4">
        <div className="space-y-2">
          <CardTitle className="text-2xl font-semibold flex items-center justify-between gap-3">
            <span>{title}</span>
            <RankingModeToggle mode={mode} onModeChange={onModeChange} />
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span>
              {isInstitutionMode ? "Institutions" : "Countries"} tracked: <strong className="text-foreground">{ranking.entries.length}</strong>
            </span>
          </div>
          <div className="flex w-full flex-col gap-3 sm:max-w-md">
            <div className="flex w-full items-center gap-2">
              <Input
                value={searchTerm}
                onChange={(event) => onSearchTermChange(event.target.value)}
                onBlur={handleSearchBlur}
                placeholder={isInstitutionMode ? "Search institution..." : "Search country..."}
                className="h-10"
              />
              {highlightedEntry ? (
                <Badge variant="secondary" className="whitespace-nowrap">
                  Rank #{highlightedEntry.rank}
                </Badge>
              ) : null}
            </div>
            {isInstitutionMode && (availableCountries && availableCountries.length > 0) ? (
              <Select value={selectedCountryFilter} onValueChange={onCountryFilterChange}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Filter by country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All countries</SelectItem>
                  {availableCountries.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-xl border border-gray-200/70 dark:border-gray-800/70 shadow-sm">
          <ScrollArea className="h-[600px]">
            <table className="w-full table-fixed border-collapse text-sm">
              <thead className="sticky top-0 z-10 bg-white/95 backdrop-blur dark:bg-gray-950/90">
                <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="w-16 px-4 py-3">Rank</th>
                  <th className="px-4 py-3">{isInstitutionMode ? "Institution" : "Country"}</th>
                  {isInstitutionMode && <th className="w-40 px-4 py-3">Country</th>}
                  <th className="w-28 px-4 py-3 text-right">
                    <span className="inline-flex items-center justify-end gap-1.5" title={shareTooltip}>
                      Share %
                      <Info className="h-3.5 w-3.5 text-muted-foreground/60" aria-hidden="true" />
                      <span className="sr-only">{shareTooltip}</span>
                    </span>
                  </th>
                  <th className="w-32 px-4 py-3 text-right">
                    <span className="inline-flex items-center justify-end gap-1.5" title={weightedTooltip}>
                      Weighted Count
                      <Info className="h-3.5 w-3.5 text-muted-foreground/60" aria-hidden="true" />
                      <span className="sr-only">{weightedTooltip}</span>
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={isInstitutionMode ? 5 : 4} className="px-4 py-6 text-center text-sm text-muted-foreground">
                      No data available.
                    </td>
                  </tr>
                ) : (
                  entries.map((entry) => {
                    const isHighlighted =
                      highlightedEntry &&
                      ((entry.type === "country" && highlightedEntry.type === "country" && highlightedEntry.country === entry.country) ||
                        (entry.type === "institution" && highlightedEntry.type === "institution" && highlightedEntry.institution === entry.institution));
                    return (
                      <tr
                        key={entry.type === "country" ? entry.country : `${entry.institution}-${entry.country ?? "Unknown"}`}
                        className={`border-b border-gray-100/70 text-sm dark:border-gray-800/60 ${
                          isHighlighted ? "bg-primary/10 dark:bg-primary/20 font-semibold" : ""
                        }`}
                      >
                        <td className="px-4 py-3">#{entry.rank}</td>
                        {entry.type === "country" ? (
                          <td className="px-4 py-3 font-medium text-foreground">{entry.country}</td>
                        ) : (
                          <td className="px-4 py-3 font-medium text-foreground">{entry.institution}</td>
                        )}
                        {isInstitutionMode && (
                          <td className="px-4 py-3 text-muted-foreground">{entry.type === "institution" ? entry.country ?? "—" : ""}</td>
                        )}
                        <td className="px-4 py-3 text-right tabular-nums">{entry.percent.toFixed(2)}%</td>
                        <td className="px-4 py-3 text-right tabular-nums">{entry.totalWeight.toFixed(2)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}

interface RankingModeToggleProps {
  mode: "country" | "institution";
  onModeChange: (mode: "country" | "institution") => void;
}

function RankingModeToggle({ mode, onModeChange }: RankingModeToggleProps) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-900/70 px-2 py-1 shadow-sm">
      <button
        onClick={() => onModeChange("country")}
        className={`px-4 py-1.5 text-xs sm:text-sm font-medium rounded-full transition-all ${
          mode === "country"
            ? "bg-gray-900 text-white shadow-sm hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
            : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/70"
        }`}
        aria-pressed={mode === "country"}
      >
        Countries
      </button>
      <button
        onClick={() => onModeChange("institution")}
        className={`px-4 py-1.5 text-xs sm:text-sm font-medium rounded-full transition-all ${
          mode === "institution"
            ? "bg-gray-900 text-white shadow-sm hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
            : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/70"
        }`}
        aria-pressed={mode === "institution"}
      >
        Institutions
      </button>
    </div>
  );
}
