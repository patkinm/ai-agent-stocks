'use client';

import { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import { TrendingUp, TrendingDown, CheckCircle, XCircle, RefreshCw, Target } from 'lucide-react';
import { format } from 'date-fns';

interface Analysis {
  _id: string;
  symbol: string;
  decision: 'buy' | 'sell';
  target_price: number | null;
  current_price: number;
  analysis_timestamp: string;
  actual_price: number | null;
  actual_change_percent: number | null;
  prediction_accuracy: number | null;
  target_reached: boolean | null;
  last_checked: Date | null;
  days_elapsed: number | null;
}

interface Stats {
  total: number;
  correct: number;
  incorrect: number;
  accuracy_rate: number;
  avg_accuracy_score: number;
}

export default function PredictionsPage() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadPredictions();
  }, []);

  const loadPredictions = async () => {
    try {
      const response = await fetch('/api/comparisons');
      const data = await response.json();
      if (data.success) {
        setAnalyses(data.analyses);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error loading predictions:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePredictions = async () => {
    setUpdating(true);
    try {
      const response = await fetch('/api/comparisons', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        await loadPredictions();
      }
    } catch (error) {
      console.error('Error updating predictions:', error);
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString: string | null | Date) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch {
      return String(dateString);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Prediction Tracking</h2>
              <p className="text-gray-600">Track how AI predictions perform vs actual results</p>
            </div>
            <button
              onClick={updatePredictions}
              disabled={updating}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gray-700 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
            >
              {updating ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Update Predictions
                </>
              )}
            </button>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Predictions</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <Target className="w-12 h-12 text-gray-400" />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Correct</p>
                  <p className="text-3xl font-bold text-green-600">{stats.correct}</p>
                </div>
                <CheckCircle className="w-12 h-12 text-green-400" />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Incorrect</p>
                  <p className="text-3xl font-bold text-red-600">{stats.incorrect}</p>
                </div>
                <XCircle className="w-12 h-12 text-red-400" />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Accuracy Rate</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.accuracy_rate.toFixed(1)}%</p>
                </div>
                <TrendingUp className="w-12 h-12 text-gray-400" />
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading predictions...</p>
          </div>
        ) : analyses.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-500">
              No prediction data available yet. Predictions are tracked automatically after analyses.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {analyses.map(analysis => {
              const isCorrect = (analysis.prediction_accuracy || 0) > 0;
              const changePercent = analysis.actual_change_percent || 0;

              return (
                <div key={analysis._id} className="card">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xl font-bold text-gray-900">{analysis.symbol}</h3>
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                            analysis.decision === 'buy'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {analysis.decision === 'buy' ? (
                            <TrendingUp className="w-4 h-4 mr-1" />
                          ) : (
                            <TrendingDown className="w-4 h-4 mr-1" />
                          )}
                          {analysis.decision.toUpperCase()}
                        </span>
                        {analysis.actual_price !== null && (
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                              isCorrect
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {isCorrect ? (
                              <CheckCircle className="w-4 h-4 mr-1" />
                            ) : (
                              <XCircle className="w-4 h-4 mr-1" />
                            )}
                            {isCorrect ? 'Correct' : 'Incorrect'}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Predicted Price</p>
                          <p className="text-lg font-semibold text-gray-900">
                            ${analysis.current_price.toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(analysis.analysis_timestamp)}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-gray-500">Target</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {analysis.target_price ? `$${analysis.target_price.toFixed(2)}` : 'N/A'}
                          </p>
                          {analysis.target_reached !== null && (
                            <p
                              className={`text-xs font-medium ${
                                analysis.target_reached ? 'text-green-600' : 'text-red-600'
                              }`}
                            >
                              {analysis.target_reached ? '✓ Reached' : '✗ Not reached'}
                            </p>
                          )}
                        </div>

                        <div>
                          <p className="text-xs text-gray-500">Current Price</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {analysis.actual_price !== null
                              ? `$${analysis.actual_price.toFixed(2)}`
                              : 'Pending'}
                          </p>
                          {analysis.last_checked && (
                            <p className="text-xs text-gray-500">
                              {formatDate(analysis.last_checked)}
                            </p>
                          )}
                        </div>

                        <div>
                          <p className="text-xs text-gray-500">Change</p>
                          <p
                            className={`text-lg font-semibold ${
                              changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {analysis.actual_change_percent !== null
                              ? `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`
                              : 'N/A'}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-gray-500">Accuracy Score</p>
                          <p
                            className={`text-lg font-semibold ${
                              (analysis.prediction_accuracy || 0) > 0
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            {analysis.prediction_accuracy !== null
                              ? analysis.prediction_accuracy.toFixed(2)
                              : 'N/A'}
                          </p>
                          {analysis.days_elapsed !== null && (
                            <p className="text-xs text-gray-500">
                              {analysis.days_elapsed} days
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
