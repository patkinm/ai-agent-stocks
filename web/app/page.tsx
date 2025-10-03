'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import PredictionGraph from '@/components/PredictionGraph';
import AnalysisDetailsPanel from '@/components/AnalysisDetailsPanel';
import { StockAnalysis, PredictionComparison } from '@/lib/models/analysis';
import { Loader2, TrendingUp, Calendar, BarChart3, Clock } from 'lucide-react';
import { format, addDays } from 'date-fns';

interface TickerInfo {
  symbol: string;
  count: number;
  lastAnalyzed: Date;
}

// Parse timeframe string to get number of days
function parseTimeframeToDays(timeframe: string): number {
  const lower = timeframe.toLowerCase();
  
  const daysMatch = lower.match(/(\d+)(?:-(\d+))?\s*days?/);
  if (daysMatch) {
    const min = parseInt(daysMatch[1]);
    const max = daysMatch[2] ? parseInt(daysMatch[2]) : min;
    return Math.round((min + max) / 2);
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
  
  return 5;
}

export default function Home() {
  const [tickers, setTickers] = useState<TickerInfo[]>([]);
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [analyses, setAnalyses] = useState<Array<StockAnalysis & { prediction?: PredictionComparison }>>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<(StockAnalysis & { prediction?: PredictionComparison }) | null>(null);
  const [loadingTickers, setLoadingTickers] = useState(true);
  const [loadingAnalyses, setLoadingAnalyses] = useState(false);
  const [error, setError] = useState('');

  // Load all tickers on mount
  useEffect(() => {
    loadTickers();
  }, []);

  // Load analyses when ticker is selected
  useEffect(() => {
    if (selectedTicker) {
      loadAnalyses(selectedTicker);
    }
  }, [selectedTicker]);

  const loadTickers = async () => {
    try {
      setLoadingTickers(true);
      setError('');
      const response = await fetch('/api/tickers');
      const data = await response.json();
      
      if (data.success) {
        setTickers(data.tickers);
        // Auto-select first ticker if available
        if (data.tickers.length > 0 && !selectedTicker) {
          setSelectedTicker(data.tickers[0].symbol);
        }
      } else {
        setError(data.error || 'Failed to load tickers');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load tickers');
    } finally {
      setLoadingTickers(false);
    }
  };

  const loadAnalyses = async (ticker: string) => {
    try {
      setLoadingAnalyses(true);
      setError('');
      const response = await fetch(`/api/ticker/${ticker}`);
      const data = await response.json();
      
      if (data.success) {
        setAnalyses(data.analyses);
      } else {
        setError(data.error || 'Failed to load analyses');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load analyses');
    } finally {
      setLoadingAnalyses(false);
    }
  };

  const handleTickerClick = (ticker: string) => {
    setSelectedTicker(ticker);
    setSelectedAnalysis(null);
  };

  const handlePointClick = (analysis: StockAnalysis & { prediction?: PredictionComparison }) => {
    setSelectedAnalysis(analysis);
  };

  const handleCloseDetails = () => {
    setSelectedAnalysis(null);
  };

  if (loadingTickers) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Loading tickers...</p>
          </div>
        </div>
      </div>
    );
  }

  if (tickers.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="text-center max-w-md">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Analysis Data</h2>
            <p className="text-gray-600 mb-6">
              There are no analyzed stocks yet. Start by analyzing some stocks from the analyze page.
            </p>
            <a href="/analyze" className="btn btn-primary">
              Go to Analysis Tool
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="flex h-[calc(100vh-64px)]">
        {/* Left Sidebar - Ticker List */}
        <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-bold text-gray-900">Analyzed Tickers</h2>
            <p className="text-sm text-gray-600">{tickers.length} stocks</p>
          </div>
          
          <div className="divide-y divide-gray-200">
            {tickers.map((ticker) => (
              <button
                key={ticker.symbol}
                onClick={() => handleTickerClick(ticker.symbol)}
                className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                  selectedTicker === ticker.symbol ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-lg font-bold text-gray-900">{ticker.symbol}</h3>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {ticker.count} {ticker.count === 1 ? 'analysis' : 'analyses'}
                  </span>
                </div>
                <p className="text-xs text-gray-600 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Last: {format(new Date(ticker.lastAnalyzed), 'MMM dd, yyyy')}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-8">
            {selectedTicker ? (
              <>
                {/* Header */}
                <div className="mb-6">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{selectedTicker}</h1>
                  <p className="text-gray-600">
                    {analyses.length} {analyses.length === 1 ? 'analysis' : 'analyses'} in chronological order
                  </p>
                </div>

                {loadingAnalyses ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                      <Loader2 className="w-12 h-12 animate-spin text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Loading analyses...</p>
                    </div>
                  </div>
                ) : error ? (
                  <div className="card bg-red-50 border-red-200">
                    <p className="text-red-800">{error}</p>
                  </div>
                ) : analyses.length === 0 ? (
                  <div className="card text-center py-12">
                    <p className="text-gray-600">No analyses found for this ticker</p>
                  </div>
                ) : (
                  <>
                    {/* Graph */}
                    <div className="card mb-8">
                      <h2 className="text-xl font-bold text-gray-900 mb-4">Stock Price & Predictions Over Time</h2>
                      <PredictionGraph 
                        symbol={selectedTicker}
                        analyses={analyses} 
                        onPointClick={handlePointClick}
                      />
                    </div>

                    {/* Analysis Timeline */}
                    <div className="mb-4">
                      <h2 className="text-xl font-bold text-gray-900 mb-4">Analysis Timeline</h2>
                    </div>

                    <div className="space-y-4">
                      {analyses.map((analysis, index) => {
                        const prediction = analysis.prediction;
                        
                        // Calculate if timeframe has elapsed
                        const predictionDate = new Date(analysis.created_at);
                        const daysInTimeframe = parseTimeframeToDays(analysis.timeframe);
                        const targetDate = addDays(predictionDate, daysInTimeframe);
                        const hasTimeframeElapsed = new Date() > targetDate;
                        
                        const hasActualPrice = prediction && prediction.actual_price !== null;
                        const shouldShowOutcome = hasTimeframeElapsed && hasActualPrice;
                        const isCorrect = prediction && prediction.prediction_accuracy && prediction.prediction_accuracy > 0;

                        return (
                          <button
                            key={analysis._id?.toString() || index}
                            onClick={() => handlePointClick(analysis)}
                            className="w-full card hover:shadow-md transition-all text-left"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <span className="text-sm text-gray-500">
                                    {format(new Date(analysis.created_at), 'MMM dd, yyyy h:mm a')}
                                  </span>
                                  <span
                                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                                      analysis.decision === 'buy'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                    }`}
                                  >
                                    <TrendingUp className="w-3 h-3 mr-1" />
                                    {analysis.decision.toUpperCase()}
                                  </span>
                                  <span className="text-xs text-gray-600">
                                    Confidence: {analysis.confidence}/10
                                  </span>
                                  {!hasTimeframeElapsed && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                      <Clock className="w-3 h-3 mr-1" />
                                      In Progress
                                    </span>
                                  )}
                                  {shouldShowOutcome && (
                                    <span
                                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                                        isCorrect
                                          ? 'bg-green-100 text-green-800'
                                          : 'bg-red-100 text-red-800'
                                      }`}
                                    >
                                      {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                                    </span>
                                  )}
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                  <div>
                                    <p className="text-gray-600">Predicted Price</p>
                                    <p className="font-bold text-gray-900">${analysis.current_price.toFixed(2)}</p>
                                  </div>
                                  {analysis.target_price && (
                                    <div>
                                      <p className="text-gray-600">Target Price</p>
                                      <p className="font-bold text-purple-600">${analysis.target_price.toFixed(2)}</p>
                                    </div>
                                  )}
                                  {shouldShowOutcome ? (
                                    <>
                                      <div>
                                        <p className="text-gray-600">Actual Price</p>
                                        <p className="font-bold text-green-600">${prediction.actual_price?.toFixed(2)}</p>
                                      </div>
                                      <div>
                                        <p className="text-gray-600">Change</p>
                                        <p
                                          className={`font-bold ${
                                            (prediction.actual_change_percent || 0) >= 0
                                              ? 'text-green-600'
                                              : 'text-red-600'
                                          }`}
                                        >
                                          {(prediction.actual_change_percent || 0) >= 0 ? '+' : ''}
                                          {prediction.actual_change_percent?.toFixed(2)}%
                                        </p>
                                      </div>
                                    </>
                                  ) : (
                                    <div>
                                      <p className="text-gray-600">Target Date</p>
                                      <p className="font-bold text-blue-600">{format(targetDate, 'MMM dd, yyyy')}</p>
                                    </div>
                                  )}
                                </div>

                                {analysis.catalyst && (
                                  <p className="text-sm text-gray-600 mt-2 line-clamp-1">
                                    <span className="font-semibold">Catalyst:</span> {analysis.catalyst}
                                  </p>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center py-20">
                <p className="text-gray-600">Select a ticker from the sidebar to view analyses</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Analysis Details Modal */}
      {selectedAnalysis && (
        <AnalysisDetailsPanel
          analysis={selectedAnalysis}
          onClose={handleCloseDetails}
        />
      )}
    </div>
  );
}
