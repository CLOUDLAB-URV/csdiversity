export async function fetchDataset(dataset: 'papers' | 'committee' | 'bigtech') {
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
  const byKey = new Map<string, { conference: string; year: number; bt: number; ac: number }>();
  
  for (const r of raw) {
    const conference = String((r.conference ?? r.Conference ?? '')).trim().toUpperCase();
    const year = Number(r.year ?? r.Year);
    if (!conference || !Number.isFinite(year)) continue;
    const k = `${conference}:${year}`;
    
    if (r.level_2 && (r['0'] !== undefined)) {
      const cat = String(r.level_2).toLowerCase();
      const val = Number(r['0']);
      
      if (!byKey.has(k)) {
        byKey.set(k, { conference, year, bt: 0, ac: 0 });
      }
      const bucket = byKey.get(k)!;
      
      if (cat === 'pct_has_big') {
        bucket.bt = val;
      } else if (cat === 'pct_no_big') {
        bucket.ac = val;
      }
    } else {
      if (!byKey.has(k)) {
        byKey.set(k, { conference, year, bt: 0, ac: 0 });
      }
      const bucket = byKey.get(k)!;
      bucket.bt += Number(r.has_big_tech ?? r.big_tech_count ?? r.bigtech ?? 0);
      bucket.ac += Number(r.academic_count ?? r.academia ?? 0);
    }
  }
  
  const rows: BigTechItem[] = [];
  byKey.forEach(({ conference, year, bt, ac }) => {
    let pBT = Number(bt.toFixed(2));
    let pAC = Number(ac.toFixed(2));
    
    const total = pBT + pAC;
    if (Math.abs(total - 100) > 0.1 && total > 0) {
      pBT = Number(((pBT / total) * 100).toFixed(2));
      pAC = Number((100 - pBT).toFixed(2));
    } else if (total === 0) {
      pBT = 0;
      pAC = 0;
    }
    
    rows.push({ 
      conference, 
      year, 
      bigTech: Math.max(0, Math.min(100, pBT)), 
      academia: Math.max(0, Math.min(100, pAC)) 
    });
  });
  
  return rows.sort((a, b) => a.year - b.year || a.conference.localeCompare(b.conference));
}

export interface CommitteeVsPapersItem {
  conference: string;
  continent: string;
  papersPercent: number;
  committeePercent: number;
  gap: number;
}

export function processCommitteeVsPapers(papersRaw: any[], committeeRaw: any[]): CommitteeVsPapersItem[] {
  const normalizeCont = (c: string): string => {
    const val = String(c ?? '').trim().toUpperCase();
    if (['NA', 'NORTH AMERICA', 'NORTH_AMERICA', 'AMERICA'].includes(val)) return 'North America';
    if (['EU', 'EUROPE'].includes(val)) return 'Europe';
    if (['AS', 'ASIA'].includes(val)) return 'Asia';
    if (['OC', 'OCEANIA', 'AF', 'AFRICA', 'SA', 'SOUTH AMERICA'].includes(val)) return 'Other';
    if (!val || val === 'UNKNOWN') return 'Unknown';
    return 'Other';
  };

  const papersByConf = new Map<string, Map<string, number>>();
  for (const r of papersRaw) {
    const conf = String(r.conference ?? r.Conference ?? '').trim().toUpperCase();
    if (!conf) continue;
    const cont = normalizeCont(r.predominant_continent ?? r['Predominant Continent'] ?? r.continent ?? '');
    if (!papersByConf.has(conf)) papersByConf.set(conf, new Map());
    const contMap = papersByConf.get(conf)!;
    contMap.set(cont, (contMap.get(cont) ?? 0) + 1);
  }

  const committeeByConf = new Map<string, Map<string, number>>();
  for (const r of committeeRaw) {
    const conf = String(r.conference ?? r.Conference ?? '').trim().toUpperCase();
    if (!conf) continue;
    const cont = normalizeCont(r.continent ?? r.Continent ?? '');
    if (!committeeByConf.has(conf)) committeeByConf.set(conf, new Map());
    const contMap = committeeByConf.get(conf)!;
    contMap.set(cont, (contMap.get(cont) ?? 0) + 1);
  }

  const allConfs = new Set([...papersByConf.keys(), ...committeeByConf.keys()]);
  const continents = ['North America', 'Europe', 'Asia', 'Other', 'Unknown'];
  const result: CommitteeVsPapersItem[] = [];

  for (const conf of allConfs) {
    const pMap = papersByConf.get(conf) ?? new Map();
    const cMap = committeeByConf.get(conf) ?? new Map();
    
    const pTotal = Array.from(pMap.values()).reduce((s, v) => s + v, 0);
    const cTotal = Array.from(cMap.values()).reduce((s, v) => s + v, 0);

    if (pTotal === 0 && cTotal === 0) {
      continue;
    }

    for (const cont of continents) {
      const pCount = pMap.get(cont) ?? 0;
      const cCount = cMap.get(cont) ?? 0;
      
      const pPct = pTotal > 0 ? Number(((pCount / pTotal) * 100).toFixed(2)) : 0;
      const cPct = cTotal > 0 ? Number(((cCount / cTotal) * 100).toFixed(2)) : 0;
      const gap = Number((cPct - pPct).toFixed(2));

      result.push({
        conference: conf,
        continent: cont,
        papersPercent: pPct,
        committeePercent: cPct,
        gap,
      });
    }
  }

  return result.sort((a, b) => a.conference.localeCompare(b.conference) || continents.indexOf(a.continent) - continents.indexOf(b.continent));
}

export interface CommitteeVsPapersByYearItem {
  conference: string;
  year: number;
  continent: string;
  papersPercent: number;
  committeePercent: number;
  gap: number;
}

export function processCommitteeVsPapersByYear(papersRaw: any[], committeeRaw: any[]): CommitteeVsPapersByYearItem[] {
  const normalizeCont = (c: string): string => {
    const val = String(c ?? '').trim().toUpperCase();
    if (['NA', 'NORTH AMERICA', 'NORTH_AMERICA', 'AMERICA'].includes(val)) return 'North America';
    if (['EU', 'EUROPE'].includes(val)) return 'Europe';
    if (['AS', 'ASIA'].includes(val)) return 'Asia';
    if (['OC', 'OCEANIA', 'AF', 'AFRICA', 'SA', 'SOUTH AMERICA'].includes(val)) return 'Other';
    if (!val || val === 'UNKNOWN') return 'Unknown';
    return 'Other';
  };

  const papersByConfYear = new Map<string, Map<string, number>>();
  for (const r of papersRaw) {
    const conf = String(r.conference ?? r.Conference ?? '').trim().toUpperCase();
    const year = Number(r.year ?? r.Year);
    if (!conf || !Number.isFinite(year)) continue;
    const cont = normalizeCont(r.predominant_continent ?? r['Predominant Continent'] ?? r.continent ?? '');
    const key = `${conf}:${year}`;
    if (!papersByConfYear.has(key)) papersByConfYear.set(key, new Map());
    const contMap = papersByConfYear.get(key)!;
    contMap.set(cont, (contMap.get(cont) ?? 0) + 1);
  }

  const committeeByConfYear = new Map<string, Map<string, number>>();
  for (const r of committeeRaw) {
    const conf = String(r.conference ?? r.Conference ?? '').trim().toUpperCase();
    const year = Number(r.year ?? r.Year);
    if (!conf || !Number.isFinite(year)) continue;
    const cont = normalizeCont(r.continent ?? r.Continent ?? '');
    const key = `${conf}:${year}`;
    if (!committeeByConfYear.has(key)) committeeByConfYear.set(key, new Map());
    const contMap = committeeByConfYear.get(key)!;
    contMap.set(cont, (contMap.get(cont) ?? 0) + 1);
  }

  const allKeys = new Set([...papersByConfYear.keys(), ...committeeByConfYear.keys()]);
  const continents = ['North America', 'Europe', 'Asia', 'Other', 'Unknown'];
  const result: CommitteeVsPapersByYearItem[] = [];

  for (const key of allKeys) {
    const [conf, yearStr] = key.split(':');
    const year = Number(yearStr);
    const pMap = papersByConfYear.get(key) ?? new Map();
    const cMap = committeeByConfYear.get(key) ?? new Map();
    
    const pTotal = Array.from(pMap.values()).reduce((s, v) => s + v, 0);
    const cTotal = Array.from(cMap.values()).reduce((s, v) => s + v, 0);

    if (pTotal === 0 && cTotal === 0) {
      continue;
    }

    for (const cont of continents) {
      const pCount = pMap.get(cont) ?? 0;
      const cCount = cMap.get(cont) ?? 0;
      
      const pPct = pTotal > 0 ? Number(((pCount / pTotal) * 100).toFixed(2)) : 0;
      const cPct = cTotal > 0 ? Number(((cCount / cTotal) * 100).toFixed(2)) : 0;
      const gap = Number((cPct - pPct).toFixed(2));

      result.push({
        conference: conf,
        year,
        continent: cont,
        papersPercent: pPct,
        committeePercent: cPct,
        gap,
      });
    }
  }

  return result.sort((a, b) => a.year - b.year || a.conference.localeCompare(b.conference) || continents.indexOf(a.continent) - continents.indexOf(b.continent));
}

function calculateGiniSimpson(counts: Map<string, number>): number {
  const total = Array.from(counts.values()).reduce((sum, val) => sum + val, 0);
  if (total === 0) return 0;
  
  let sumOfSquares = 0;
  counts.forEach(count => {
    const proportion = count / total;
    sumOfSquares += proportion * proportion;
  });
  
  return Number((1 - sumOfSquares).toFixed(4));
}

export interface DiversityData {
  conference: string;
  committee: number;
  papers: number;
}

export function processDiversity(papersRaw: any[], committeeRaw: any[]): DiversityData[] {
  const normalizeConf = (c: string): string => String(c ?? '').trim().toUpperCase();
  const normalizeCont = (c: string): string => {
    const val = String(c ?? '').trim().toUpperCase();
    if (['NA', 'NORTH AMERICA', 'NORTH_AMERICA', 'AMERICA'].includes(val)) return 'North America';
    if (['EU', 'EUROPE'].includes(val)) return 'Europe';
    if (['AS', 'ASIA'].includes(val)) return 'Asia';
    if (['OC', 'OCEANIA', 'AF', 'AFRICA', 'SA', 'SOUTH AMERICA'].includes(val)) return 'Other';
    return 'Other';
  };

  const knownConferences = ['OSDI', 'ASPLOS', 'NSDI', 'SIGCOMM', 'EUROSYS', 'ATC'];

  const papersByConf = new Map<string, Map<string, number>>();
  for (const row of papersRaw) {
    const conf = normalizeConf(row.conference ?? row.Conference);
    if (!conf) continue;
    
    const cont = normalizeCont(row.predominant_continent ?? row['Predominant Continent'] ?? row.continent ?? '');
    if (!papersByConf.has(conf)) papersByConf.set(conf, new Map());
    const contMap = papersByConf.get(conf)!;
    contMap.set(cont, (contMap.get(cont) ?? 0) + 1);
  }

  const committeeByConf = new Map<string, Map<string, number>>();
  for (const row of committeeRaw) {
    const conf = normalizeConf(row.conference ?? row.Conference);
    if (!conf) continue;
    
    const cont = normalizeCont(row.continent ?? row.Continent ?? '');
    if (!committeeByConf.has(conf)) committeeByConf.set(conf, new Map());
    const contMap = committeeByConf.get(conf)!;
    contMap.set(cont, (contMap.get(cont) ?? 0) + 1);
  }

  const allConfs = new Set([
    ...knownConferences,
    ...papersByConf.keys(),
    ...committeeByConf.keys()
  ]);
  const result: DiversityData[] = [];

  for (const conf of allConfs) {
    const papersCounts = papersByConf.get(conf) ?? new Map();
    const committeeCounts = committeeByConf.get(conf) ?? new Map();
    
    const papersDiversity = calculateGiniSimpson(papersCounts);
    const committeeDiversity = calculateGiniSimpson(committeeCounts);
    
    result.push({
      conference: conf,
      committee: committeeDiversity,
      papers: papersDiversity,
    });
  }

  return result.sort((a, b) => a.conference.localeCompare(b.conference));
}