import { NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/services/database';

export async function GET() {
  try {
    const db = new DatabaseService();
    const tickers = await db.getAllAnalyzedTickers();

    return NextResponse.json({ success: true, tickers });
  } catch (error: any) {
    console.error('Error fetching tickers:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch tickers' },
      { status: 500 }
    );
  }
}


