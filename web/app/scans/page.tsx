'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { Calendar, TrendingUp, TrendingDown, Clock, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

interface Scan {
  _id: string;
  scan_timestamp: string;
  scan_type: string;
  stocks_analyzed: number;
  buy_signals: number;
  sell_signals: number;
  avg_confidence: number;
  stock_symbols: string[];
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
      return format(new Date(dateString), 'MMM d, yyyy HH:mm');
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
          <p className="text-gray-600">Browse previous analysis sessions and their results</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading scans...</p>
          </div>
        ) : scans.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-600">No scans yet. Start your first analysis!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {scans.map(scan => (
              <div
                key={scan._id}
                onClick={() => router.push(`/scans/${scan._id}`)}
                className="card hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {scan.scan_type === 'complete' && 'Market Scan'}
                        {scan.scan_type === 'specific' && 'Specific Stocks'}
                        {scan.scan_type === 'single' && 'Single Stock'}
                      </h3>
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(scan.created_at)}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {scan.stock_symbols.slice(0, 8).map(symbol => (
                        <span
                          key={symbol}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded"
                        >
                          {symbol}
                        </span>
                      ))}
                      {scan.stock_symbols.length > 8 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs font-medium rounded">
                          +{scan.stock_symbols.length - 8} more
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Analyzed</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {scan.stocks_analyzed}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          Buy
                        </p>
                        <p className="text-lg font-semibold text-green-600">{scan.buy_signals}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <TrendingDown className="w-3 h-3" />
                          Sell
                        </p>
                        <p className="text-lg font-semibold text-red-600">{scan.sell_signals}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Avg Confidence</p>
                        <p className="text-lg font-semibold text-blue-600">
                          {scan.avg_confidence.toFixed(1)}/10
                        </p>
                      </div>
                    </div>
                  </div>

                  <ChevronRight className="w-6 h-6 text-gray-400 ml-4 flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


