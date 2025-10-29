"use client"

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FilterPanel } from "@/components/filters/filter-panel";
import { ChartContainer } from "@/components/charts/chart-container";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const CONferences = ['OSDI', 'SOSP', 'ASPLOS', 'NSDI', 'SIGCOMM'];

import { fetchDataset, processCitations, type CitationAggItem } from "@/lib/data/load-data";

export default function CitationsPage() {
  const [selectedConference, setSelectedConference] = useState<string>("all");
  const [data, setData] = useState<CitationAggItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const raw = await fetchDataset('citations');
        const processed = processCitations(raw);
        if (active) setData(processed);
      } catch (e: any) {
        if (active) setError(e?.message ?? 'Failed to load data');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false };
  }, []);

  const conferences = useMemo(() => Array.from(new Set(data.map(d => d.conference))).sort(), [data]);
  const years = useMemo(() => Array.from(new Set(data.map(d => d.year))).sort((a, b) => a - b), [data]);

  const chartData = useMemo(() => {
    let arr = data;
    if (selectedConference !== "all") {
      arr = arr.filter(d => d.conference === selectedConference);
    }
    if (selectedYear) {
      arr = arr.filter(d => d.year === selectedYear);
    }
    return arr;
  }, [data, selectedConference, selectedYear]);

  return (
    <div className="space-y-6">
      {loading && (
        <div className="text-sm text-muted-foreground">Loading data…</div>
      )}
      {error && (
        <div className="text-sm text-red-600">{error}</div>
      )}
      {!loading && !error && chartData.length === 0 && (
        <div className="text-sm text-muted-foreground">No data available for current filters.</div>
      )}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Citations Analysis</h1>
        <p className="text-muted-foreground mt-2">
          Comparison between accepted papers and cited papers with continental distribution
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
          <Card>
            <CardHeader>
              <CardTitle>Accepted vs Cited Papers</CardTitle>
              <CardDescription>
                Comparison of paper acceptance and citation rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-[500px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="conference" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="accepted" fill="#1f3b6f" name="Accepted Papers" />
                    <Bar dataKey="cited" fill="#1681c5" name="Cited Papers" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Data Quality Notice</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start space-x-2">
                <div className="w-4 h-4 bg-gray-300 rounded-sm mt-0.5"></div>
                <div>
                  <p className="text-sm font-medium">Unknown Data</p>
                  <p className="text-sm text-muted-foreground">
                    Some papers lack complete geographical information. The "Unknown" category represents papers with missing continental data.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


