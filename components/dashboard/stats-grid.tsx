"use client"

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/charts/chart-container";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { fetchDataset, processContinentDistribution, processAsianTrends, processBigTech, type AsianTrendItem, type BigTechItem } from "@/lib/data/load-data";

const COLORS = {
  'North America': '#1f3b6f',
  'Europe': '#1681c5',
  'Asia': '#7d7d7d',
  'Others': '#c5c5c5',
};

export function StatsGrid() {
  const [data, setData] = useState<{ name: keyof typeof COLORS; value: number }[]>([]);
  const [topContinent, setTopContinent] = useState<{ name: keyof typeof COLORS; value: number } | null>(null);
  const [asianGrowth, setAsianGrowth] = useState<{ growth: number; since: number } | null>(null);
  const [bigTechAvg, setBigTechAvg] = useState<number | null>(null);
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const raw = await fetchDataset('papers');
        const dist = processContinentDistribution(raw);
        if (!active || dist.length === 0) return;
        const totals = dist.reduce((acc, d) => {
          acc.na += d['North America'];
          acc.eu += d['Europe'];
          acc.asia += d['Asia'];
          acc.other += d['Others'];
          return acc;
        }, { na: 0, eu: 0, asia: 0, other: 0 });
        const sum = totals.na + totals.eu + totals.asia + totals.other || 1;
        const rows: { name: keyof typeof COLORS; value: number }[] = [
          { name: 'North America', value: Number(((totals.na / sum) * 100).toFixed(2)) },
          { name: 'Europe', value: Number(((totals.eu / sum) * 100).toFixed(2)) },
          { name: 'Asia', value: Number(((totals.asia / sum) * 100).toFixed(2)) },
          { name: 'Others', value: Number(((totals.other / sum) * 100).toFixed(2)) },
        ];
        setData(rows);
        // Top continent KPI
        const top = [...rows].sort((a, b) => b.value - a.value)[0];
        setTopContinent(top);
        // Asian growth KPI (overall percentage across all conferences), from earliest to latest year
        const trends: AsianTrendItem[] = processAsianTrends(raw);
        const years = Array.from(new Set(trends.map(t => t.year))).sort((a, b) => a - b);
        if (years.length > 0) {
          const first = years[0];
          const last = years[years.length - 1];
          const agg = (year: number) => {
            const arr = trends.filter(t => t.year === year);
            if (arr.length === 0) return 0;
            const avg = arr.reduce((s, t) => s + t.percentage, 0) / arr.length;
            return Number(avg.toFixed(2));
          };
          const pFirst = agg(first);
          const pLast = agg(last);
          const growth = Number((pLast - pFirst).toFixed(2));
          setAsianGrowth({ growth, since: first });
        }
      } catch (e) {
        // leave empty on error
      }
    })();
    return () => { active = false };
  }, []);

  // Big Tech average KPI
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const raw = await fetchDataset('bigtech');
        if (!active) return;
        const items: BigTechItem[] = processBigTech(raw);
        if (items.length > 0) {
          const avg = items.reduce((s, d) => s + d.bigTech, 0) / items.length;
          setBigTechAvg(Number(avg.toFixed(2)));
        }
      } catch (e) {
        // ignore if dataset missing
      }
    })();
    return () => { active = false };
  }, []);

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none shadow-lg bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Top Continent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold tracking-tight bg-gradient-to-br from-blue-600 to-blue-800 bg-clip-text text-transparent">{topContinent ? `${topContinent.value}%` : '—'}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {topContinent ? `${topContinent.name} leads` : '—'}
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

        
      </div>

      {/* Chart Card */}
      <Card className="border-none shadow-xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold">Distribution by Continent</CardTitle>
          <CardDescription>Overall breakdown of academic papers across conferences</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{}} className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={800}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ paddingTop: '20px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}

