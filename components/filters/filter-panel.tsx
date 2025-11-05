"use client"

import { useMemo, useState, memo, useCallback } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FilterPanelProps {
  conferences: string[];
  years: number[];
  selectedConference?: string;
  selectedYear?: number;
  onConferenceChange?: (conference: string) => void;
  onYearChange: (year: number | undefined) => void;
  selectedConferences?: string[];
  onConferencesChange?: (conferences: string[]) => void;
}

export const FilterPanel = memo(function FilterPanel({ 
  conferences, 
  years, 
  selectedConference, 
  selectedYear, 
  onConferenceChange, 
  onYearChange, 
  selectedConferences, 
  onConferencesChange 
}: FilterPanelProps) {
  const [openMulti, setOpenMulti] = useState(false);
  const [query, setQuery] = useState("");
  
  const filteredConfs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? conferences.filter(c => c.toLowerCase().includes(q)) : conferences;
  }, [conferences, query]);
  
  const handleToggleMulti = useCallback(() => {
    setOpenMulti(v => !v);
  }, []);
  
  const handleSelectAll = useCallback(() => {
    onConferencesChange?.(conferences);
  }, [onConferencesChange, conferences]);
  
  const handleClear = useCallback(() => {
    onConferencesChange?.([]);
  }, [onConferencesChange]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {(onConferencesChange || onConferenceChange) && (
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="conference-select">Conferences</label>
            <button
              id="conference-select"
              className="w-full border rounded-md px-3 py-2 text-sm text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={handleToggleMulti}
              aria-expanded={openMulti}
              aria-haspopup="listbox"
              aria-label={`Conference selector. ${selectedConferences && selectedConferences.length > 0 ? `${selectedConferences.length} selected` : 'No conferences selected'}`}
            >
              {selectedConferences && selectedConferences.length > 0
                ? `Selected (${selectedConferences.length})`
                : 'Select conferences'}
            </button>
            {openMulti && (
              <div 
                className="border rounded-md p-3 space-y-2 max-h-64 overflow-auto"
                role="listbox"
                aria-label="Conference selection list"
              >
                <div className="flex items-center gap-2">
                  <input
                    className="w-full border rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                    placeholder="Search conferences"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    aria-label="Search conferences"
                    type="search"
                  />
                  <button
                    className="text-xs underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded"
                    onClick={handleSelectAll}
                    aria-label="Select all conferences"
                  >
                    Select all
                  </button>
                  <button
                    className="text-xs underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded"
                    onClick={handleClear}
                    aria-label="Clear all conference selections"
                  >
                    Clear
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-2" role="group" aria-label="Conference options">
                  <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(selectedConferences?.length ?? 0) === 0}
                      className="focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                      aria-label="Select all conferences option"
                      onChange={() => onConferencesChange?.([])}
                    />
                    <span>All Conferences</span>
                  </label>
                  {filteredConfs.map(conf => {
                    const checked = selectedConferences?.includes(conf) ?? false;
                    return (
                      <label key={conf} className="inline-flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-1 rounded">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              const next = Array.from(new Set([...(selectedConferences ?? []), conf]));
                              onConferencesChange?.(next);
                              if (onConferenceChange) {
                                onConferenceChange('all');
                              }
                            } else {
                              const next = (selectedConferences ?? []).filter(c => c !== conf);
                              onConferencesChange?.(next);
                              if ((next?.length ?? 0) === 0) {
                                if (onConferenceChange) {
                                  onConferenceChange('all');
                                }
                                return;
                              } else {
                                if (onConferenceChange) {
                                  onConferenceChange('all');
                                }
                              }
                            }
                          }}
                          className="focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                          aria-label={`Select ${conf} conference`}
                        />
                        <span>{conf}</span>
                      </label>
                    );
                  })}
                </div>
                {selectedConferences && selectedConferences.length > 0 && (
                  <div className="text-xs text-muted-foreground">Multiple selected</div>
                )}
              </div>
            )}
          </div>
        )}

        

        {years && years.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="year-select">Year</label>
            <Select 
              value={selectedYear?.toString()}
              onValueChange={(value) => {
                if (value === 'all') return onYearChange(undefined);
                const n = parseInt(value, 10);
                onYearChange(Number.isNaN(n) ? undefined : n);
              }}
              aria-label="Select year filter"
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
});