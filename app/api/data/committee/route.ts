import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import Papa from 'papaparse';

export async function GET() {
  try {
    const filePath = join(process.cwd(), 'data', 'unifiedCommitteeData.csv');
    const fileContent = await readFile(filePath, 'utf-8');
    const parsed = Papa.parse(fileContent, { header: true, skipEmptyLines: true });
    
    return NextResponse.json({ data: parsed.data });
  } catch (error: any) {
    console.error('Error loading committee data:', error);
    return NextResponse.json(
      { error: 'Failed to load committee data', message: error?.message },
      { status: 500 }
    );
  }
}



