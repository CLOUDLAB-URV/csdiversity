const fs = require('fs');
const path = require('path');

const DATASET_MAP = {
  papers: 'unifiedPaperCountryData.csv',
  committee: 'unifiedCommitteeCountryData.csv',
};

const datasetKey = (process.argv[2] ?? 'papers').toLowerCase();
const conferenceCode = (process.argv[3] ?? 'ATC').toUpperCase();

if (!DATASET_MAP[datasetKey]) {
  console.error(`Unknown dataset "${datasetKey}". Use one of: ${Object.keys(DATASET_MAP).join(', ')}`);
  process.exit(1);
}

const CSV_PATH = path.join(__dirname, '..', 'data', DATASET_MAP[datasetKey]);

const COUNTRY_ALIASES = {
  'usa': 'United States',
  'u.s.a.': 'United States',
  'u.s.': 'United States',
  'united states of america': 'United States',
  'united states': 'United States',
  'the united states': 'United States',
  'uk': 'United Kingdom',
  'u.k.': 'United Kingdom',
  'great britain': 'United Kingdom',
  'united kingdom of great britain and northern ireland': 'United Kingdom',
  'south korea': 'South Korea',
  'republic of korea': 'South Korea',
  'korea, south': 'South Korea',
  'korea (south)': 'South Korea',
  'north korea': 'North Korea',
  'peoples republic of china': 'China',
  "people's republic of china": 'China',
  'p.r. china': 'China',
  'mainland china': 'China',
  'hong kong sar': 'Hong Kong',
  'hong kong s.a.r.': 'Hong Kong',
  'czech republic': 'Czechia',
  'the netherlands': 'Netherlands',
  'russian federation': 'Russia',
  'uae': 'United Arab Emirates',
  'u.a.e.': 'United Arab Emirates',
};

const normalizeCountryName = (country) => {
  if (!country) return 'Unknown';
  const trimmed = country.trim();
  if (!trimmed) return 'Unknown';

  const lower = trimmed.toLowerCase();
  if (COUNTRY_ALIASES[lower]) {
    return COUNTRY_ALIASES[lower];
  }
  if (lower === 'unknown' || lower === 'n/a') return 'Unknown';
  if (lower === 'other') return 'Other';

  return trimmed
    .replace(/\s+/g, ' ')
    .split(' ')
    .map(part => (part.length === 1 ? part.toUpperCase() : part[0].toUpperCase() + part.slice(1).toLowerCase()))
    .join(' ');
};

const parseCountriesFromValue = (value) => {
  if (!value) return [];
  const cleaned = String(value).replace(/\r?\n/g, ' ').trim();
  if (!cleaned) return [];
  return cleaned
    .split(/[;,]/)
    .map(part => normalizeCountryName(part))
    .filter(country => country && country !== 'Unknown' && country !== 'Other');
};

const csvLines = fs.readFileSync(CSV_PATH, 'utf8').trim().split(/\r?\n/);
const headers = csvLines.shift().split(',');

const idxConference = headers.indexOf('Conference');
const idxYear = headers.indexOf('Year');
const idxCountries = headers.indexOf('Countries');

const parseCsvRow = (line) => {
  const parts = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === ',' && !inQuotes) {
      parts.push(current);
      current = '';
      continue;
    }
    current += char;
  }
  parts.push(current);
  return parts.map(part => part.trim());
};

const records = csvLines.map(parseCsvRow);

const aggregateSummary = (conferenceFilter) => {
  const overall = new Map();
  const perYear = new Map();
  let unmappedOverall = 0;

  records.forEach((row) => {
    const conf = String(row[idxConference] ?? '').trim().toUpperCase();
    if (conferenceFilter && conf !== conferenceFilter) return;

    const year = Number(row[idxYear]);
    const countries = parseCountriesFromValue(row[idxCountries]);
    const unique = Array.from(new Set(countries));

    if (!perYear.has(year)) {
      perYear.set(year, { totalRows: 0, unmapped: 0, values: new Map() });
    }
    const yearBucket = perYear.get(year);
    yearBucket.totalRows += 1;

    if (unique.length === 0) {
      yearBucket.unmapped += 1;
      unmappedOverall += 1;
      return;
    }

    const weight = 1 / unique.length;
    unique.forEach((country) => {
      overall.set(country, (overall.get(country) ?? 0) + weight);
      yearBucket.values.set(country, (yearBucket.values.get(country) ?? 0) + weight);
    });
  });

  const sortedOverall = Array.from(overall.entries()).sort((a, b) => b[1] - a[1]);
  const topCountries = sortedOverall.slice(0, 10).map(([country]) => country);
  const otherOverall = sortedOverall.slice(10).reduce((sum, [, value]) => sum + value, 0);
  const totalOverall = sortedOverall.reduce((sum, [, value]) => sum + value, 0);

  const aggregatedPercentages = new Map();
  sortedOverall.forEach(([country, value]) => {
    aggregatedPercentages.set(country, Number(((value / totalOverall) * 100).toFixed(2)));
  });

  const perYearBreakdown = Array.from(perYear.entries()).map(([year, bucket]) => {
    const row = { year, totalRows: bucket.totalRows };
    let topSum = 0;
    topCountries.forEach((country) => {
      const value = bucket.values.get(country) ?? 0;
      const pct = bucket.totalRows > 0 ? (value / bucket.totalRows) * 100 : 0;
      row[country] = Number(pct.toFixed(2));
      topSum += pct;
    });

    const other = bucket.values.entries()
      .filter(([country]) => !topCountries.includes(country))
      .reduce((sum, [, value]) => sum + value, 0);

    const otherPct = bucket.totalRows > 0 ? (other / bucket.totalRows) * 100 : 0;
    const unmappedPct = bucket.totalRows > 0 ? (bucket.unmapped / bucket.totalRows) * 100 : 0;

    row['Other Countries'] = Number(otherPct.toFixed(2));
    row['Unmapped'] = Number(unmappedPct.toFixed(2));
    row['TopSum'] = Number(topSum.toFixed(2));

    return row;
  }).sort((a, b) => a.year - b.year);

  const totalRows = perYearBreakdown.reduce((sum, row) => sum + row.totalRows, 0);
  const weightedOtherPercent = totalRows > 0
    ? Number((perYearBreakdown.reduce((sum, row) => sum + (row['Other Countries'] * row.totalRows / 100), 0) / totalRows * 100).toFixed(2))
    : 0;

  return {
    topCountries,
    aggregatedPercentages,
    aggregatedOtherPercent: Number(((otherOverall / totalOverall) * 100).toFixed(2)),
    aggregatedUnmappedPercent: Number(((unmappedOverall / (totalOverall + unmappedOverall)) * 100 || 0).toFixed(2)),
    weightedOtherPercent,
    perYearBreakdown,
  };
};

const conferenceResult = aggregateSummary(conferenceCode);

console.log(`Dataset: ${datasetKey}`);
console.log(`Top countries for ${conferenceCode}:`, conferenceResult.topCountries.join(', '));
console.log('Aggregated percentages:');
conferenceResult.topCountries.forEach((country) => {
  console.log(`  ${country}: ${conferenceResult.aggregatedPercentages.get(country)}%`);
});
console.log(`  Other Countries: ${conferenceResult.aggregatedOtherPercent}%`);
console.log(`  Other Countries (weighted from per-year): ${conferenceResult.weightedOtherPercent}%`);
console.log(`  Unmapped (share of rows): ${conferenceResult.aggregatedUnmappedPercent}%`);

console.log('\nPer year breakdown (percentages by row count)');
conferenceResult.perYearBreakdown.forEach((row) => {
  const { year, totalRows, TopSum, ['Other Countries']: other, Unmapped: unmapped } = row;
  console.log(`${year} (rows=${totalRows}): TopSum=${TopSum.toFixed(2)}%, Other=${other.toFixed(2)}%, Unmapped=${unmapped.toFixed(2)}%`);
});
