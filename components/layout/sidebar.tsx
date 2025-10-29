"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Globe,
  TrendingUp,
  Building2,
  Quote,
  Users,
  Info,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Continent Distribution", href: "/continent-distribution", icon: Globe },
  { name: "Asian Trends", href: "/asian-trends", icon: TrendingUp },
  { name: "Big Tech vs Academia", href: "/big-tech-analysis", icon: Building2 },
  { name: "Citations", href: "/citations", icon: Quote },
  { name: "Diversity", href: "/diversity", icon: Users },
  { name: "About", href: "/about", icon: Info },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-slate-200 dark:border-slate-800 bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 px-6 pb-4">
        <div className="flex h-20 shrink-0 items-center border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Navigation</h2>
        </div>
        <nav className="flex flex-1 flex-col pt-6">
          <ul role="list" className="flex flex-1 flex-col gap-y-2">
            <li>
              <ul role="list" className="space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={cn(
                          "group flex gap-x-3 rounded-lg p-3 text-sm leading-6 font-medium transition-all duration-200",
                          isActive
                            ? "bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-foreground shadow-sm border border-blue-200 dark:border-blue-800"
                            : "text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-foreground"
                        )}
                      >
                        <Icon className={cn(
                          "h-5 w-5 shrink-0 transition-colors",
                          isActive ? "text-blue-600" : "text-muted-foreground group-hover:text-foreground"
                        )} aria-hidden="true" />
                        {item.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}

