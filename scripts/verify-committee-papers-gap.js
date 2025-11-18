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

const normalizeCont = (c) => {
  const val = String(c || '').trim().toUpperCase();
  if (!val) return null;
  if (['NA', 'NORTH AMERICA', 'NORTH_AMERICA', 'AMERICA'].includes(val)) return 'North America';
  if (['EU', 'EUROPE'].includes(val)) return 'Europe';
  if (['AS', 'ASIA'].includes(val)) return 'Asia';
  if (['SA', 'SOUTH AMERICA', 'OC', 'OCEANIA', 'AF', 'AFRICA'].includes(val)) return 'Other';
  if (val === 'UNKNOWN') return 'Unknown';
  return null;
};

const testCommitteeVsPapers = (papersData, committeeData) => {
  console.log('\n=== Testing Committee vs Papers Gap ===');
  
  const papersByConf = new Map();
  for (const r of papersData) {
    const conf = normalizeConferenceName(r.conference || r.Conference || '');
    if (!conf) continue;
    const cont = normalizeCont(r.predominant_continent || r['Predominant Continent'] || r.continent || '');
    if (!cont) continue;
    if (!papersByConf.has(conf)) papersByConf.set(conf, new Map());
    const contMap = papersByConf.get(conf);
    contMap.set(cont, (contMap.get(cont) || 0) + 1);
  }

  const committeeByConf = new Map();
  for (const r of committeeData) {
    const conf = normalizeConferenceName(r.conference || r.Conference || '');
    if (!conf) continue;
    const cont = normalizeCont(r.continent || r.Continent || '');
    if (!cont) continue;
    if (!committeeByConf.has(conf)) committeeByConf.set(conf, new Map());
    const contMap = committeeByConf.get(conf);
    contMap.set(cont, (contMap.get(cont) || 0) + 1);
  }

  const allConfs = new Set([...papersByConf.keys(), ...committeeByConf.keys()]);
  const continents = ['North America', 'Europe', 'Asia', 'Other', 'Unknown'];
  const result = [];

  for (const conf of allConfs) {
    const pMap = papersByConf.get(conf) || new Map();
    const cMap = committeeByConf.get(conf) || new Map();
    
    const pTotal = Array.from(pMap.values()).reduce((s, v) => s + v, 0);
    const cTotal = Array.from(cMap.values()).reduce((s, v) => s + v, 0);

    if (pTotal === 0 && cTotal === 0) {
      continue;
    }

    for (const cont of continents) {
      const pCount = pMap.get(cont) || 0;
      const cCount = cMap.get(cont) || 0;
      
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
  
  console.log(`Total conferences analyzed: ${allConfs.size}`);
  console.log(`Total results (conference x continent): ${result.length}`);
  
  const sampleConf = Array.from(allConfs)[0];
  const sampleResults = result.filter(r => r.conference === sampleConf);
  
  console.log(`\nSample: ${sampleConf}`);
  sampleResults.forEach(r => {
    console.log(`  ${r.continent.padEnd(15)}: Papers ${r.papersPercent.toString().padStart(6)}%, Committee ${r.committeePercent.toString().padStart(6)}%, Gap ${r.gap >= 0 ? '+' : ''}${r.gap}%`);
  });
  
  const sumPapers = sampleResults.reduce((s, r) => s + r.papersPercent, 0);
  const sumCommittee = sampleResults.reduce((s, r) => s + r.committeePercent, 0);
  
  console.log(`\nPercentage sums for ${sampleConf}:`);
  console.log(`  Papers: ${sumPapers.toFixed(2)}% (should be 100%)`);
  console.log(`  Committee: ${sumCommittee.toFixed(2)}% (should be 100%)`);
  
  const validSums = Math.abs(sumPapers - 100) < 0.1 && Math.abs(sumCommittee - 100) < 0.1;
  
  console.log(`\nGap examples:`);
  const gapExamples = result
    .filter(r => Math.abs(r.gap) > 5)
    .sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap))
    .slice(0, 5);
  
  gapExamples.forEach(r => {
    console.log(`  ${r.conference} ${r.continent}: ${r.gap >= 0 ? '+' : ''}${r.gap}% (Committee ${r.committeePercent}% vs Papers ${r.papersPercent}%)`);
  });
  
  const allValid = result.every(r => {
    return r.papersPercent >= 0 && r.papersPercent <= 100 &&
           r.committeePercent >= 0 && r.committeePercent <= 100;
  });
  
  console.log(`\nValidation: All percentages in range? ${allValid ? '✓' : '✗'}`);
  console.log(`Validation: Sample sums correct? ${validSums ? '✓' : '✗'}`);
  
  return allValid && validSums;
};

const main = async () => {
  console.log('=== Committee vs Papers Verification ===\n');
  
  const dataDir = path.join(__dirname, '..', 'data');
  const papersFile = path.join(dataDir, 'unifiedPaperData.csv');
  const committeeFile = path.join(dataDir, 'unifiedCommitteeData.csv');
  
  if (!fs.existsSync(papersFile) || !fs.existsSync(committeeFile)) {
    console.error('Data files not found!');
    return;
  }
  
  const papersCSV = fs.readFileSync(papersFile, 'utf8');
  const papersParsed = Papa.parse(papersCSV, { header: true, skipEmptyLines: true });
  const papersData = papersParsed.data;
  
  const committeeCSV = fs.readFileSync(committeeFile, 'utf8');
  const committeeParsed = Papa.parse(committeeCSV, { header: true, skipEmptyLines: true });
  const committeeData = committeeParsed.data;
  
  console.log(`Loaded ${papersData.length} papers`);
  console.log(`Loaded ${committeeData.length} committee members`);
  
  const test = testCommitteeVsPapers(papersData, committeeData);
  
  console.log(`\n=== Result: ${test ? '✓ PASS' : '✗ FAIL'} ===`);
};

main().catch(console.error);



