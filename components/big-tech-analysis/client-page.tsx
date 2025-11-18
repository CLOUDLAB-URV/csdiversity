"use client"

import { useMemo, useState, useCallback, Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FilterPanel } from "@/components/filters/filter-panel";
import type { BigTechItem, BigTechByRegionItem } from "@/lib/data/load-data";
import { ChartContainer } from "@/components/charts/chart-container";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, Brush, ComposedChart, Area } from "recharts";

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

interface ClientBigTechAnalysisPageProps {
  initialData: BigTechItem[];
  initialDataByRegion: BigTechByRegionItem[];
}

export function ClientBigTechAnalysisPage({ initialData, initialDataByRegion }: ClientBigTechAnalysisPageProps) {
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);
  const [topN, setTopN] = useState<number | 'all'>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [mode, setMode] = useState<'all' | 'aggregate'>('aggregate');
  const [selectedConferences, setSelectedConferences] = useState<string[]>([]);

  const conferences = useMemo(() => {
    const confs = new Set<string>();
    for (const d of initialData) confs.add(d.conference);
    return Array.from(confs).sort();
  }, [initialData]);
  
  const years = useMemo(() => {
    const yrs = new Set<number>();
    for (const d of initialData) yrs.add(d.year);
    return Array.from(yrs).sort((a, b) => a - b);
  }, [initialData]);
  
  const handleConferencesChange = useCallback((list: string[]) => {
    setSelectedConferences(list);
    if (list.length > 0) setMode('all');
    trackEvent({
      action: "bigtech_filter_conferences",
      category: "bigtech",
      value: list.length,
    });
  }, []);
  
  const handleTopNChange = useCallback((value: number | 'all') => {
    setTopN(value);
    trackEvent({
      action: "bigtech_topn_change",
      category: "bigtech",
      label: value === 'all' ? 'all' : value.toString(),
    });
  }, []);
  
  const handleSortOrderChange = useCallback((value: 'desc' | 'asc') => {
    setSortOrder(value);
    trackEvent({
      action: "bigtech_sort_order_change",
      category: "bigtech",
      label: value,
    });
  }, []);
  
  const handleModeChange = useCallback((value: 'all' | 'aggregate') => {
    setMode(value);
    trackEvent({
      action: "bigtech_mode_change",
      category: "bigtech",
      label: value,
    });
  }, []);

  const handleYearChange = useCallback((year: number | undefined) => {
    setSelectedYear(year);
    trackEvent({
      action: "bigtech_year_change",
      category: "bigtech",
      label: year ? year.toString() : "all",
    });
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

  const filteredDataByRegion = useMemo(() => {
    let data = initialDataByRegion;
    if (selectedConferences.length > 0) {
      data = data.filter(d => selectedConferences.includes(d.conference));
    }
    if (selectedYear) {
      data = data.filter(d => d.year === selectedYear);
    }
    return data;
  }, [initialDataByRegion, selectedYear, selectedConferences]);
  
  const chartData = useMemo(() => {
    const isSingleConference = selectedConferences.length === 1 && !selectedYear;
    
    if (isSingleConference) {
      const grouped = new Map<number, { year: number; btValues: number[]; acValues: number[] }>();
      filteredData.forEach(d => {
        const key = d.year;
        const item = grouped.get(key) || { year: key, btValues: [], acValues: [] };
        item.btValues.push(d.bigTech);
        item.acValues.push(d.academia);
        grouped.set(key, item);
      });
      let rows = Array.from(grouped.values()).map(({ year, btValues, acValues }) => {
        const btAvg = btValues.length > 0 ? btValues.reduce((s, v) => s + v, 0) / btValues.length : 0;
        const acAvg = acValues.length > 0 ? acValues.reduce((s, v) => s + v, 0) / acValues.length : 0;
        const unmappedAvg = filteredData.filter(d => d.year === year).length > 0 
          ? filteredData.filter(d => d.year === year).reduce((s, d) => s + (d.unmapped || 0), 0) / filteredData.filter(d => d.year === year).length 
          : 0;
        const pBT = Number(btAvg.toFixed(2));
        const pAC = Number(acAvg.toFixed(2));
        const pUnmapped = Number(unmappedAvg.toFixed(2));
        return { conference: String(year), 'Big Tech': pBT, 'Academia': pAC, 'Unmapped': pUnmapped };
      });
      rows.sort((a, b) => Number(a.conference) - Number(b.conference));
      return rows;
    } else {
      const grouped = new Map<string, { conference: string; btValues: number[]; acValues: number[] }>();
      filteredData.forEach(d => {
        const key = d.conference;
        const item = grouped.get(key) || { conference: key, btValues: [], acValues: [] };
        item.btValues.push(d.bigTech);
        item.acValues.push(d.academia);
        grouped.set(key, item);
      });
      let rows = Array.from(grouped.values()).map(({ conference, btValues, acValues }) => {
        const btAvg = btValues.length > 0 ? btValues.reduce((s, v) => s + v, 0) / btValues.length : 0;
        const acAvg = acValues.length > 0 ? acValues.reduce((s, v) => s + v, 0) / acValues.length : 0;
        const unmappedAvg = filteredData.filter(d => d.conference === conference).length > 0
          ? filteredData.filter(d => d.conference === conference).reduce((s, d) => s + (d.unmapped || 0), 0) / filteredData.filter(d => d.conference === conference).length
          : 0;
        const pBT = Number(btAvg.toFixed(2));
        const pAC = Number(acAvg.toFixed(2));
        const pUnmapped = Number(unmappedAvg.toFixed(2));
        return { conference, 'Big Tech': pBT, 'Academia': pAC, 'Unmapped': pUnmapped };
      });
      rows.sort((a, b) => sortOrder === 'desc' ? (b['Big Tech'] - a['Big Tech']) : (a['Big Tech'] - b['Big Tech']));
      if (topN !== 'all') rows = rows.slice(0, topN);
      return rows;
    }
  }, [filteredData, sortOrder, topN, selectedConferences, selectedYear]);

  const chartDataByRegion = useMemo(() => {
    const isSingleConference = selectedConferences.length === 1 && !selectedYear;
    
    if (isSingleConference) {
      const grouped = new Map<number, { 
        year: number; 
        naValues: number[]; 
        asiaValues: number[]; 
        euValues: number[]; 
        othersValues: number[]; 
        acValues: number[] 
      }>();
      filteredDataByRegion.forEach(d => {
        const key = d.year;
        const item = grouped.get(key) || { 
          year: key, 
          naValues: [], 
          asiaValues: [], 
          euValues: [], 
          othersValues: [], 
          acValues: [] 
        };
        item.naValues.push(d.bigTechNA);
        item.asiaValues.push(d.bigTechAsia);
        item.euValues.push(d.bigTechEU);
        item.othersValues.push(d.bigTechOthers);
        item.acValues.push(d.academia);
        grouped.set(key, item);
      });
      let rows = Array.from(grouped.values()).map(({ year, naValues, asiaValues, euValues, othersValues, acValues }) => {
        const yearData = filteredDataByRegion.filter(d => d.year === year);
        if (yearData.length === 0) {
          return {
            conference: String(year),
            'Big Tech (NA)': 0,
            'Big Tech (Asia)': 0,
            'Big Tech (EU)': 0,
            'Big Tech (Others)': 0,
            'Academia': 0,
            'Unmapped': 0
          };
        }
        
        const pNA = Number((yearData.reduce((s, d) => s + d.bigTechNA, 0) / yearData.length).toFixed(2));
        const pAsia = Number((yearData.reduce((s, d) => s + d.bigTechAsia, 0) / yearData.length).toFixed(2));
        const pEU = Number((yearData.reduce((s, d) => s + d.bigTechEU, 0) / yearData.length).toFixed(2));
        const pOthers = Number((yearData.reduce((s, d) => s + d.bigTechOthers, 0) / yearData.length).toFixed(2));
        const pAC = Number((yearData.reduce((s, d) => s + d.academia, 0) / yearData.length).toFixed(2));
        const pUnmapped = Number((yearData.reduce((s, d) => s + (d.unmapped || 0), 0) / yearData.length).toFixed(2));
        
        return { 
          conference: String(year), 
          'Big Tech (NA)': pNA, 
          'Big Tech (Asia)': pAsia, 
          'Big Tech (EU)': pEU, 
          'Big Tech (Others)': pOthers, 
          'Academia': pAC,
          'Unmapped': pUnmapped
        };
      });
      rows.sort((a, b) => Number(a.conference) - Number(b.conference));
      return rows;
    } else {
      const grouped = new Map<string, { 
        conference: string; 
        naValues: number[]; 
        asiaValues: number[]; 
        euValues: number[]; 
        othersValues: number[]; 
        acValues: number[] 
      }>();
      filteredDataByRegion.forEach(d => {
        const key = d.conference;
        const item = grouped.get(key) || { 
          conference: key, 
          naValues: [], 
          asiaValues: [], 
          euValues: [], 
          othersValues: [], 
          acValues: [] 
        };
        item.naValues.push(d.bigTechNA);
        item.asiaValues.push(d.bigTechAsia);
        item.euValues.push(d.bigTechEU);
        item.othersValues.push(d.bigTechOthers);
        item.acValues.push(d.academia);
        grouped.set(key, item);
      });
      let rows = Array.from(grouped.values()).map(({ conference, naValues, asiaValues, euValues, othersValues, acValues }) => {
        const confData = filteredDataByRegion.filter(d => d.conference === conference);
        if (confData.length === 0) {
          return {
            conference,
            'Big Tech (NA)': 0,
            'Big Tech (Asia)': 0,
            'Big Tech (EU)': 0,
            'Big Tech (Others)': 0,
            'Academia': 0,
            'Unmapped': 0
          };
        }
        
        const pNA = Number((confData.reduce((s, d) => s + d.bigTechNA, 0) / confData.length).toFixed(2));
        const pAsia = Number((confData.reduce((s, d) => s + d.bigTechAsia, 0) / confData.length).toFixed(2));
        const pEU = Number((confData.reduce((s, d) => s + d.bigTechEU, 0) / confData.length).toFixed(2));
        const pOthers = Number((confData.reduce((s, d) => s + d.bigTechOthers, 0) / confData.length).toFixed(2));
        const pAC = Number((confData.reduce((s, d) => s + d.academia, 0) / confData.length).toFixed(2));
        const pUnmapped = Number((confData.reduce((s, d) => s + (d.unmapped || 0), 0) / confData.length).toFixed(2));
        
        return { 
          conference, 
          'Big Tech (NA)': pNA, 
          'Big Tech (Asia)': pAsia, 
          'Big Tech (EU)': pEU, 
          'Big Tech (Others)': pOthers, 
          'Academia': pAC,
          'Unmapped': pUnmapped
        };
      });
      const totalBigTech = (row: any) => row['Big Tech (NA)'] + row['Big Tech (Asia)'] + row['Big Tech (EU)'] + row['Big Tech (Others)'];
      rows.sort((a, b) => sortOrder === 'desc' ? (totalBigTech(b) - totalBigTech(a)) : (totalBigTech(a) - totalBigTech(b)));
      if (topN !== 'all') rows = rows.slice(0, topN);
      return rows;
    }
  }, [filteredDataByRegion, sortOrder, topN, selectedConferences, selectedYear]);
  const isSingleConferenceView = selectedConferences.length === 1 && !selectedYear;


  const { evolutionData, evolutionConfs, aggregateEvolutionData } = useMemo(() => {
    const confs = selectedConferences.length > 0 
      ? selectedConferences 
      : Array.from(new Set(initialData.map(d => d.conference))).sort();

    const allYears = Array.from(new Set(initialData.map(d => d.year))).sort((a, b) => a - b);
    const byYear = new Map<number, any>();
    
    for (const year of allYears) {
      const base: any = { year };
      for (const conf of confs) {
        const item = initialData.find(d => d.year === year && d.conference === conf);
        base[conf] = item?.bigTech ?? null;
      }
      byYear.set(year, base);
    }
    
    const data = Array.from(byYear.values()).sort((a, b) => a.year - b.year);
    const aggregateMap = new Map<number, number[]>();
    
    for (const year of allYears) {
      const values = confs.map(conf => {
        const item = initialData.find(d => d.year === year && d.conference === conf);
        return item?.bigTech;
      }).filter((val): val is number => val !== null && val !== undefined);
      
      if (values.length > 0) aggregateMap.set(year, values);
    }

    const aggregateData = Array.from(aggregateMap.entries()).map(([year, values]) => {
      const n = values.length || 1;
      const mean = values.reduce((s, v) => s + v, 0) / n;
      const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / n;
      const sd = Math.sqrt(variance);
      return {
        year,
        mean: Number(mean.toFixed(2)),
        upper: Number((mean + sd).toFixed(2)),
        lower: Number((mean - sd).toFixed(2)),
      };
    }).sort((a, b) => a.year - b.year);

    return { evolutionData: data, evolutionConfs: confs, aggregateEvolutionData: aggregateData };
  }, [initialData, selectedConferences]);

  const palette = [
    '#1f3b6f', '#1681c5', '#7d7d7d', '#10b981', '#8b5cf6',
    '#ef4444', '#f59e0b', '#22c55e', '#06b6d4', '#a855f7',
    '#64748b', '#84cc16', '#f97316', '#0ea5e9', '#e11d48',
    '#9333ea', '#c026d3', '#db2777', '#e11d48', '#f97316',
    '#0891b2', '#059669', '#dc2626', '#ea580c', '#ca8a04'
  ];

  const trendData = useMemo(() => {
    const byYear = new Map<number, { btValues: number[]; acValues: number[]; unmappedValues: number[] }>();
    filteredData.forEach(d => {
      const agg = byYear.get(d.year) || { btValues: [], acValues: [], unmappedValues: [] };
      agg.btValues.push(d.bigTech);
      agg.acValues.push(d.academia);
      agg.unmappedValues.push(d.unmapped || 0);
      byYear.set(d.year, agg);
    });
    return Array.from(byYear.entries())
      .map(([year, { btValues, acValues, unmappedValues }]) => {
        const btAvg = btValues.length > 0 ? btValues.reduce((s, v) => s + v, 0) / btValues.length : 0;
        const acAvg = acValues.length > 0 ? acValues.reduce((s, v) => s + v, 0) / acValues.length : 0;
        const unmappedAvg = unmappedValues.length > 0 ? unmappedValues.reduce((s, v) => s + v, 0) / unmappedValues.length : 0;
        const pBT = Number(btAvg.toFixed(2));
        const pAC = Number(acAvg.toFixed(2));
        const pUnmapped = Number(unmappedAvg.toFixed(2));
        return { year, 'Big Tech': pBT, 'Academia': pAC, 'Unmapped': pUnmapped };
      })
      .sort((a, b) => a.year - b.year);
  }, [filteredData]);

  const kpis = useMemo(() => {
    if (filteredData.length === 0) return null;
    const overall = filteredData.reduce((s, d) => s + d.bigTech, 0) / filteredData.length;
    const byConf = new Map<string, number>();
    filteredData.forEach(d => byConf.set(d.conference, (byConf.get(d.conference) ?? 0) + d.bigTech));
    const byCount = new Map<string, number>();
    filteredData.forEach(d => byCount.set(d.conference, (byCount.get(d.conference) ?? 0) + 1));
    const confAvg = Array.from(byConf.entries()).map(([c, sum]) => ({ c, avg: sum / (byCount.get(c) ?? 1) }));
    confAvg.sort((a, b) => b.avg - a.avg);
    const top = confAvg[0];
    const bottom = confAvg[confAvg.length - 1];
    const series = trendData;
    const latestPct = series.length > 0 ? series[series.length - 1]['Big Tech'] : 0;
    return {
      overall: Number(overall.toFixed(2)),
      topConf: top ? { name: top.c, pct: Number(top.avg.toFixed(2)) } : null,
      bottomConf: bottom ? { name: bottom.c, pct: Number(bottom.avg.toFixed(2)) } : null,
      latest: Number(latestPct.toFixed(2)),
    };
  }, [filteredData, trendData]);

  if (!filteredData.length) {
    return (
      <div className="space-y-6">
        <div className="text-sm text-muted-foreground">No data available for current filters.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Big Tech vs Academia</h1>
        <p className="text-muted-foreground mt-2">
          Comparison of contributions from major tech companies and academic institutions
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <FilterPanel
            conferences={conferences}
            years={years as number[]}
            selectedYear={selectedYear}
            onYearChange={handleYearChange}
            selectedConferences={selectedConferences}
            onConferencesChange={handleConferencesChange}
          />
          <div className="mt-4 space-y-2">
            <label className="text-sm font-medium">Order</label>
            <div className="flex gap-2">
              <button 
                className={`px-2.5 py-1 text-xs rounded-md border transition-all ${
                  sortOrder==='desc'
                    ? 'bg-gray-900 text-white border-gray-900 dark:bg-gray-700 dark:border-gray-700'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`} 
                onClick={() => handleSortOrderChange('desc')}
              >
                Big Tech ↓
              </button>
              <button 
                className={`px-2.5 py-1 text-xs rounded-md border transition-all ${
                  sortOrder==='asc'
                    ? 'bg-gray-900 text-white border-gray-900 dark:bg-gray-700 dark:border-gray-700'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`} 
                onClick={() => handleSortOrderChange('asc')}
              >
                Big Tech ↑
              </button>
            </div>
            <label className="text-sm font-medium">Show</label>
            <div className="flex gap-2">
              <button 
                className={`px-2.5 py-1 text-xs rounded-md border transition-all ${
                  topN==='all'
                    ? 'bg-gray-900 text-white border-gray-900 dark:bg-gray-700 dark:border-gray-700'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`} 
                onClick={() => handleTopNChange('all')}
              >
                All
              </button>
              <button 
                className={`px-2.5 py-1 text-xs rounded-md border transition-all ${
                  topN===5
                    ? 'bg-gray-900 text-white border-gray-900 dark:bg-gray-700 dark:border-gray-700'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`} 
                onClick={() => handleTopNChange(5)}
              >
                Top 5
              </button>
              <button 
                className={`px-2.5 py-1 text-xs rounded-md border transition-all ${
                  topN===10
                    ? 'bg-gray-900 text-white border-gray-900 dark:bg-gray-700 dark:border-gray-700'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`} 
                onClick={() => handleTopNChange(10)}
              >
                Top 10
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          {kpis && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Avg Big Tech %</CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold">{kpis.overall}%</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Top Conference</CardTitle></CardHeader>
                <CardContent><div className="text-sm">{kpis.topConf?.name}</div><div className="text-xl font-semibold">{kpis.topConf?.pct}%</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Latest Year Big Tech %</CardTitle></CardHeader>
                <CardContent><div className="text-xl font-semibold">{kpis.latest}%</div></CardContent>
              </Card>
            </div>
          )}
          <Card className="border-none shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold">Papers with Big Tech vs Academia Affiliation</CardTitle>
              <CardDescription>
                Percentage breakdown by conference (sorted, 100% stacked)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-[600px]">
                <Suspense fallback={<ChartSkeleton />}>
                  <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    role="img"
                    aria-label={`Big Tech vs Academia breakdown ${selectedConferences.length > 0 ? `for selected conferences` : selectedYear ? `for ${selectedYear}` : ''}`}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                    <XAxis
                      dataKey="conference"
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      angle={isSingleConferenceView ? 0 : -45}
                      textAnchor={isSingleConferenceView ? 'middle' : 'end'}
                      height={isSingleConferenceView ? 40 : 80}
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
                        padding: '12px',
                        pointerEvents: 'none'
                      }}
                      cursor={{ fill: 'rgba(0, 0, 0, 0.02)' }}
                      formatter={(value: any, name: any) => {
                        const num = Math.min(100, Math.max(0, Number(Number(value).toFixed(2))));
                        return [`${num}%`, name];
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ fontSize: '12px' }}
                      payload={[
                        { value: 'Big Tech', type: 'rect', color: '#c5c5c5' },
                        { value: 'Academia', type: 'rect', color: '#1f3b6f' },
                        { value: 'Unmapped', type: 'rect', color: 'transparent' },
                      ]}
                      content={({ payload }) => (
                        <ul className="flex flex-wrap justify-center gap-4">
                          {payload?.map((entry: any, index: number) => (
                            <li key={index} className="flex items-center gap-2">
                              {entry.value === 'Unmapped' ? (
                                <svg width="14" height="14" className="inline-block">
                                  <rect
                                    x="1"
                                    y="1"
                                    width="12"
                                    height="12"
                                    fill="transparent"
                                    stroke="#9ca3af"
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
                              <span>{entry.value}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    />
                    <Bar dataKey='Academia' stackId="a" fill="#1f3b6f" radius={[0, 0, 0, 0]} />
                    <Bar dataKey='Big Tech' stackId="a" fill="#c5c5c5" radius={[0, 0, 0, 0]} />
                    <Bar dataKey='Unmapped' stackId="a" fill="transparent" radius={[4, 4, 0, 0]} hide={true} />
                  </BarChart>
                </ResponsiveContainer>
                </Suspense>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="mt-6 border-none shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold">Big Tech by Region</CardTitle>
              <CardDescription>
                Breakdown of Big Tech contributions by geographic region (North America, Asia, Europe, Others)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-[600px]">
                <Suspense fallback={<ChartSkeleton />}>
                  <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartDataByRegion}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    role="img"
                    aria-label={`Big Tech by region breakdown ${selectedConferences.length > 0 ? `for selected conferences` : selectedYear ? `for ${selectedYear}` : ''}`}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                    <XAxis
                      dataKey="conference"
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      angle={isSingleConferenceView ? 0 : -45}
                      textAnchor={isSingleConferenceView ? 'middle' : 'end'}
                      height={isSingleConferenceView ? 40 : 80}
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
                        padding: '12px',
                        pointerEvents: 'none'
                      }}
                      cursor={{ fill: 'rgba(0, 0, 0, 0.02)' }}
                      formatter={(value: any, name: any) => {
                        const num = Math.min(100, Math.max(0, Number(Number(value).toFixed(2))));
                        return [`${num}%`, name];
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ fontSize: '12px' }}
                      payload={[
                        { value: 'Big Tech (NA)', type: 'rect', color: '#ef4444' },
                        { value: 'Big Tech (EU)', type: 'rect', color: '#60a5fa' },
                        { value: 'Big Tech (Others)', type: 'rect', color: '#a855f7' },
                        { value: 'Big Tech (Asia)', type: 'rect', color: '#eab308' },
                        { value: 'Academia', type: 'rect', color: '#1f3b6f' },
                        { value: 'Unmapped', type: 'rect', color: 'transparent' },
                      ]}
                      content={({ payload }) => (
                        <ul className="flex flex-wrap justify-center gap-4">
                          {payload?.map((entry: any, index: number) => (
                            <li key={index} className="flex items-center gap-2">
                              {entry.value === 'Unmapped' ? (
                                <svg width="14" height="14" className="inline-block">
                                  <rect
                                    x="1"
                                    y="1"
                                    width="12"
                                    height="12"
                                    fill="transparent"
                                    stroke="#9ca3af"
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
                              <span>{entry.value}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    />
                    <Bar dataKey='Academia' stackId="a" fill="#1f3b6f" radius={[0, 0, 0, 0]} />
                    <Bar dataKey='Big Tech (Asia)' stackId="a" fill="#eab308" radius={[0, 0, 0, 0]} />
                    <Bar dataKey='Big Tech (Others)' stackId="a" fill="#a855f7" radius={[0, 0, 0, 0]} />
                    <Bar dataKey='Big Tech (EU)' stackId="a" fill="#60a5fa" radius={[0, 0, 0, 0]} />
                    <Bar dataKey='Big Tech (NA)' stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} />
                    <Bar dataKey='Unmapped' stackId="a" fill="transparent" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                </Suspense>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="mt-6 border-none shadow-xl">
            <CardHeader>
              <CardTitle>Key Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm">• Bars show percentage split by conference, ordered by highest Big Tech percentage.</p>
              <p className="text-sm">• Big Tech is broken down by region: North America (red), Europe (light blue), Others (purple), Asia (yellow).</p>
              <p className="text-sm">• Use filters for year/conference to observe changes in the distribution.</p>
            </CardContent>
          </Card>

          <Card className="mt-6 border-none shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Big Tech vs Academia Over Time</CardTitle>
              <CardDescription>
                Percentage split per year {selectedConferences.length > 0 ? `for selected conferences` : '(all conferences)'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-[450px]">
                <Suspense fallback={<ChartSkeleton />}>
                  <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={trendData} 
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    role="img"
                    aria-label={`Big Tech vs Academia over time ${selectedConferences.length > 0 ? `for selected conferences` : ''}`}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                    <XAxis dataKey="year" tick={{ fill: '#6b7280', fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 12 }} label={{ value: 'Percentage', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6b7280' } }} tickFormatter={(v: number) => `${Math.min(100, Math.max(0, Number(Number(v).toFixed(0))))}%`} />
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.98)', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', padding: '12px', pointerEvents: 'none' }} formatter={(value: any, name: any) => [`${Math.min(100, Math.max(0, Number(Number(value).toFixed(2))))}%`, name]} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey='Academia' stackId="t" fill="#1f3b6f" radius={[0, 0, 0, 0]} />
                    <Bar dataKey='Big Tech' stackId="t" fill="#c5c5c5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                </Suspense>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="mt-6 border-none shadow-xl">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-xl font-semibold">Conference Evolution (Big Tech % over time)</CardTitle>
                  <CardDescription>
                    {selectedConferences.length > 0 
                      ? `Showing ${selectedConferences.length} selected conference${selectedConferences.length > 1 ? 's' : ''}`
                      : mode === 'aggregate' 
                        ? 'Showing mean ± SD across all conferences' 
                        : `Showing all ${evolutionConfs.length} conferences`}
                  </CardDescription>
                </div>
                {selectedConferences.length === 0 && evolutionConfs.length > 1 && (
                  <div className="flex p-0.5 rounded-lg border bg-white dark:bg-gray-800">
                    <button
                      className={`px-4 py-2 text-sm rounded-md font-medium transition-all ${
                        mode === 'aggregate' 
                          ? 'bg-gray-900 text-white shadow-md dark:bg-gray-700' 
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                      onClick={() => setMode('aggregate')}
                    >
                      Aggregate
                    </button>
                    <button
                      className={`px-4 py-2 text-sm rounded-md font-medium transition-all ${
                        mode === 'all' 
                          ? 'bg-gray-900 text-white shadow-md dark:bg-gray-700' 
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                      onClick={() => setMode('all')}
                    >
                      All Lines
                    </button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-[500px]">
                <Suspense fallback={<ChartSkeleton />}>
                  <ResponsiveContainer width="100%" height="100%">
                    {mode === 'all' || selectedConferences.length > 0 ? (
                    <LineChart 
                      data={evolutionData} 
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                      role="img"
                      aria-label={`Big Tech percentage evolution for ${evolutionConfs.length} conference${evolutionConfs.length > 1 ? 's' : ''}`}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                      <XAxis 
                        dataKey="year" 
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        label={{ value: 'Year', position: 'insideBottom', offset: -10, style: { textAnchor: 'middle', fill: '#6b7280' } }}
                      />
                      <YAxis 
                        domain={[0, 100]} 
                        tick={{ fill: '#6b7280', fontSize: 12 }} 
                        label={{ value: 'Big Tech (%)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6b7280' } }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.98)', 
                          border: '1px solid #e5e7eb', 
                          borderRadius: '8px', 
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', 
                          padding: '12px',
                          pointerEvents: 'none'
                        }} 
                        formatter={(value: any, name: any) => {
                          if (value === null || value === undefined) return ['N/A', name];
                          return [`${Number(value).toFixed(2)}%`, name];
                        }}
                      />
                      <Legend 
                        wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
                        formatter={(value) => <span style={{ fontSize: '11px' }}>{value}</span>}
                      />
                      <Brush dataKey="year" height={20} travellerWidth={8} />
                      {evolutionConfs.map((conf, idx) => (
                        <Line 
                          key={conf} 
                          type="monotone" 
                          dataKey={conf} 
                          stroke={palette[idx % palette.length]} 
                          strokeWidth={2} 
                          dot={{ fill: palette[idx % palette.length], r: 2 }} 
                          activeDot={{ r: 5 }}
                          connectNulls={false}
                        />
                      ))}
                    </LineChart>
                  ) : (
                    <ComposedChart 
                      data={aggregateEvolutionData} 
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                      role="img"
                      aria-label="Aggregate Big Tech percentage with mean and standard deviation"
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                      <XAxis 
                        dataKey="year" 
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        label={{ value: 'Year', position: 'insideBottom', offset: -10, style: { textAnchor: 'middle', fill: '#6b7280' } }}
                      />
                      <YAxis 
                        domain={[0, 100]} 
                        tick={{ fill: '#6b7280', fontSize: 12 }} 
                        label={{ value: 'Big Tech % (Mean ± SD)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6b7280' } }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.98)', 
                          border: '1px solid #e5e7eb', 
                          borderRadius: '8px', 
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', 
                          padding: '12px',
                          pointerEvents: 'none'
                        }} 
                        formatter={(value: any, name: any) => {
                          const num = Number(value).toFixed(2);
                          return [`${num}%`, name === 'mean' ? 'Mean' : name === 'upper' ? 'Mean + SD' : 'Mean - SD'];
                        }}
                      />
                      <Brush dataKey="year" height={20} travellerWidth={8} />
                      <Area 
                        type="monotone" 
                        dataKey="upper" 
                        stroke="transparent" 
                        fill="#1681c5" 
                        fillOpacity={0.15}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="lower" 
                        stroke="transparent" 
                        fill="#ffffff" 
                        fillOpacity={1}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="mean" 
                        stroke="#1f3b6f" 
                        strokeWidth={3} 
                        dot={{ r: 3 }} 
                        activeDot={{ r: 6 }}
                      />
                    </ComposedChart>
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

