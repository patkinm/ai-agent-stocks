'use client';

import { useState } from 'react';
import Navigation from '@/components/Navigation';
import AnalysisCard from '@/components/AnalysisCard';
import { Search, Loader2, AlertCircle } from 'lucide-react';

export default function AnalyzePage() {
  const [symbol, setSymbol] = useState('');
  const [count, setCount] = useState(8);
  const [mode, setMode] = useState<'single' | 'scan'>('single');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [scanId, setScanId] = useState('');

  const handleAnalyze = async () => {
    if (mode === 'single' && !symbol.trim()) {
      setError('Please enter a stock symbol');
      return;
    }

    setLoading(true);
    setError('');
    setResults([]);

    try {
      if (mode === 'single') {
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbol: symbol.toUpperCase() }),
        });

        const data = await response.json();
        if (data.error) {
          setError(data.error);
        } else {
          setResults([data.analysis]);
        }
      } else {
        const response = await fetch('/api/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ count }),
        });

        const data = await response.json();
        if (data.error) {
          setError(data.error);
        } else {
          setResults(data.results);
          setScanId(data.scanId);
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const buys = results.filter(r => r.decision === 'buy');
  const sells = results.filter(r => r.decision === 'sell');
  const avgConfidence =
    results.length > 0
      ? results.reduce((sum, r) => sum + r.confidence, 0) / results.length
      : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Stock Analysis</h2>
          <p className="text-gray-600">AI-powered binary decision analysis for short-term trading</p>
        </div>

        <div className="card mb-8">
          <div className="flex gap-4 mb-4">
            <button
              onClick={() => setMode('single')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                mode === 'single'
                  ? 'bg-gray-700 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Single Stock
            </button>
            <button
              onClick={() => setMode('scan')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                mode === 'scan'
                  ? 'bg-gray-700 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Market Scan
            </button>
          </div>

          {mode === 'single' ? (
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Enter stock symbol (e.g., AAPL)"
                value={symbol}
                onChange={e => setSymbol(e.target.value.toUpperCase())}
                onKeyPress={e => e.key === 'Enter' && handleAnalyze()}
                className="input flex-1"
                disabled={loading}
              />
              <button
                onClick={handleAnalyze}
                disabled={loading}
                className="btn btn-primary flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Analyze
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of stocks to scan
                </label>
                <input
                  type="number"
                  value={count}
                  onChange={e => setCount(parseInt(e.target.value) || 8)}
                  min="1"
                  max="20"
                  className="input"
                  disabled={loading}
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="btn btn-primary flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      Start Scan
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>

        {loading && (
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              {mode === 'single' ? 'Analyzing stock...' : 'Scanning market and analyzing stocks...'}
            </p>
            <p className="text-sm text-gray-500 mt-2">This may take a few minutes</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-800 font-medium">Buy Signals</p>
                    <p className="text-3xl font-bold text-green-900">{buys.length}</p>
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
                    <p className="text-3xl font-bold text-red-900">{sells.length}</p>
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
                    <p className="text-3xl font-bold text-blue-900">{avgConfidence.toFixed(1)}/10</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
                    <span className="text-2xl">📊</span>
                  </div>
                </div>
              </div>
            </div>

            {scanId && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  Scan ID: <span className="font-mono font-semibold">{scanId}</span> - View in{' '}
                  <a href="/scans" className="underline hover:text-blue-900">
                    Scans History
                  </a>
                </p>
              </div>
            )}

            <div className="mb-4">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Analysis Results</h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {results.map((result, index) => (
                <AnalysisCard key={index} analysis={result} />
              ))}
            </div>

            <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                ⚠️ <strong>Disclaimer:</strong> This is for educational purposes only. Always do your
                own research before trading. Past performance does not guarantee future results.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}


