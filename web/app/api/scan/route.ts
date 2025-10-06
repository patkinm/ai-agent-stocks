import { NextRequest, NextResponse } from 'next/server';
import { StockAnalyzer } from '@/lib/services/stock-analyzer';
import { DatabaseService } from '@/lib/services/database';
import { MarketDataFetcher } from '@/lib/services/market-data';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { count = 8, symbols } = body;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    const analyzer = new StockAnalyzer(apiKey);
    const marketData = new MarketDataFetcher();
    const db = new DatabaseService();

    // STEP 1: Detect tickers
    let detectedTickers: string[];
    if (symbols && symbols.length > 0) {
      detectedTickers = symbols.map((s: string) => s.toUpperCase());
    } else {
      detectedTickers = await analyzer.findTopShortTermStocks(count);
    }

    // Create scan session with detected tickers
    const scanId = await db.createScanSession(detectedTickers);

    // STEP 2: Analyze each ticker
    const results = [];
    const failedTickers = [];

    for (const symbol of detectedTickers) {
      try {
        // Get stock data
        const stockData = await marketData.getStockData(symbol, '3mo');
        if (!stockData) {
          failedTickers.push(symbol);
          continue;
        }

        // Analyze
        const analysis = await analyzer.analyzeStockForBinaryDecision(symbol);
        if (analysis.error) {
          failedTickers.push(symbol);
          continue;
        }

        // Merge data
        const fullAnalysis = { ...analysis, ...stockData };

        // Save to database with scan_id
        const analysisId = await db.saveAnalysis(fullAnalysis, scanId);
        results.push({ ...fullAnalysis, _id: analysisId });
      } catch (error) {
        console.error(`Error analyzing ${symbol}:`, error);
        failedTickers.push(symbol);
      }
    }

    // STEP 3: Update scan session with results
    await db.updateScanSession(scanId, results, failedTickers);

    return NextResponse.json({
      success: true,
      scanId: scanId.toString(),
      detectedTickers,
      results,
      failedTickers,
      summary: {
        total_detected: detectedTickers.length,
        successful_analyses: results.length,
        failed_analyses: failedTickers.length,
        buy_signals: results.filter(r => r.decision === 'buy').length,
        sell_signals: results.filter(r => r.decision === 'sell').length,
        avg_confidence:
          results.length > 0
            ? results.reduce((sum, r) => sum + r.confidence, 0) / results.length
            : 0,
      },
    });
  } catch (error: any) {
    console.error('Error performing scan:', error);
    return NextResponse.json({ error: error.message || 'Failed to perform scan' }, { status: 500 });
  }
}
