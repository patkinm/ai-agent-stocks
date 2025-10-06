'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { Calendar, TrendingUp, TrendingDown, ChevronRight, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

interface Scan {
  _id: string;
  scan_timestamp: string;
  detected_tickers: string[];
  successful_analyses: number;
  failed_tickers: string[];
  buy_signals: number;
  sell_signals: number;
  avg_confidence: number;
  created_at: string;
}

export default function ScansPage() {
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadScans();
  }, []);

  const loadScans = async () => {
    try {
      const response = await fetch('/api/scans');
      const data = await response.json();
      if (data.success) {
        setScans(data.scans);
      }
    } catch (error) {
      console.error('Error loading scans:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Scan History</h2>
          <p className="text-gray-600">Browse past market scans and their results</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading scans...</p>
          </div>
        ) : scans.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-500">No scans yet. Run your first market scan!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {scans.map((scan) => (
              <div
                key={scan._id}
                onClick={() => router.push(`/scans/${scan._id}`)}
                className="card hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <h3 className="text-lg font-bold text-gray-900">
                        {formatDate(scan.scan_timestamp)}
                      </h3>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-gray-500">Detected</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {scan.detected_tickers?.length || 0}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500">Analyzed</p>
                        <p className="text-lg font-semibold text-green-600 flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" />
                          {scan.successful_analyses || 0}
                        </p>
                      </div>

                      {(scan.failed_tickers?.length || 0) > 0 && (
                        <div>
                          <p className="text-xs text-gray-500">Failed</p>
                          <p className="text-lg font-semibold text-red-600 flex items-center gap-1">
                            <XCircle className="w-4 h-4" />
                            {scan.failed_tickers?.length || 0}
                          </p>
                        </div>
                      )}

                      <div>
                        <p className="text-xs text-gray-500">Buy Signals</p>
                        <p className="text-lg font-semibold text-green-600 flex items-center gap-1">
                          <TrendingUp className="w-4 h-4" />
                          {scan.buy_signals || 0}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500">Sell Signals</p>
                        <p className="text-lg font-semibold text-red-600 flex items-center gap-1">
                          <TrendingDown className="w-4 h-4" />
                          {scan.sell_signals || 0}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500">Avg Confidence</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {(scan.avg_confidence || 0).toFixed(1)}%
                        </p>
                      </div>
                    </div>

                    {scan.detected_tickers && scan.detected_tickers.length > 0 && (
                      <div className="text-xs text-gray-600">
                        <span className="font-medium">Tickers:</span>{' '}
                        {scan.detected_tickers.slice(0, 10).join(', ')}
                        {scan.detected_tickers.length > 10 && ` +${scan.detected_tickers.length - 10} more`}
                      </div>
                    )}
                  </div>

                  <ChevronRight className="w-6 h-6 text-gray-400 ml-4" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

