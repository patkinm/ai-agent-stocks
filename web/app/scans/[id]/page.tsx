'use client';

import { useEffect, useState } from 'react';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import AnalysisCard from '@/components/AnalysisCard';
import { ArrowLeft, Calendar, Loader2 } from 'lucide-react';
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

export default function ScanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [scan, setScan] = useState<Scan | null>(null);
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadScanDetails();
  }, [resolvedParams.id]);

  const loadScanDetails = async () => {
    try {
      const response = await fetch(`/api/scans/${resolvedParams.id}`);
      const data = await response.json();
      if (data.success) {
        setScan(data.scan);
        setAnalyses(data.analyses);
      }
    } catch (error) {
      console.error('Error loading scan details:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMMM d, yyyy \'at\' h:mm a');
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Loading scan details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!scan) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="card text-center py-12">
            <p className="text-gray-600">Scan not found</p>
          </div>
        </div>
      </div>
    );
  }

  const buys = analyses.filter(a => a.decision === 'buy');
  const sells = analyses.filter(a => a.decision === 'sell');

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Scans
        </button>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-3xl font-bold text-gray-900">
              {scan.scan_type === 'complete' && 'Market Scan'}
              {scan.scan_type === 'specific' && 'Specific Stocks Analysis'}
              {scan.scan_type === 'single' && 'Single Stock Analysis'}
            </h2>
          </div>
          <p className="text-gray-600 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {formatDate(scan.created_at)}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-800 font-medium">Buy Signals</p>
                <p className="text-3xl font-bold text-green-900">{scan.buy_signals}</p>
              </div>
              <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
                <span className="text-2xl">🟢</span>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-800 font-medium">Sell Signals</p>
                <p className="text-3xl font-bold text-red-900">{scan.sell_signals}</p>
              </div>
              <div className="w-12 h-12 bg-red-200 rounded-full flex items-center justify-center">
                <span className="text-2xl">🔴</span>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-800 font-medium">Avg Confidence</p>
                <p className="text-3xl font-bold text-blue-900">
                  {scan.avg_confidence.toFixed(1)}/10
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            Buy Recommendations ({buys.length})
          </h3>
        </div>

        {buys.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {buys.map((analysis, index) => (
              <AnalysisCard key={index} analysis={analysis} />
            ))}
          </div>
        ) : (
          <div className="card text-center py-8 mb-8">
            <p className="text-gray-600">No buy signals in this scan</p>
          </div>
        )}

        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            Sell Recommendations ({sells.length})
          </h3>
        </div>

        {sells.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {sells.map((analysis, index) => (
              <AnalysisCard key={index} analysis={analysis} />
            ))}
          </div>
        ) : (
          <div className="card text-center py-8">
            <p className="text-gray-600">No sell signals in this scan</p>
          </div>
        )}
      </div>
    </div>
  );
}


