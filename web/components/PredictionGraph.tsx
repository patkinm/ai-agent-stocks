'use client';

import { useState, useEffect } from 'react';
import {
  ComposedChart,
  Line,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
  ReferenceLine,
} from 'recharts';
import { StockAnalysis } from '@/lib/models/analysis';
import { format, parseISO, addDays, subDays, subWeeks, subMonths, subYears, startOfYear } from 'date-fns';
import { Loader2, Clock } from 'lucide-react';

type TimeRange = '1D' | '1W' | '1M' | 'YTD' | '1Y' | 'ALL';

const TIME_RANGES: { label: string; value: TimeRange }[] = [
  { label: '1 Day', value: '1D' },
  { label: '1 Week', value: '1W' },
  { label: '1 Month', value: '1M' },
  { label: 'Year to Date', value: 'YTD' },
  { label: '1 Year', value: '1Y' },
  { label: 'All Time', value: 'ALL' },
];

interface PredictionGraphProps {
  symbol: string;
  analyses: StockAnalysis[];
  onPointClick: (analysis: StockAnalysis) => void;
}

interface HistoricalDataPoint {
  date: string;
  timestamp: number;
  price: number;
}

interface ChartDataPoint {
  date: string;
  dateMs: number;
  stockPrice?: number;
  predictionPrice?: number;
  targetPrice?: number;
  actualPrice?: number;
  analysis?: StockAnalysis;
  isFuture?: boolean;
  isPrediction?: boolean;
  isTarget?: boolean;
  isActual?: boolean;
  predictionId?: number;
}

// Parse timeframe string to get number of days
function parseTimeframeToDays(timeframe: string): number {
  const lower = timeframe.toLowerCase();
  
  // Match patterns like "3-5 days", "1-2 weeks", "next 3 days", etc.
  const daysMatch = lower.match(/(\d+)(?:-(\d+))?\s*days?/);
  if (daysMatch) {
    const min = parseInt(daysMatch[1]);
    const max = daysMatch[2] ? parseInt(daysMatch[2]) : min;
    return Math.round((min + max) / 2); // Use average
  }
  
  const weeksMatch = lower.match(/(\d+)(?:-(\d+))?\s*weeks?/);
  if (weeksMatch) {
    const min = parseInt(weeksMatch[1]);
    const max = weeksMatch[2] ? parseInt(weeksMatch[2]) : min;
    return Math.round((min + max) / 2) * 7;
  }
  
  const monthsMatch = lower.match(/(\d+)(?:-(\d+))?\s*months?/);
  if (monthsMatch) {
    const min = parseInt(monthsMatch[1]);
    const max = monthsMatch[2] ? parseInt(monthsMatch[2]) : min;
    return Math.round((min + max) / 2) * 30;
  }
  
  // Default to 5 days if can't parse
  return 5;
}

export default function PredictionGraph({ symbol, analyses, onPointClick }: PredictionGraphProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('ALL');
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([]);
  const [dataInterval, setDataInterval] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadHistoricalData();
  }, [symbol, analyses, timeRange]);

  const loadHistoricalData = async () => {
    try {
      setLoading(true);
      setError('');

      let minDate: Date;
      let maxDate = new Date();

      // Determine date range based on timeRange selector
      if (timeRange === 'ALL') {
        // Get date range from analyses if available
        if (analyses.length > 0) {
          const dates = analyses.map(a => new Date(a.created_at).getTime());
          minDate = new Date(Math.min(...dates));
          
          // Calculate max date considering future timeframes
          maxDate = new Date(Math.max(...dates, Date.now()));
          analyses.forEach(analysis => {
            const predictionDate = new Date(analysis.created_at);
            const daysInFuture = parseTimeframeToDays(analysis.timeframe);
            const targetDate = addDays(predictionDate, daysInFuture);
            if (targetDate > maxDate) {
              maxDate = targetDate;
            }
          });
          
          // Add buffer days
          minDate.setDate(minDate.getDate() - 7);
          maxDate.setDate(maxDate.getDate() + 7);
        } else {
          // Default to 1 year if no analyses
          minDate = subYears(maxDate, 1);
        }
      } else {
        // Use selected time range
        switch (timeRange) {
          case '1D':
            minDate = subDays(maxDate, 1);
            break;
          case '1W':
            minDate = subWeeks(maxDate, 1);
            break;
          case '1M':
            minDate = subMonths(maxDate, 1);
            break;
          case 'YTD':
            minDate = startOfYear(maxDate);
            break;
          case '1Y':
            minDate = subYears(maxDate, 1);
            break;
          default:
            minDate = subMonths(maxDate, 1);
        }
        
        // Extend maxDate to include future predictions within this time window
        if (analyses.length > 0) {
          analyses.forEach(analysis => {
            const predictionDate = new Date(analysis.created_at);
            const daysInFuture = parseTimeframeToDays(analysis.timeframe);
            const targetDate = addDays(predictionDate, daysInFuture);
            
            // Only extend for predictions made within the selected time range
            if (predictionDate >= minDate && predictionDate <= maxDate) {
              if (targetDate > maxDate) {
                maxDate = targetDate;
              }
            }
          });
          
          // Add small buffer for future dates
          if (maxDate > new Date()) {
            maxDate = addDays(maxDate, 3);
          }
        }
      }

      const startDate = minDate.toISOString().split('T')[0];
      const endDate = maxDate.toISOString().split('T')[0];

      const response = await fetch(
        `/api/stock-history/${symbol}?startDate=${startDate}&endDate=${endDate}`
      );

      const data = await response.json();

      if (data.success) {
        let extendedHistory = [...data.history];
        
        // If we need future dates and the last data point is before maxDate, extend the timeline
        if (data.history.length > 0) {
          const lastPoint = data.history[data.history.length - 1];
          const lastTimestamp = lastPoint.timestamp;
          const requestedEndTimestamp = new Date(endDate).getTime();
          
          // If we requested future data, add placeholder points
          if (requestedEndTimestamp > lastTimestamp) {
            const dayInMs = 24 * 60 * 60 * 1000;
            let currentTimestamp = lastTimestamp + dayInMs;
            
            // Add daily points until we reach the requested end date
            while (currentTimestamp <= requestedEndTimestamp) {
              extendedHistory.push({
                date: new Date(currentTimestamp).toISOString().split('T')[0],
                timestamp: currentTimestamp,
                price: lastPoint.price, // Use last known price
              });
              currentTimestamp += dayInMs;
            }
            
            console.log(`Extended data into future: added ${extendedHistory.length - data.history.length} future points`);
          }
        }
        
        setHistoricalData(extendedHistory);
        setDataInterval(data.interval || '1d');
        console.log(`Loaded ${data.dataPoints || data.history.length} data points with interval: ${data.interval}`);
      } else {
        setError(data.error || 'Failed to load stock history');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load stock history');
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload;
      
      // Find if this point has any prediction analysis
      let analysis: StockAnalysis | null = null;
      let isStart = false;
      let isEnd = false;
      
      // Check all possible prediction indices (check up to 100 predictions max)
      for (let i = 0; i < 100; i++) {
        if (data[`prediction_${i}_analysis`]) {
          analysis = data[`prediction_${i}_analysis`];
          isStart = data[`prediction_${i}_isStart`] || false;
          isEnd = data[`prediction_${i}_isEnd`] || false;
          break;
        }
      }
      
      // Check if this is a prediction or target point
      if (analysis) {
        // Prediction data is now directly in analysis
        const isBuy = analysis.decision === 'buy';
        
        // Calculate if timeframe has elapsed
        const predictionDate = new Date(analysis.created_at);
        const daysInTimeframe = parseTimeframeToDays(analysis.timeframe);
        const targetDate = addDays(predictionDate, daysInTimeframe);
        const hasTimeframeElapsed = new Date() > targetDate;
        const shouldShowOutcome = hasTimeframeElapsed && analysis.actual_price !== null;

        if (isEnd) {
          // Target price tooltip
          return (
            <div className="bg-purple-50 p-4 border-2 border-purple-300 rounded-lg shadow-xl">
              <p className="font-bold text-purple-900 mb-2">
                Target Price - {format(new Date(data.dateMs), 'MMM dd, yyyy')}
              </p>
              
              <div className="space-y-1 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-gray-700">Target:</span>
                  <span className="font-bold text-purple-700">${analysis.target_price?.toFixed(2)}</span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-gray-700">Timeframe:</span>
                  <span className="font-semibold text-gray-900">{analysis.timeframe}</span>
                </div>

                <div className="border-t border-purple-200 my-2"></div>

                <div className="flex justify-between gap-4">
                  <span className="text-gray-700">Predicted on:</span>
                  <span className="text-gray-900">{format(new Date(analysis.created_at), 'MMM dd, yyyy')}</span>
                </div>

                {data.stockPrice && shouldShowOutcome && (
                  <>
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-700">Actual Price:</span>
                      <span className="font-semibold text-gray-900">${data.stockPrice.toFixed(2)}</span>
                    </div>
                    
                    {analysis.target_price && (
                      <div className="flex justify-between gap-4">
                        <span className="text-gray-700">Difference:</span>
                        <span className={`font-semibold ${
                          data.stockPrice >= analysis.target_price ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {data.stockPrice >= analysis.target_price ? '✓ Reached' : '✗ Not Reached'}
                        </span>
                      </div>
                    )}
                  </>
                )}

                {!hasTimeframeElapsed && (
                  <p className="text-xs text-blue-700 italic mt-2 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Target date in the future
                  </p>
                )}
              </div>
              
              <p className="text-xs text-gray-500 mt-3 pt-2 border-t border-purple-200">
                Click to view full analysis details
              </p>
            </div>
          );
        } else {
          // Prediction point tooltip
          return (
            <div className="bg-white p-4 border-2 border-gray-300 rounded-lg shadow-xl">
              <p className="font-bold text-gray-900 mb-2">
                Prediction - {format(new Date(data.dateMs), 'MMM dd, yyyy')}
              </p>
              
              <div className="space-y-1 text-sm">
                <div className="flex justify-between gap-4 items-center">
                  <span className="text-gray-600">Decision:</span>
                  <span className={`font-bold uppercase px-2 py-1 rounded ${
                    isBuy ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {analysis.decision}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-gray-600">Confidence:</span>
                  <span className="font-semibold text-gray-900">{analysis.confidence}/10</span>
                </div>

                <div className="border-t border-gray-200 my-2"></div>
                
                <div className="flex justify-between gap-4">
                  <span className="text-gray-600">Price at Analysis:</span>
                  <span className="font-semibold text-blue-600">${analysis.current_price.toFixed(2)}</span>
                </div>
                
                {analysis.target_price && (
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-600">Target Price:</span>
                    <span className="font-semibold text-purple-600">${analysis.target_price.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between gap-4">
                  <span className="text-gray-600">Timeframe:</span>
                  <span className="text-gray-900">{analysis.timeframe}</span>
                </div>

                {data.stockPrice && (
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-600">Actual Price:</span>
                    <span className="font-semibold text-gray-900">${data.stockPrice.toFixed(2)}</span>
                  </div>
                )}
                
                {shouldShowOutcome && (
                  <>
                    <div className="border-t border-gray-200 my-2"></div>
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-600">Price After {analysis.days_elapsed} days:</span>
                      <span className="font-semibold text-green-600">${analysis.actual_price?.toFixed(2)}</span>
                    </div>
                    
                    {analysis.actual_change_percent !== null && (
                      <div className="flex justify-between gap-4">
                        <span className="text-gray-600">Change:</span>
                        <span className={`font-semibold ${
                          analysis.actual_change_percent >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {analysis.actual_change_percent >= 0 ? '+' : ''}
                          {analysis.actual_change_percent.toFixed(2)}%
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between gap-4">
                      <span className="text-gray-600">Outcome:</span>
                      <span className={`font-bold ${
                        analysis.prediction_accuracy && analysis.prediction_accuracy > 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        {analysis.prediction_accuracy && analysis.prediction_accuracy > 0 ? '✓ Correct' : '✗ Incorrect'}
                      </span>
                    </div>
                  </>
                )}
                
                {!hasTimeframeElapsed && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-xs text-blue-700 italic flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Prediction in progress - target date: {format(targetDate, 'MMM dd, yyyy')}
                    </p>
                  </div>
                )}
              </div>
              
              <p className="text-xs text-gray-500 mt-3 pt-2 border-t border-gray-200">
                Click to view full analysis details
              </p>
            </div>
          );
        }
      } else {
        // Stock price point
        return (
          <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
            <p className="font-semibold text-gray-900 mb-1">
              {format(new Date(data.dateMs), 'MMM dd, yyyy')}
            </p>
            <p className="text-sm">
              <span className="text-gray-600">Price: </span>
              <span className="font-semibold text-gray-900">${data.stockPrice?.toFixed(2)}</span>
            </p>
          </div>
        );
      }
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">Loading stock price history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 bg-red-50 rounded-lg border border-red-200">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (historicalData.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-500">No historical data available</p>
      </div>
    );
  }

  const chartData: ChartDataPoint[] = [];
  const today = Date.now();

  // Get time range boundaries for filtering
  const minTimestamp = historicalData[0].timestamp;
  const maxTimestamp = historicalData[historicalData.length - 1].timestamp;

  // Add historical stock prices as continuous data
  historicalData.forEach(point => {
    chartData.push({
      date: format(new Date(point.timestamp), 'MM/dd/yy'),
      dateMs: point.timestamp,
      stockPrice: point.price,
      isFuture: point.timestamp > today,
    });
  });

  // Create prediction line segments (filtered by time range)
  console.log(`Time range: ${format(minTimestamp, 'MMM dd, yyyy')} to ${format(maxTimestamp, 'MMM dd, yyyy')}`);
  console.log(`Total analyses: ${analyses.length}`);
  
  interface PredictionSegment {
    predictionDate: number;
    targetDate: number;
    predictionPrice: number;
    targetPrice: number;
    analysis: StockAnalysis;
  }
  
  const predictionSegments: PredictionSegment[] = [];
  
  analyses.forEach(analysis => {
    const predictionDate = new Date(analysis.created_at).getTime();
    const daysInFuture = parseTimeframeToDays(analysis.timeframe);
    const targetDate = addDays(new Date(analysis.created_at), daysInFuture).getTime();
    
    // Only include prediction if at least one point falls within the visible time range
    if ((predictionDate >= minTimestamp && predictionDate <= maxTimestamp) ||
        (targetDate >= minTimestamp && targetDate <= maxTimestamp) ||
        (predictionDate <= minTimestamp && targetDate >= maxTimestamp)) {
      
      if (analysis.target_price) {
        predictionSegments.push({
          predictionDate,
          targetDate,
          predictionPrice: analysis.current_price,
          targetPrice: analysis.target_price,
          analysis,
        });
      }
    }
  });
  
  console.log(`Added ${predictionSegments.length} prediction segments to chart`);

  // Sort by date
  chartData.sort((a, b) => a.dateMs - b.dateMs);

  // Build final data with prediction lines integrated
  // Each prediction gets its own dataKey (prediction_0, prediction_1, etc.)
  const finalData: any[] = [];
  
  // Start with all base data points (stock prices)
  chartData.forEach(point => {
    const dataPoint: any = {
      date: point.date,
      dateMs: point.dateMs,
      stockPrice: point.stockPrice,
      isFuture: point.isFuture,
    };
    
    // Add prediction line data
    predictionSegments.forEach((segment, index) => {
      const ts = point.dateMs;
      // Only set value if this timestamp is between prediction start and end
      if (ts >= segment.predictionDate && ts <= segment.targetDate) {
        // Linear interpolation between prediction price and target price
        const ratio = (ts - segment.predictionDate) / (segment.targetDate - segment.predictionDate);
        const interpolatedPrice = segment.predictionPrice + ratio * (segment.targetPrice - segment.predictionPrice);
        dataPoint[`prediction_${index}`] = interpolatedPrice;
        
        // Store analysis for the start point
        if (ts === segment.predictionDate) {
          dataPoint[`prediction_${index}_analysis`] = segment.analysis;
          dataPoint[`prediction_${index}_isStart`] = true;
        }
        if (ts === segment.targetDate) {
          dataPoint[`prediction_${index}_analysis`] = segment.analysis;
          dataPoint[`prediction_${index}_isEnd`] = true;
        }
      }
    });
    
    finalData.push(dataPoint);
  });

  // Ensure prediction endpoints exist in finalData
  predictionSegments.forEach((segment, index) => {
    // Check if prediction start date exists
    let hasStart = finalData.some(d => d.dateMs === segment.predictionDate);
    if (!hasStart) {
      const newPoint: any = {
        date: format(segment.predictionDate, 'MM/dd/yy'),
        dateMs: segment.predictionDate,
        [`prediction_${index}`]: segment.predictionPrice,
        [`prediction_${index}_analysis`]: segment.analysis,
        [`prediction_${index}_isStart`]: true,
      };
      finalData.push(newPoint);
    }
    
    // Check if target date exists
    let hasEnd = finalData.some(d => d.dateMs === segment.targetDate);
    if (!hasEnd) {
      const newPoint: any = {
        date: format(segment.targetDate, 'MM/dd/yy'),
        dateMs: segment.targetDate,
        [`prediction_${index}`]: segment.targetPrice,
        [`prediction_${index}_analysis`]: segment.analysis,
        [`prediction_${index}_isEnd`]: true,
      };
      finalData.push(newPoint);
    }
  });
  
  // Re-sort after adding missing points
  finalData.sort((a, b) => a.dateMs - b.dateMs);

  const handlePointClick = (data: any) => {
    if (data && data.analysis) {
      onPointClick(data.analysis);
    }
  };

  // Get today's position for reference line
  const todayMs = Date.now();

  // Calculate price change for current time range
  const firstPrice = historicalData[0]?.price || 0;
  const lastPrice = historicalData[historicalData.length - 1]?.price || 0;
  const priceChange = lastPrice - firstPrice;
  const priceChangePercent = firstPrice > 0 ? (priceChange / firstPrice) * 100 : 0;
  const isPositive = priceChange >= 0;
  
  // Count historical vs future data points
  const todayTimestamp = Date.now();
  const historicalPoints = historicalData.filter(d => d.timestamp <= todayTimestamp).length;
  const futurePoints = historicalData.filter(d => d.timestamp > todayTimestamp).length;

  return (
    <div className="w-full">
      {/* Time Range Selector */}
      <div className="flex flex-wrap gap-2 mb-4">
        {TIME_RANGES.map(range => (
          <button
            key={range.value}
            onClick={() => setTimeRange(range.value)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              timeRange === range.value
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {range.label}
          </button>
        ))}
      </div>

      {/* Price Info */}
      {historicalData.length > 0 && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-sm text-gray-600">Current Price</p>
              <p className="text-2xl font-bold text-gray-900">${lastPrice.toFixed(2)}</p>
              {dataInterval && (
                <p className="text-xs text-gray-500 mt-1">
                  Interval: {dataInterval === '5m' ? '5 minutes' : dataInterval === '1h' ? '1 hour' : dataInterval === '1d' ? 'Daily' : dataInterval === '1wk' ? 'Weekly' : dataInterval}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Change ({TIME_RANGES.find(r => r.value === timeRange)?.label})</p>
              <p className={`text-2xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {isPositive ? '+' : ''}{priceChange.toFixed(2)} ({isPositive ? '+' : ''}{priceChangePercent.toFixed(2)}%)
              </p>
            </div>
            {analyses.length > 0 && (
              <div className="text-right">
                <p className="text-sm text-gray-600">Total Analyses</p>
                <p className="text-2xl font-bold text-blue-600">{analyses.length}</p>
              </div>
            )}
            {futurePoints > 0 && (
              <div className="text-right">
                <p className="text-sm text-gray-600">Timeline</p>
                <p className="text-sm font-semibold text-gray-900">
                  {historicalPoints} past + {futurePoints} future
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <ResponsiveContainer width="100%" height={500}>
        <ComposedChart
          data={finalData}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="date" 
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis 
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            tickFormatter={(value) => `$${value.toFixed(0)}`}
            domain={['auto', 'auto']}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ fontSize: '14px', paddingTop: '10px' }}
            iconType="line"
          />
          
          {/* Reference line for today */}
          <ReferenceLine 
            x={format(todayMs, 'MM/dd/yy')} 
            stroke="#ef4444" 
            strokeDasharray="3 3"
            label={{ value: 'Today', position: 'top', fill: '#ef4444', fontSize: 12 }}
          />
          
          {/* Main Stock Price Line - Continuous */}
          <Line
            type="monotone"
            dataKey="stockPrice"
            stroke="#1f2937"
            strokeWidth={3}
            name="Stock Price"
            dot={false}
            connectNulls
            isAnimationActive={false}
          />
          
          {/* Prediction Lines - Each prediction segment as a separate line */}
          {predictionSegments.map((segment, index) => {
            // Determine color based on decision
            const isBuy = segment.analysis.decision === 'buy';
            const lineColor = isBuy ? '#10b981' : '#ef4444'; // green for buy, red for sell
            const dotColor = isBuy ? '#059669' : '#dc2626';
            
            return (
              <Line
                key={`prediction-line-${index}`}
                type="linear"
                dataKey={`prediction_${index}`}
                stroke={lineColor}
                strokeWidth={3}
                strokeDasharray="5 5"
                name={index === 0 ? "Predictions" : undefined}
                connectNulls={false}
                dot={(props: any) => {
                  const { cx, cy, payload, value } = props;
                  
                  // Only show dot if this point has the prediction value
                  if (!value) return null;
                  
                  const isStart = payload[`prediction_${index}_isStart`];
                  const isEnd = payload[`prediction_${index}_isEnd`];
                  
                  // Only show dots at start and end
                  if (!isStart && !isEnd) return null;
                  
                  return (
                    <g>
                      <circle
                        cx={cx}
                        cy={cy}
                        r={8}
                        fill={dotColor}
                        stroke="#fff"
                        strokeWidth={2}
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                          const analysis = payload[`prediction_${index}_analysis`];
                          if (analysis) handlePointClick({ analysis });
                        }}
                      />
                      {isStart && (
                        <text
                          x={cx}
                          y={cy - 15}
                          textAnchor="middle"
                          fill={dotColor}
                          fontSize="11"
                          fontWeight="bold"
                        >
                          {segment.analysis.decision.toUpperCase()}
                        </text>
                      )}
                    </g>
                  );
                }}
                isAnimationActive={false}
              />
            );
          })}
        </ComposedChart>
      </ResponsiveContainer>
      
      <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 bg-gray-800"></div>
          <span>Stock Price</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            <div className="w-8 h-0.5 border-t-[3px] border-dashed border-green-600"></div>
            <div className="w-3 h-3 rounded-full bg-green-600 border-2 border-white -ml-1"></div>
          </div>
          <span>Buy Prediction</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            <div className="w-8 h-0.5 border-t-[3px] border-dashed border-red-600"></div>
            <div className="w-3 h-3 rounded-full bg-red-600 border-2 border-white -ml-1"></div>
          </div>
          <span>Sell Prediction</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 border-t-2 border-dashed border-red-500"></div>
          <span>Today</span>
        </div>
      </div>
    </div>
  );
}
