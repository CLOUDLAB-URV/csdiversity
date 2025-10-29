import { StatsGrid } from "@/components/dashboard/stats-grid";
import { QuickStats } from "@/components/dashboard/quick-stats";
import Link from "next/link";

import { Globe2, TrendingUp, Building2, Quote, Users, Info } from "lucide-react";

const navItems = [
  {
    title: "Continent Distribution",
    description: "View the distribution of papers across different continents",
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
    title: "Citations Analysis",
    description: "Analyze citation patterns and their geographic distribution",
    href: "/citations",
    icon: Quote,
    gradient: "from-orange-500 to-red-500",
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
];

export default function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent dark:from-gray-100 dark:via-gray-200 dark:to-gray-300">
          Conference Data Dashboard
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Comprehensive visualization and analysis of academic conference data from systems and networks conferences
        </p>
      </div>

      {/* Quick Stats */}
      <QuickStats />

      {/* Main Stats and Chart */}
      <StatsGrid />

      {/* Navigation Cards */}
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

