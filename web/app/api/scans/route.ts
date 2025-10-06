import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/services/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    const db = new DatabaseService();
    const scans = await db.getAllScans(limit);

    return NextResponse.json({ success: true, scans });
  } catch (error: any) {
    console.error('Error fetching scans:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch scans' }, { status: 500 });
  }
}





