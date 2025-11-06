"use client"

import { useMemo, memo, Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/charts/chart-container";
import type { DiversityData } from "@/lib/data/load-data";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
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
}

export const ClientDiversityPage = memo(function ClientDiversityPage({ initialData }: ClientDiversityPageProps) {
  const radarData = useMemo(() => {
    const validConferences = ['OSDI', 'ASPLOS', 'NSDI', 'SIGCOMM', 'EUROSYS', 'ATC', 'SOCC', 'IEEECLOUD', 'CCGRID', 'EUROPAR', 'ICDCS', 'MIDDLEWARE', 'IC2E'];
    return initialData
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
  }, [initialData]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Diversity Metrics</h1>
        <p className="text-muted-foreground mt-2">
          Gini-Simpson Index analysis across conferences
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-none shadow-xl">
          <CardHeader>
            <CardTitle>Diversity Index Comparison</CardTitle>
            <CardDescription>
              Gini-Simpson Index across different categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[450px]">
              <Suspense fallback={<ChartSkeleton />}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={initialData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
                    role="img"
                    aria-label="Diversity indices comparison between committees and papers"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                    <XAxis 
                      dataKey="conference" 
                      angle={-45} 
                      textAnchor="end" 
                      height={120}
                      interval={0}
                      tick={{ fill: '#6b7280', fontSize: 11 }}
                    />
                    <YAxis 
                      domain={[0, 1]}
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      label={{ value: 'Diversity Index', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6b7280' } }}
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
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                    <Bar dataKey="committee" fill="#1681c5" name="Committee Diversity" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="papers" fill="#7d7d7d" name="Papers Diversity" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Suspense>
            </ChartContainer>
          </CardContent>
          </Card>

          <Card className="border-none shadow-xl">
          <CardHeader>
            <CardTitle>Radar Chart</CardTitle>
            <CardDescription>
              Multi-dimensional diversity comparison
            </CardDescription>
          </CardHeader>
          <CardContent>
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
      </div>

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

