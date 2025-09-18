"""
Market Data Fetcher for stock analysis
"""
import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import requests


class MarketDataFetcher:
    """Fetches and processes market data for stock analysis"""
    
    def __init__(self):
        self.session = requests.Session()
    
    def get_stock_data(self, symbol: str, period: str = "1mo") -> Optional[Dict]:
        """
        Fetch comprehensive stock data for a given symbol
        
        Args:
            symbol: Stock ticker symbol
            period: Data period (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max)
        
        Returns:
            Dictionary containing stock data and metrics
        """
        try:
            ticker = yf.Ticker(symbol)
            
            # Get historical data
            hist = ticker.history(period=period)
            if hist.empty:
                return None
            
            # Get stock info
            info = ticker.info
            
            # Calculate technical indicators
            current_price = hist['Close'].iloc[-1]
            prev_close = hist['Close'].iloc[-2] if len(hist) > 1 else current_price
            
            # Calculate moving averages
            ma_5 = hist['Close'].rolling(window=5).mean().iloc[-1] if len(hist) >= 5 else current_price
            ma_20 = hist['Close'].rolling(window=20).mean().iloc[-1] if len(hist) >= 20 else current_price
            
            # Calculate RSI (simplified)
            delta = hist['Close'].diff()
            gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
            loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
            rs = gain / loss
            rsi = 100 - (100 / (1 + rs)).iloc[-1] if len(hist) >= 14 else 50
            
            # Volume analysis
            avg_volume = hist['Volume'].rolling(window=20).mean().iloc[-1] if len(hist) >= 20 else hist['Volume'].iloc[-1]
            current_volume = hist['Volume'].iloc[-1]
            
            return {
                'symbol': symbol,
                'current_price': float(current_price),
                'previous_close': float(prev_close),
                'price_change': float(current_price - prev_close),
                'price_change_percent': float((current_price - prev_close) / prev_close * 100),
                'volume': int(current_volume),
                'avg_volume': float(avg_volume),
                'volume_ratio': float(current_volume / avg_volume) if avg_volume > 0 else 1.0,
                'ma_5': float(ma_5),
                'ma_20': float(ma_20),
                'rsi': float(rsi),
                'market_cap': info.get('marketCap'),
                'pe_ratio': info.get('trailingPE'),
                'beta': info.get('beta'),
                'fifty_two_week_high': info.get('fiftyTwoWeekHigh'),
                'fifty_two_week_low': info.get('fiftyTwoWeekLow'),
                'short_name': info.get('shortName', symbol),
                'sector': info.get('sector'),
                'industry': info.get('industry'),
                'analyst_target_price': info.get('targetMeanPrice'),
                'recommendation': info.get('recommendationMean'),
                'earnings_date': info.get('earningsDate'),
                'dividend_yield': info.get('dividendYield'),
                'last_updated': datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"Error fetching data for {symbol}: {str(e)}")
            return None
    
    def get_multiple_stocks_data(self, symbols: List[str], period: str = "1mo") -> Dict[str, Dict]:
        """
        Fetch data for multiple stocks
        
        Args:
            symbols: List of stock ticker symbols
            period: Data period
        
        Returns:
            Dictionary mapping symbols to their data
        """
        results = {}
        for symbol in symbols:
            data = self.get_stock_data(symbol.strip().upper(), period)
            if data:
                results[symbol.upper()] = data
        
        return results
    
    def get_market_overview(self) -> Dict:
        """
        Get overall market indicators
        
        Returns:
            Dictionary containing market overview data
        """
        market_symbols = ['^GSPC', '^DJI', '^IXIC', '^VIX']  # S&P 500, Dow, Nasdaq, VIX
        market_data = {}
        
        for symbol in market_symbols:
            try:
                ticker = yf.Ticker(symbol)
                hist = ticker.history(period="5d")
                if not hist.empty:
                    current = hist['Close'].iloc[-1]
                    prev = hist['Close'].iloc[-2] if len(hist) > 1 else current
                    change = (current - prev) / prev * 100
                    
                    market_data[symbol] = {
                        'value': float(current),
                        'change_percent': float(change)
                    }
            except Exception as e:
                print(f"Error fetching market data for {symbol}: {str(e)}")
        
        return market_data
    
    def format_stock_summary(self, stock_data: Dict) -> str:
        """
        Format stock data into a readable summary for GPT analysis
        
        Args:
            stock_data: Stock data dictionary
        
        Returns:
            Formatted string summary
        """
        if not stock_data:
            return "No data available"
        
        # Helper function to safely format numbers
        def safe_format(value, format_str, default='N/A'):
            if value is None or (isinstance(value, str) and value == 'N/A'):
                return default
            try:
                return format_str.format(value)
            except (ValueError, TypeError):
                return default
        
        # Safe formatting for financial data
        market_cap = stock_data.get('market_cap')
        market_cap_str = f"${market_cap:,}" if market_cap else 'N/A'
        
        analyst_target = stock_data.get('analyst_target_price')
        analyst_target_str = f"${analyst_target:.2f}" if analyst_target else 'N/A'
        
        dividend_yield = stock_data.get('dividend_yield')
        dividend_yield_str = f"{dividend_yield:.2f}%" if dividend_yield else 'N/A'
        
        pe_ratio = stock_data.get('pe_ratio')
        pe_ratio_str = f"{pe_ratio:.2f}" if pe_ratio else 'N/A'
        
        beta = stock_data.get('beta')
        beta_str = f"{beta:.2f}" if beta else 'N/A'
        
        fifty_two_low = stock_data.get('fifty_two_week_low', 0) or 0
        fifty_two_high = stock_data.get('fifty_two_week_high', 0) or 0
        
        summary = f"""
Stock: {stock_data['short_name']} ({stock_data['symbol']})
Sector: {stock_data.get('sector', 'N/A')} | Industry: {stock_data.get('industry', 'N/A')}

Price Information:
- Current Price: ${stock_data['current_price']:.2f}
- Change: ${stock_data['price_change']:.2f} ({stock_data['price_change_percent']:.2f}%)
- 52-Week Range: ${fifty_two_low:.2f} - ${fifty_two_high:.2f}

Technical Indicators:
- 5-day MA: ${stock_data['ma_5']:.2f}
- 20-day MA: ${stock_data['ma_20']:.2f}
- RSI: {stock_data['rsi']:.1f}
- Volume: {stock_data['volume']:,} (Ratio: {stock_data['volume_ratio']:.2f}x avg)

Fundamentals:
- Market Cap: {market_cap_str}
- P/E Ratio: {pe_ratio_str}
- Beta: {beta_str}
- Analyst Target: {analyst_target_str}
- Dividend Yield: {dividend_yield_str}
"""
        return summary.strip()
