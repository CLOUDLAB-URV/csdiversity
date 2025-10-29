"use client"

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/charts/chart-container";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";

interface DiversityData {
  conference: string;
  citations: number;
  committee: number;
  papers: number;
}

const CONferences = ['OSDI', 'SOSP', 'ASPLOS', 'NSDI', 'SIGCOMM'];

export default function DiversityPage() {
  const mockData: DiversityData[] = useMemo(() => {
    return CONferences.map(conf => ({
      conference: conf,
      citations: 0.6 + Math.random() * 0.3,
      committee: 0.5 + Math.random() * 0.4,
      papers: 0.65 + Math.random() * 0.25,
    })).map(d => ({
      conference: d.conference,
      citations: Number(d.citations.toFixed(3)),
      committee: Number(d.committee.toFixed(3)),
      papers: Number(d.papers.toFixed(3)),
    }));
  }, []);

  const radarData = useMemo(() => {
    return CONferences.map(conf => {
      const data = mockData.find(d => d.conference === conf)!;
      return {
        conference: conf,
        Citations: data.citations,
        Committee: data.committee,
        Papers: data.papers,
      };
    });
  }, [mockData]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Diversity Metrics</h1>
        <p className="text-muted-foreground mt-2">
          Gini-Simpson Index analysis across conferences
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Diversity Index Comparison</CardTitle>
            <CardDescription>
              Gini-Simpson Index across different categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={mockData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="conference" />
                  <YAxis domain={[0, 1]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="citations" fill="#1f3b6f" name="Citations Diversity" />
                  <Bar dataKey="committee" fill="#1681c5" name="Committee Diversity" />
                  <Bar dataKey="papers" fill="#7d7d7d" name="Papers Diversity" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Radar Chart</CardTitle>
            <CardDescription>
              Multi-dimensional diversity comparison
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData[0]}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="conference" />
                  <PolarRadiusAxis angle={90} domain={[0, 1]} />
                  <Radar name="Citations" dataKey="Citations" stroke="#1f3b6f" fill="#1f3b6f" fillOpacity={0.6} />
                  <Radar name="Committee" dataKey="Committee" stroke="#1681c5" fill="#1681c5" fillOpacity={0.6} />
                  <Radar name="Papers" dataKey="Papers" stroke="#7d7d7d" fill="#7d7d7d" fillOpacity={0.6} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>About Gini-Simpson Index</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            The Gini-Simpson Index measures diversity and ranges from 0 to 1. A value closer to 1 indicates 
            greater diversity (more evenly distributed) while a value closer to 0 indicates less diversity 
            (more concentrated). This metric helps assess the geographical and institutional distribution 
            of contributions across conferences.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}


