"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Globe,
  TrendingUp,
  Building2,
  Users,
  Info,
  UserCheck,
  X,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard, description: "Overview and statistics" },
  { name: "Continent Distribution", href: "/continent-distribution", icon: Globe, description: "Geographic analysis" },
  { name: "Asian Trends", href: "/asian-trends", icon: TrendingUp, description: "Asian participation trends" },
  { name: "Big Tech vs Academia", href: "/big-tech-analysis", icon: Building2, description: "Industry vs academia" },
  { name: "Committee vs Papers", href: "/committee-analysis", icon: UserCheck, description: "Committee representation" },
  { name: "Diversity", href: "/diversity", icon: Users, description: "Diversity metrics" },
  { name: "About", href: "/about", icon: Info, description: "About this project" },
];

interface SidebarProps {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export function Sidebar({ mobileMenuOpen, setMobileMenuOpen }: SidebarProps) {
  const pathname = usePathname();

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileMenuOpen]);

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:top-16 lg:bottom-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-4 overflow-y-auto border-r border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-950/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:supports-[backdrop-filter]:bg-slate-950/80 px-4 py-6 shadow-sm">
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        "group relative flex gap-x-3 rounded-xl p-3.5 text-sm font-medium transition-all duration-200",
                        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-950",
                        isActive
                          ? "bg-gradient-to-r from-blue-500/15 to-purple-500/15 text-foreground shadow-md border border-blue-300/50 dark:border-blue-700/50"
                          : "text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-foreground"
                      )}
                      aria-current={isActive ? "page" : undefined}
                      aria-label={`Navigate to ${item.name} page`}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 rounded-r-full bg-gradient-to-b from-blue-500 to-purple-600" />
                      )}
                      <Icon
                        className={cn(
                          "h-5 w-5 shrink-0 transition-all duration-200",
                          isActive
                            ? "text-blue-600 dark:text-blue-400 scale-110"
                            : "text-muted-foreground group-hover:text-foreground group-hover:scale-105"
                        )}
                        aria-hidden="true"
                      />
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="truncate">{item.name}</span>
                        <span className={cn(
                          "text-xs truncate transition-opacity",
                          isActive
                            ? "text-muted-foreground opacity-80"
                            : "text-muted-foreground/60 opacity-0 group-hover:opacity-100"
                        )}>
                          {item.description}
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="lg:hidden fixed inset-y-0 left-0 z-50 w-80 flex flex-col bg-white/95 dark:bg-slate-950/95 backdrop-blur supports-[backdrop-filter]:bg-white/98 dark:supports-[backdrop-filter]:bg-slate-950/98 border-r border-slate-200 dark:border-slate-800 shadow-2xl animate-in slide-in-from-left duration-300">
            <div className="flex h-16 shrink-0 items-center justify-between px-6 gap-3 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-base font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Navigation
              </h2>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Close menu"
              >
                <X className="h-5 w-5 text-slate-900 dark:text-slate-100" />
              </button>
            </div>
            <nav className="flex flex-1 flex-col overflow-y-auto px-6 py-6">
              <ul role="list" className="flex flex-1 flex-col gap-y-1.5">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "group relative flex gap-x-3 rounded-xl p-3.5 text-sm font-medium transition-all duration-200",
                          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-950",
                          isActive
                            ? "bg-gradient-to-r from-blue-500/15 to-purple-500/15 text-foreground shadow-md border border-blue-300/50 dark:border-blue-700/50"
                            : "text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-foreground"
                        )}
                        aria-current={isActive ? "page" : undefined}
                        aria-label={`Navigate to ${item.name} page`}
                      >
                        {isActive && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 rounded-r-full bg-gradient-to-b from-blue-500 to-purple-600" />
                        )}
                        <Icon
                          className={cn(
                            "h-5 w-5 shrink-0 transition-all duration-200",
                            isActive
                              ? "text-blue-600 dark:text-blue-400 scale-110"
                              : "text-muted-foreground group-hover:text-foreground group-hover:scale-105"
                          )}
                          aria-hidden="true"
                        />
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="truncate">{item.name}</span>
                          <span className="text-xs truncate text-muted-foreground/70">
                            {item.description}
                          </span>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
        </>
      )}
    </>
  );
}

