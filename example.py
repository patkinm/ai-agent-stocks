#!/usr/bin/env python3
"""
Example usage of the AI Stock Analyzer
"""
import os
from src.stock_analyzer import StockAnalyzer
from src.config import Config


def example_binary_stock_analysis():
    """Example of binary analysis for a single stock"""
    print("🎯 Example: Binary Stock Analysis")
    print("-" * 40)
    
    # Make sure API key is set
    if not os.getenv('OPENAI_API_KEY'):
        print("❌ Please set your OPENAI_API_KEY environment variable")
        return
    
    try:
        analyzer = StockAnalyzer()
        
        # Analyze Apple stock with binary decision
        symbol = "AAPL"
        print(f"Binary analysis for {symbol}...")
        
        result = analyzer.analyze_stock_for_binary_decision(symbol, show_progress=True)
        
        if 'error' in result:
            print(f"Error: {result['error']}")
            return
        
        # Display results
        decision = result['decision'].upper()
        indicator = "🟢 BUY" if decision == 'BUY' else "🔴 SELL"
        
        print(f"\n📊 Binary Analysis Results for {result['symbol']}:")
        print(f"Current Price: ${result['current_price']:.2f}")
        
        # Show analysis first
        if result.get('analysis'):
            print(f"\nAnalysis:")
            print(result['analysis'])
        
        print(f"\nDecision: {indicator}")
        print(f"Confidence: {result['confidence']}/10")
        print(f"Target Price: ${result.get('target_price', 'N/A')}")
        print(f"Stop Loss: ${result.get('stop_loss', 'N/A')}")
        print(f"Catalyst: {result.get('catalyst', 'N/A')}")
        
    except Exception as e:
        print(f"Error: {e}")


def example_complete_workflow():
    """Example of complete workflow: find stocks + binary analysis"""
    print("\n\n🚀 Example: Complete Binary Workflow")
    print("-" * 40)
    
    if not os.getenv('OPENAI_API_KEY'):
        print("❌ Please set your OPENAI_API_KEY environment variable")
        return
    
    try:
        analyzer = StockAnalyzer()
        
        print("Running complete binary analysis workflow...")
        print("This will:")
        print("1. Search for top short-term trading stocks")
        print("2. Analyze each for binary BUY/SELL decisions")
        print("3. Display summary with visualization")
        print("\nThis may take several minutes...\n")
        
        # Run complete workflow with 5 stocks
        results = analyzer.run_complete_binary_analysis(count=5)
        
        if results:
            analyzer.display_binary_summary(results)
            print("\n✅ Complete workflow example finished!")
        else:
            print("❌ No results obtained from workflow")
            
    except Exception as e:
        print(f"Error: {e}")


def example_find_stocks_only():
    """Example of just finding top stocks without analysis"""
    print("\n\n🔍 Example: Finding Top Stocks")
    print("-" * 40)
    
    if not os.getenv('OPENAI_API_KEY'):
        print("❌ Please set your OPENAI_API_KEY environment variable")
        return
    
    try:
        analyzer = StockAnalyzer()
        
        print("Finding top 5 short-term trading candidates...")
        stocks = analyzer.find_top_short_term_stocks(count=5)
        
        if stocks:
            print(f"\n🎯 Top trading candidates found: {', '.join(stocks)}")
            print("These stocks were identified using GPT-5 web search for:")
            print("- Recent news catalysts")
            print("- Technical breakouts")
            print("- High volume activity")
            print("- Upcoming events")
        else:
            print("❌ No stocks found")
            
    except Exception as e:
        print(f"Error: {e}")


def example_market_data_only():
    """Example of just fetching market data including extended hours"""
    print("\n\n📊 Example: Market Data Fetching (with Extended Hours)")
    print("-" * 40)
    
    from src.market_data import MarketDataFetcher
    
    fetcher = MarketDataFetcher()
    
    # Get data for a stock
    symbol = "TSLA"
    print(f"Fetching comprehensive data for {symbol}...")
    
    data = fetcher.get_stock_data(symbol)
    if data:
        print(f"\n{symbol} Regular Market Data:")
        print(f"Price: ${data['current_price']:.2f}")
        print(f"Change: {data['price_change_percent']:.2f}%")
        print(f"Volume: {data['volume']:,}")
        print(f"RSI: {data['rsi']:.1f}")
        print(f"Market Cap: ${data.get('market_cap', 0):,}")
        
        # Show extended hours data
        print(f"\n📈 Extended Hours Activity:")
        if data.get('premarket_price'):
            print(f"Pre-Market: ${data['premarket_price']:.2f} ({data['premarket_change_percent']:+.2f}%)")
            print(f"Pre-Market Volume: {data.get('premarket_volume', 0):,}")
        if data.get('afterhours_price'):
            print(f"After-Hours: ${data['afterhours_price']:.2f} ({data['afterhours_change_percent']:+.2f}%)")
            print(f"After-Hours Volume: {data.get('afterhours_volume', 0):,}")
        if not data.get('extended_hours_active'):
            print("No current extended hours activity")
    else:
        print(f"Could not fetch data for {symbol}")
    
    # Get market overview
    print(f"\nMarket Overview:")
    market_data = fetcher.get_market_overview()
    for symbol, data in market_data.items():
        index_names = {
            '^GSPC': 'S&P 500',
            '^DJI': 'Dow Jones', 
            '^IXIC': 'Nasdaq',
            '^VIX': 'VIX'
        }
        name = index_names.get(symbol, symbol)
        print(f"{name}: {data['value']:.2f} ({data['change_percent']:+.2f}%)")


if __name__ == "__main__":
    print("🚀 AI Stock Analyzer - Binary Decision Examples")
    print("=" * 60)
    
    # Run examples
    example_market_data_only()
    
    # Only run GPT examples if API key is available
    if os.getenv('OPENAI_API_KEY'):
        print("\n" + "=" * 60)
        print("🤖 GPT-5 POWERED EXAMPLES")
        print("=" * 60)
        
        # Example 1: Binary analysis of single stock
        example_binary_stock_analysis()
        
        # Example 2: Finding top stocks
        example_find_stocks_only()
        
        # Ask user if they want to run the complete workflow (takes longer)
        print("\n" + "=" * 60)
        user_choice = input("🤔 Run complete workflow example? (takes 5-10 minutes) [y/N]: ").strip().lower()
        if user_choice in ['y', 'yes']:
            example_complete_workflow()
        else:
            print("⏩ Skipping complete workflow example")
            print("💡 To run it manually: python main.py --count 5")
    else:
        print("\n💡 Set OPENAI_API_KEY to run GPT-5 binary analysis examples")
        print("Example: export OPENAI_API_KEY='your-key-here'")
        print("\n📖 Available examples with API key:")
        print("- Binary stock analysis (BUY/SELL decisions)")
        print("- Top stock finding using unrestricted web search")
        print("- Complete workflow (find + analyze)")
        print("\n⚙️  Configuration options:")
        print("- REASONING_EFFORT=medium (default)")
        print("- USE_DOMAIN_RESTRICTIONS=false (searches all domains)")
        print("- INCLUDE_EXTENDED_HOURS=true (pre-market and after-hours data)")
    
    print("\n✅ Examples completed!")
    print("🚀 To run the full analyzer: python main.py")
