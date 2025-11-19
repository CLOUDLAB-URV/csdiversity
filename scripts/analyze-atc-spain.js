const fs = require('fs');
const path = require('path');

// Same normalization functions as in the component
const COUNTRY_ALIASES = {
  "usa": "United States",
  "u.s.a.": "United States",
  "u.s.": "United States",
  "united states of america": "United States",
  "united states": "United States",
  "the united states": "United States",
  "uk": "United Kingdom",
  "u.k.": "United Kingdom",
  "great britain": "United Kingdom",
  "united kingdom of great britain and northern ireland": "United Kingdom",
  "south korea": "South Korea",
  "republic of korea": "South Korea",
  "korea, republic of": "South Korea",
  "korea, south": "South Korea",
  "korea (south)": "South Korea",
  "north korea": "North Korea",
  "peoples republic of china": "China",
  "people's republic of china": "China",
  "p.r. china": "China",
  "mainland china": "China",
  "hong kong sar": "Hong Kong",
  "hong kong s.a.r.": "Hong Kong",
  "czech republic": "Czechia",
  "the netherlands": "Netherlands",
  "russian federation": "Russia",
  "uae": "United Arab Emirates",
  "u.a.e.": "United Arab Emirates",
  "iran, islamic republic of": "Iran",
  "islamic republic of iran": "Iran",
  "venezuela, bolivarian republic of": "Venezuela",
  "bolivarian republic of venezuela": "Venezuela",
};

function normalizeCountryName(country) {
  if (!country) return "Unknown";
  const trimmed = country.trim();
  if (!trimmed) return "Unknown";

  const lower = trimmed.toLowerCase();
  if (COUNTRY_ALIASES[lower]) {
    return COUNTRY_ALIASES[lower];
  }

  if (lower === "unknown" || lower === "n/a") return "Unknown";
  if (lower === "other") return "Other";

  if (lower.startsWith("republic of")) {
    const rest = trimmed.substring("Republic of".length).trim();
    if (rest) {
      return `Republic of ${rest
        .split(" ")
        .map((part) => {
          if (!part) return part;
          if (part.length === 1) return part.toUpperCase();
          return part[0].toUpperCase() + part.slice(1).toLowerCase();
        })
        .join(" ")}`;
    }
    return "Republic Of";
  }

  return trimmed
    .replace(/\s+/g, " ")
    .split(" ")
    .map((part, index, array) => {
      if (!part) return part;
      if (part.toLowerCase() === "of" && index > 0 && index < array.length - 1) {
        return "of";
      }
      if (part.length === 1) return part.toUpperCase();
      return part[0].toUpperCase() + part.slice(1).toLowerCase();
    })
    .join(" ");
}

function parseCountriesFromValue(value) {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .flatMap((item) => parseCountriesFromValue(item))
      .map((item) => normalizeCountryName(item))
      .filter(Boolean)
      .filter((country) => country !== "Unknown" && country !== "Other");
  }

  if (typeof value === "string") {
    const cleaned = value.replace(/\r?\n/g, " ").trim();
    if (!cleaned) return [];
    
    const parts = [];
    const separators = /[;,]/g;
    let lastIndex = 0;
    let match;
    
    while ((match = separators.exec(cleaned)) !== null) {
      const before = cleaned.substring(lastIndex, match.index).trim();
      const after = cleaned.substring(match.index + 1).trim();
      
      const afterLower = after.toLowerCase();
      if (afterLower.startsWith("republic of") || afterLower.startsWith("islamic republic of") || afterLower.startsWith("bolivarian republic of")) {
        continue;
      }
      
      if (before.trim()) {
        parts.push(before.trim());
      }
      lastIndex = match.index + 1;
    }
    
    const remaining = cleaned.substring(lastIndex).trim();
    if (remaining) {
      parts.push(remaining);
    }
    
    const finalParts = parts.length > 0 ? parts : cleaned.split(/[;,]/).map(p => p.trim()).filter(Boolean);
    
    return finalParts
      .map((part) => normalizeCountryName(part))
      .filter(Boolean)
      .filter((country) => country !== "Unknown" && country !== "Other");
  }

  return [];
}

function computeCountryRankingForATC(rows) {
  // Filter for ATC conference
  const atcRows = rows.filter((row) => {
    const conf = String(row?.conference ?? row?.Conference ?? "").trim().toUpperCase();
    return conf === "ATC";
  });

  console.log(`Total ATC papers: ${atcRows.length}`);

  const totals = new Map();
  let unmapped = 0;

  atcRows.forEach((row) => {
    const countries = parseCountriesFromValue(row?.countries ?? row?.Countries ?? row?.country ?? row?.Country);
    const unique = Array.from(new Set(countries));
    if (unique.length === 0) {
      unmapped += 1;
      return;
    }
    const weight = 1 / unique.length;
    unique.forEach((country) => {
      totals.set(country, (totals.get(country) ?? 0) + weight);
    });
  });

  const totalWeight = Array.from(totals.values()).reduce((sum, value) => sum + value, 0);
  
  if (totalWeight === 0) {
    console.log("No data found for ATC");
    return null;
  }

  const entries = Array.from(totals.entries())
    .map(([country, weight]) => ({
      country,
      percent: Number(((weight / totalWeight) * 100).toFixed(2)),
      totalWeight: Number(weight.toFixed(2)),
    }))
    .sort((a, b) => b.percent - a.percent || a.country.localeCompare(b.country))
    .map((entry, index) => ({ ...entry, rank: index + 1 }));

  return {
    entries,
    totalRows: atcRows.length,
    unmappedCount: unmapped,
    totalWeight,
  };
}

async function main() {
  const csvPath = path.join(__dirname, '..', 'data', 'unifiedPaperCountryData.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.error(`File not found: ${csvPath}`);
    process.exit(1);
  }

  console.log('Loading data from CSV...');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n');
  const headers = lines[0].split(',');
  
  // Find column indices
  const conferenceIdx = headers.findIndex(h => h.toLowerCase() === 'conference');
  const countriesIdx = headers.findIndex(h => h.toLowerCase() === 'countries');
  const countryIdx = headers.findIndex(h => h.toLowerCase() === 'country');
  
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Simple CSV parsing (handles quoted fields)
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current);
    
    if (values.length > Math.max(conferenceIdx, countriesIdx, countryIdx)) {
      rows.push({
        conference: values[conferenceIdx]?.trim(),
        Conference: values[conferenceIdx]?.trim(),
        countries: values[countriesIdx]?.trim() || values[countryIdx]?.trim(),
        Countries: values[countriesIdx]?.trim() || values[countryIdx]?.trim(),
        country: values[countryIdx]?.trim() || values[countriesIdx]?.trim(),
        Country: values[countryIdx]?.trim() || values[countriesIdx]?.trim(),
      });
    }
  }

  console.log(`Loaded ${rows.length} rows from CSV`);
  
  const ranking = computeCountryRankingForATC(rows);
  
  if (!ranking) {
    console.log('No ranking data found');
    return;
  }

  console.log('\n=== ATC Country Rankings ===');
  console.log(`Total papers: ${ranking.totalRows}`);
  console.log(`Unmapped: ${ranking.unmappedCount}`);
  console.log(`Total weighted count: ${ranking.totalWeight.toFixed(2)}\n`);

  // Find Spain
  const spainEntry = ranking.entries.find(e => 
    e.country.toLowerCase() === 'spain' || 
    e.country.toLowerCase() === 'españa'
  );

  if (spainEntry) {
    console.log(`\n🇪🇸 SPAIN:`);
    console.log(`   Rank: #${spainEntry.rank}`);
    console.log(`   Share: ${spainEntry.percent}%`);
    console.log(`   Weighted Count: ${spainEntry.totalWeight.toFixed(2)}`);
  } else {
    console.log('\n❌ Spain not found in rankings');
    console.log('\nAvailable countries (first 20):');
    ranking.entries.slice(0, 20).forEach(e => {
      console.log(`   ${e.rank}. ${e.country}: ${e.percent}%`);
    });
  }

  console.log('\n=== Top 10 Countries ===');
  ranking.entries.slice(0, 10).forEach(e => {
    const marker = e.country.toLowerCase() === 'spain' ? '🇪🇸' : '  ';
    console.log(`${marker} ${e.rank}. ${e.country}: ${e.percent}% (${e.totalWeight.toFixed(2)})`);
  });
}

main().catch(console.error);

