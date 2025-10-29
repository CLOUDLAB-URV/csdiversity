"use client"

import { useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FilterPanelProps {
  conferences: string[];
  years: number[];
  selectedConference?: string;
  selectedYear?: number;
  onConferenceChange?: (conference: string) => void;
  onYearChange: (year: number | undefined) => void;
  // Optional multi-select for conferences
  selectedConferences?: string[];
  onConferencesChange?: (conferences: string[]) => void;
}

export function FilterPanel({
  conferences,
  years,
  selectedConference,
  selectedYear,
  onConferenceChange,
  onYearChange,
  selectedConferences,
  onConferencesChange,
}: FilterPanelProps) {
  const [openMulti, setOpenMulti] = useState<boolean>(false);
  const [query, setQuery] = useState<string>("");
  const filteredConfs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? conferences.filter(c => c.toLowerCase().includes(q)) : conferences;
  }, [conferences, query]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {onConferenceChange && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Conference</label>
            <Select value={selectedConference} onValueChange={(value) => {
              onConferenceChange(value);
              if (onConferencesChange) onConferencesChange([]);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="All Conferences" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Conferences</SelectItem>
                {conferences.map((conf) => (
                  <SelectItem key={conf} value={conf}>
                    {conf}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {onConferencesChange && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Conferences</label>
            <button
              className="w-full border rounded-md px-3 py-2 text-sm text-left"
              onClick={() => setOpenMulti(v => !v)}
            >
              {selectedConferences && selectedConferences.length > 0
                ? `Selected (${selectedConferences.length})`
                : 'Select conferences'}
            </button>
            {openMulti && (
              <div className="border rounded-md p-3 space-y-2 max-h-64 overflow-auto">
                <div className="flex items-center gap-2">
                  <input
                    className="w-full border rounded-md px-2 py-1 text-sm"
                    placeholder="Search conferences"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  <button
                    className="text-xs underline"
                    onClick={() => onConferencesChange?.(conferences)}
                  >
                    Select all
                  </button>
                  <button
                    className="text-xs underline"
                    onClick={() => onConferencesChange?.([])}
                  >
                    Clear
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={(selectedConferences?.length ?? 0) === 0}
                      onChange={() => onConferencesChange?.([])}
                    />
                    <span>All Conferences</span>
                  </label>
                  {filteredConfs.map(conf => {
                    const checked = selectedConferences?.includes(conf) ?? false;
                    return (
                      <label key={conf} className="inline-flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              const next = Array.from(new Set([...(selectedConferences ?? []), conf]));
                              onConferencesChange?.(next);
                              // When multi-select is active, drive single-select to 'all' for compatibility
                              onConferenceChange?.('all');
                            } else {
                              const next = (selectedConferences ?? []).filter(c => c !== conf);
                              onConferencesChange?.(next);
                              if ((next?.length ?? 0) === 0) {
                                // No multi selections left, keep current single selection as-is
                              } else {
                                onConferenceChange?.('all');
                              }
                            }
                          }}
                        />
                        <span>{conf}</span>
                      </label>
                    );
                  })}
                </div>
                {selectedConferences && selectedConferences.length > 0 && (
                  <div className="text-xs text-muted-foreground">Multiple selected — single conference filter set to All.</div>
                )}
              </div>
            )}
          </div>
        )}

        

        {years && years.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Year</label>
            <Select 
              value={selectedYear?.toString()}
              onValueChange={(value) => {
                if (value === 'all') return onYearChange(undefined);
                const n = parseInt(value, 10);
                onYearChange(Number.isNaN(n) ? undefined : n);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


