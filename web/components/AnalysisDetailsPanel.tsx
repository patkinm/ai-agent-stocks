'use client';

import { X, TrendingUp, TrendingDown, Target, StopCircle, Calendar, Zap, Clock, CheckCircle, XCircle } from 'lucide-react';
import { StockAnalysis, PredictionComparison } from '@/lib/models/analysis';
import { format, addDays } from 'date-fns';

interface AnalysisDetailsPanelProps {
  analysis: StockAnalysis & { prediction?: PredictionComparison };
  onClose: () => void;
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

export default function AnalysisDetailsPanel({ analysis, onClose }: AnalysisDetailsPanelProps) {
  const isBuy = analysis.decision === 'buy';
  const prediction = analysis.prediction;
  
  // Calculate if timeframe has elapsed
  const predictionDate = new Date(analysis.created_at);
  const daysInTimeframe = parseTimeframeToDays(analysis.timeframe);
  const targetDate = addDays(predictionDate, daysInTimeframe);
  const hasTimeframeElapsed = new Date() > targetDate;
  
  // Only show prediction outcome if timeframe has elapsed AND we have actual data
  const shouldShowOutcome = hasTimeframeElapsed && 
                           prediction && 
                           prediction.actual_price !== null;
  
  const targetChange = analysis.target_price
    ? ((analysis.target_price - analysis.current_price) / analysis.current_price) * 100
    : 0;

  const stopLossChange = analysis.stop_loss
    ? ((analysis.stop_loss - analysis.current_price) / analysis.current_price) * 100
    : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-3xl font-bold text-gray-900">{analysis.symbol}</h2>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                  isBuy
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {isBuy ? (
                  <TrendingUp className="w-4 h-4 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 mr-1" />
                )}
                {analysis.decision.toUpperCase()}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              Analyzed on {format(new Date(analysis.created_at), 'MMMM dd, yyyy \'at\' h:mm a')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {/* Price Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="card bg-blue-50 border-blue-200">
              <p className="text-xs text-blue-800 font-medium mb-1">Price at Analysis</p>
              <p className="text-2xl font-bold text-blue-900">${analysis.current_price.toFixed(2)}</p>
              <p
                className={`text-sm font-medium mt-1 ${
                  analysis.price_change_percent >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {analysis.price_change_percent >= 0 ? '+' : ''}
                {analysis.price_change_percent.toFixed(2)}%
              </p>
            </div>

            {analysis.target_price && (
              <div className="card bg-purple-50 border-purple-200">
                <p className="text-xs text-purple-800 font-medium mb-1">Target Price</p>
                <p className="text-2xl font-bold text-purple-900">${analysis.target_price.toFixed(2)}</p>
                <p
                  className={`text-sm font-medium mt-1 ${
                    targetChange >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {targetChange >= 0 ? '+' : ''}
                  {targetChange.toFixed(1)}%
                </p>
              </div>
            )}

            {analysis.stop_loss && (
              <div className="card bg-red-50 border-red-200">
                <p className="text-xs text-red-800 font-medium mb-1">Stop Loss</p>
                <p className="text-2xl font-bold text-red-900">${analysis.stop_loss.toFixed(2)}</p>
                <p
                  className={`text-sm font-medium mt-1 ${
                    stopLossChange >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {stopLossChange >= 0 ? '+' : ''}
                  {stopLossChange.toFixed(1)}%
                </p>
              </div>
            )}

            <div className="card bg-gray-50 border-gray-200">
              <p className="text-xs text-gray-800 font-medium mb-1">Confidence</p>
              <p className="text-2xl font-bold text-gray-900">{analysis.confidence}/10</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className={`h-2 rounded-full ${
                    analysis.confidence >= 7 ? 'bg-green-600' : 
                    analysis.confidence >= 5 ? 'bg-yellow-600' : 'bg-red-600'
                  }`}
                  style={{ width: `${(analysis.confidence / 10) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Prediction Outcome - Only show if timeframe has elapsed */}
          {shouldShowOutcome && (
            <div className={`card mb-6 ${
              prediction.prediction_accuracy && prediction.prediction_accuracy > 0
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start gap-4">
                {prediction.prediction_accuracy && prediction.prediction_accuracy > 0 ? (
                  <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
                ) : (
                  <XCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <h3 className={`text-lg font-bold mb-2 ${
                    prediction.prediction_accuracy && prediction.prediction_accuracy > 0
                      ? 'text-green-900'
                      : 'text-red-900'
                  }`}>
                    Prediction Outcome
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Actual Price</p>
                      <p className="font-bold text-gray-900">${prediction.actual_price?.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Price Change</p>
                      <p className={`font-bold ${
                        (prediction.actual_change_percent || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {(prediction.actual_change_percent || 0) >= 0 ? '+' : ''}
                        {prediction.actual_change_percent?.toFixed(2)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Target Reached</p>
                      <p className="font-bold text-gray-900">
                        {prediction.target_reached ? 'Yes ✓' : 'No ✗'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Days Elapsed</p>
                      <p className="font-bold text-gray-900">{prediction.days_elapsed || 0} days</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Timeframe Status - Show if timeframe hasn't elapsed yet */}
          {!hasTimeframeElapsed && (
            <div className="card mb-6 bg-blue-50 border-blue-200">
              <div className="flex items-start gap-4">
                <Clock className="w-8 h-8 text-blue-600 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-2 text-blue-900">
                    Prediction In Progress
                  </h3>
                  <div className="text-sm space-y-2">
                    <p className="text-gray-700">
                      This prediction's timeframe has not yet elapsed.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-600">Prediction Date</p>
                        <p className="font-semibold text-gray-900">
                          {format(predictionDate, 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Target Date</p>
                        <p className="font-semibold text-gray-900">
                          {format(targetDate, 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Days Until Target</p>
                        <p className="font-semibold text-blue-700">
                          {Math.ceil((targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days remaining
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Timeframe</p>
                        <p className="font-semibold text-gray-900">
                          {analysis.timeframe}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Analysis Details */}
          <div className="card mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Analysis</h3>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{analysis.analysis}</p>
          </div>

          {/* Catalyst & Timeframe */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {analysis.catalyst && (
              <div className="card bg-amber-50 border-amber-200">
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-amber-800 font-medium mb-1">Catalyst</p>
                    <p className="text-sm text-gray-700">{analysis.catalyst}</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="card">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-gray-600 font-medium mb-1">Timeframe</p>
                  <p className="text-sm text-gray-900 font-semibold">{analysis.timeframe}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Technical Indicators */}
          <div className="card mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Technical Indicators</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-600">RSI</p>
                <p className="font-bold text-gray-900">{analysis.rsi.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-600">MA 5</p>
                <p className="font-bold text-gray-900">${analysis.ma_5.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-600">MA 20</p>
                <p className="font-bold text-gray-900">${analysis.ma_20.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-600">Volume Ratio</p>
                <p className="font-bold text-gray-900">{analysis.volume_ratio.toFixed(2)}x</p>
              </div>
            </div>
          </div>

          {/* Company Info */}
          {(analysis.sector || analysis.industry || analysis.market_cap) && (
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Company Information</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                {analysis.sector && (
                  <div>
                    <p className="text-gray-600">Sector</p>
                    <p className="font-bold text-gray-900">{analysis.sector}</p>
                  </div>
                )}
                {analysis.industry && (
                  <div>
                    <p className="text-gray-600">Industry</p>
                    <p className="font-bold text-gray-900">{analysis.industry}</p>
                  </div>
                )}
                {analysis.market_cap && (
                  <div>
                    <p className="text-gray-600">Market Cap</p>
                    <p className="font-bold text-gray-900">
                      ${(analysis.market_cap / 1e9).toFixed(2)}B
                    </p>
                  </div>
                )}
                {analysis.pe_ratio && (
                  <div>
                    <p className="text-gray-600">P/E Ratio</p>
                    <p className="font-bold text-gray-900">{analysis.pe_ratio.toFixed(2)}</p>
                  </div>
                )}
                {analysis.beta && (
                  <div>
                    <p className="text-gray-600">Beta</p>
                    <p className="font-bold text-gray-900">{analysis.beta.toFixed(2)}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4 flex justify-end">
          <button
            onClick={onClose}
            className="btn btn-secondary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}


