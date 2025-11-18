const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

const normalizeConferenceName = (conf) => {
  const normalized = String(conf || '').trim().toUpperCase();
  const conferenceMap = {
    'CLOUD': 'SOCC',
    'IEEECLOUD': 'IEEECLOUD',
    'IEEE CLOUD': 'IEEECLOUD',
  };
  return conferenceMap[normalized] || normalized;
};

const normalizeContinentForDistribution = (c) => {
  const val = String(c || '').trim().toUpperCase();
  if (!val) return null;
  if (['NA', 'NORTH AMERICA', 'NORTH_AMERICA', 'AMERICA'].includes(val)) return 'North America';
  if (['EU', 'EUROPE'].includes(val)) return 'Europe';
  if (['AS', 'ASIA'].includes(val)) return 'Asia';
  if (['SA', 'SOUTH AMERICA', 'OC', 'OCEANIA', 'AF', 'AFRICA'].includes(val)) return 'Others';
  return null;
};

const testAsianTrends = (data) => {
  console.log('\n=== Testing Asian Trends Calculation ===');
  
  const counts = new Map();
  
  data.forEach(row => {
    const conf = normalizeConferenceName(row.conference || row.Conference);
    const year = Number(row.year || row.Year);
    if (!conf || !Number.isFinite(year)) return;
    
    const continent = normalizeContinentForDistribution(
      row.predominant_continent || row['Predominant Continent'] || row.continent
    );
    if (!continent) return;
    
    const id = `${conf}:${year}`;
    const cur = counts.get(id) || { asia: 0, total: 0, conference: conf, year };
    cur.total += 1;
    if (continent === 'Asia') cur.asia += 1;
    counts.set(id, cur);
  });
  
  const results = Array.from(counts.values())
    .map(({ conference, year, asia, total }) => ({
      conference,
      year,
      asia,
      total,
      percentage: total > 0 ? Number(((asia / total) * 100).toFixed(2)) : 0,
    }))
    .sort((a, b) => a.year - b.year || a.conference.localeCompare(b.conference));
  
  console.log(`Total conference-year combinations: ${results.length}`);
  
  const years = Array.from(new Set(results.map(r => r.year))).sort((a, b) => a - b);
  const firstYear = years[0];
  const lastYear = years[years.length - 1];
  
  console.log(`Year range: ${firstYear} - ${lastYear}`);
  
  const firstYearItems = results.filter(r => r.year === firstYear);
  const lastYearItems = results.filter(r => r.year === lastYear);
  
  const avgFirst = firstYearItems.reduce((s, r) => s + r.percentage, 0) / firstYearItems.length;
  const avgLast = lastYearItems.reduce((s, r) => s + r.percentage, 0) / lastYearItems.length;
  const growth = Number((avgLast - avgFirst).toFixed(2));
  
  console.log(`\nAsian percentage in ${firstYear}: ${avgFirst.toFixed(2)}% (avg across ${firstYearItems.length} conferences)`);
  console.log(`Asian percentage in ${lastYear}: ${avgLast.toFixed(2)}% (avg across ${lastYearItems.length} conferences)`);
  console.log(`Growth: ${growth >= 0 ? '+' : ''}${growth}%`);
  
  console.log(`\nSample data for year ${lastYear}:`);
  lastYearItems.slice(0, 5).forEach(item => {
    console.log(`  ${item.conference}: ${item.asia}/${item.total} = ${item.percentage}%`);
  });
  
  const allValid = results.every(r => {
    return r.percentage >= 0 && r.percentage <= 100 && r.asia <= r.total;
  });
  
  console.log(`\nValidation: All percentages in valid range (0-100%)? ${allValid ? '✓' : '✗'}`);
  
  return allValid;
};

const main = async () => {
  console.log('=== Asian Trends Verification ===\n');
  
  const dataDir = path.join(__dirname, '..', 'data');
  const papersFile = path.join(dataDir, 'unifiedPaperData.csv');
  
  if (!fs.existsSync(papersFile)) {
    console.error('Papers data file not found!');
    return;
  }
  
  const papersCSV = fs.readFileSync(papersFile, 'utf8');
  const papersParsed = Papa.parse(papersCSV, { header: true, skipEmptyLines: true });
  const papersData = papersParsed.data;
  
  console.log(`Loaded ${papersData.length} papers`);
  
  const test = testAsianTrends(papersData);
  
  console.log(`\n=== Result: ${test ? '✓ PASS' : '✗ FAIL'} ===`);
};

main().catch(console.error);



