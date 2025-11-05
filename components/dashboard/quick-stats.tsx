import { memo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Calendar, Globe } from "lucide-react";

interface QuickStatsProps {
  totalPapers: number;
  yearRange: { min: number; max: number } | null;
  numConfs: number;
}

export const QuickStats = memo(function QuickStats({ totalPapers, yearRange, numConfs }: QuickStatsProps) {

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <Card className="border-none shadow-md bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-transparent rounded-full blur-2xl"></div>
        <CardHeader className="relative">
          <div className="flex items-center justify-between mb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Papers</CardTitle>
            <div className="rounded-lg bg-blue-100 dark:bg-blue-900/30 p-2">
              <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative">
          <div className="text-3xl font-bold">{totalPapers.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Across all conferences
          </p>
        </CardContent>
      </Card>

      <Card className="border-none shadow-md bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-400/20 to-transparent rounded-full blur-2xl"></div>
        <CardHeader className="relative">
          <div className="flex items-center justify-between mb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Year Range</CardTitle>
            <div className="rounded-lg bg-emerald-100 dark:bg-emerald-900/30 p-2">
              <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative">
          <div className="text-3xl font-bold">{yearRange ? `${yearRange.min}-${yearRange.max}` : '—'}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Historical data coverage
          </p>
        </CardContent>
      </Card>

      <Card className="border-none shadow-md bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-transparent rounded-full blur-2xl"></div>
        <CardHeader className="relative">
          <div className="flex items-center justify-between mb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Conferences</CardTitle>
            <div className="rounded-lg bg-purple-100 dark:bg-purple-900/30 p-2">
              <Globe className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative">
          <div className="text-3xl font-bold">{numConfs}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Major systems conferences
          </p>
        </CardContent>
      </Card>
    </div>
  );
});

