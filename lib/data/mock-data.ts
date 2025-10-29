// Mock data for demonstration
// In production, this would be replaced with actual CSV/JSON data

export const conferences = ['OSDI', 'SOSP', 'ASPLOS', 'NSDI', 'SIGCOMM'];

export const years = Array.from({ length: 25 }, (_, i) => 2000 + i);

export interface ContinentData {
  conference: string;
  year: number;
  'North America': number;
  'Europe': number;
  'Asia': number;
  'Others': number;
}

export interface AsianTrendData {
  conference: string;
  year: number;
  percentage: number;
}

export interface BigTechData {
  conference: string;
  year: number;
  bigTech: number;
  academia: number;
}

export function getContinentDistribution(): ContinentData[] {
  const data: ContinentData[] = [];
  
  for (const conf of conferences) {
    for (let year = 2000; year <= 2024; year++) {
      // Simulating varied data
      const baseNA = 50 + Math.random() * 20;
      const baseEU = 20 + Math.random() * 15;
      const baseAS = 15 + Math.random() * 20;
      const baseOT = 5 + Math.random() * 10;
      
      const total = baseNA + baseEU + baseAS + baseOT;
      
      data.push({
        conference: conf,
        year,
        'North America': Math.round((baseNA / total) * 100),
        'Europe': Math.round((baseEU / total) * 100),
        'Asia': Math.round((baseAS / total) * 100),
        'Others': Math.round((baseOT / total) * 100),
      });
    }
  }
  
  return data;
}

export function getAsianTrends(): AsianTrendData[] {
  const data: AsianTrendData[] = [];
  
  for (const conf of conferences) {
    for (let year = 2000; year <= 2024; year++) {
      // Simulating increasing trend for Asia
      const trendFactor = (year - 2000) / 24;
      const percentage = 10 + trendFactor * 30 + Math.random() * 10;
      
      data.push({
        conference: conf,
        year,
        percentage: Math.round(percentage),
      });
    }
  }
  
  return data;
}

export function getBigTechData(): BigTechData[] {
  const data: BigTechData[] = [];
  
  for (const conf of conferences) {
    for (let year = 2000; year <= 2024; year++) {
      // Simulating big tech growth
      const trendFactor = (year - 2000) / 24;
      const bigTech = 15 + trendFactor * 25 + Math.random() * 10;
      const academia = 100 - bigTech;
      
      data.push({
        conference: conf,
        year,
        bigTech: Math.round(bigTech),
        academia: Math.round(academia),
      });
    }
  }
  
  return data;
}


