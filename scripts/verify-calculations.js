const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

const testContinentDistribution = (data) => {
  console.log('\n=== Testing Continent Distribution ===');
  
  const continents = { NA: 0, EU: 0, Asia: 0, Others: 0 };
  let total = 0;
  
  data.forEach(row => {
    total++;
    const continent = (row.predominant_continent || row['Predominant Continent'] || '').trim().toUpperCase();
    if (['NA', 'NORTH AMERICA', 'NORTH_AMERICA', 'AMERICA'].includes(continent)) {
      continents.NA++;
    } else if (['EU', 'EUROPE'].includes(continent)) {
      continents.EU++;
    } else if (['AS', 'ASIA'].includes(continent)) {
      continents.Asia++;
    } else if (['SA', 'SOUTH AMERICA', 'OC', 'OCEANIA', 'AF', 'AFRICA'].includes(continent)) {
      continents.Others++;
    }
  });
  
  const classified = continents.NA + continents.EU + continents.Asia + continents.Others;
  const unclassified = total - classified;
  
  console.log(`Total papers: ${total}`);
  console.log(`Classified: ${classified} (${((classified/total)*100).toFixed(2)}%)`);
  console.log(`Unclassified: ${unclassified} (${((unclassified/total)*100).toFixed(2)}%)`);
  console.log(`North America: ${continents.NA} (${((continents.NA/classified)*100).toFixed(2)}%)`);
  console.log(`Europe: ${continents.EU} (${((continents.EU/classified)*100).toFixed(2)}%)`);
  console.log(`Asia: ${continents.Asia} (${((continents.Asia/classified)*100).toFixed(2)}%)`);
  console.log(`Others: ${continents.Others} (${((continents.Others/classified)*100).toFixed(2)}%)`);
  
  const sum = (continents.NA/classified + continents.EU/classified + continents.Asia/classified + continents.Others/classified) * 100;
  console.log(`Sum of percentages: ${sum.toFixed(2)}% (should be 100%)`);
  
  return Math.abs(sum - 100) < 0.01;
};

const testBigTech = (data) => {
  console.log('\n=== Testing Big Tech Analysis ===');
  
  let total = 0;
  let withInstitutions = 0;
  let bigTech = 0;
  let academia = 0;
  
  const bigTechPatterns = [
    /\bgoogle\b/i, /\bmicrosoft\b/i, /\bmeta\b/i, /\bfacebook\b/i,
    /\bamazon\b/i, /\baws\b/i, /\bapple\b/i, /\bibm\b/i,
    /\bhuawei\b/i, /\balibaba\b/i, /\btencent\b/i
  ];
  
  data.forEach(row => {
    total++;
    const institutions = String(row.institutions || row.Institutions || '').trim();
    
    if (institutions) {
      withInstitutions++;
      const hasBigTech = bigTechPatterns.some(pattern => pattern.test(institutions));
      if (hasBigTech) {
        bigTech++;
      } else {
        academia++;
      }
    }
  });
  
  const unmapped = total - withInstitutions;
  
  console.log(`Total papers: ${total}`);
  console.log(`With institutions: ${withInstitutions} (${((withInstitutions/total)*100).toFixed(2)}%)`);
  console.log(`Big Tech: ${bigTech} (${((bigTech/total)*100).toFixed(2)}%)`);
  console.log(`Academia: ${academia} (${((academia/total)*100).toFixed(2)}%)`);
  console.log(`Unmapped: ${unmapped} (${((unmapped/total)*100).toFixed(2)}%)`);
  
  const sumCheck = bigTech + academia + unmapped;
  console.log(`Sum check: ${sumCheck} === ${total} ? ${sumCheck === total}`);
  
  const percentSum = ((bigTech/total) + (academia/total) + (unmapped/total)) * 100;
  console.log(`Percentage sum: ${percentSum.toFixed(2)}% (should be 100%)`);
  
  return Math.abs(percentSum - 100) < 0.01 && sumCheck === total;
};

const testCountryFractional = (data) => {
  console.log('\n=== Testing Country Fractional Counting ===');
  
  const totals = new Map();
  let unmapped = 0;
  
  data.forEach(row => {
    const countriesStr = row.Countries || row.countries || row.Country || row.country || '';
    const countries = countriesStr.split(/[;,]/).map(c => c.trim()).filter(Boolean);
    const unique = Array.from(new Set(countries));
    
    if (unique.length === 0) {
      unmapped++;
      return;
    }
    
    const weight = 1 / unique.length;
    unique.forEach(country => {
      totals.set(country, (totals.get(country) || 0) + weight);
    });
  });
  
  const totalWeight = Array.from(totals.values()).reduce((sum, val) => sum + val, 0);
  const totalPapers = data.length;
  
  console.log(`Total papers: ${totalPapers}`);
  console.log(`Unmapped: ${unmapped}`);
  console.log(`Total weight (should equal papers - unmapped): ${totalWeight.toFixed(2)}`);
  console.log(`Expected: ${totalPapers - unmapped}`);
  console.log(`Unique countries: ${totals.size}`);
  
  const top5 = Array.from(totals.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  console.log('\nTop 5 countries:');
  top5.forEach(([country, weight], idx) => {
    console.log(`  ${idx + 1}. ${country}: ${weight.toFixed(2)} (${((weight/totalWeight)*100).toFixed(2)}%)`);
  });
  
  return Math.abs(totalWeight - (totalPapers - unmapped)) < 0.01;
};

const main = async () => {
  console.log('=== Verification of Plot Calculations ===\n');
  
  const dataDir = path.join(__dirname, '..', 'data');
  
  const papersFile = path.join(dataDir, 'unifiedPaperData.csv');
  const papersCountryFile = path.join(dataDir, 'unifiedPaperCountryData.csv');
  
  if (!fs.existsSync(papersFile)) {
    console.error('Papers data file not found!');
    return;
  }
  
  const papersCSV = fs.readFileSync(papersFile, 'utf8');
  const papersParsed = Papa.parse(papersCSV, { header: true, skipEmptyLines: true });
  const papersData = papersParsed.data;
  
  console.log(`Loaded ${papersData.length} papers from unified dataset`);
  
  const test1 = testContinentDistribution(papersData);
  const test2 = testBigTech(papersData);
  
  if (fs.existsSync(papersCountryFile)) {
    const papersCountryCSV = fs.readFileSync(papersCountryFile, 'utf8');
    const papersCountryParsed = Papa.parse(papersCountryCSV, { header: true, skipEmptyLines: true });
    const papersCountryData = papersCountryParsed.data;
    
    console.log(`\nLoaded ${papersCountryData.length} papers from country dataset`);
    const test3 = testCountryFractional(papersCountryData);
    
    console.log('\n=== Test Results ===');
    console.log(`Continent Distribution: ${test1 ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`Big Tech Analysis: ${test2 ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`Country Fractional: ${test3 ? '✓ PASS' : '✗ FAIL'}`);
  } else {
    console.log('\n=== Test Results ===');
    console.log(`Continent Distribution: ${test1 ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`Big Tech Analysis: ${test2 ? '✓ PASS' : '✗ FAIL'}`);
  }
};

main().catch(console.error);

