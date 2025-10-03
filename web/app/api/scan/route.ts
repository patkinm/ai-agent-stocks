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

    let stocksToAnalyze: string[];
    let scanType: 'complete' | 'specific' | 'single';

    if (symbols && symbols.length > 0) {
      // Analyze specific symbols
      stocksToAnalyze = symbols.map((s: string) => s.toUpperCase());
      scanType = symbols.length === 1 ? 'single' : 'specific';
    } else {
      // Find top stocks
      stocksToAnalyze = await analyzer.findTopShortTermStocks(count);
      scanType = 'complete';
    }

    // Create scan session
    const scanId = await db.saveScanSession(scanType, stocksToAnalyze);
    console.log('Created scan session:', scanId, 'Type:', scanType, 'Symbols:', stocksToAnalyze);

    // Analyze each stock
    const results = [];
    for (const symbol of stocksToAnalyze) {
      try {
        // Get stock data
        const stockData = await marketData.getStockData(symbol, '3mo');
        if (!stockData) {
          continue;
        }

        // Analyze
        const analysis = await analyzer.analyzeStockForBinaryDecision(symbol);
        if (analysis.error) {
          continue;
        }

        // Merge data
        const fullAnalysis = { ...analysis, ...stockData };

        // Save to database
        const analysisId = await db.saveAnalysis(fullAnalysis, scanId);
        results.push({ ...fullAnalysis, _id: analysisId });
      } catch (error) {
        console.error(`Error analyzing ${symbol}:`, error);
      }
    }

    // Update scan summary
    await db.updateScanSummary(scanId, results);
    console.log('Updated scan summary for:', scanId, 'Results:', results.length);

    return NextResponse.json({
      success: true,
      scanId,
      results,
      summary: {
        total_analyzed: results.length,
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


