import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/services/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = new DatabaseService();
    
    const scan = await db.getScanById(id);
    if (!scan) {
      return NextResponse.json({ error: 'Scan not found' }, { status: 404 });
    }

    const analyses = await db.getAnalysesByScanId(id);

    return NextResponse.json({ 
      success: true, 
      scan,
      analyses 
    });
  } catch (error: any) {
    console.error('Error fetching scan details:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch scan details' },
      { status: 500 }
    );
  }
}





