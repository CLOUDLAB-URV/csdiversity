"use client"

import { useMemo, memo, Suspense, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/charts/chart-container";
import type { DiversityData } from "@/lib/data/load-data";
import { processDiversity } from "@/lib/data/load-data";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

const ChartSkeleton = () => (
  <div className="h-[400px] w-full space-y-4 p-4">
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
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  </div>
);

interface ClientDiversityPageProps {
  initialData: DiversityData[];
  papersRaw: any[];
  committeeRaw: any[];
}

export const ClientDiversityPage = memo(function ClientDiversityPage({ initialData, papersRaw, committeeRaw }: ClientDiversityPageProps) {
  const years = useMemo(() => {
    const yrs = new Set<number>();
    for (const row of papersRaw) {
      const year = Number(row.year ?? row.Year);
      if (Number.isFinite(year)) yrs.add(year);
    }
    return Array.from(yrs).sort((a, b) => a - b);
  }, [papersRaw]);

  const [yearRange, setYearRange] = useState<[number, number]>(
    years.length > 0 ? [years[0], years[years.length - 1]] : [2000, 2024]
  );

  const handleYearRangeChange = useCallback((range: [number, number]) => {
    setYearRange(range);
  }, []);

  const filteredDiversityData = useMemo(() => {
    const filteredPapers = papersRaw.filter(row => {
      const year = Number(row.year ?? row.Year);
      return Number.isFinite(year) && year >= yearRange[0] && year <= yearRange[1];
    });
    const filteredCommittee = committeeRaw.filter(row => {
      const year = Number(row.year ?? row.Year);
      return Number.isFinite(year) && year >= yearRange[0] && year <= yearRange[1];
    });
    return processDiversity(filteredPapers, filteredCommittee);
  }, [papersRaw, committeeRaw, yearRange]);

  const radarData = useMemo(() => {
    const validConferences = ['OSDI', 'ASPLOS', 'NSDI', 'SIGCOMM', 'EUROSYS', 'ATC', 'SOCC', 'IEEECLOUD', 'CCGRID', 'EUROPAR', 'ICDCS', 'MIDDLEWARE', 'IC2E'];
    return filteredDiversityData
      .filter(d => {
        const conf = d.conference;
        if (!conf) return false;
        if (/^\d+$/.test(conf)) return false;
        return validConferences.includes(conf) || /^[A-Z0-9]{2,}$/.test(conf);
      })
      .map(d => ({
      conference: d.conference,
      Committee: d.committee,
      Papers: d.papers,
    }));
  }, [filteredDiversityData]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Diversity Metrics</h1>
        <p className="text-muted-foreground mt-2">
          Gini-Simpson Index analysis across conferences
        </p>
      </div>

      <Card className="border-none shadow-xl">
          <CardHeader>
            <CardTitle>Radar Chart</CardTitle>
            <CardDescription>
              Multi-dimensional diversity comparison
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
              </div>
            </div>
            <ChartContainer config={{}} className="h-[400px]">
              <Suspense fallback={<ChartSkeleton />}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart 
                    data={radarData}
                    role="img"
                    aria-label="Multi-dimensional diversity comparison"
                  >
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis 
                      dataKey="conference" 
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                    />
                    <PolarRadiusAxis 
                      angle={90} 
                      domain={[0, 1]} 
                      tick={{ fill: '#6b7280', fontSize: 10 }}
                    />
                    <Radar 
                      name="Committee" 
                      dataKey="Committee" 
                      stroke="#1681c5" 
                      fill="#1681c5" 
                      fillOpacity={0.6} 
                      strokeWidth={2}
                    />
                    <Radar 
                      name="Papers" 
                      dataKey="Papers" 
                      stroke="#7d7d7d" 
                      fill="#7d7d7d" 
                      fillOpacity={0.6} 
                      strokeWidth={2}
                    />
                    <Legend 
                      wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.98)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        padding: '12px'
                      }}
                      formatter={(value: any) => Number(value).toFixed(4)}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </Suspense>
            </ChartContainer>
          </CardContent>
      </Card>

      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle>About Gini-Simpson Index</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            The Gini-Simpson Index ranges from 0 to 1. Higher values mean more diversity across continents. 
            Lower values indicate concentration in one region.
          </p>
          <div className="mt-4 pt-4 border-t">
            <h4 className="font-semibold text-sm mb-2">Calculation</h4>
            <p className="text-sm text-muted-foreground">
              Formula: <span className="font-mono">D = 1 - Σ(p_i²)</span>, where p_i is the proportion of each continent.
            </p>
          </div>
          <div className="mt-4 pt-4 border-t">
            <h4 className="font-semibold text-sm mb-2">What the numbers mean</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li><strong>D ≈ 0:</strong> One continent dominates</li>
              <li><strong>D ≈ 0.5:</strong> Moderate diversity</li>
              <li><strong>D ≈ 1:</strong> Balanced across continents</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

