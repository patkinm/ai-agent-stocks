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
    const now = Date.now() / 1000;

    // Determine interval based on date range
    const daysDiff = (end - start) / (60 * 60 * 24);
    const daysFromNow = (now - start) / (60 * 60 * 24);
    let interval = '1d'; // default daily
    
    // Yahoo Finance intraday data is only available for recent data
    if (daysDiff <= 1 && daysFromNow <= 7) {
      interval = '5m'; // 5-minute intervals for 1 day (last 7 days only)
    } else if (daysDiff <= 7 && daysFromNow <= 60) {
      interval = '1h'; // hourly for 1 week (last 60 days only)
    } else if (daysDiff <= 60) {
      interval = '1d'; // daily for up to 2 months
    } else if (daysDiff <= 365) {
      interval = '1d'; // daily for up to 1 year
    } else {
      interval = '1wk'; // weekly for longer periods
    }

    console.log(`Fetching ${symbol}: ${daysDiff.toFixed(1)} days, interval: ${interval}`);

    // Try to fetch with the calculated interval, with fallback to daily if intraday fails
    let data: any = null;
    let actualInterval = interval;
    const intervalsToTry = interval === '5m' || interval === '1h' ? [interval, '1d'] : [interval];

    for (const tryInterval of intervalsToTry) {
      const chartUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${Math.floor(start)}&period2=${Math.floor(end)}&interval=${tryInterval}`;
      
      const response = await fetch(chartUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        console.log(`Failed to fetch ${symbol} with interval ${tryInterval}, status: ${response.status}`);
        continue;
      }

      const responseData = await response.json();

      // Check if we have valid data
      if (responseData.chart?.result?.[0]) {
        const result = responseData.chart.result[0];
        const timestamps = result.timestamp;
        const prices = result.indicators?.quote?.[0]?.close;

        // Validate that we have the required data
        if (timestamps && Array.isArray(timestamps) && timestamps.length > 0 &&
            prices && Array.isArray(prices) && prices.length > 0) {
          data = responseData;
          actualInterval = tryInterval;
          if (tryInterval !== interval) {
            console.log(`Fell back from ${interval} to ${tryInterval} for ${symbol}`);
          }
          break;
        } else {
          console.log(`Invalid data structure for ${symbol} with interval ${tryInterval}`);
        }
      }
    }

    // If no interval worked, return error
    if (!data || !data.chart?.result?.[0]) {
      console.error(`No valid data for ${symbol} after trying intervals: ${intervalsToTry.join(', ')}`);
      return NextResponse.json(
        { error: 'No data available for this symbol and time period' },
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

    console.log(`Returned ${history.length} data points with interval ${actualInterval}`);

    return NextResponse.json({ success: true, symbol, history, interval: actualInterval, dataPoints: history.length });
  } catch (error: any) {
    console.error('Error fetching stock history:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch stock history' },
      { status: 500 }
    );
  }
}

