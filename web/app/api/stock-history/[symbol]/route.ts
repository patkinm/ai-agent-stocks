import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      );
    }

    // Convert dates to timestamps
    const start = new Date(startDate).getTime() / 1000;
    const end = new Date(endDate).getTime() / 1000;

    // Fetch historical data from Yahoo Finance
    const chartUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${Math.floor(start)}&period2=${Math.floor(end)}&interval=1d`;
    
    const response = await fetch(chartUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch stock history' },
        { status: 500 }
      );
    }

    const data = await response.json();

    if (!data.chart?.result?.[0]) {
      return NextResponse.json(
        { error: 'No data available for this symbol' },
        { status: 404 }
      );
    }

    const result = data.chart.result[0];
    const timestamps = result.timestamp;
    const prices = result.indicators.quote[0].close;

    // Format the data
    const history = timestamps.map((timestamp: number, index: number) => ({
      date: new Date(timestamp * 1000).toISOString().split('T')[0],
      timestamp: timestamp * 1000,
      price: prices[index],
    })).filter((item: any) => item.price !== null);

    return NextResponse.json({ success: true, symbol, history });
  } catch (error: any) {
    console.error('Error fetching stock history:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch stock history' },
      { status: 500 }
    );
  }
}

