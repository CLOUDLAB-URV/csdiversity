import { StatsGrid } from "@/components/dashboard/stats-grid";
import { QuickStats } from "@/components/dashboard/quick-stats";
import Link from "next/link";
import { loadDatasetStatic } from "@/lib/data/load-data-static";
import { processContinentDistribution, processAsianTrends, processBigTech } from "@/lib/data/load-data";
import type { Metadata } from "next";
import { Globe2, TrendingUp, Building2, Users, Info, UserCheck, BarChart3 } from "lucide-react";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "CSdiversity Dashboard: Comprehensive overview of academic conference statistics and trends. Explore continent distribution, Asian trends, Big Tech vs Academia analysis, committee diversity metrics, and research patterns across 13 top-tier systems and networks conferences (OSDI, ASPLOS, NSDI, SIGCOMM, EuroSys, ATC, SOCC, IEEECLOUD, CCGRID, EUROPAR, ICDCS, MIDDLEWARE, IC2E) with interactive visualizations from 2000-2024.",
  keywords: [
    "conference dashboard",
    "academic statistics",
    "conference metrics",
    "research trends",
    "academic data visualization",
    "systems conferences",
    "networks conferences",
    "conference analytics",
    "research statistics",
    "academic data dashboard",
    "conference metrics dashboard",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "CSdiversity Dashboard | Academic Conference Analysis & Statistics",
    description: "Comprehensive dashboard with overview statistics and trends for academic conference data from 13 top-tier systems and networks conferences. Interactive visualizations, analytics, and research insights from 2000-2024.",
    url: baseUrl,
    type: "website",
    images: [
      {
        url: `${baseUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Conference Data Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CSdiversity Dashboard | Academic Conference Analysis",
    description: "Comprehensive dashboard with overview statistics and trends for academic conference data from 13 top-tier systems and networks conferences",
  },
};

const navItems = [
  {
    title: "Accepted Papers Distribution",
    description: "View the geographic distribution of accepted papers across different continents",
    href: "/continent-distribution",
    icon: Globe2,
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    title: "Asian Trends",
    description: "Track the evolution of Asian academic contribution over time",
    href: "/asian-trends",
    icon: TrendingUp,
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    title: "Big Tech vs Academia",
    description: "Compare contributions from major tech companies and academic institutions",
    href: "/big-tech-analysis",
    icon: Building2,
    gradient: "from-purple-500 to-pink-500",
  },
  {
    title: "Committee vs Papers",
    description: "Compare geographic distribution between program committees and accepted papers",
    href: "/committee-analysis",
    icon: UserCheck,
    gradient: "from-rose-500 to-pink-500",
  },
  {
    title: "Diversity Metrics",
    description: "Explore diversity indices across conferences and committees",
    href: "/diversity",
    icon: Users,
    gradient: "from-indigo-500 to-purple-500",
  },
  {
    title: "About",
    description: "Learn more about this project and the data sources",
    href: "/about",
    icon: Info,
    gradient: "from-gray-500 to-slate-500",
  },
  {
    title: "Country Ranking",
    description: "View overall country ranking and search for specific positions",
    href: "/country-ranking",
    icon: BarChart3,
    gradient: "from-teal-500 to-emerald-500",
  },
];

export default async function Dashboard() {
  const papersRaw = await loadDatasetStatic('papers');
  const papersCountryRaw = await loadDatasetStatic('papers-country');

  const continentData = processContinentDistribution(papersRaw);
  const asianTrends = processAsianTrends(papersRaw);
  const bigTechData = processBigTech(papersRaw);

  // Calculate QuickStats
  const totalPapers = papersRaw.length;
  const years = papersRaw.map((r: any) => Number(r.Year ?? r.year)).filter((n: any) => Number.isFinite(n));
  const yearRange = years.length > 0 ? { min: Math.min(...years), max: Math.max(...years) } : null;
  const confs = new Set<string>(papersRaw.map((r: any) => String(r.Conference ?? r.conference)).filter(Boolean));
  const numConfs = confs.size;

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent dark:from-gray-100 dark:via-gray-200 dark:to-gray-300">
          CSdiversity
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Comprehensive visualization and analysis of academic conference data from systems research conferences
        </p>
      </div>

      <QuickStats totalPapers={totalPapers} yearRange={yearRange} numConfs={numConfs} />

      <StatsGrid
        continentData={continentData}
        asianTrends={asianTrends}
        bigTechData={bigTechData}
        papersCountryRaw={papersCountryRaw}
      />

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Explore Analysis</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group relative overflow-hidden rounded-xl border bg-card shadow-sm transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
              >
                <div className="absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-5" 
                     style={{ background: `linear-gradient(to bottom right, var(--tw-gradient-stops))` }}
                     data-gradient={item.gradient}
                >
                </div>
                <div className="relative p-6">
                  <div className={`mb-4 inline-flex rounded-lg bg-gradient-to-br ${item.gradient} p-3`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold mb-2 text-lg">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                  <div className="mt-4 flex items-center text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    Explore →
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
