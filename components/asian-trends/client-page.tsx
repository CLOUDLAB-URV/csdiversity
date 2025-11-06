"use client"

import { useMemo, useState, useCallback, Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FilterPanel } from "@/components/filters/filter-panel";
import type { AsianTrendItem } from "@/lib/data/load-data";
import { ChartContainer } from "@/components/charts/chart-container";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush, BarChart, Bar, ComposedChart, Area } from "recharts";
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

interface ClientAsianTrendsPageProps {
  initialData: AsianTrendItem[];
}

export function ClientAsianTrendsPage({ initialData }: ClientAsianTrendsPageProps) {
  const [conferenceQuery, setConferenceQuery] = useState("");
  const [topN, setTopN] = useState<number | 'all'>('all');
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

  const confAverages = useMemo(() => {
    const avg = new Map<string, number>();
    for (const conf of conferences) {
      const items = initialData.filter(d => d.conference === conf);
      const sum = items.reduce((s, r) => s + r.percentage, 0);
      avg.set(conf, items.length ? sum / items.length : 0);
    }
    return avg;
  }, [conferences, initialData]);
  
  const displayedConferences = useMemo(() => {
    if (selectedConferences.length > 0) return selectedConferences;
    
    let list = conferences;
    if (conferenceQuery.trim()) {
      const q = conferenceQuery.toLowerCase();
      list = conferences.filter(c => c.toLowerCase().includes(q));
    }
    
    list.sort((a, b) => (confAverages.get(b) ?? 0) - (confAverages.get(a) ?? 0));
    return topN !== 'all' ? list.slice(0, topN) : list;
  }, [conferences, conferenceQuery, topN, selectedConferences, confAverages]);
  
  const handleConferencesChange = useCallback((list: string[]) => {
    setSelectedConferences(list);
    setMode(list.length > 0 ? 'all' : 'aggregate');
  }, []);
  
  const handleQueryChange = useCallback((value: string) => {
    setConferenceQuery(value);
  }, []);
  
  const handleTopNChange = useCallback((value: number | 'all') => {
    setTopN(value);
  }, []);
  
  const handleModeChange = useCallback((newMode: 'all' | 'aggregate') => {
    setMode(newMode);
  }, []);

  const activeConferences = useMemo(() => {
    if (selectedConferences.length > 0) return selectedConferences;
    return displayedConferences.length ? displayedConferences : conferences;
  }, [selectedConferences, displayedConferences, conferences]);

  const chartData = useMemo(() => {
    const grouped = new Map<number, Record<string, number>>();
    
    for (const item of initialData) {
      if (!activeConferences.includes(item.conference)) continue;
      
      if (!grouped.has(item.year)) {
        const base: Record<string, number> = { year: item.year };
        for (const conf of activeConferences) base[conf] = 0;
        grouped.set(item.year, base);
      }
      
      const yearData = grouped.get(item.year)!;
      yearData[item.conference] = item.percentage;
    }
    
    return Array.from(grouped.values()).sort((a, b) => a.year - b.year);
  }, [initialData, activeConferences]);

  const aggregateTrendData = useMemo(() => {
    const confs = displayedConferences.length ? displayedConferences : conferences;
    const byYear = new Map<number, number[]>();
    
    for (const item of initialData) {
      if (!confs.includes(item.conference)) continue;
      const arr = byYear.get(item.year) || [];
      arr.push(item.percentage);
      byYear.set(item.year, arr);
    }
    
    return Array.from(byYear.entries()).map(([year, values]) => {
      const n = values.length || 1;
      const mean = values.reduce((s, v) => s + v, 0) / n;
      const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / n;
      const sd = Math.sqrt(variance);
      return {
        year,
        mean: Number(mean.toFixed(2)),
        upper: Number((mean + sd).toFixed(2)),
        lower: Number((mean - sd).toFixed(2))
      };
    }).sort((a, b) => a.year - b.year);
  }, [initialData, displayedConferences, conferences]);

  const numSeries = activeConferences.length;

  const palette = [
    '#1f3b6f', '#1681c5', '#7d7d7d', '#10b981', '#8b5cf6',
    '#ef4444', '#f59e0b', '#22c55e', '#06b6d4', '#a855f7',
    '#64748b', '#84cc16', '#f97316', '#0ea5e9', '#e11d48'
  ];

  const aggregateData = useMemo(() => {
    const list = displayedConferences.length ? displayedConferences : conferences;
    return list.map(conf => {
      const items = initialData.filter(d => d.conference === conf);
      const n = items.length || 1;
      const mean = items.reduce((s, r) => s + r.percentage, 0) / n;
      const variance = items.reduce((s, r) => s + Math.pow(r.percentage - mean, 2), 0) / n;
      const sd = Math.sqrt(variance);
      return {
        conference: conf,
        mean: Number(mean.toFixed(2)),
        sd: Number(sd.toFixed(2)),
      };
    }).sort((a, b) => b.mean - a.mean);
  }, [initialData, conferences, displayedConferences]);

  return (
    <div className="space-y-6">
      {activeConferences.length === 0 && (
        <div className="text-sm text-muted-foreground">No data available for current filters.</div>
      )}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Asian Trends</h1>
        <p className="text-muted-foreground mt-2">
          Evolution of Asian academic contribution over time across different conferences
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <FilterPanel
            conferences={conferences}
            years={[]}
            selectedConferences={selectedConferences}
            onConferencesChange={(list) => {
              setSelectedConferences(list);
              setMode(list.length > 0 ? 'all' : 'aggregate');
            }}
            onYearChange={() => {}}
          />
        </div>

        <div className="lg:col-span-3">
          <Card className="border-none shadow-xl">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-xl font-semibold">Asian Papers Percentage Over Time</CardTitle>
                  <CardDescription>
                    Aggregate by default (mean ± sd). Switch to All lines to compare conferences.
                  </CardDescription>
                </div>
                {numSeries > 1 && (
                  <div className="hidden md:flex p-0.5 rounded-lg border bg-white">
                    <button
                      className={`px-3 py-1.5 text-sm rounded-md transition-all ${
                        mode === 'aggregate' 
                          ? 'bg-gray-900 text-white shadow-md dark:bg-gray-700' 
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                      onClick={() => handleModeChange('aggregate')}
                    >
                      Aggregate
                    </button>
                    <button
                      className={`px-3 py-1.5 text-sm rounded-md transition-all ${
                        mode === 'all' 
                          ? 'bg-gray-900 text-white shadow-md dark:bg-gray-700' 
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                      onClick={() => handleModeChange('all')}
                    >
                      All lines
                    </button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3 mb-4">
                <input
                  type="text"
                  value={conferenceQuery}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  placeholder="Filter conferences by name"
                  className="w-full md:w-1/2 border rounded-md px-3 py-2 text-sm"
                />
                <div className="flex flex-wrap gap-2 items-center">
                  <div className="flex gap-2">
                    <button 
                      className={`px-2.5 py-1 text-xs rounded-md border transition-all ${
                        topN==='all'
                          ? 'bg-gray-900 text-white border-gray-900 dark:bg-gray-700 dark:border-gray-700'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                      } ${selectedConferences.length>0 ? 'opacity-50 cursor-not-allowed' : ''}`} 
                      onClick={() => handleTopNChange('all')} 
                      disabled={selectedConferences.length>0}
                    >
                      All
                    </button>
                    <button 
                      className={`px-2.5 py-1 text-xs rounded-md border transition-all ${
                        topN===3
                          ? 'bg-gray-900 text-white border-gray-900 dark:bg-gray-700 dark:border-gray-700'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                      } ${selectedConferences.length>0 ? 'opacity-50 cursor-not-allowed' : ''}`} 
                      onClick={() => handleTopNChange(3)} 
                      disabled={selectedConferences.length>0}
                    >
                      Top 3
                    </button>
                    <button 
                      className={`px-2.5 py-1 text-xs rounded-md border transition-all ${
                        topN===5
                          ? 'bg-gray-900 text-white border-gray-900 dark:bg-gray-700 dark:border-gray-700'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                      } ${selectedConferences.length>0 ? 'opacity-50 cursor-not-allowed' : ''}`} 
                      onClick={() => handleTopNChange(5)} 
                      disabled={selectedConferences.length>0}
                    >
                      Top 5
                    </button>
                  </div>
                  {numSeries > 1 && (
                    <div className="flex gap-2 ml-auto md:hidden">
                      <button 
                        className={`px-3 py-1.5 text-sm rounded-md transition-all ${
                          mode==='aggregate'
                            ? 'bg-gray-900 text-white shadow-md dark:bg-gray-700'
                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`} 
                        onClick={() => handleModeChange('aggregate')}
                      >
                        Aggregate
                      </button>
                      <button 
                        className={`px-3 py-1.5 text-sm rounded-md transition-all ${
                          mode==='all'
                            ? 'bg-gray-900 text-white shadow-md dark:bg-gray-700'
                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`} 
                        onClick={() => handleModeChange('all')}
                      >
                        All lines
                      </button>
                    </div>
                  )}
                </div>

                {selectedConferences.length>0 && (
                  <div className="flex flex-wrap gap-2 items-center">
                    {selectedConferences.map(conf => (
                      <span key={conf} className="inline-flex items-center gap-2 px-2 py-1 rounded-full border text-xs">
                        {conf}
                        <button
                          aria-label={`Remove ${conf}`}
                          className="rounded-full w-4 h-4 flex items-center justify-center border"
                          onClick={() => {
                            const next = selectedConferences.filter(c=>c!==conf);
                            setSelectedConferences(next);
                            if (next.length===0) handleModeChange('aggregate');
                          }}
                        >×</button>
                      </span>
                    ))}
                    <button className="text-xs underline ml-2" onClick={() => { setSelectedConferences([]); setMode('aggregate'); }}>Reset selection</button>
                  </div>
                )}

                <div>
                  <button
                    className="mt-1 text-xs underline"
                    onClick={() => { 
                      handleQueryChange(''); 
                      handleTopNChange('all'); 
                      setSelectedConferences([]); 
                      handleModeChange('aggregate'); 
                    }}
                  >Reset view</button>
                </div>
                
              </div>
              <ChartContainer config={{}} className="h-[600px]">
                <Suspense fallback={<ChartSkeleton />}>
                  <ResponsiveContainer width="100%" height="100%">
                  {(numSeries === 1 ? 'all' : mode) === 'all' ? (
                    <LineChart 
                      data={chartData} 
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      role="img"
                      aria-label={`Asian trends over time for ${activeConferences.length} conference${activeConferences.length > 1 ? 's' : ''}`}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                      <XAxis dataKey="year" tick={{ fill: '#6b7280', fontSize: 12 }} />
                      <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6b7280' } }} />
                      <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.98)', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', padding: '12px' }} />
                      <Legend iconType="line" wrapperStyle={{ fontSize: '12px' }} />
                      <Brush dataKey="year" height={20} travellerWidth={8} />
                      {activeConferences.map((conf, idx) => (
                        <Line key={conf} type="monotone" dataKey={conf} stroke={palette[idx % palette.length]} strokeWidth={3} dot={{ fill: palette[idx % palette.length], r: 3 }} activeDot={{ r: 6 }} />
                      ))}
                    </LineChart>
                  ) : (
                    <ComposedChart 
                      data={aggregateTrendData} 
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      role="img"
                      aria-label="Aggregate Asian trends with mean and standard deviation"
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                      <XAxis dataKey="year" tick={{ fill: '#6b7280', fontSize: 12 }} />
                      <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} label={{ value: 'Mean ± SD (%)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6b7280' } }} />
                      <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.98)', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', padding: '12px' }} />
                      <Brush dataKey="year" height={20} travellerWidth={8} />
                      <Area type="monotone" dataKey="upper" stroke="transparent" fill="#1681c5" fillOpacity={0.12} />
                      <Area type="monotone" dataKey="lower" stroke="transparent" fill="#ffffff" fillOpacity={1} />
                      <Line type="monotone" dataKey="mean" stroke="#1f3b6f" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                    </ComposedChart>
                  )}
                </ResponsiveContainer>
                </Suspense>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl mt-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold">Conferences Summary (Mean ± Variability)</CardTitle>
              <CardDescription>
                Average Asian percentage per conference across all years; tooltip shows standard deviation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-[500px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={aggregateData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                    role="img"
                    aria-label="Average Asian percentage per conference"
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
                      label={{ value: 'Mean Percentage (%)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6b7280' } }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.98)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        padding: '12px'
                      }}
                      formatter={(value: any, name: any, props: any) => {
                        if (name === 'mean') {
                          const sd = props?.payload?.sd ?? 0;
                          return [`${Number(value).toFixed(2)}% (σ=${Number(sd).toFixed(2)})`, 'Mean'];
                        }
                        return [value, name];
                      }}
                    />
                    <Bar dataKey="mean" fill="#1681c5" radius={[4, 4, 0, 0]} />
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
