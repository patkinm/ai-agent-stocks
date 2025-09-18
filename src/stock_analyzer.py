"""
AI Stock Analyzer using GPT-5 for short-term trading recommendations
"""
import json
from datetime import datetime
from typing import Dict, List, Optional
from openai import OpenAI
from .config import Config
from .market_data import MarketDataFetcher


class StockAnalyzer:
    """AI-powered stock analyzer for short-term trading opportunities"""
    
    def __init__(self):
        """Initialize the stock analyzer"""
        Config.validate_config()
        self.client = OpenAI(api_key=Config.OPENAI_API_KEY)
        self.market_data = MarketDataFetcher()
    
    def find_top_short_term_stocks(self, count: int = 10) -> List[str]:
        """
        Use GPT-5 with web search to find top stocks for short-term trading
        
        Args:
            count: Number of top stocks to find
            
        Returns:
            List of stock symbols
        """
        print(f"🔍 Searching for top {count} short-term trading opportunities...")
        
        search_prompt = f"""
You are an elite quantitative trader specializing in short-term momentum plays. Your task: identify the TOP {count} stocks with the highest probability of significant price movement in the next 1-5 trading days.

SEARCH CRITERIA (use web search extensively):
1. **Breaking Catalysts (Last 24-48 hours)**:
   - Earnings surprises (beats/misses with volume spikes)
   - FDA approvals, drug trial results, regulatory news
   - Product launches, major partnerships, acquisitions
   - Analyst upgrades/downgrades with price target changes
   - Insider buying/selling, share buyback announcements

2. **Technical Momentum Indicators**:
   - Stocks breaking above key resistance levels with volume
   - Gap ups/downs on news with follow-through potential
   - Unusual options activity (high call/put volume)
   - Short squeeze candidates with high short interest

3. **Market Sentiment & Social Signals**:
   - Trending stocks on financial social media
   - High pre-market/after-hours trading activity
   - Sector rotation plays with institutional buying

4. **Upcoming Events (Next 1-5 days)**:
   - Earnings announcements this week
   - FDA decision dates, clinical trial readouts
   - Product launches, conferences, investor days
   - Ex-dividend dates for dividend plays

SEARCH INSTRUCTIONS:
- Search for "most active stocks today unusual volume"
- Search for "premarket movers gainers losers today"
- Search for "after hours trading activity unusual volume"
- Search for "earnings this week stock movers"
- Search for "analyst upgrades downgrades today"
- Search for "biotech FDA approvals pipeline 2024"
- Search for "short squeeze candidates high short interest"
- Search for "breaking news stock market today"
- Search for "extended hours trading activity"

OUTPUT FORMAT:
Provide EXACTLY {count} stock ticker symbols as a comma-separated list.
Example: AAPL,MSFT,GOOGL,TSLA,NVDA

REQUIREMENTS:
- Focus on liquid stocks (>$5B market cap preferred)
- Prioritize stocks with clear, identifiable catalysts
- Include mix of large caps and growth stocks
- Avoid penny stocks or illiquid securities
- Select stocks with options liquidity for hedging
"""
        
        try:
            # Configure web search tools
            web_search_tool = {"type": "web_search"}
            if Config.USE_DOMAIN_RESTRICTIONS:
                web_search_tool["filters"] = {
                    "allowed_domains": Config.PREFERRED_DOMAINS
                }
            
            response = self.client.responses.create(
                model="gpt-5",
                reasoning={"effort": Config.REASONING_EFFORT},
                tools=[web_search_tool],
                tool_choice="auto",
                include=["web_search_call.action.sources"],
                input=search_prompt
            )
            
            # Extract stock symbols from response
            response_text = response.output_text.strip()
            print(f"🎯 Found potential stocks: {response_text}")
            
            # Parse symbols from response
            symbols = []
            for line in response_text.split('\n'):
                if ',' in line and not line.startswith('Based on') and not line.startswith('Here are'):
                    # Extract symbols from comma-separated line
                    potential_symbols = [s.strip().upper() for s in line.split(',')]
                    for symbol in potential_symbols:
                        # Basic validation - should be 1-5 characters, letters only
                        if symbol.isalpha() and 1 <= len(symbol) <= 5:
                            symbols.append(symbol)
            
            # Remove duplicates and limit to requested count
            symbols = list(dict.fromkeys(symbols))[:count]
            
            if not symbols:
                print("⚠️  No valid symbols found, using fallback stocks...")
                symbols = Config.DEFAULT_STOCKS[:count]
            
            print(f"✅ Selected {len(symbols)} stocks for analysis: {', '.join(symbols)}")
            return symbols
            
        except Exception as e:
            print(f"❌ Error finding stocks: {str(e)}")
            print("🔄 Using default stocks as fallback...")
            return Config.DEFAULT_STOCKS[:count]
    
    def analyze_stock_for_binary_decision(self, symbol: str, show_progress: bool = True) -> Dict:
        """
        Analyze a single stock and provide BINARY decision (BUY or SELL only)
        
        Args:
            symbol: Stock ticker symbol
            show_progress: Whether to show progress indicators
            
        Returns:
            Dictionary containing binary analysis results
        """
        if show_progress:
            print(f"  📊 Fetching market data for {symbol}...")
        
        # Get current stock data
        stock_data = self.market_data.get_stock_data(symbol, period="3mo")
        if not stock_data:
            return {"error": f"Could not fetch data for {symbol}"}
        
        if show_progress:
            print(f"  🌐 Searching for latest news and catalysts...")
        
        # Get market overview
        market_overview = self.market_data.get_market_overview()
        
        # Format data for GPT analysis
        stock_summary = self.market_data.format_stock_summary(stock_data)
        
        # Create binary analysis prompt
        analysis_prompt = self._create_binary_analysis_prompt(stock_summary, market_overview, symbol)
        
        try:
            if show_progress:
                print(f"  🤖 Running GPT-5 analysis...")
            
            # Configure web search tools
            web_search_tool = {"type": "web_search"}
            if Config.USE_DOMAIN_RESTRICTIONS:
                web_search_tool["filters"] = {
                    "allowed_domains": Config.PREFERRED_DOMAINS
                }
            
            # Use GPT-5 with web search to analyze the stock
            response = self.client.responses.create(
                model="gpt-5",
                reasoning={"effort": Config.REASONING_EFFORT},
                tools=[web_search_tool],
                tool_choice="auto",
                include=["web_search_call.action.sources"],
                input=analysis_prompt
            )
            
            # Parse and structure the response for binary decision
            analysis_result = self._parse_binary_response(response.output_text, stock_data)
            analysis_result['raw_response'] = response.output_text
            
            return analysis_result
            
        except Exception as e:
            return {"error": f"Analysis failed for {symbol}: {str(e)}"}
    
    def analyze_multiple_stocks(self, symbols: List[str]) -> Dict[str, Dict]:
        """
        Analyze multiple stocks and rank them for short-term trading
        
        Args:
            symbols: List of stock ticker symbols
            
        Returns:
            Dictionary containing analysis for each stock
        """
        results = {}
        
        for symbol in symbols[:Config.MAX_STOCKS_TO_ANALYZE]:
            print(f"Analyzing {symbol}...")
            results[symbol] = self.analyze_stock_for_short_term_trading(symbol)
        
        return results
    
    def get_top_recommendations(self, analysis_results: Dict[str, Dict], top_n: int = 5) -> List[Dict]:
        """
        Extract and rank top stock recommendations
        
        Args:
            analysis_results: Results from analyze_multiple_stocks
            top_n: Number of top recommendations to return
            
        Returns:
            List of top recommendations sorted by score
        """
        recommendations = []
        
        for symbol, result in analysis_results.items():
            if 'error' not in result and result.get('recommendation_score', 0) > 0:
                recommendations.append({
                    'symbol': symbol,
                    'score': result.get('recommendation_score', 0),
                    'action': result.get('recommendation', 'hold'),
                    'target_price': result.get('target_price'),
                    'stop_loss': result.get('stop_loss'),
                    'time_horizon': result.get('time_horizon', '1-5 days'),
                    'reasoning': result.get('reasoning', ''),
                    'risk_level': result.get('risk_level', 'medium')
                })
        
        # Sort by score (highest first)
        recommendations.sort(key=lambda x: x['score'], reverse=True)
        
        return recommendations[:top_n]
    
    def _create_binary_analysis_prompt(self, stock_summary: str, market_overview: Dict, symbol: str) -> str:
        """Create a binary decision analysis prompt for GPT-5"""
        
        market_context = self._format_market_overview(market_overview)
        
        prompt = f"""
You are a world-class momentum trader with a 15-year track record. Your specialty: making BINARY decisions (BUY/SELL only) for 1-5 day swing trades with 70%+ win rate.

CURRENT MARKET CONDITIONS:
{market_context}

TARGET STOCK: {symbol}
{stock_summary}

ANALYSIS FRAMEWORK:
Your decision must be based on PROBABILITY OF PROFIT in the next 1-5 trading days. No holds allowed.

MANDATORY WEB SEARCH (search extensively for):
1. **Immediate Catalysts (24-48 hours)**:
   - Breaking news, earnings results, guidance changes
   - FDA approvals, clinical trial results, regulatory updates
   - Analyst upgrades/downgrades with new price targets
   - Partnership announcements, acquisitions, spin-offs
   - Management changes, insider trading activity

2. **Extended Hours Analysis (CRITICAL)**:
   - Pre-market movers and unusual activity
   - After-hours earnings reactions and guidance
   - Extended hours volume spikes and patterns
   - Overnight news that could affect opening
   - International market reactions and spillover effects

3. **Technical Setup Analysis**:
   - Key support/resistance levels and recent breaks
   - Volume patterns and unusual activity
   - Gap fills, breakout patterns, momentum shifts
   - Options flow (unusual call/put activity)
   - Short interest and potential squeeze setups
   - Extended hours price action vs regular hours

4. **Upcoming Events (1-5 days)**:
   - Earnings date if within timeframe
   - Product launches, conferences, investor days
   - Economic data releases affecting sector
   - Ex-dividend dates, special dividends
   - Congressional hearings, regulatory decisions

DECISION CRITERIA:
- BUY: Strong catalyst + technical setup + positive momentum
- SELL: Negative catalyst + technical breakdown + bearish sentiment
- If mixed signals, choose side with better risk/reward ratio

RISK MANAGEMENT:
- Target: 3-8% move within timeframe
- Stop loss: -2 to -4% maximum loss
- Consider position sizing based on volatility

OUTPUT FORMAT (EXACT):
DECISION: [BUY or SELL]
CONFIDENCE: [1-10 scale]
TARGET: $[specific price]
STOP LOSS: $[specific price]
CATALYST: [Primary driver - max 15 words]
TIMEFRAME: [1-5 days]

REASONING:
[2-3 sentences explaining the key factors driving your decision and why this timeframe makes sense]

CRITICAL: You MUST choose BUY or SELL. Base decision on highest probability outcome for next 1-5 days.
"""
        return prompt.strip()
    
    def _create_analysis_prompt(self, stock_summary: str, market_overview: Dict, symbol: str) -> str:
        """Create a comprehensive analysis prompt for GPT-5 (legacy method)"""
        
        market_context = self._format_market_overview(market_overview)
        
        prompt = f"""
You are an expert quantitative analyst specializing in short-term stock trading (1-5 day holding periods). 
Analyze the following stock for potential short-term trading opportunities.

CURRENT MARKET CONDITIONS:
{market_context}

STOCK DATA FOR {symbol}:
{stock_summary}

ANALYSIS REQUIREMENTS:
Please provide a comprehensive analysis focused on SHORT-TERM trading opportunities (1-5 days). Search for recent news, earnings announcements, analyst upgrades/downgrades, technical breakouts, and any catalysts that could drive price movement in the next few days.

Your analysis should include:
1. Recent news and catalysts that could affect price in the next 1-5 days
2. Technical analysis for short-term price movements
3. Volume and momentum indicators
4. Key support and resistance levels
5. Risk factors and potential downside
6. Specific entry/exit strategy with price targets

PROVIDE YOUR RECOMMENDATION IN THIS FORMAT:
RECOMMENDATION: [BUY/SELL/HOLD]
CONFIDENCE SCORE: [1-10 scale]
TARGET PRICE: $[price]
STOP LOSS: $[price]
TIME HORIZON: [1-5 days]
RISK LEVEL: [low/medium/high]

REASONING:
[Detailed explanation of your analysis and recommendation]

Focus specifically on short-term catalysts and technical setups that could drive price action in the next 1-5 trading days.
"""
        return prompt.strip()
    
    def _format_market_overview(self, market_overview: Dict) -> str:
        """Format market overview data for the prompt"""
        if not market_overview:
            return "Market data unavailable"
        
        formatted = []
        index_names = {
            '^GSPC': 'S&P 500',
            '^DJI': 'Dow Jones',
            '^IXIC': 'Nasdaq',
            '^VIX': 'VIX (Volatility)'
        }
        
        for symbol, data in market_overview.items():
            name = index_names.get(symbol, symbol)
            formatted.append(f"{name}: {data['value']:.2f} ({data['change_percent']:+.2f}%)")
        
        return "\n".join(formatted)
    
    def _parse_gpt_response(self, response_text: str, stock_data: Dict) -> Dict:
        """Parse GPT response and extract structured data"""
        result = {
            'symbol': stock_data['symbol'],
            'current_price': stock_data['current_price'],
            'analysis_timestamp': datetime.now().isoformat(),
            'recommendation': 'hold',
            'recommendation_score': 5,
            'target_price': None,
            'stop_loss': None,
            'time_horizon': '1-5 days',
            'risk_level': 'medium',
            'reasoning': response_text
        }
        
        # Extract structured data from response
        try:
            lines = response_text.upper().split('\n')
            
            for line in lines:
                if 'RECOMMENDATION:' in line:
                    rec = line.split('RECOMMENDATION:')[1].strip()
                    if 'BUY' in rec:
                        result['recommendation'] = 'buy'
                    elif 'SELL' in rec:
                        result['recommendation'] = 'sell'
                    else:
                        result['recommendation'] = 'hold'
                
                elif 'CONFIDENCE SCORE:' in line:
                    try:
                        score = float(line.split('CONFIDENCE SCORE:')[1].strip().split()[0])
                        result['recommendation_score'] = max(1, min(10, score))
                    except:
                        pass
                
                elif 'TARGET PRICE:' in line:
                    try:
                        price_str = line.split('TARGET PRICE:')[1].strip()
                        price = float(price_str.replace('$', '').split()[0])
                        result['target_price'] = price
                    except:
                        pass
                
                elif 'STOP LOSS:' in line:
                    try:
                        price_str = line.split('STOP LOSS:')[1].strip()
                        price = float(price_str.replace('$', '').split()[0])
                        result['stop_loss'] = price
                    except:
                        pass
                
                elif 'TIME HORIZON:' in line:
                    horizon = line.split('TIME HORIZON:')[1].strip()
                    result['time_horizon'] = horizon
                
                elif 'RISK LEVEL:' in line:
                    risk = line.split('RISK LEVEL:')[1].strip().lower()
                    if any(level in risk for level in ['low', 'medium', 'high']):
                        result['risk_level'] = risk.split()[0]
        
        except Exception as e:
            print(f"Error parsing GPT response: {e}")
        
        return result
    
    def _parse_binary_response(self, response_text: str, stock_data: Dict) -> Dict:
        """Parse GPT binary response and extract structured data"""
        result = {
            'symbol': stock_data['symbol'],
            'current_price': stock_data['current_price'],
            'analysis_timestamp': datetime.now().isoformat(),
            'decision': 'sell',  # Default to sell if uncertain
            'confidence': 5,
            'target_price': None,
            'stop_loss': None,
            'catalyst': '',
            'timeframe': '1-5 days',
            'reasoning': response_text
        }
        
        # Extract structured data from response
        try:
            lines = response_text.upper().split('\n')
            
            for line in lines:
                if 'DECISION:' in line:
                    decision = line.split('DECISION:')[1].strip()
                    if 'BUY' in decision:
                        result['decision'] = 'buy'
                    elif 'SELL' in decision:
                        result['decision'] = 'sell'
                
                elif 'CONFIDENCE:' in line:
                    try:
                        conf = float(line.split('CONFIDENCE:')[1].strip().split()[0])
                        result['confidence'] = max(1, min(10, conf))
                    except:
                        pass
                
                elif 'TARGET:' in line:
                    try:
                        price_str = line.split('TARGET:')[1].strip()
                        price = float(price_str.replace('$', '').split()[0])
                        result['target_price'] = price
                    except:
                        pass
                
                elif 'STOP LOSS:' in line:
                    try:
                        price_str = line.split('STOP LOSS:')[1].strip()
                        price = float(price_str.replace('$', '').split()[0])
                        result['stop_loss'] = price
                    except:
                        pass
                
                elif 'CATALYST:' in line:
                    catalyst = line.split('CATALYST:')[1].strip()
                    result['catalyst'] = catalyst[:100]  # Limit length
                
                elif 'TIMEFRAME:' in line:
                    timeframe = line.split('TIMEFRAME:')[1].strip()
                    result['timeframe'] = timeframe
        
        except Exception as e:
            print(f"Error parsing binary response: {e}")
        
        return result
    
    def run_complete_binary_analysis(self, count: int = 10) -> List[Dict]:
        """
        Complete workflow: Find top stocks, then analyze each for binary decisions
        
        Args:
            count: Number of stocks to find and analyze
            
        Returns:
            List of analysis results with binary decisions
        """
        print("🚀 AI STOCK ANALYZER - BINARY DECISION MODE")
        print("=" * 60)
        
        # Step 1: Find top stocks using web search
        print("\n📈 STEP 1: Finding Top Short-Term Trading Candidates")
        print("-" * 50)
        stocks = self.find_top_short_term_stocks(count)
        
        if not stocks:
            print("❌ No stocks found for analysis")
            return []
        
        # Step 2: Analyze each stock for binary decision
        print(f"\n🔬 STEP 2: Binary Analysis of {len(stocks)} Stocks")
        print("-" * 50)
        
        results = []
        
        for i, symbol in enumerate(stocks, 1):
            print(f"\n[{i}/{len(stocks)}] 🎯 ANALYZING {symbol}")
            print("─" * 30)
            
            analysis = self.analyze_stock_for_binary_decision(symbol, show_progress=True)
            
            if 'error' not in analysis:
                decision = analysis['decision'].upper()
                confidence = analysis['confidence']
                current_price = analysis['current_price']
                target_price = analysis.get('target_price')
                
                # Calculate projected change percentage
                if target_price and current_price:
                    projected_change_pct = ((target_price - current_price) / current_price) * 100
                    change_indicator = "📈" if projected_change_pct >= 0 else "📉"
                    target_display = f"${target_price:.2f} ({change_indicator}{projected_change_pct:+.1f}%)"
                else:
                    target_display = "N/A"
                
                # Visual decision indicator
                if decision == 'BUY':
                    indicator = "🟢 BUY"
                else:
                    indicator = "🔴 SELL"
                
                print(f"  ✅ {indicator} | Confidence: {confidence}/10")
                print(f"  💰 Current: ${current_price:.2f} → Target: {target_display}")
                
                # Show catalyst if available
                if analysis.get('catalyst'):
                    print(f"  💡 Catalyst: {analysis['catalyst']}")
                
                results.append(analysis)
            else:
                print(f"  ❌ Error: {analysis['error']}")
        
        return results
    
    def display_binary_summary(self, results: List[Dict]) -> None:
        """Display a summary of binary analysis results"""
        if not results:
            print("\n❌ No results to display")
            return
        
        # Separate BUY and SELL recommendations
        buys = [r for r in results if r.get('decision') == 'buy']
        sells = [r for r in results if r.get('decision') == 'sell']
        
        print("\n" + "=" * 60)
        print("📊 BINARY ANALYSIS SUMMARY")
        print("=" * 60)
        
        print(f"\n🟢 BUY RECOMMENDATIONS ({len(buys)} stocks):")
        print("-" * 40)
        if buys:
            # Sort by confidence (highest first)
            buys.sort(key=lambda x: x.get('confidence', 0), reverse=True)
            for i, stock in enumerate(buys, 1):
                current_price = stock['current_price']
                target_price = stock.get('target_price')
                stop_price = stock.get('stop_loss')
                
                # Calculate projected percentage changes
                if target_price:
                    target_change_pct = ((target_price - current_price) / current_price) * 100
                    target_display = f"${target_price:.2f} (📈{target_change_pct:+.1f}%)"
                else:
                    target_display = 'N/A'
                
                stop_display = f"${stop_price:.2f}" if stop_price else 'N/A'
                
                print(f"{i}. {stock['symbol']} | Confidence: {stock.get('confidence', 0)}/10")
                print(f"   Current: ${current_price:.2f} → Target: {target_display} | Stop: {stop_display}")
                print(f"   Catalyst: {stock.get('catalyst', 'N/A')}")
                print()
        else:
            print("   No BUY recommendations")
        
        print(f"\n🔴 SELL RECOMMENDATIONS ({len(sells)} stocks):")
        print("-" * 40)
        if sells:
            # Sort by confidence (highest first)
            sells.sort(key=lambda x: x.get('confidence', 0), reverse=True)
            for i, stock in enumerate(sells, 1):
                current_price = stock['current_price']
                target_price = stock.get('target_price')
                stop_price = stock.get('stop_loss')
                
                # Calculate projected percentage changes
                if target_price:
                    target_change_pct = ((target_price - current_price) / current_price) * 100
                    target_display = f"${target_price:.2f} (📉{target_change_pct:+.1f}%)"
                else:
                    target_display = 'N/A'
                
                stop_display = f"${stop_price:.2f}" if stop_price else 'N/A'
                
                print(f"{i}. {stock['symbol']} | Confidence: {stock.get('confidence', 0)}/10")
                print(f"   Current: ${current_price:.2f} → Target: {target_display} | Stop: {stop_display}")
                print(f"   Catalyst: {stock.get('catalyst', 'N/A')}")
                print()
        else:
            print("   No SELL recommendations")
        
        # Overall statistics
        if results:
            avg_confidence = sum(r.get('confidence', 0) for r in results) / len(results)
            print(f"\n📈 STATISTICS:")
            print(f"   Total Analyzed: {len(results)}")
            print(f"   Buy Signals: {len(buys)} ({len(buys)/len(results)*100:.1f}%)")
            print(f"   Sell Signals: {len(sells)} ({len(sells)/len(results)*100:.1f}%)")
            print(f"   Avg Confidence: {avg_confidence:.1f}/10")
        
        print("\n⚠️  DISCLAIMER: This is for educational purposes only.")
        print("   Always do your own research before trading!")
    
    def generate_portfolio_summary(self, recommendations: List[Dict]) -> str:
        """Generate a summary of portfolio recommendations"""
        if not recommendations:
            return "No trading recommendations found."
        
        summary = f"TOP {len(recommendations)} SHORT-TERM TRADING RECOMMENDATIONS\n"
        summary += "=" * 60 + "\n\n"
        
        for i, rec in enumerate(recommendations, 1):
            target_str = f"${rec['target_price']:.2f}" if rec.get('target_price') else 'N/A'
            stop_str = f"${rec['stop_loss']:.2f}" if rec.get('stop_loss') else 'N/A'
            
            summary += f"{i}. {rec['symbol']} - {rec['action'].upper()}\n"
            summary += f"   Score: {rec['score']}/10 | Risk: {rec['risk_level']}\n"
            summary += f"   Target: {target_str} | Stop Loss: {stop_str}\n"
            summary += f"   Horizon: {rec['time_horizon']}\n"
            summary += f"   Reasoning: {rec['reasoning'][:200]}...\n\n"
        
        summary += "\nDISCLAIMER: This is for educational purposes only. "
        summary += "Always do your own research and consider your risk tolerance before trading."
        
        return summary
