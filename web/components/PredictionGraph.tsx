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
import { StockAnalysis, PredictionComparison } from '@/lib/models/analysis';
import { format, parseISO, addDays } from 'date-fns';
import { Loader2, Clock } from 'lucide-react';

interface PredictionGraphProps {
  symbol: string;
  analyses: Array<StockAnalysis & { prediction?: PredictionComparison }>;
  onPointClick: (analysis: StockAnalysis & { prediction?: PredictionComparison }) => void;
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
  analysis?: StockAnalysis & { prediction?: PredictionComparison };
  isFuture?: boolean;
  isPrediction?: boolean;
  isTarget?: boolean;
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
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadHistoricalData();
  }, [symbol, analyses]);

  const loadHistoricalData = async () => {
    if (analyses.length === 0) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Get date range from analyses
      const dates = analyses.map(a => new Date(a.created_at).getTime());
      const minDate = new Date(Math.min(...dates));
      
      // Calculate max date considering future timeframes
      let maxDate = new Date(Math.max(...dates, Date.now()));
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

      const startDate = minDate.toISOString().split('T')[0];
      const endDate = maxDate.toISOString().split('T')[0];

      const response = await fetch(
        `/api/stock-history/${symbol}?startDate=${startDate}&endDate=${endDate}`
      );

      const data = await response.json();

      if (data.success) {
        setHistoricalData(data.history);
      } else {
        setError(data.error || 'Failed to load stock history');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load stock history');
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload as ChartDataPoint;
      
      // Check if this is a prediction or target point
      if (data.analysis) {
        const prediction = data.analysis.prediction;
        const isBuy = data.analysis.decision === 'buy';
        
        // Calculate if timeframe has elapsed
        const predictionDate = new Date(data.analysis.created_at);
        const daysInTimeframe = parseTimeframeToDays(data.analysis.timeframe);
        const targetDate = addDays(predictionDate, daysInTimeframe);
        const hasTimeframeElapsed = new Date() > targetDate;
        const shouldShowOutcome = hasTimeframeElapsed && prediction && prediction.actual_price !== null;

        if (data.isTarget) {
          // Target price tooltip
          return (
            <div className="bg-purple-50 p-4 border-2 border-purple-300 rounded-lg shadow-xl">
              <p className="font-bold text-purple-900 mb-2">
                Target Price - {format(new Date(data.dateMs), 'MMM dd, yyyy')}
              </p>
              
              <div className="space-y-1 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-gray-700">Target:</span>
                  <span className="font-bold text-purple-700">${data.targetPrice?.toFixed(2)}</span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-gray-700">Timeframe:</span>
                  <span className="font-semibold text-gray-900">{data.analysis.timeframe}</span>
                </div>

                <div className="border-t border-purple-200 my-2"></div>

                <div className="flex justify-between gap-4">
                  <span className="text-gray-700">Predicted on:</span>
                  <span className="text-gray-900">{format(new Date(data.analysis.created_at), 'MMM dd, yyyy')}</span>
                </div>

                {data.stockPrice && shouldShowOutcome && (
                  <>
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-700">Actual Price:</span>
                      <span className="font-semibold text-gray-900">${data.stockPrice.toFixed(2)}</span>
                    </div>
                    
                    {data.analysis.target_price && (
                      <div className="flex justify-between gap-4">
                        <span className="text-gray-700">Difference:</span>
                        <span className={`font-semibold ${
                          data.stockPrice >= data.analysis.target_price ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {data.stockPrice >= data.analysis.target_price ? '✓ Reached' : '✗ Not Reached'}
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
                    {data.analysis.decision}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-gray-600">Confidence:</span>
                  <span className="font-semibold text-gray-900">{data.analysis.confidence}/10</span>
                </div>

                <div className="border-t border-gray-200 my-2"></div>
                
                <div className="flex justify-between gap-4">
                  <span className="text-gray-600">Price at Analysis:</span>
                  <span className="font-semibold text-blue-600">${data.analysis.current_price.toFixed(2)}</span>
                </div>
                
                {data.analysis.target_price && (
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-600">Target Price:</span>
                    <span className="font-semibold text-purple-600">${data.analysis.target_price.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between gap-4">
                  <span className="text-gray-600">Timeframe:</span>
                  <span className="text-gray-900">{data.analysis.timeframe}</span>
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
                      <span className="text-gray-600">Price After {prediction.days_elapsed} days:</span>
                      <span className="font-semibold text-green-600">${prediction.actual_price?.toFixed(2)}</span>
                    </div>
                    
                    {prediction.actual_change_percent !== null && (
                      <div className="flex justify-between gap-4">
                        <span className="text-gray-600">Change:</span>
                        <span className={`font-semibold ${
                          prediction.actual_change_percent >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {prediction.actual_change_percent >= 0 ? '+' : ''}
                          {prediction.actual_change_percent.toFixed(2)}%
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between gap-4">
                      <span className="text-gray-600">Outcome:</span>
                      <span className={`font-bold ${
                        prediction.prediction_accuracy && prediction.prediction_accuracy > 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        {prediction.prediction_accuracy && prediction.prediction_accuracy > 0 ? '✓ Correct' : '✗ Incorrect'}
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

  if (analyses.length === 0 || historicalData.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  const chartData: ChartDataPoint[] = [];
  const today = Date.now();

  // Add historical stock prices as continuous data
  historicalData.forEach(point => {
    chartData.push({
      date: format(new Date(point.timestamp), 'MM/dd/yy'),
      dateMs: point.timestamp,
      stockPrice: point.price,
      isFuture: point.timestamp > today,
    });
  });

  // Add prediction points and target points
  analyses.forEach(analysis => {
    const predictionDate = new Date(analysis.created_at).getTime();
    const daysInFuture = parseTimeframeToDays(analysis.timeframe);
    const targetDate = addDays(new Date(analysis.created_at), daysInFuture).getTime();
    
    // Find the closest stock price for prediction date
    const closestHistorical = historicalData.reduce((prev, curr) => {
      return Math.abs(curr.timestamp - predictionDate) < Math.abs(prev.timestamp - predictionDate)
        ? curr
        : prev;
    });

    // Add prediction point
    chartData.push({
      date: format(predictionDate, 'MM/dd/yy'),
      dateMs: predictionDate,
      stockPrice: closestHistorical.price,
      predictionPrice: analysis.current_price,
      analysis,
      isPrediction: true,
    });

    // Add target price point at future date
    if (analysis.target_price) {
      const targetHistorical = historicalData.find(h => 
        Math.abs(h.timestamp - targetDate) < 24 * 60 * 60 * 1000
      );

      chartData.push({
        date: format(targetDate, 'MM/dd/yy'),
        dateMs: targetDate,
        stockPrice: targetHistorical?.price,
        targetPrice: analysis.target_price,
        analysis,
        isFuture: targetDate > today,
        isTarget: true,
      });
    }
  });

  // Sort by date
  chartData.sort((a, b) => a.dateMs - b.dateMs);

  // Separate data for different visualizations
  const stockPriceData = chartData.filter(d => !d.isPrediction && !d.isTarget);
  const predictionPoints = chartData.filter(d => d.isPrediction);
  const targetPoints = chartData.filter(d => d.isTarget);

  // Merge for final chart data, avoiding duplicates
  const finalData: ChartDataPoint[] = [];
  const dateMap = new Map<string, ChartDataPoint>();

  chartData.forEach(point => {
    const key = point.date;
    if (!dateMap.has(key)) {
      dateMap.set(key, { ...point });
    } else {
      const existing = dateMap.get(key)!;
      // Merge properties
      if (point.predictionPrice) existing.predictionPrice = point.predictionPrice;
      if (point.targetPrice) existing.targetPrice = point.targetPrice;
      if (point.analysis) existing.analysis = point.analysis;
      if (point.isPrediction) existing.isPrediction = true;
      if (point.isTarget) existing.isTarget = true;
    }
  });

  dateMap.forEach(value => finalData.push(value));
  finalData.sort((a, b) => a.dateMs - b.dateMs);

  const handlePointClick = (data: any) => {
    if (data && data.analysis) {
      onPointClick(data.analysis);
    }
  };

  // Get today's position for reference line
  const todayMs = Date.now();

  return (
    <div className="w-full">
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
          
          {/* Prediction Points - Scatter */}
          <Scatter
            dataKey="predictionPrice"
            fill="#3b82f6"
            name="Prediction"
            shape="circle"
            onClick={handlePointClick}
          >
            {predictionPoints.map((entry, index) => (
              <circle
                key={`prediction-${index}`}
                r={8}
                fill="#3b82f6"
                stroke="#1e40af"
                strokeWidth={2}
                style={{ cursor: 'pointer' }}
              />
            ))}
          </Scatter>
          
          {/* Target Price Points - Scatter (positioned at future dates) */}
          <Scatter
            dataKey="targetPrice"
            fill="#a855f7"
            name="Target Price (Future)"
            shape="diamond"
            onClick={handlePointClick}
          >
            {targetPoints.map((entry, index) => (
              <polygon
                key={`target-${index}`}
                points="0,-10 10,0 0,10 -10,0"
                fill="#a855f7"
                stroke="#7e22ce"
                strokeWidth={2}
                style={{ cursor: 'pointer' }}
              />
            ))}
          </Scatter>
        </ComposedChart>
      </ResponsiveContainer>
      
      <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 bg-gray-800"></div>
          <span>Actual Stock Price</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-blue-800"></div>
          <span>Prediction Point</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-purple-500 border-2 border-purple-800" style={{ transform: 'rotate(45deg)' }}></div>
          <span>Target Price (at future date based on timeframe)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 border-t-2 border-dashed border-red-500"></div>
          <span>Today</span>
        </div>
      </div>
    </div>
  );
}
