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
        Fetch comprehensive stock data for a given symbol including extended hours
        
        Args:
            symbol: Stock ticker symbol
            period: Data period (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max)
        
        Returns:
            Dictionary containing stock data and metrics including pre/post market
        """
        try:
            ticker = yf.Ticker(symbol)
            
            # Get historical data
            hist = ticker.history(period=period)
            if hist.empty:
                return None
            
            # Get extended hours data (pre-market and after-hours)
            extended_hours_data = self._get_extended_hours_data(ticker, symbol)
            
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
                'last_updated': datetime.now().isoformat(),
                # Extended hours data
                **extended_hours_data
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
    
    def _get_extended_hours_data(self, ticker, symbol: str) -> Dict:
        """
        Get pre-market and after-hours trading data
        
        Args:
            ticker: yfinance Ticker object
            symbol: Stock symbol
            
        Returns:
            Dictionary with extended hours data
        """
        extended_data = {
            'premarket_price': None,
            'premarket_change': None,
            'premarket_change_percent': None,
            'premarket_volume': None,
            'afterhours_price': None,
            'afterhours_change': None,
            'afterhours_change_percent': None,
            'afterhours_volume': None,
            'extended_hours_active': False,
            'last_extended_trade_time': None
        }
        
        try:
            # Get fast info which sometimes includes pre/post market data
            fast_info = ticker.fast_info
            
            # Try to get current quote data
            info = ticker.info
            
            # Check for pre-market data
            premarket_price = info.get('preMarketPrice')
            if premarket_price:
                regular_price = info.get('regularMarketPrice', info.get('previousClose', 0))
                if regular_price:
                    extended_data['premarket_price'] = premarket_price
                    extended_data['premarket_change'] = premarket_price - regular_price
                    extended_data['premarket_change_percent'] = (premarket_price - regular_price) / regular_price * 100
                    extended_data['premarket_volume'] = info.get('preMarketVolume', 0)
                    extended_data['extended_hours_active'] = True
                    
                    premarket_time = info.get('preMarketTime')
                    if premarket_time:
                        extended_data['last_extended_trade_time'] = datetime.fromtimestamp(premarket_time).isoformat()
            
            # Check for after-hours data
            afterhours_price = info.get('postMarketPrice')
            if afterhours_price:
                regular_price = info.get('regularMarketPrice', info.get('previousClose', 0))
                if regular_price:
                    extended_data['afterhours_price'] = afterhours_price
                    extended_data['afterhours_change'] = afterhours_price - regular_price
                    extended_data['afterhours_change_percent'] = (afterhours_price - regular_price) / regular_price * 100
                    extended_data['afterhours_volume'] = info.get('postMarketVolume', 0)
                    extended_data['extended_hours_active'] = True
                    
                    afterhours_time = info.get('postMarketTime')
                    if afterhours_time:
                        extended_data['last_extended_trade_time'] = datetime.fromtimestamp(afterhours_time).isoformat()
            
            # Get 1-day data with extended hours if available
            try:
                hist_1d = ticker.history(period="1d", interval="1m", prepost=True)
                if not hist_1d.empty:
                    # Check if we have extended hours activity
                    market_hours = hist_1d.between_time('09:30', '16:00')
                    extended_hours = hist_1d[~hist_1d.index.isin(market_hours.index)]
                    
                    if not extended_hours.empty:
                        extended_data['extended_hours_active'] = True
                        
                        # Get latest extended hours data
                        latest_extended = extended_hours.iloc[-1]
                        extended_data['last_extended_trade_time'] = latest_extended.name.isoformat()
                        
                        # If we didn't get pre/post market prices from info, try from history
                        if not extended_data['premarket_price'] and not extended_data['afterhours_price']:
                            regular_close = market_hours['Close'].iloc[-1] if not market_hours.empty else hist_1d['Close'].iloc[0]
                            latest_price = latest_extended['Close']
                            
                            # Determine if it's pre-market or after-hours based on time
                            trade_time = latest_extended.name.time()
                            if trade_time < datetime.strptime('09:30', '%H:%M').time():
                                # Pre-market
                                extended_data['premarket_price'] = latest_price
                                extended_data['premarket_change'] = latest_price - regular_close
                                extended_data['premarket_change_percent'] = (latest_price - regular_close) / regular_close * 100
                                extended_data['premarket_volume'] = int(latest_extended['Volume'])
                            else:
                                # After-hours
                                extended_data['afterhours_price'] = latest_price
                                extended_data['afterhours_change'] = latest_price - regular_close
                                extended_data['afterhours_change_percent'] = (latest_price - regular_close) / regular_close * 100
                                extended_data['afterhours_volume'] = int(latest_extended['Volume'])
            except Exception:
                # Extended hours data not available or error occurred
                pass
                
        except Exception as e:
            print(f"Note: Extended hours data not available for {symbol}: {str(e)}")
        
        return extended_data
    
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
        
        # Format extended hours data
        extended_hours_section = self._format_extended_hours_data(stock_data)
        
        summary = f"""
Stock: {stock_data['short_name']} ({stock_data['symbol']})
Sector: {stock_data.get('sector', 'N/A')} | Industry: {stock_data.get('industry', 'N/A')}

Price Information:
- Current Price: ${stock_data['current_price']:.2f}
- Change: ${stock_data['price_change']:.2f} ({stock_data['price_change_percent']:.2f}%)
- 52-Week Range: ${fifty_two_low:.2f} - ${fifty_two_high:.2f}

{extended_hours_section}

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
    
    def _format_extended_hours_data(self, stock_data: Dict) -> str:
        """
        Format extended hours (pre-market and after-hours) data for analysis
        
        Args:
            stock_data: Stock data dictionary
            
        Returns:
            Formatted string with extended hours information
        """
        extended_sections = []
        
        # Pre-market data
        if stock_data.get('premarket_price'):
            premarket_price = stock_data['premarket_price']
            premarket_change = stock_data.get('premarket_change', 0)
            premarket_change_pct = stock_data.get('premarket_change_percent', 0)
            premarket_volume = stock_data.get('premarket_volume', 0)
            
            change_indicator = "📈" if premarket_change >= 0 else "📉"
            extended_sections.append(f"""Pre-Market Activity:
- Pre-Market Price: ${premarket_price:.2f}
- Pre-Market Change: {change_indicator} ${premarket_change:.2f} ({premarket_change_pct:+.2f}%)
- Pre-Market Volume: {premarket_volume:,}""")
        
        # After-hours data
        if stock_data.get('afterhours_price'):
            afterhours_price = stock_data['afterhours_price']
            afterhours_change = stock_data.get('afterhours_change', 0)
            afterhours_change_pct = stock_data.get('afterhours_change_percent', 0)
            afterhours_volume = stock_data.get('afterhours_volume', 0)
            
            change_indicator = "📈" if afterhours_change >= 0 else "📉"
            extended_sections.append(f"""After-Hours Activity:
- After-Hours Price: ${afterhours_price:.2f}
- After-Hours Change: {change_indicator} ${afterhours_change:.2f} ({afterhours_change_pct:+.2f}%)
- After-Hours Volume: {afterhours_volume:,}""")
        
        # Extended hours activity status
        if stock_data.get('extended_hours_active'):
            if stock_data.get('last_extended_trade_time'):
                trade_time = stock_data['last_extended_trade_time']
                extended_sections.append(f"⏰ Last Extended Trade: {trade_time}")
        else:
            if not extended_sections:
                extended_sections.append("Extended Hours: No current pre-market or after-hours activity")
        
        return "\n".join(extended_sections) if extended_sections else "Extended Hours: Data not available"
