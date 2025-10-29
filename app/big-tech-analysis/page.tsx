"use client"

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FilterPanel } from "@/components/filters/filter-panel";
import { fetchDataset, processBigTech, type BigTechItem } from "@/lib/data/load-data";
import { ChartContainer } from "@/components/charts/chart-container";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, Brush } from "recharts";

export default function BigTechAnalysisPage() {
  const [selectedConference, setSelectedConference] = useState<string>("all");
  const [allData, setAllData] = useState<BigTechItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);
  const [topN, setTopN] = useState<number | 'all'>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const raw = await fetchDataset('bigtech');
        const processed = processBigTech(raw);
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
  const years = useMemo(() => Array.from(new Set(allData.map(d => d.year))).sort((a, b) => a - b), [allData]);
  
  const filteredData = useMemo(() => {
    let arr = allData;
    if (selectedConference !== "all") {
      arr = arr.filter(d => d.conference === selectedConference);
    }
    if (selectedYear) {
      arr = arr.filter(d => d.year === selectedYear);
    }
    return arr;
  }, [allData, selectedConference, selectedYear]);
  
  // Group by conference, compute percentage split (Big Tech vs Academia)
  const chartData = useMemo(() => {
    const grouped = new Map<string, { conference: string; bt: number; ac: number }>();
    filteredData.forEach(d => {
      const key = d.conference;
      const item = grouped.get(key) || { conference: key, bt: 0, ac: 0 };
      item.bt += d.bigTech;
      item.ac += d.academia;
      grouped.set(key, item);
    });
    let rows = Array.from(grouped.values()).map(({ conference, bt, ac }) => {
      const total = bt + ac || 1;
      const pBT = Number(((bt / total) * 100).toFixed(2));
      let pAC = Number(((ac / total) * 100).toFixed(2));
      // normalize last segment to exactly 100
      pAC = Number((100 - pBT).toFixed(2));
      if (pAC < 0) pAC = 0; if (pAC > 100) pAC = 100;
      return { conference, 'Big Tech': pBT, 'Academia': pAC };
    });
    rows.sort((a, b) => sortOrder === 'desc' ? (b['Big Tech'] - a['Big Tech']) : (a['Big Tech'] - b['Big Tech']));
    if (topN !== 'all') rows = rows.slice(0, topN);
    return rows;
  }, [filteredData, sortOrder, topN]);

  // Evolution per conference across years (lines)
  const { evolutionData, evolutionConfs } = useMemo(() => {
    // Determine which conferences to show: if a single is selected, just that; otherwise top 5 by avg Big Tech
    let confs: string[] = [];
    if (selectedConference !== 'all') {
      confs = [selectedConference];
    } else {
      const avgByConf = new Map<string, number>();
      for (const d of allData) {
        const sum = (avgByConf.get(d.conference) ?? 0) + d.bigTech;
        avgByConf.set(d.conference, sum);
      }
      const counts = new Map<string, number>();
      for (const d of allData) counts.set(d.conference, (counts.get(d.conference) ?? 0) + 1);
      const avgs: { conf: string; avg: number }[] = Array.from(avgByConf.entries()).map(([conf, sum]) => ({ conf, avg: sum / (counts.get(conf) ?? 1) }));
      avgs.sort((a, b) => b.avg - a.avg);
      confs = avgs.slice(0, 5).map(x => x.conf);
    }

    const byYear = new Map<number, any>();
    for (const d of allData) {
      if (!confs.includes(d.conference)) continue;
      const row = byYear.get(d.year) || { year: d.year };
      row[d.conference] = d.bigTech; // use Big Tech percentage
      byYear.set(d.year, row);
    }
    const data = Array.from(byYear.values()).sort((a, b) => a.year - b.year);
    return { evolutionData: data, evolutionConfs: confs };
  }, [allData, selectedConference]);

  const palette = [
    '#1f3b6f', '#1681c5', '#7d7d7d', '#10b981', '#8b5cf6',
    '#ef4444', '#f59e0b', '#22c55e', '#06b6d4', '#a855f7',
    '#64748b', '#84cc16', '#f97316', '#0ea5e9', '#e11d48'
  ];

  // Trend over years: percentage split per year (aggregated over selectedConference or all)
  const trendData = useMemo(() => {
    const byYear = new Map<number, { bt: number; ac: number }>();
    filteredData.forEach(d => {
      const agg = byYear.get(d.year) || { bt: 0, ac: 0 };
      agg.bt += d.bigTech;
      agg.ac += d.academia;
      byYear.set(d.year, agg);
    });
    return Array.from(byYear.entries())
      .map(([year, { bt, ac }]) => {
        const total = bt + ac || 1;
        const pBT = Number(((bt / total) * 100).toFixed(2));
        let pAC = Number(((ac / total) * 100).toFixed(2));
        pAC = Number((100 - pBT).toFixed(2));
        if (pAC < 0) pAC = 0; if (pAC > 100) pAC = 100;
        return { year, 'Big Tech': pBT, 'Academia': pAC };
      })
      .sort((a, b) => a.year - b.year);
  }, [filteredData]);

  // KPIs
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
            selectedConference={selectedConference}
            selectedYear={selectedYear}
            onConferenceChange={setSelectedConference}
            onYearChange={setSelectedYear}
          />
          <div className="mt-4 space-y-2">
            <label className="text-sm font-medium">Order</label>
            <div className="flex gap-2">
              <button className={`px-2.5 py-1 text-xs rounded-md border ${sortOrder==='desc'?'bg-gray-900 text-white border-gray-900':''}`} onClick={() => setSortOrder('desc')}>Big Tech ↓</button>
              <button className={`px-2.5 py-1 text-xs rounded-md border ${sortOrder==='asc'?'bg-gray-900 text-white border-gray-900':''}`} onClick={() => setSortOrder('asc')}>Big Tech ↑</button>
            </div>
            <label className="text-sm font-medium">Show</label>
            <div className="flex gap-2">
              <button className={`px-2.5 py-1 text-xs rounded-md border ${topN==='all'?'bg-gray-900 text-white border-gray-900':''}`} onClick={() => setTopN('all')}>All</button>
              <button className={`px-2.5 py-1 text-xs rounded-md border ${topN===5?'bg-gray-900 text-white border-gray-900':''}`} onClick={() => setTopN(5)}>Top 5</button>
              <button className={`px-2.5 py-1 text-xs rounded-md border ${topN===10?'bg-gray-900 text-white border-gray-900':''}`} onClick={() => setTopN(10)}>Top 10</button>
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
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                    <XAxis dataKey="conference" tick={{ fill: '#6b7280', fontSize: 12 }} />
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
                      wrapperStyle={{ fontSize: '12px' }}
                    />
                    <Bar dataKey='Academia' stackId="a" fill="#1f3b6f" radius={[0, 0, 0, 0]} />
                    <Bar dataKey='Big Tech' stackId="a" fill="#c5c5c5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Key Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm">• Bars show percentage split por conferencia; ordenadas por mayor % Big Tech.</p>
              <p className="text-sm">• Use filtros para año/conferencia y observar cambios en el reparto.</p>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Big Tech vs Academia Over Time</CardTitle>
              <CardDescription>
                Percentage split per year {selectedConference !== 'all' ? `for ${selectedConference}` : '(all conferences)'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-[450px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                    <XAxis dataKey="year" tick={{ fill: '#6b7280', fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 12 }} label={{ value: 'Percentage', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6b7280' } }} tickFormatter={(v: number) => `${Math.min(100, Math.max(0, Number(Number(v).toFixed(0))))}%`} />
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.98)', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', padding: '12px' }} formatter={(value: any, name: any) => [`${Math.min(100, Math.max(0, Number(Number(value).toFixed(2))))}%`, name]} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey='Academia' stackId="t" fill="#1f3b6f" radius={[0, 0, 0, 0]} />
                    <Bar dataKey='Big Tech' stackId="t" fill="#c5c5c5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Conference Evolution (Big Tech % over time)</CardTitle>
              <CardDescription>
                {selectedConference !== 'all' ? `Trend for ${selectedConference}` : `Top ${evolutionConfs.length} conferences by average Big Tech %`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-[500px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={evolutionData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                    <XAxis dataKey="year" tick={{ fill: '#6b7280', fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 12 }} label={{ value: 'Big Tech (%)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6b7280' } }} />
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.98)', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', padding: '12px' }} formatter={(value: any) => `${Number(value).toFixed(2)}%`} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Brush dataKey="year" height={20} travellerWidth={8} />
                    {evolutionConfs.map((conf, idx) => (
                      <Line key={conf} type="monotone" dataKey={conf} stroke={palette[idx % palette.length]} strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

