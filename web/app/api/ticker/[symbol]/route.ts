import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/services/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;
    const db = new DatabaseService();
    const analyses = await db.getAnalysesBySymbolChronological(symbol.toUpperCase());

    return NextResponse.json({ 
      success: true, 
      symbol: symbol.toUpperCase(), 
      analyses 
    });
  } catch (error: any) {
    console.error('Error fetching ticker analyses:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch ticker analyses' },
      { status: 500 }
    );
  }
}
