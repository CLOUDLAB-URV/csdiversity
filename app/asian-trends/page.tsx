"use client"

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FilterPanel } from "@/components/filters/filter-panel";
import { fetchDataset, processAsianTrends, type AsianTrendItem } from "@/lib/data/load-data";
import { ChartContainer } from "@/components/charts/chart-container";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush, BarChart, Bar, ComposedChart, Area } from "recharts";

export default function AsianTrendsPage() {
  const [selectedConference, setSelectedConference] = useState<string>("all");
  const [allData, setAllData] = useState<AsianTrendItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const raw = await fetchDataset('papers');
        const processed = processAsianTrends(raw);
        if (active) setAllData(processed);
      } catch (e: any) {
        if (active) setError(e?.message ?? 'Failed to load data');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false };
  }, []);
  
  const conferences = useMemo(() => Array.from(new Set(allData.map(d => d.conference))).sort(), [allData]);
  const [conferenceQuery, setConferenceQuery] = useState<string>("");
  const [topN, setTopN] = useState<number | 'all'>('all');
  const [mode, setMode] = useState<'all' | 'aggregate'>('aggregate');
  const [selectedConferences, setSelectedConferences] = useState<string[]>([]);

  const displayedConferences = useMemo(() => {
    if (selectedConferences.length > 0) {
      return selectedConferences;
    }
    const byAvg = new Map<string, number>();
    for (const conf of conferences) {
      const rows = allData.filter(d => d.conference === conf);
      const avg = rows.length ? rows.reduce((s, r) => s + r.percentage, 0) / rows.length : 0;
      byAvg.set(conf, avg);
    }
    let list = conferences.filter(c => c.toLowerCase().includes(conferenceQuery.toLowerCase()));
    list.sort((a, b) => (byAvg.get(b)! - byAvg.get(a)!));
    if (topN !== 'all') list = list.slice(0, topN);
    return list;
  }, [conferences, allData, conferenceQuery, topN, selectedConferences]);
  const years = useMemo(() => Array.from(new Set(allData.map(d => d.year))).sort((a, b) => a - b), [allData]);

  const effectiveConferences = useMemo(() => {
    if (selectedConferences.length > 0) return selectedConferences;
    return (displayedConferences.length ? displayedConferences : conferences);
  }, [selectedConferences, displayedConferences, conferences]);

  const filteredData = useMemo(() => {
    return allData;
  }, [allData]);
  
  // Group by year, ensure all known conferences exist per year (fill 0 if missing)
  const chartData = useMemo(() => {
    const allConfs = effectiveConferences;
    const grouped = new Map<number, any>();
    filteredData.forEach(d => {
      if (!grouped.has(d.year)) {
        const base: any = { year: d.year };
        allConfs.forEach(c => { base[c] = 0; });
        grouped.set(d.year, base);
      }
      grouped.get(d.year)![d.conference] = d.percentage;
    });
    return Array.from(grouped.values()).sort((a, b) => a.year - b.year);
  }, [filteredData, effectiveConferences]);

  const aggregateTrendData = useMemo(() => {
    // Mean and SD across selected/displayed conferences per year
    const confs = displayedConferences.length ? displayedConferences : conferences;
    const byYear = new Map<number, number[]>();
    filteredData.forEach(d => {
      const arr = byYear.get(d.year) || [];
      arr.push(d.percentage);
      byYear.set(d.year, arr);
    });
    return Array.from(byYear.entries())
      .map(([year, arr]) => {
        const n = arr.length || 1;
        const mean = arr.reduce((s, v) => s + v, 0) / n;
        const variance = arr.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / n;
        const sd = Math.sqrt(variance);
        return { year, mean: Number(mean.toFixed(2)), upper: Number((mean + sd).toFixed(2)), lower: Number((mean - sd).toFixed(2)) };
      })
      .sort((a, b) => a.year - b.year);
  }, [filteredData, displayedConferences, conferences]);

  const numSeries = useMemo(() => effectiveConferences.length, [effectiveConferences]);

  const palette = [
    '#1f3b6f', '#1681c5', '#7d7d7d', '#10b981', '#8b5cf6',
    '#ef4444', '#f59e0b', '#22c55e', '#06b6d4', '#a855f7',
    '#64748b', '#84cc16', '#f97316', '#0ea5e9', '#e11d48'
  ];

  const aggregateData = useMemo(() => {
    const list = (displayedConferences.length ? displayedConferences : conferences);
    return list.map(conf => {
      const rows = allData.filter(d => d.conference === conf);
      const n = rows.length || 1;
      const mean = rows.reduce((s, r) => s + r.percentage, 0) / n;
      const variance = rows.reduce((s, r) => s + Math.pow(r.percentage - mean, 2), 0) / n;
      const sd = Math.sqrt(variance);
      return {
        conference: conf,
        mean: Number(mean.toFixed(2)),
        sd: Number(sd.toFixed(2)),
      };
    }).sort((a, b) => b.mean - a.mean);
  }, [allData, conferences, displayedConferences]);

  return (
    <div className="space-y-6">
      {loading && (
        <div className="text-sm text-muted-foreground">Loading data…</div>
      )}
      {error && (
        <div className="text-sm text-red-600">{error}</div>
      )}
      {!loading && !error && filteredData.length === 0 && (
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
                    Aggregate by default (mean ± sd). Switch to All lines to comparar conferencias.
                  </CardDescription>
                </div>
                {numSeries > 1 && (
                  <div className="hidden md:flex p-0.5 rounded-lg border bg-white">
                    <button
                      className={`px-3 py-1.5 text-sm rounded-md ${mode === 'aggregate' ? 'bg-gray-900 text-white' : 'text-gray-700'}`}
                      onClick={() => setMode('aggregate')}
                    >Aggregate</button>
                    <button
                      className={`px-3 py-1.5 text-sm rounded-md ${mode === 'all' ? 'bg-gray-900 text-white' : 'text-gray-700'}`}
                      onClick={() => setMode('all')}
                    >All lines</button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3 mb-4">
                <input
                  type="text"
                  value={conferenceQuery}
                  onChange={(e) => setConferenceQuery(e.target.value)}
                  placeholder="Filter conferences by name"
                  className="w-full md:w-1/2 border rounded-md px-3 py-2 text-sm"
                />
                <div className="flex flex-wrap gap-2 items-center">
                  <div className="flex gap-2">
                    <button className="px-2.5 py-1 text-xs rounded-md border" onClick={() => setTopN('all')} disabled={selectedConferences.length>0}>All</button>
                    <button className="px-2.5 py-1 text-xs rounded-md border" onClick={() => setTopN(3)} disabled={selectedConferences.length>0}>Top 3</button>
                    <button className="px-2.5 py-1 text-xs rounded-md border" onClick={() => setTopN(5)} disabled={selectedConferences.length>0}>Top 5</button>
                  </div>
                  {numSeries > 1 && (
                    <div className="flex gap-2 ml-auto md:hidden">
                      <button className={`px-3 py-1.5 text-sm rounded-md ${mode==='aggregate'?'bg-gray-900 text-white':'border'}`} onClick={() => setMode('aggregate')}>Aggregate</button>
                      <button className={`px-3 py-1.5 text-sm rounded-md ${mode==='all'?'bg-gray-900 text-white':'border'}`} onClick={() => setMode('all')}>All lines</button>
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
                            if (next.length===0) setMode('aggregate');
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
                    onClick={() => { setConferenceQuery(''); setTopN('all'); setSelectedConferences([]); setMode('aggregate'); }}
                  >Reset view</button>
                </div>
                
              </div>
              <ChartContainer config={{}} className="h-[600px]">
                <ResponsiveContainer width="100%" height="100%">
                  {(numSeries === 1 ? 'all' : mode) === 'all' ? (
                    <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                      <XAxis dataKey="year" tick={{ fill: '#6b7280', fontSize: 12 }} />
                      <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6b7280' } }} />
                      <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.98)', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', padding: '12px' }} />
                      <Legend iconType="line" wrapperStyle={{ fontSize: '12px' }} />
                      <Brush dataKey="year" height={20} travellerWidth={8} />
                      {effectiveConferences.map((conf, idx) => (
                        <Line key={conf} type="monotone" dataKey={conf} stroke={palette[idx % palette.length]} strokeWidth={3} dot={{ fill: palette[idx % palette.length], r: 3 }} activeDot={{ r: 6 }} />
                      ))}
                    </LineChart>
                  ) : (
                    <ComposedChart data={aggregateTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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

