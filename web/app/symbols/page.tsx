'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { Search, Loader2 } from 'lucide-react';

export default function SymbolsPage() {
  const [symbol, setSymbol] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSearch = async () => {
    if (!symbol.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: symbol.toUpperCase() }),
      });

      const data = await response.json();
      if (data.success) {
        // Redirect to home with the analysis
        router.push(`/?symbol=${symbol.toUpperCase()}`);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const popularStocks = [
    { symbol: 'AAPL', name: 'Apple Inc.' },
    { symbol: 'MSFT', name: 'Microsoft Corp.' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.' },
    { symbol: 'TSLA', name: 'Tesla Inc.' },
    { symbol: 'NVDA', name: 'NVIDIA Corp.' },
    { symbol: 'META', name: 'Meta Platforms' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.' },
    { symbol: 'AMD', name: 'Advanced Micro Devices' },
    { symbol: 'NFLX', name: 'Netflix Inc.' },
    { symbol: 'SPY', name: 'S&P 500 ETF' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Search Symbols</h2>
          <p className="text-gray-600">Analyze any stock symbol or browse popular stocks</p>
        </div>

        <div className="card mb-8">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Enter stock symbol (e.g., AAPL)"
              value={symbol}
              onChange={e => setSymbol(e.target.value.toUpperCase())}
              onKeyPress={e => e.key === 'Enter' && handleSearch()}
              className="input flex-1"
              disabled={loading}
            />
            <button
              onClick={handleSearch}
              disabled={loading || !symbol.trim()}
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
        </div>

        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Popular Stocks</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {popularStocks.map(stock => (
            <div
              key={stock.symbol}
              onClick={() => setSymbol(stock.symbol)}
              className="card hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-bold text-gray-900">{stock.symbol}</h4>
                  <p className="text-sm text-gray-600">{stock.name}</p>
                </div>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setSymbol(stock.symbol);
                    handleSearch();
                  }}
                  className="btn btn-secondary text-sm"
                >
                  Analyze
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


