/**
 * Type definitions for CSV data structures
 */

// Raw CSV row types (as parsed from CSV files)
export interface RawPaperRow {
  conference?: string;
  Conference?: string;
  year?: string | number;
  Year?: string | number;
  country?: string;
  Country?: string;
  countries?: string;
  Countries?: string;
  predominant_continent?: string;
  'Predominant Continent'?: string;
  continent?: string;
  institutions?: string;
  Institutions?: string;
  [key: string]: unknown; // Allow other fields
}

export interface RawCommitteeRow {
  conference?: string;
  Conference?: string;
  year?: string | number;
  Year?: string | number;
  country?: string;
  Country?: string;
  countries?: string;
  Countries?: string;
  continent?: string;
  Continent?: string;
  [key: string]: unknown; // Allow other fields
}

// Union type for any raw CSV row
export type RawDatasetRow = RawPaperRow | RawCommitteeRow;

// Type guard functions
export function isRawPaperRow(row: RawDatasetRow): row is RawPaperRow {
  return 'predominant_continent' in row || 'Predominant Continent' in row || 'institutions' in row || 'Institutions' in row;
}

export function isRawCommitteeRow(row: RawDatasetRow): row is RawCommitteeRow {
  return !isRawPaperRow(row);
}

// Normalized data types
export interface NormalizedPaperData {
  conference: string;
  year: number;
  predominantContinent: string | null;
  institutions: string | null;
}

export interface NormalizedCommitteeData {
  conference: string;
  year: number;
  continent: string | null;
}

// Helper function to normalize conference name
export function normalizeConferenceName(conf: string | undefined | null): string {
  const normalized = String(conf ?? '').trim().toUpperCase();
  const conferenceMap: Record<string, string> = {
    'CLOUD': 'SOCC',
    'IEEECLOUD': 'IEEECLOUD',
    'IEEE CLOUD': 'IEEECLOUD',
  };
  return conferenceMap[normalized] || normalized;
}

// Helper function to extract year from row
export function extractYear(row: RawDatasetRow): number | null {
  const yearVal = row.year ?? row.Year;
  const year = typeof yearVal === 'string' ? Number(yearVal) : yearVal;
  return Number.isFinite(year) ? Number(year) : null;
}

// Helper function to extract conference from row
export function extractConference(row: RawDatasetRow): string | null {
  const conf = normalizeConferenceName(row.conference ?? row.Conference);
  return conf || null;
}

// Helper function to extract continent from paper row
export function extractPaperContinent(row: RawPaperRow): string | null {
  const continent = row.predominant_continent ?? row['Predominant Continent'] ?? row.continent;
  return continent ? String(continent).trim() : null;
}

// Helper function to extract continent from committee row
export function extractCommitteeContinent(row: RawCommitteeRow): string | null {
  const continent = row.continent ?? row.Continent;
  return continent ? String(continent).trim() : null;
}

// Helper function to extract institutions from paper row
export function extractInstitutions(row: RawPaperRow): string | null {
  const institutions = row.institutions ?? row.Institutions;
  return institutions ? String(institutions).trim() : null;
}
