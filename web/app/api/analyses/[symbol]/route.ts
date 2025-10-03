import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/services/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    const db = new DatabaseService();
    const analyses = await db.getAnalysesBySymbol(symbol.toUpperCase(), limit);

    return NextResponse.json({ success: true, symbol: symbol.toUpperCase(), analyses });
  } catch (error: any) {
    console.error('Error fetching analyses:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch analyses' },
      { status: 500 }
    );
  }
}


