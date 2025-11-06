"use client"

import { useMemo, memo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/charts/chart-container";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import type { ContinentDistributionItem, AsianTrendItem, BigTechItem } from "@/lib/data/load-data";

const COLORS = {
  'North America': '#1f3b6f',
  'Europe': '#1681c5',
  'Asia': '#7d7d7d',
  'Others': '#c5c5c5',
};

const formatNumber = (num: number): string => {
  return num.toLocaleString('en-US');
};

interface StatsGridProps {
  continentData: ContinentDistributionItem[];
  asianTrends: AsianTrendItem[];
  bigTechData: BigTechItem[];
}

export const StatsGrid = memo(function StatsGrid({ continentData, asianTrends, bigTechData }: StatsGridProps) {
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

      <Card className="border-none shadow-xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold">Accepted Papers Distribution by Continent</CardTitle>
          <CardDescription>Overall breakdown of accepted papers across conferences</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{}} className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
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
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
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
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
});