import path from 'path';
import { promises as fs } from 'fs';
import Papa from 'papaparse';
import { processContinentDistribution, processCommitteeContinentDistribution, type ContinentDistributionItem } from './load-data';

const DATASET_TO_FILENAME: Record<string, string> = {
  papers: 'unifiedPaperData.csv',
  committee: 'unifiedCommitteeData.csv',
};

export async function loadDatasetStatic(dataset: 'papers' | 'committee'): Promise<any[]> {
  const filename = DATASET_TO_FILENAME[dataset];

  if (!filename) {
    throw new Error(`Unknown dataset: ${dataset}`);
  }

  try {
    const filePath = path.join(process.cwd(), 'data', filename);
    const csv = await fs.readFile(filePath, 'utf8');
    const parsed = Papa.parse(csv, { 
      header: true, 
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      transform: (value) => value?.trim() || '',
      dynamicTyping: false,
    });

    if (parsed.errors && parsed.errors.length > 0) {
      const criticalErrors = parsed.errors.filter((e: any) => 
        e.type !== 'FieldMismatch' && e.code !== 'TooFewFields' && e.code !== 'TooManyFields'
      );
      if (criticalErrors.length > 0) {
        console.warn('CSV parse warnings:', parsed.errors.slice(0, 5));
      }
    }

    return parsed.data as any[];
  } catch (error: any) {
    if (error?.code === 'ENOENT') {
      throw new Error(`Dataset file not found: ${filename}`);
    }
    throw new Error(`Failed to load dataset ${dataset}: ${error?.message ?? 'Unknown error'}`);
  }
}

export { processContinentDistribution, processCommitteeContinentDistribution, type ContinentDistributionItem };

