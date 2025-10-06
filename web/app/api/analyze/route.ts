import { NextRequest, NextResponse } from 'next/server';
import { StockAnalyzer } from '@/lib/services/stock-analyzer';
import { DatabaseService } from '@/lib/services/database';
import { MarketDataFetcher } from '@/lib/services/market-data';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symbol } = body;

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
    const analysisId = await db.saveAnalysis(fullAnalysis);

    return NextResponse.json({
      success: true,
      analysis: { ...fullAnalysis, _id: analysisId },
    });
  } catch (error: any) {
    console.error('Error in analyze API:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze stock' },
      { status: 500 }
    );
  }
}


