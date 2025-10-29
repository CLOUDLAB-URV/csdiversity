# Data Integration Guide

This guide explains how to integrate your actual conference data into the application.

## Current Status

The application currently uses mock data generated in `lib/data/mock-data.ts`. To use your real data, follow these steps:

## Required Data Files

Place your CSV files in the `data/` directory with these exact names:

1. **unifiedPaperData.csv** - Papers with continent predominance
2. **unifiedCitationsData.csv** - Citations with continental distribution  
3. **unifiedCommitteeData.csv** - Committee member data
4. **big_companies_analysis_papers_new.csv** - Big Tech vs Academia analysis

## CSV Structure Examples

### unifiedPaperData.csv
```csv
year,conference,title,continent,authors,institutions,countries
2024,OSDI,"Sample Paper Title",North America,"Author1, Author2","Institution1, Institution2","USA, UK"
```

### unifiedCitationsData.csv
```csv
paper_id,conference,year,cited_by,continent_distribution,unknown_count
paper1,OSDI,2024,150,"North America:45, Europe:30, Asia:20, Others:5",0
```

### unifiedCommitteeData.csv
```csv
year,conference,member_name,institution,country,continent
2024,OSDI,"John Doe","University of X",USA,North America
```

### big_companies_analysis_papers_new.csv
```csv
year,conference,has_big_tech,companies,academic_count
2024,OSDI,1,"Google, Microsoft",50
```

## Integration Steps

### 1. Install CSV Parser

```bash
npm install papaparse @types/papaparse
```

### 2. Create Data Loader

Create `lib/data/load-data.ts`:

```typescript
import Papa from 'papaparse';

export async function loadPapersData() {
  const response = await fetch('/data/unifiedPaperData.csv');
  const csv = await response.text();
  return Papa.parse(csv, { header: true }).data;
}

export async function loadCitationsData() {
  const response = await fetch('/data/unifiedCitationsData.csv');
  const csv = await response.text();
  return Papa.parse(csv, { header: true }).data;
}

// ... similar for other files
```

### 3. Update Mock Data Functions

Replace the mock data functions in `lib/data/mock-data.ts`:

```typescript
import { loadPapersData } from './load-data';

export async function getContinentDistribution(): Promise<ContinentData[]> {
  const data = await loadPapersData();
  // Process and transform your CSV data
  return processPapersData(data);
}
```

### 4. Update Components to Use Async Data

In your page components, update to use async data loading:

```typescript
export default async function ContinentDistributionPage() {
  const data = await getContinentDistribution();
  // ...
}
```

Or use client-side data fetching with React Query or similar.

## Data Processing Examples

### Continent Distribution Processing

```typescript
function processPapersData(rawData: any[]): ContinentData[] {
  return rawData.map(row => ({
    conference: row.conference,
    year: parseInt(row.year),
    'North America': parseInt(row.north_america),
    'Europe': parseInt(row.europe),
    'Asia': parseInt(row.asia),
    'Others': parseInt(row.others),
  }));
}
```

### Asian Trends Processing

```typescript
function processAsianTrends(rawData: any[]): AsianTrendData[] {
  return rawData.map(row => ({
    conference: row.conference,
    year: parseInt(row.year),
    percentage: parseFloat(row.asian_percentage),
  }));
}
```

## Color Scheme Reference

When processing data, maintain these color codes:

- North America: `#1f3b6f`
- Europe: `#1681c5`  
- Asia: `#7d7d7d`
- Others: `#c5c5c5`
- Big Tech: `#c5c5c5`
- Academia: `#1f3b6f`

## Validation

After integration, validate:

1. Data loads correctly
2. Charts render properly
3. Filters work as expected
4. No console errors
5. Performance is acceptable

## Performance Optimization

For large datasets:

1. Use server-side data processing
2. Implement pagination
3. Cache processed data
4. Use React.memo for expensive components
5. Consider data aggregation at load time

## Testing

Test with:

- Small sample (100 rows)
- Medium dataset (1000 rows)
- Full dataset to check performance

## Questions?

See the main README or create an issue in the repository.


