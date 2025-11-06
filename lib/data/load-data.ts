export async function fetchDataset(dataset: 'papers' | 'committee') {
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
  total: number;
}

const normalizeConferenceName = (conf: string): string => {
  const normalized = String(conf ?? '').trim().toUpperCase();
  const conferenceMap: Record<string, string> = {
    'CLOUD': 'SOCC',
    'IEEECLOUD': 'IEEECLOUD',
    'IEEE CLOUD': 'IEEECLOUD',
  };
  return conferenceMap[normalized] || normalized;
};

const normalizeContinentForDistribution = (c: string): string | null => {
  const val = String(c ?? '').trim().toUpperCase();
  if (!val) return null;
  if (['NA', 'NORTH AMERICA', 'NORTH_AMERICA', 'AMERICA'].includes(val)) return 'North America';
  if (['EU', 'EUROPE'].includes(val)) return 'Europe';
  if (['AS', 'ASIA'].includes(val)) return 'Asia';
  if (['SA', 'SOUTH AMERICA', 'OC', 'OCEANIA', 'AF', 'AFRICA'].includes(val)) return 'Others';
  return null;
};

export function processContinentDistribution(raw: any[]): ContinentDistributionItem[] {
  const key = (v: any) => String(v ?? '').trim();
  const normConf = (c: string) => normalizeConferenceName(c);
  const buckets = new Map<string, ContinentDistributionItem>();
  const totals = new Map<string, number>();

  for (const row of raw) {
    const conf = normConf(row.conference ?? row.Conference);
    const yearVal = row.year ?? row.Year;
    const year = Number(yearVal);
    if (!conf || !Number.isFinite(year)) continue;

    const keyId = `${conf}:${year}`;
    totals.set(keyId, (totals.get(keyId) ?? 0) + 1);

    const continent = normalizeContinentForDistribution(row.predominant_continent ?? row['Predominant Continent'] ?? row.continent);
    if (!continent) continue;

    let cur = buckets.get(keyId);
    if (!cur) {
      cur = {
        conference: conf,
        year,
        'North America': 0,
        'Europe': 0,
        'Asia': 0,
        'Others': 0,
        total: 0,
      };
      buckets.set(keyId, cur);
    }
    const continentKey = continent as 'North America' | 'Europe' | 'Asia' | 'Others';
    if (continentKey === 'North America') {
      cur['North America'] = cur['North America'] + 1;
    } else if (continentKey === 'Europe') {
      cur['Europe'] = cur['Europe'] + 1;
    } else if (continentKey === 'Asia') {
      cur['Asia'] = cur['Asia'] + 1;
    } else if (continentKey === 'Others') {
      cur['Others'] = cur['Others'] + 1;
    }
  }

  const result = Array.from(buckets.values());
  for (const item of result) {
    const keyId = `${item.conference}:${item.year}`;
    item.total = totals.get(keyId) ?? 0;
  }

  return result.sort((a, b) => a.year - b.year || a.conference.localeCompare(b.conference));
}

export function processCommitteeContinentDistribution(raw: any[]): ContinentDistributionItem[] {
  const key = (v: any) => String(v ?? '').trim();
  const normConf = (c: string) => normalizeConferenceName(c);
  const buckets = new Map<string, ContinentDistributionItem>();
  const totals = new Map<string, number>();

  for (const row of raw) {
    const conf = normConf(row.conference ?? row.Conference);
    const yearVal = row.year ?? row.Year;
    const year = Number(yearVal);
    if (!conf || !Number.isFinite(year)) continue;

    const keyId = `${conf}:${year}`;
    totals.set(keyId, (totals.get(keyId) ?? 0) + 1);

    const continent = normalizeContinentForDistribution(row.continent ?? row.Continent ?? '');
    if (!continent) continue;

    let cur = buckets.get(keyId);
    if (!cur) {
      cur = {
        conference: conf,
        year,
        'North America': 0,
        'Europe': 0,
        'Asia': 0,
        'Others': 0,
        total: 0,
      };
      buckets.set(keyId, cur);
    }
    const continentKey = continent as 'North America' | 'Europe' | 'Asia' | 'Others';
    if (continentKey === 'North America') {
      cur['North America'] = cur['North America'] + 1;
    } else if (continentKey === 'Europe') {
      cur['Europe'] = cur['Europe'] + 1;
    } else if (continentKey === 'Asia') {
      cur['Asia'] = cur['Asia'] + 1;
    } else if (continentKey === 'Others') {
      cur['Others'] = cur['Others'] + 1;
    }
  }

  const result = Array.from(buckets.values());
  for (const item of result) {
    const keyId = `${item.conference}:${item.year}`;
    item.total = totals.get(keyId) ?? 0;
  }

  return result.sort((a, b) => a.year - b.year || a.conference.localeCompare(b.conference));
}

export interface AsianTrendItem {
  conference: string;
  year: number;
  percentage: number;
}

export function processAsianTrends(raw: any[]): AsianTrendItem[] {
  const key = (v: any) => String(v ?? '').trim();
  const normConf = (c: string) => normalizeConferenceName(c);
  const counts = new Map<string, { asia: number; total: number; conference: string; year: number }>();

  for (const row of raw) {
    const conf = normConf(row.conference ?? row.Conference);
    const yearVal = row.year ?? row.Year;
    const year = Number(yearVal);
    if (!conf || !Number.isFinite(year)) continue;
    
    const continent = normalizeContinentForDistribution(row.predominant_continent ?? row['Predominant Continent'] ?? row.continent);
    if (!continent) continue;
    
    const id = `${conf}:${year}`;
    const cur = counts.get(id) || { asia: 0, total: 0, conference: conf, year };
    cur.total += 1;
    if (continent === 'Asia') cur.asia += 1;
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
  unmapped: number;
}

export interface BigTechByRegionItem {
  conference: string;
  year: number;
  bigTechNA: number;
  bigTechAsia: number;
  bigTechEU: number;
  bigTechOthers: number;
  academia: number;
  unmapped: number;
}

const hasBigTechChina = (institutions: string): boolean => {
  if (!institutions) return false;
  const lower = institutions.toLowerCase();
  const chinaPatterns = [
    /\bhuawei\b/,
    /\balibaba\b/,
    /\balibaba\s+cloud\b/,
    /\bbytedance\b/,
    /\btencent\b/,
    /\bbaidu\b/,
    /\bsamsung\b/,
    /\bxiaomi\b/,
    /\btiktok\b/
  ];
  return chinaPatterns.some(pattern => pattern.test(lower));
};

const hasBigTechAmerica = (institutions: string): boolean => {
  if (!institutions) return false;
  const lower = institutions.toLowerCase();
  const americaPatterns = [
    /\bibm\b/,
    /\bibm\s+research\b/,
    /\bibm\s+linux\s+technology\s+center\b/,
    /\bmicrosoft\b/,
    /\bmicrosoft\s+azure\b/,
    /\bazure\b/,
    /\bmicrosoft\s+research\b/,
    /\bgoogle\b/,
    /\bgoogle\s+cloud\b/,
    /\balphabet\b/,
    /\bamazon\b/,
    /\bamazon\s+web\s+services\b/,
    /\baws\b/,
    /\bfacebook\b/,
    /\bmeta\b/,
    /\bmeta\s+platforms\b/,
    /\bapple\b/,
    /\bintel\b/,
    /\boracle\b/,
    /\boracle\s+labs\b/,
    /\bcisco\b/,
    /\bcisco\s+systems\b/,
    /\bhp\b/,
    /\bhewlett\s+packard\b/,
    /\bhp\s+labs\b/,
    /\bhpe\b/,
    /\bhewlett\s+packard\s+enterprise\b/,
    /\bnvidia\b/,
    /\bvmware\b/,
    /\bnetflix\b/,
    /\buber\b/,
    /\btwitter\b/,
    /\byahoo\b/,
    /\bsnap\b/,
    /\bsalesforce\b/,
    /\bamd\b/,
    /\badvanced\s+micro\s+devices\b/,
    /\bqualcomm\b/,
    /\bbroadcom\b/
  ];
  return americaPatterns.some(pattern => pattern.test(lower));
};

const hasBigTechEurope = (institutions: string): boolean => {
  if (!institutions) return false;
  const lower = institutions.toLowerCase();
  const europePatterns = [
    /\barm\b/,
    /\barm\s+ltd\b/,
    /\barm\s+limited\b/,
    /\barm\s+holdings\b/,
    /\bericsson\b/,
    /\bnokia\b/,
    /\bsiemens\b/,
    /\borange\b/,
    /\batos\b/,
    /\bdeutsche\s+telekom\b/,
    /\bbosch\b/,
    /\bairbus\b/,
    /\bsap\b/,
    /\btelefonica\b/,
    /\btelefónica\b/,
    /\bvodafone\b/,
    /\bthales\b/,
    /\bphilips\b/
  ];
  return europePatterns.some(pattern => pattern.test(lower));
};

export function processBigTech(papersRaw: any[]): BigTechItem[] {
  if (!papersRaw || papersRaw.length === 0) {
    return [];
  }
  
  const statsByKey = new Map<string, {
    conference: string;
    year: number;
    total: number;
    withInstitutions: number;
    bigTechTotal: number;
    academiaTotal: number;
  }>();
  
  for (const row of papersRaw) {
    const conf = normalizeConferenceName(row.conference ?? row.Conference);
    const yearVal = row.year ?? row.Year;
    const year = Number(yearVal);
    if (!conf || !Number.isFinite(year)) continue;
    
    const keyId = `${conf}:${year}`;
    let stats = statsByKey.get(keyId);
    if (!stats) {
      stats = {
        conference: conf,
        year,
        total: 0,
        withInstitutions: 0,
        bigTechTotal: 0,
        academiaTotal: 0
      };
      statsByKey.set(keyId, stats);
    }
    
    stats.total += 1;
    
    const institutions = String(row.institutions ?? row.Institutions ?? '').trim();
    if (!institutions) {
      continue;
    }
    
    stats.withInstitutions += 1;
    
    const hasChina = hasBigTechChina(institutions);
    const hasAmerica = hasBigTechAmerica(institutions);
    const hasEurope = hasBigTechEurope(institutions);
    
    if (hasChina || hasAmerica || hasEurope) {
      stats.bigTechTotal += 1;
    } else {
      stats.academiaTotal += 1;
    }
  }
  
  const rows: BigTechItem[] = [];
  
  for (const stats of statsByKey.values()) {
    const pBT = stats.total > 0 ? Number(((stats.bigTechTotal / stats.total) * 100).toFixed(2)) : 0;
    const pAC = stats.total > 0 ? Number(((stats.academiaTotal / stats.total) * 100).toFixed(2)) : 0;
    const pUnmapped = stats.total > 0 ? Number((((stats.total - stats.withInstitutions) / stats.total) * 100).toFixed(2)) : 0;
    
    rows.push({
      conference: stats.conference,
      year: stats.year,
      bigTech: Math.max(0, Math.min(100, pBT)),
      academia: Math.max(0, Math.min(100, pAC)),
      unmapped: Math.max(0, Math.min(100, pUnmapped))
    });
  }
  
  return rows.sort((a, b) => a.year - b.year || a.conference.localeCompare(b.conference));
}

export function processBigTechByRegion(raw: any[], papersRaw?: any[]): BigTechByRegionItem[] {
  if (!papersRaw || papersRaw.length === 0) {
    return [];
  }
  
  const statsByKey = new Map<string, {
    conference: string;
    year: number;
    total: number;
    withInstitutions: number;
    bigTechTotal: number;
    academiaTotal: number;
    bigTechNA: number;
    bigTechAsia: number;
    bigTechEU: number;
    bigTechOthers: number;
  }>();
  
  for (const row of papersRaw) {
    const conf = normalizeConferenceName(row.conference ?? row.Conference);
    const yearVal = row.year ?? row.Year;
    const year = Number(yearVal);
    if (!conf || !Number.isFinite(year)) continue;
    
    const keyId = `${conf}:${year}`;
    let stats = statsByKey.get(keyId);
    if (!stats) {
      stats = {
        conference: conf,
        year,
        total: 0,
        withInstitutions: 0,
        bigTechTotal: 0,
        academiaTotal: 0,
        bigTechNA: 0,
        bigTechAsia: 0,
        bigTechEU: 0,
        bigTechOthers: 0
      };
      statsByKey.set(keyId, stats);
    }
    
    stats.total += 1;
    
    const institutions = String(row.institutions ?? row.Institutions ?? '').trim();
    if (!institutions) {
      continue;
    }
    
    stats.withInstitutions += 1;
    
    const hasChina = hasBigTechChina(institutions);
    const hasAmerica = hasBigTechAmerica(institutions);
    const hasEurope = hasBigTechEurope(institutions);
    
    if (hasChina || hasAmerica || hasEurope) {
      stats.bigTechTotal += 1;
      
      const regions = [];
      if (hasChina) regions.push('asia');
      if (hasAmerica) regions.push('na');
      if (hasEurope) regions.push('eu');
      
      const weight = 1 / regions.length;
      
      if (regions.includes('asia')) stats.bigTechAsia += weight;
      if (regions.includes('na')) stats.bigTechNA += weight;
      if (regions.includes('eu')) stats.bigTechEU += weight;
    } else {
      stats.academiaTotal += 1;
    }
  }
  
  const rows: BigTechByRegionItem[] = [];
  
  for (const stats of statsByKey.values()) {
    const pBT = stats.total > 0 ? Number(((stats.bigTechTotal / stats.total) * 100).toFixed(2)) : 0;
    const pAC = stats.total > 0 ? Number(((stats.academiaTotal / stats.total) * 100).toFixed(2)) : 0;
    
    const pUnmapped = stats.total > 0 ? Number((((stats.total - stats.withInstitutions) / stats.total) * 100).toFixed(2)) : 0;
    
    let bigTechNA = 0;
    let bigTechAsia = 0;
    let bigTechEU = 0;
    let bigTechOthers = 0;
    
    if (stats.bigTechTotal > 0) {
      const pNA = stats.bigTechNA / stats.bigTechTotal;
      const pAsia = stats.bigTechAsia / stats.bigTechTotal;
      const pEU = stats.bigTechEU / stats.bigTechTotal;
      const pOther = stats.bigTechOthers / stats.bigTechTotal;
      
      bigTechNA = Number((pBT * pNA).toFixed(2));
      bigTechAsia = Number((pBT * pAsia).toFixed(2));
      bigTechEU = Number((pBT * pEU).toFixed(2));
      bigTechOthers = Number((pBT * pOther).toFixed(2));
      
      const sum = bigTechNA + bigTechAsia + bigTechEU + bigTechOthers;
      const diff = Number((pBT - sum).toFixed(2));
      if (Math.abs(diff) > 0.01) {
        if (bigTechOthers > 0) {
          bigTechOthers = Number((bigTechOthers + diff).toFixed(2));
        } else if (bigTechEU > 0) {
          bigTechEU = Number((bigTechEU + diff).toFixed(2));
        } else if (bigTechAsia > 0) {
          bigTechAsia = Number((bigTechAsia + diff).toFixed(2));
        } else {
          bigTechNA = Number((bigTechNA + diff).toFixed(2));
        }
      }
    }
    
    rows.push({
      conference: stats.conference,
      year: stats.year,
      bigTechNA: Math.max(0, Math.min(100, bigTechNA)),
      bigTechAsia: Math.max(0, Math.min(100, bigTechAsia)),
      bigTechEU: Math.max(0, Math.min(100, bigTechEU)),
      bigTechOthers: Math.max(0, Math.min(100, bigTechOthers)),
      academia: Math.max(0, Math.min(100, pAC)),
      unmapped: Math.max(0, Math.min(100, pUnmapped))
    });
  }
  
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
  const normalizeCont = (c: string): string | null => {
    const val = String(c ?? '').trim().toUpperCase();
    if (!val) return null;
    if (['NA', 'NORTH AMERICA', 'NORTH_AMERICA', 'AMERICA'].includes(val)) return 'North America';
    if (['EU', 'EUROPE'].includes(val)) return 'Europe';
    if (['AS', 'ASIA'].includes(val)) return 'Asia';
    if (['SA', 'SOUTH AMERICA', 'OC', 'OCEANIA', 'AF', 'AFRICA'].includes(val)) return 'Other';
    if (val === 'UNKNOWN') return 'Unknown';
    return null;
  };

  const papersByConf = new Map<string, Map<string, number>>();
  for (const r of papersRaw) {
    const conf = normalizeConferenceName(r.conference ?? r.Conference ?? '');
    if (!conf) continue;
    const cont = normalizeCont(r.predominant_continent ?? r['Predominant Continent'] ?? r.continent ?? '');
    if (!cont) continue;
    if (!papersByConf.has(conf)) papersByConf.set(conf, new Map());
    const contMap = papersByConf.get(conf)!;
    contMap.set(cont, (contMap.get(cont) ?? 0) + 1);
  }

  const committeeByConf = new Map<string, Map<string, number>>();
  for (const r of committeeRaw) {
    const conf = normalizeConferenceName(r.conference ?? r.Conference ?? '');
    if (!conf) continue;
    const cont = normalizeCont(r.continent ?? r.Continent ?? '');
    if (!cont) continue;
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
  const normalizeCont = (c: string): string | null => {
    const val = String(c ?? '').trim().toUpperCase();
    if (!val) return null;
    if (['NA', 'NORTH AMERICA', 'NORTH_AMERICA', 'AMERICA'].includes(val)) return 'North America';
    if (['EU', 'EUROPE'].includes(val)) return 'Europe';
    if (['AS', 'ASIA'].includes(val)) return 'Asia';
    if (['SA', 'SOUTH AMERICA', 'OC', 'OCEANIA', 'AF', 'AFRICA'].includes(val)) return 'Other';
    if (val === 'UNKNOWN') return 'Unknown';
    return null;
  };

  const papersByConfYear = new Map<string, Map<string, number>>();
  for (const r of papersRaw) {
    const conf = normalizeConferenceName(r.conference ?? r.Conference ?? '');
    const year = Number(r.year ?? r.Year);
    if (!conf || !Number.isFinite(year)) continue;
    const cont = normalizeCont(r.predominant_continent ?? r['Predominant Continent'] ?? r.continent ?? '');
    if (!cont) continue;
    const key = `${conf}:${year}`;
    if (!papersByConfYear.has(key)) papersByConfYear.set(key, new Map());
    const contMap = papersByConfYear.get(key)!;
    contMap.set(cont, (contMap.get(cont) ?? 0) + 1);
  }

  const committeeByConfYear = new Map<string, Map<string, number>>();
  for (const r of committeeRaw) {
    const conf = normalizeConferenceName(r.conference ?? r.Conference ?? '');
    const year = Number(r.year ?? r.Year);
    if (!conf || !Number.isFinite(year)) continue;
    const cont = normalizeCont(r.continent ?? r.Continent ?? '');
    if (!cont) continue;
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
  const normalizeConf = (c: string): string => normalizeConferenceName(c);
  const normalizeContForDiversity = (c: string): string | null => {
    const val = String(c ?? '').trim().toUpperCase();
    if (!val) return null;
    if (['NA', 'NORTH AMERICA', 'NORTH_AMERICA', 'AMERICA'].includes(val)) return 'North America';
    if (['EU', 'EUROPE'].includes(val)) return 'Europe';
    if (['AS', 'ASIA'].includes(val)) return 'Asia';
    if (['SA', 'SOUTH AMERICA', 'OC', 'OCEANIA', 'AF', 'AFRICA'].includes(val)) return 'Other';
    return null;
  };

  const knownConferences = ['OSDI', 'ASPLOS', 'NSDI', 'SIGCOMM', 'EUROSYS', 'ATC', 'SOCC', 'IEEECLOUD', 'CCGRID', 'EUROPAR', 'ICDCS', 'MIDDLEWARE', 'IC2E'];

  const papersByConf = new Map<string, Map<string, number>>();
  for (const row of papersRaw) {
    const conf = normalizeConf(row.conference ?? row.Conference);
    if (!conf || /^\d+$/.test(conf)) continue;
    
    const cont = normalizeContForDiversity(row.predominant_continent ?? row['Predominant Continent'] ?? row.continent ?? '');
    if (!cont) continue;
    
    if (!papersByConf.has(conf)) papersByConf.set(conf, new Map());
    const contMap = papersByConf.get(conf)!;
    contMap.set(cont, (contMap.get(cont) ?? 0) + 1);
  }

  const committeeByConf = new Map<string, Map<string, number>>();
  for (const row of committeeRaw) {
    const conf = normalizeConf(row.conference ?? row.Conference);
    if (!conf || /^\d+$/.test(conf)) continue;
    
    const cont = normalizeContForDiversity(row.continent ?? row.Continent ?? '');
    if (!cont) continue;
    
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