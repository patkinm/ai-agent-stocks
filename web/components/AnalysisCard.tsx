'use client';

import { TrendingUp, TrendingDown, Target, StopCircle, Calendar, Zap } from 'lucide-react';

interface AnalysisCardProps {
  analysis: {
    symbol: string;
    decision: 'buy' | 'sell';
    confidence: number;
    current_price: number;
    target_price: number | null;
    stop_loss: number | null;
    catalyst: string;
    timeframe: string;
    analysis: string;
    price_change_percent: number;
  };
}

export default function AnalysisCard({ analysis }: AnalysisCardProps) {
  const isBuy = analysis.decision === 'buy';
  const targetChange = analysis.target_price
    ? ((analysis.target_price - analysis.current_price) / analysis.current_price) * 100
    : 0;

  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-2xl font-bold text-gray-900">{analysis.symbol}</h3>
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
          <p className="text-sm text-gray-500 mt-1">
            Confidence: <span className="font-semibold text-gray-900">{analysis.confidence}/10</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900">${analysis.current_price.toFixed(2)}</p>
          <p
            className={`text-sm font-medium ${
              analysis.price_change_percent >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {analysis.price_change_percent >= 0 ? '+' : ''}
            {analysis.price_change_percent.toFixed(2)}%
          </p>
        </div>
      </div>

      {analysis.analysis && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-700 leading-relaxed">{analysis.analysis}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-4">
        {analysis.target_price && (
          <div className="flex items-start gap-2">
            <Target className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500">Target</p>
              <p className="text-lg font-semibold text-gray-900">
                ${analysis.target_price.toFixed(2)}
              </p>
              <p
                className={`text-xs font-medium ${
                  targetChange >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {targetChange >= 0 ? '+' : ''}
                {targetChange.toFixed(1)}%
              </p>
            </div>
          </div>
        )}
        {analysis.stop_loss && (
          <div className="flex items-start gap-2">
            <StopCircle className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500">Stop Loss</p>
              <p className="text-lg font-semibold text-gray-900">
                ${analysis.stop_loss.toFixed(2)}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2 text-sm">
        {analysis.catalyst && (
          <div className="flex items-start gap-2">
            <Zap className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-gray-700">{analysis.catalyst}</p>
          </div>
        )}
        <div className="flex items-center gap-2 text-gray-500">
          <Calendar className="w-4 h-4" />
          <p>Timeframe: {analysis.timeframe}</p>
        </div>
      </div>
    </div>
  );
}


