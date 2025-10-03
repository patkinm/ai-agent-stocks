import { NextRequest, NextResponse } from 'next/server';
import { StockAnalyzer } from '@/lib/services/stock-analyzer';
import { DatabaseService } from '@/lib/services/database';
import { MarketDataFetcher } from '@/lib/services/market-data';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symbol, scanId: providedScanId } = body;

    console.log('=== ANALYZE API CALLED ===');
    console.log('Symbol:', symbol);
    console.log('Provided scanId:', providedScanId);

    if (!symbol) {
      return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    const analyzer = new StockAnalyzer(apiKey);
    const marketData = new MarketDataFetcher();
    const db = new DatabaseService();

    // Create a scan session if not provided
    let scanId = providedScanId;
    if (!scanId) {
      console.log('No scanId provided, creating new scan session...');
      try {
        scanId = await db.saveScanSession('single', [symbol.toUpperCase()]);
        console.log('✅ Created scan session:', scanId);
      } catch (scanError) {
        console.error('❌ Failed to create scan session:', scanError);
        throw scanError;
      }
    } else {
      console.log('Using provided scanId:', scanId);
    }

    // Get stock data first to merge with analysis
    const stockData = await marketData.getStockData(symbol.toUpperCase(), '3mo');
    if (!stockData) {
      return NextResponse.json({ error: `Could not fetch data for ${symbol}` }, { status: 404 });
    }

    // Analyze the stock
    const analysis = await analyzer.analyzeStockForBinaryDecision(symbol.toUpperCase());

    if (analysis.error) {
      return NextResponse.json({ error: analysis.error }, { status: 500 });
    }

    // Merge stock data with analysis
    const fullAnalysis = { ...analysis, ...stockData };

    // Save to database
    console.log('Saving analysis with scanId:', scanId);
    const analysisId = await db.saveAnalysis(fullAnalysis, scanId);
    console.log('✅ Saved analysis with ID:', analysisId);
    
    // Update scan summary
    console.log('Updating scan summary for scanId:', scanId);
    await db.updateScanSummary(scanId, [fullAnalysis]);
    console.log('✅ Updated scan summary');

    return NextResponse.json({
      success: true,
      scanId: scanId.toString(),
      analysis: { ...fullAnalysis, _id: analysisId },
    });
  } catch (error: any) {
    console.error('❌ ERROR in analyze API:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze stock' },
      { status: 500 }
    );
  }
}


