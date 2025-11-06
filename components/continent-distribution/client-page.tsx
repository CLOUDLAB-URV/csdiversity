"use client"

import { useMemo, useState, useCallback, Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FilterPanel } from "@/components/filters/filter-panel";
import { ChartContainer } from "@/components/charts/chart-container";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { ContinentDistributionItem } from "@/lib/data/load-data-static";

import { Skeleton } from "@/components/ui/skeleton";

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
};

interface ClientContinentDistributionPageProps {
  initialData: ContinentDistributionItem[];
  conferences: string[];
  years: number[];
}

export function ClientContinentDistributionPage({ initialData, conferences, years }: ClientContinentDistributionPageProps) {
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);
  const [selectedConferences, setSelectedConferences] = useState<string[]>([]);
  
  const handleYearChange = useCallback((year: number | undefined) => {
    setSelectedYear(year);
  }, []);
  
  const handleConferencesChange = useCallback((list: string[]) => {
    setSelectedConferences(list);
  }, []);
  
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
    
    const isSingleConference = selectedConferences.length === 1 && !selectedYear;
    
    if (isSingleConference) {
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
          const pNA = Number(((v.na / total) * 100).toFixed(2));
          const pEU = Number(((v.eu / total) * 100).toFixed(2));
          const pAS = Number(((v.asia / total) * 100).toFixed(2));
          const pOT = Number(((v.other / total) * 100).toFixed(2));
          return {
            conference: String(year),
            'North America': pNA,
            'Europe': pEU,
            'Asia': pAS,
            'Others': pOT,
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
        const pNA = Number(((v.na / total) * 100).toFixed(2));
        const pEU = Number(((v.eu / total) * 100).toFixed(2));
        const pAS = Number(((v.asia / total) * 100).toFixed(2));
        const pOT = Number(((v.other / total) * 100).toFixed(2));
        return {
          conference: conf,
          'North America': pNA,
          'Europe': pEU,
          'Asia': pAS,
          'Others': pOT,
        };
      });
      rows.sort((a, b) => b['North America'] - a['North America']);
      return rows;
    }
  }, [filteredData, selectedYear, selectedConferences]);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent dark:from-gray-100 dark:via-gray-200 dark:to-gray-300">
          Accepted Papers Distribution
        </h1>
        <p className="text-lg text-muted-foreground">
          Geographic distribution of accepted papers across different continents and conferences
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
              <CardTitle className="text-xl font-semibold">Accepted Papers by Continent</CardTitle>
              <CardDescription>
                {selectedConferences.length === 1 && !selectedYear
                  ? "Stacked bar chart showing distribution by year for the selected conference"
                  : "Stacked bar chart showing distribution across conferences"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-[600px]">
                <Suspense fallback={<ChartSkeleton />}>
                  <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    role="img"
                    aria-label={`Continent distribution ${selectedConferences.length > 0 ? `for selected conferences` : selectedYear ? `for ${selectedYear}` : ''}`}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                    <XAxis 
                      dataKey="conference" 
                      angle={-45} 
                      textAnchor="end" 
                      height={80}
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                    />
                    <YAxis 
                      domain={[0, 100]}
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      label={{ value: 'Percentage', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6b7280' } }}
                      tickFormatter={(v: number) => `${Math.min(100, Math.max(0, Number(Number(v).toFixed(0))))}%`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.98)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        padding: '12px'
                      }}
                      cursor={{ fill: 'rgba(0, 0, 0, 0.02)' }}
                      formatter={(value: any, name: any) => {
                        const num = Math.min(100, Math.max(0, Number(Number(value).toFixed(2))));
                        return [`${num}%`, name];
                      }}
                    />
                    <Legend 
                      iconType="rect"
                      wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }}
                    />
                    <Bar dataKey="North America" stackId="a" fill={COLORS['North America']} radius={[0, 0, 0, 0]} />
                    <Bar dataKey="Europe" stackId="a" fill={COLORS['Europe']} radius={[0, 0, 0, 0]} />
                    <Bar dataKey="Asia" stackId="a" fill={COLORS['Asia']} radius={[0, 0, 0, 0]} />
                    <Bar dataKey="Others" stackId="a" fill={COLORS['Others']} radius={[4, 4, 0, 0]} />
                  </BarChart>
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

