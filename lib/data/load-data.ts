export async function fetchDataset(dataset: 'papers' | 'citations' | 'committee' | 'bigtech') {
  const res = await fetch(`/api/data/${dataset}`, { cache: 'no-store' });
  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    throw new Error(`Failed to load ${dataset}: ${res.status} ${msg}`);
  }
  const json = await res.json();
  return json.data as any[];
}

export interface ContinentDistributionItem {
  conference: string;
  year: number;
  'North America': number;
  'Europe': number;
  'Asia': number;
  'Others': number;
}

export function processContinentDistribution(raw: any[]): ContinentDistributionItem[] {
  // Expect CSV headers like: Conference, Year, Predominant Continent
  // Aggregate counts per (conference, year) for each continent.
  const key = (v: any) => String(v ?? '').trim();
  const normConf = (c: string) => key(c).toUpperCase();
  const normCont = (c: string) => key(c).toUpperCase();
  const buckets = new Map<string, ContinentDistributionItem>();

  for (const row of raw) {
    const conf = normConf(row.conference ?? row.Conference);
    const yearVal = row.year ?? row.Year;
    const year = Number(yearVal);
    if (!conf || !Number.isFinite(year)) continue;

    const contCode = normCont(row.predominant_continent ?? row['Predominant Continent'] ?? row.continent);
    const keyId = `${conf}:${year}`;
    let cur = buckets.get(keyId);
    if (!cur) {
      cur = {
        conference: conf,
        year,
        'North America': 0,
        'Europe': 0,
        'Asia': 0,
        'Others': 0,
      };
      buckets.set(keyId, cur);
    }
    if (contCode === 'NA' || contCode === 'NORTH AMERICA') cur['North America'] += 1;
    else if (contCode === 'EU' || contCode === 'EUROPE') cur['Europe'] += 1;
    else if (contCode === 'AS' || contCode === 'ASIA') cur['Asia'] += 1;
    else cur['Others'] += 1;
  }

  return Array.from(buckets.values()).sort((a, b) => a.year - b.year || a.conference.localeCompare(b.conference));
}

export interface AsianTrendItem {
  conference: string;
  year: number;
  percentage: number;
}

export function processAsianTrends(raw: any[]): AsianTrendItem[] {
  // Compute percentage of Asia-predominant papers per (conference, year)
  const key = (v: any) => String(v ?? '').trim();
  const normConf = (c: string) => key(c).toUpperCase();
  const normCont = (c: string) => key(c).toUpperCase();
  const counts = new Map<string, { asia: number; total: number; conference: string; year: number }>();

  for (const row of raw) {
    const conf = normConf(row.conference ?? row.Conference);
    const yearVal = row.year ?? row.Year;
    const year = Number(yearVal);
    if (!conf || !Number.isFinite(year)) continue;
    const contCode = normCont(row.predominant_continent ?? row['Predominant Continent'] ?? row.continent);
    const id = `${conf}:${year}`;
    const cur = counts.get(id) || { asia: 0, total: 0, conference: conf, year };
    cur.total += 1;
    if (contCode === 'AS' || contCode === 'ASIA') cur.asia += 1;
    counts.set(id, cur);
  }

  return Array.from(counts.values())
    .map(({ conference, year, asia, total }) => ({
      conference,
      year,
      percentage: total > 0 ? Number(((asia / total) * 100).toFixed(2)) : 0,
    }))
    .sort((a, b) => a.year - b.year || a.conference.localeCompare(b.conference));
}

export interface BigTechItem {
  conference: string;
  year: number;
  bigTech: number;
  academia: number;
}

export function processBigTech(raw: any[]): BigTechItem[] {
  // Supports two formats:
  // 1) Long percentages per (Conference, Year, level_2 in {pct_has_big,pct_no_big,pct_all_none}, value in column '0')
  // 2) Wide counts with has_big_tech / academic_count
  const byKey = new Map<string, { conference: string; year: number; bt: number; ac: number; unk: number }>();
  for (const r of raw) {
    const conference = String((r.conference ?? r.Conference ?? '')).trim();
    const year = Number(r.year ?? r.Year);
    if (!conference || !Number.isFinite(year)) continue;
    const k = `${conference}:${year}`;
    const bucket = byKey.get(k) || { conference, year, bt: 0, ac: 0, unk: 0 };
    if (r.level_2 && (r['0'] !== undefined)) {
      const cat = String(r.level_2).toLowerCase();
      const val = Number(r['0']);
      if (cat === 'pct_has_big') bucket.bt += val;
      else if (cat === 'pct_no_big') bucket.ac += val;
      else if (cat === 'pct_all_none') bucket.unk += val;
    } else {
      // Fallback to counts
      bucket.bt += Number(r.has_big_tech ?? r.big_tech_count ?? r.bigtech ?? 0);
      bucket.ac += Number(r.academic_count ?? r.academia ?? 0);
    }
    byKey.set(k, bucket);
  }
  const rows: BigTechItem[] = [];
  byKey.forEach(({ conference, year, bt, ac, unk }) => {
    // Normalize to percentages excluding unknown so BigTech + Academia = 100
    const denom = (bt + ac) || 1;
    const pBT = Number(((bt / denom) * 100).toFixed(2));
    let pAC = Number(((ac / denom) * 100).toFixed(2));
    // Ensure exact 100 with normalization
    pAC = Number((100 - pBT).toFixed(2));
    rows.push({ conference, year, bigTech: pBT, academia: Math.max(0, Math.min(100, pAC)) });
  });
  return rows.sort((a, b) => a.year - b.year || a.conference.localeCompare(b.conference));
}

export interface CitationAggItem {
  conference: string;
  year: number;
  accepted: number;
  cited: number;
  unknown: number;
}

export function processCitations(raw: any[]): CitationAggItem[] {
  // Expect rows with fields like: Conference, Year, cited_by, unknown_count
  const byKey = new Map<string, { accepted: number; cited: number; unknown: number; conference: string; year: number }>();
  for (const r of raw) {
    const conference = String((r.conference ?? r.Conference ?? '')).toUpperCase();
    const year = Number(r.year ?? r.Year);
    if (!conference || !Number.isFinite(year)) continue;
    const k = `${conference}:${year}`;
    const entry = byKey.get(k) || { accepted: 0, cited: 0, unknown: 0, conference, year };
    entry.accepted += 1; // each row corresponds to an accepted paper
    entry.cited += Number(r.cited_by ?? r.CitedBy ?? 0);
    entry.unknown += Number(r.unknown_count ?? r.Unknown ?? 0);
    byKey.set(k, entry);
  }
  return Array.from(byKey.values()).sort((a, b) => a.year - b.year || a.conference.localeCompare(b.conference));
}


