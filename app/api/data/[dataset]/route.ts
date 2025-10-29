import { NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';
import Papa from 'papaparse';

const DATASET_TO_FILENAME: Record<string, string> = {
  papers: 'unifiedPaperData.csv',
  citations: 'unifiedCitationsData.csv',
  committee: 'unifiedCommitteeData.csv',
  bigtech: 'big_companies_analysis_papers_new.csv',
};

export async function GET(
  _request: Request,
  { params }: { params: { dataset: string } }
) {
  const dataset = params.dataset;
  const filename = DATASET_TO_FILENAME[dataset];

  if (!filename) {
    return NextResponse.json({ error: 'Unknown dataset' }, { status: 404 });
  }

  try {
    const filePath = path.join(process.cwd(), 'data', filename);
    const csv = await fs.readFile(filePath, 'utf8');
    const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true });

    if (parsed.errors && parsed.errors.length > 0) {
      return NextResponse.json({ error: 'CSV parse error', details: parsed.errors }, { status: 500 });
    }

    return NextResponse.json({ data: parsed.data });
  } catch (error: any) {
    if (error?.code === 'ENOENT') {
      return NextResponse.json({ error: 'Dataset file not found', filename }, { status: 404 });
    }
    return NextResponse.json({ error: error?.message ?? 'Failed to load dataset' }, { status: 500 });
  }
}


