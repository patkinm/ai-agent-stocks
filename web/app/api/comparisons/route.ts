import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/services/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    const db = new DatabaseService();
    const comparisons = await db.getCompletedComparisons(limit);
    const stats = await db.getComparisonStats();

    return NextResponse.json({ success: true, comparisons, stats });
  } catch (error: any) {
    console.error('Error fetching comparisons:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch comparisons' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = new DatabaseService();

    // Get all pending comparisons
    const pending = await db.getPendingComparisons();

    // Update each one
    let updated = 0;
    for (const comparison of pending) {
      try {
        await db.updatePredictionComparison(comparison._id!.toString());
        updated++;
      } catch (error) {
        console.error(`Error updating comparison ${comparison._id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updated} of ${pending.length} pending comparisons`,
      updated,
      total: pending.length,
    });
  } catch (error: any) {
    console.error('Error updating comparisons:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update comparisons' },
      { status: 500 }
    );
  }
}


