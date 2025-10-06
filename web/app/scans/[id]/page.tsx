'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import AnalysisCard from '@/components/AnalysisCard';
import { Calendar, TrendingUp, TrendingDown, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
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
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-500">Loading scan details...</p>
        </div>
      </div>
    );
  }

  if (!scan) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-red-600">Scan not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => router.push('/scans')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Scans
        </button>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-6 h-6 text-gray-400" />
            <h2 className="text-3xl font-bold text-gray-900">
              {formatDate(scan.scan_timestamp)}
            </h2>
          </div>
          <p className="text-gray-600">Scan details and analysis results</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <p className="text-sm text-gray-600 mb-1">Detected Tickers</p>
            <p className="text-3xl font-bold text-gray-900">{scan.detected_tickers?.length || 0}</p>
          </div>

          <div className="card">
            <p className="text-sm text-gray-600 mb-1">Successful</p>
            <p className="text-3xl font-bold text-green-600 flex items-center gap-2">
              <CheckCircle className="w-6 h-6" />
              {scan.successful_analyses || 0}
            </p>
          </div>

          <div className="card">
            <p className="text-sm text-gray-600 mb-1">Buy Signals</p>
            <p className="text-3xl font-bold text-green-600 flex items-center gap-2">
              <TrendingUp className="w-6 h-6" />
              {scan.buy_signals || 0}
            </p>
          </div>

          <div className="card">
            <p className="text-sm text-gray-600 mb-1">Sell Signals</p>
            <p className="text-3xl font-bold text-red-600 flex items-center gap-2">
              <TrendingDown className="w-6 h-6" />
              {scan.sell_signals || 0}
            </p>
          </div>
        </div>

        {/* Detected Tickers */}
        {scan.detected_tickers && scan.detected_tickers.length > 0 && (
          <div className="card mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-3">
              Step 1: Detected Tickers ({scan.detected_tickers.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {scan.detected_tickers.map((ticker) => (
                <span
                  key={ticker}
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    scan.failed_tickers?.includes(ticker)
                      ? 'bg-red-100 text-red-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {ticker}
                  {scan.failed_tickers?.includes(ticker) && ' ✗'}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Failed Tickers */}
        {(scan.failed_tickers?.length || 0) > 0 && (
          <div className="card mb-8 bg-red-50 border-red-200">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <h3 className="text-lg font-bold text-red-900">
                Failed Analyses ({scan.failed_tickers?.length || 0})
              </h3>
            </div>
            <p className="text-sm text-red-700">
              These tickers could not be analyzed: {scan.failed_tickers?.join(', ')}
            </p>
          </div>
        )}

        {/* Analysis Results */}
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900">
            Step 2: Analysis Results ({analyses.length})
          </h3>
          <p className="text-gray-600">Individual ticker analysis with AI recommendations</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {analyses.map((analysis, index) => (
            <div key={analysis._id}>
              <p className="text-xs text-gray-500 mb-2">
                Analysis {index + 1} of {analyses.length}
              </p>
              <AnalysisCard analysis={analysis} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

