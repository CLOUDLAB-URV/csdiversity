"use client"

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FilterPanel } from "@/components/filters/filter-panel";
import { fetchDataset, processContinentDistribution, type ContinentDistributionItem } from "@/lib/data/load-data";
import { ChartContainer } from "@/components/charts/chart-container";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = {
  'North America': '#1f3b6f',
  'Europe': '#1681c5',
  'Asia': '#7d7d7d',
  'Others': '#c5c5c5',
};

export default function ContinentDistributionPage() {
  const [selectedConference, setSelectedConference] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);
  const [allData, setAllData] = useState<ContinentDistributionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const raw = await fetchDataset('papers');
        const processed = processContinentDistribution(raw);
        if (active) setAllData(processed);
      } catch (e: any) {
        if (active) setError(e?.message ?? 'Failed to load data');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false };
  }, []);
  
  const filteredData = useMemo(() => {
    let filtered = allData;
    
    if (selectedConference !== "all") {
      filtered = filtered.filter(d => d.conference === selectedConference);
    }
    
    if (selectedYear) {
      filtered = filtered.filter(d => d.year === selectedYear);
    }
    
    return filtered;
  }, [allData, selectedConference, selectedYear]);
  
  // Compute percentages per conference so bars sum to 100
  const chartData = useMemo(() => {
    if (filteredData.length === 0) return [] as any[];
    // Sum counts per conference (respecting selectedYear if provided above)
    const grouped = new Map<string, { na: number; eu: number; asia: number; other: number }>();
    filteredData.forEach(d => {
      const g = grouped.get(d.conference) || { na: 0, eu: 0, asia: 0, other: 0 };
      g.na += d['North America'];
      g.eu += d['Europe'];
      g.asia += d['Asia'];
      g.other += d['Others'];
      grouped.set(d.conference, g);
    });
    const rows = Array.from(grouped.entries()).map(([conf, v]) => {
      const total = v.na + v.eu + v.asia + v.other || 1;
      const pNA = Number(((v.na / total) * 100).toFixed(2));
      const pEU = Number(((v.eu / total) * 100).toFixed(2));
      const pAS = Number(((v.asia / total) * 100).toFixed(2));
      let pOT = Number(((v.other / total) * 100).toFixed(2));
      // Normalize to exactly 100% to avoid 100.009999 artifacts
      const sumFirstThree = pNA + pEU + pAS;
      pOT = Number((100 - sumFirstThree).toFixed(2));
      // Guard against rounding pushing slightly negative/over 100
      if (pOT < 0) pOT = 0;
      if (pOT > 100) pOT = 100;
      return {
        conference: conf,
        'North America': pNA,
        'Europe': pEU,
        'Asia': pAS,
        'Others': pOT,
      };
    });
    // Sort by most American to least (descending North America percentage)
    rows.sort((a, b) => b['North America'] - a['North America']);
    return rows;
  }, [filteredData]);

  const conferences = useMemo(() => Array.from(new Set(allData.map(d => d.conference))).sort(), [allData]);
  const years = useMemo(() => Array.from(new Set(allData.map(d => d.year))).sort((a, b) => a - b), [allData]);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent dark:from-gray-100 dark:via-gray-200 dark:to-gray-300">
          Continent Distribution
        </h1>
        <p className="text-lg text-muted-foreground">
          Distribution of accepted papers across different continents and conferences
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <FilterPanel
            conferences={conferences}
            years={years as number[]}
            selectedConference={selectedConference}
            selectedYear={selectedYear}
            onConferenceChange={setSelectedConference}
            onYearChange={setSelectedYear}
          />
        </div>

        <div className="lg:col-span-3">
          <Card className="border-none shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold">Papers by Continent</CardTitle>
              <CardDescription>
                Stacked bar chart showing distribution across conferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-[600px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
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
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

