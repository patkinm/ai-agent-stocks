import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/services/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    const db = new DatabaseService();
    const analyses = await db.getAnalysesWithPredictions(limit);
    const stats = await db.getPredictionStats();

    return NextResponse.json({ success: true, analyses, stats });
  } catch (error: any) {
    console.error('Error fetching predictions:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch predictions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = new DatabaseService();

    // Get all pending predictions
    const pending = await db.getPendingPredictionUpdates();

    // Update each one
    let updated = 0;
    for (const analysis of pending) {
      try {
        await db.updateAnalysisPrediction(analysis._id!.toString());
        updated++;
      } catch (error) {
        console.error(`Error updating analysis ${analysis._id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updated} of ${pending.length} pending predictions`,
      updated,
      total: pending.length,
    });
  } catch (error: any) {
    console.error('Error updating predictions:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update predictions' },
      { status: 500 }
    );
  }
}
