'use client';

import { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import { TrendingUp, TrendingDown, CheckCircle, XCircle, RefreshCw, Target } from 'lucide-react';
import { format } from 'date-fns';

interface Comparison {
  _id: string;
  symbol: string;
  predicted_decision: 'buy' | 'sell';
  predicted_target: number;
  predicted_price: number;
  prediction_date: string;
  actual_price: number | null;
  actual_change_percent: number | null;
  prediction_accuracy: number | null;
  target_reached: boolean | null;
  comparison_date: string | null;
  days_elapsed: number | null;
}

interface Stats {
  total: number;
  correct: number;
  incorrect: number;
  accuracy_rate: number;
  avg_accuracy_score: number;
}

export default function ComparisonsPage() {
  const [comparisons, setComparisons] = useState<Comparison[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadComparisons();
  }, []);

  const loadComparisons = async () => {
    try {
      const response = await fetch('/api/comparisons');
      const data = await response.json();
      if (data.success) {
        setComparisons(data.comparisons);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error loading comparisons:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateComparisons = async () => {
    setUpdating(true);
    try {
      const response = await fetch('/api/comparisons', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        await loadComparisons();
      }
    } catch (error) {
      console.error('Error updating comparisons:', error);
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Prediction Tracking</h2>
            <p className="text-gray-600">
              Compare predictions with actual stock performance
            </p>
          </div>
          <button
            onClick={updateComparisons}
            disabled={updating}
            className="btn btn-primary flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${updating ? 'animate-spin' : ''}`} />
            {updating ? 'Updating...' : 'Update All'}
          </button>
        </div>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <div>
                <p className="text-sm text-blue-800 font-medium">Total Predictions</p>
                <p className="text-3xl font-bold text-blue-900">{stats.total}</p>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <div>
                <p className="text-sm text-green-800 font-medium">Correct</p>
                <p className="text-3xl font-bold text-green-900">{stats.correct}</p>
                <p className="text-xs text-green-700 mt-1">
                  {stats.accuracy_rate.toFixed(1)}% accuracy
                </p>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <div>
                <p className="text-sm text-red-800 font-medium">Incorrect</p>
                <p className="text-3xl font-bold text-red-900">{stats.incorrect}</p>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <div>
                <p className="text-sm text-purple-800 font-medium">Avg Score</p>
                <p className="text-3xl font-bold text-purple-900">
                  {stats.avg_accuracy_score.toFixed(2)}
                </p>
                <p className="text-xs text-purple-700 mt-1">-1 to +1 scale</p>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading predictions...</p>
          </div>
        ) : comparisons.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-600">
              No prediction comparisons yet. Analyses will appear here after the predicted timeframe.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {comparisons.map(comparison => {
              const isCorrect = (comparison.prediction_accuracy || 0) > 0;
              const changePercent = comparison.actual_change_percent || 0;

              return (
                <div key={comparison._id} className="card">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xl font-bold text-gray-900">{comparison.symbol}</h3>
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                            comparison.predicted_decision === 'buy'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {comparison.predicted_decision === 'buy' ? (
                            <TrendingUp className="w-4 h-4 mr-1" />
                          ) : (
                            <TrendingDown className="w-4 h-4 mr-1" />
                          )}
                          {comparison.predicted_decision.toUpperCase()}
                        </span>
                        {comparison.actual_price !== null && (
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
                          <p className="text-xs text-gray-500">Predicted</p>
                          <p className="text-lg font-semibold text-gray-900">
                            ${comparison.predicted_price.toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(comparison.prediction_date)}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-gray-500">Target</p>
                          <p className="text-lg font-semibold text-gray-900">
                            ${comparison.predicted_target.toFixed(2)}
                          </p>
                          {comparison.target_reached !== null && (
                            <p
                              className={`text-xs font-medium ${
                                comparison.target_reached ? 'text-green-600' : 'text-red-600'
                              }`}
                            >
                              {comparison.target_reached ? '✓ Reached' : '✗ Not reached'}
                            </p>
                          )}
                        </div>

                        <div>
                          <p className="text-xs text-gray-500">Actual</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {comparison.actual_price !== null
                              ? `$${comparison.actual_price.toFixed(2)}`
                              : 'Pending'}
                          </p>
                          {comparison.comparison_date && (
                            <p className="text-xs text-gray-500">
                              {formatDate(comparison.comparison_date)}
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
                            {comparison.actual_change_percent !== null
                              ? `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`
                              : 'N/A'}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-gray-500">Accuracy</p>
                          <p
                            className={`text-lg font-semibold ${
                              (comparison.prediction_accuracy || 0) > 0
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            {comparison.prediction_accuracy !== null
                              ? comparison.prediction_accuracy.toFixed(2)
                              : 'N/A'}
                          </p>
                          {comparison.days_elapsed !== null && (
                            <p className="text-xs text-gray-500">
                              {comparison.days_elapsed} days
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


