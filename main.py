#!/usr/bin/env python3
"""
AI Stock Analyzer - Main execution script
Uses GPT-5 to find short-term trading opportunities
"""
import sys
import json
import argparse
from datetime import datetime
from src.stock_analyzer import StockAnalyzer
from src.config import Config


def main():
    """Main execution function"""
    parser = argparse.ArgumentParser(
        description="AI Stock Analyzer - Binary Decision Mode for Short-term Trading"
    )
    parser.add_argument(
        "--count", 
        type=int, 
        help="Number of top stocks to find and analyze",
        default=8
    )
    parser.add_argument(
        "--output", 
        type=str, 
        help="Output file path for detailed results (JSON format)",
        default=None
    )
    parser.add_argument(
        "--single", 
        type=str, 
        help="Analyze a single stock symbol (binary decision)",
        default=None
    )
    parser.add_argument(
        "--stocks", 
        type=str, 
        help="Comma-separated list of specific stocks to analyze (binary decisions)",
        default=None
    )
    
    args = parser.parse_args()
    
    try:
        # Initialize analyzer
        analyzer = StockAnalyzer()
        
        if args.single:
            # Analyze single stock with binary decision
            print("🚀 AI STOCK ANALYZER - SINGLE STOCK BINARY ANALYSIS")
            print("=" * 60)
            print(f"\n🎯 Analyzing {args.single.upper()} for binary decision...")
            
            result = analyzer.analyze_stock_for_binary_decision(args.single.upper(), show_progress=True)
            
            if 'error' in result:
                print(f"❌ Error: {result['error']}")
                return
            
            print_binary_stock_analysis(result)
            
        elif args.stocks:
            # Analyze specific stocks with binary decisions
            stocks = [s.strip().upper() for s in args.stocks.split(',')]
            print("🚀 AI STOCK ANALYZER - BINARY DECISION MODE")
            print("=" * 60)
            print(f"\n🎯 Analyzing {len(stocks)} specific stocks: {', '.join(stocks)}")
            
            results = []
            for i, symbol in enumerate(stocks, 1):
                print(f"\n[{i}/{len(stocks)}] 🎯 ANALYZING {symbol}")
                print("─" * 30)
                
                analysis = analyzer.analyze_stock_for_binary_decision(symbol, show_progress=True)
                
                if 'error' not in analysis:
                    decision = analysis['decision'].upper()
                    confidence = analysis['confidence']
                    target = analysis.get('target_price', 'N/A')
                    
                    if decision == 'BUY':
                        indicator = "🟢 BUY"
                    else:
                        indicator = "🔴 SELL"
                    
                    print(f"  ✅ {indicator} | Confidence: {confidence}/10 | Target: ${target}")
                    results.append(analysis)
                else:
                    print(f"  ❌ Error: {analysis['error']}")
            
            # Display summary
            analyzer.display_binary_summary(results)
            
            # Save results if requested
            if args.output:
                save_binary_results(results, args.output)
                print(f"\n💾 Results saved to: {args.output}")
            
        else:
            # Complete workflow: Find stocks + Binary analysis
            results = analyzer.run_complete_binary_analysis(args.count)
            
            if results:
                # Display summary
                analyzer.display_binary_summary(results)
                
                # Save results if requested
                if args.output:
                    save_binary_results(results, args.output)
                    print(f"\n💾 Results saved to: {args.output}")
            else:
                print("❌ No analysis results obtained.")
    
    except KeyboardInterrupt:
        print("\n\n🛑 Analysis interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        sys.exit(1)


def print_binary_stock_analysis(result):
    """Print detailed binary analysis for a single stock"""
    print("\n" + "=" * 50)
    print(f"BINARY ANALYSIS RESULTS FOR {result['symbol']}")
    print("=" * 50)
    
    # Decision with visual indicator
    decision = result['decision'].upper()
    if decision == 'BUY':
        indicator = "🟢 BUY"
        color_line = "🟢" * 30
    else:
        indicator = "🔴 SELL" 
        color_line = "🔴" * 30
    
    print(color_line)
    print(f"📊 Current Price: ${result['current_price']:.2f}")
    print(f"🎯 DECISION: {indicator}")
    print(f"⭐ Confidence: {result['confidence']}/10")
    print(color_line)
    
    if result.get('target_price'):
        print(f"🎯 Target Price: ${result['target_price']:.2f}")
    if result.get('stop_loss'):
        print(f"🛑 Stop Loss: ${result['stop_loss']:.2f}")
    
    print(f"⏰ Timeframe: {result.get('timeframe', '1-5 days')}")
    
    if result.get('catalyst'):
        print(f"💡 Main Catalyst: {result['catalyst']}")
    
    print(f"\n📝 REASONING:")
    print("-" * 30)
    reasoning_lines = result['reasoning'].split('\n')
    for line in reasoning_lines[:10]:  # Limit to first 10 lines for readability
        if line.strip():
            print(line.strip())
    
    print(f"\n🕐 Analysis Time: {result['analysis_timestamp']}")


def save_binary_results(results, output_path):
    """Save binary analysis results to JSON file"""
    # Separate BUY and SELL recommendations
    buys = [r for r in results if r.get('decision') == 'buy']
    sells = [r for r in results if r.get('decision') == 'sell']
    
    output_data = {
        'timestamp': datetime.now().isoformat(),
        'analysis_type': 'binary_decisions',
        'summary': {
            'total_analyzed': len(results),
            'buy_signals': len(buys),
            'sell_signals': len(sells),
            'buy_percentage': len(buys) / len(results) * 100 if results else 0,
            'avg_confidence': sum(r.get('confidence', 0) for r in results) / len(results) if results else 0,
            'top_buy_picks': [r['symbol'] for r in sorted(buys, key=lambda x: x.get('confidence', 0), reverse=True)[:3]],
            'top_sell_picks': [r['symbol'] for r in sorted(sells, key=lambda x: x.get('confidence', 0), reverse=True)[:3]]
        },
        'buy_recommendations': buys,
        'sell_recommendations': sells,
        'all_results': results
    }
    
    with open(output_path, 'w') as f:
        json.dump(output_data, f, indent=2, default=str)


def run_interactive_mode():
    """Run in interactive mode for binary analysis"""
    analyzer = StockAnalyzer()
    
    print("🚀 AI STOCK ANALYZER - INTERACTIVE BINARY MODE")
    print("=" * 50)
    print("🔄 Enter stock symbols for binary decisions (BUY/SELL only)")
    print("Commands: 'quit' to exit, 'help' for help, 'scan' to find top stocks")
    
    while True:
        try:
            user_input = input("\n📈 Enter stock symbol(s) or command: ").strip()
            
            if user_input.lower() in ['quit', 'exit', 'q']:
                print("👋 Goodbye!")
                break
            elif user_input.lower() == 'help':
                print_help()
                continue
            elif user_input.lower() == 'scan':
                print("\n🔍 Scanning for top trading opportunities...")
                count = input("How many stocks to find? (default 5): ").strip()
                try:
                    count = int(count) if count else 5
                except:
                    count = 5
                
                results = analyzer.run_complete_binary_analysis(count)
                if results:
                    analyzer.display_binary_summary(results)
                continue
            elif not user_input:
                continue
            
            symbols = [s.strip().upper() for s in user_input.split(',')]
            
            if len(symbols) == 1:
                # Single stock - detailed view
                symbol = symbols[0]
                print(f"\n🎯 Binary Analysis for {symbol}...")
                result = analyzer.analyze_stock_for_binary_decision(symbol, show_progress=True)
                
                if 'error' in result:
                    print(f"❌ {result['error']}")
                else:
                    print_binary_stock_analysis(result)
            else:
                # Multiple stocks - summary view
                print(f"\n🎯 Binary Analysis for {len(symbols)} stocks...")
                results = []
                
                for i, symbol in enumerate(symbols, 1):
                    print(f"\n[{i}/{len(symbols)}] Analyzing {symbol}...")
                    result = analyzer.analyze_stock_for_binary_decision(symbol, show_progress=False)
                    
                    if 'error' not in result:
                        decision = result['decision'].upper()
                        confidence = result['confidence']
                        indicator = "🟢 BUY" if decision == 'BUY' else "🔴 SELL"
                        print(f"  ✅ {indicator} | Confidence: {confidence}/10")
                        results.append(result)
                    else:
                        print(f"  ❌ Error: {result['error']}")
                
                if results:
                    print("\n" + "=" * 40)
                    print("📊 SUMMARY")
                    print("=" * 40)
                    buys = [r for r in results if r.get('decision') == 'buy']
                    sells = [r for r in results if r.get('decision') == 'sell']
                    print(f"🟢 BUY: {[r['symbol'] for r in buys]}")
                    print(f"🔴 SELL: {[r['symbol'] for r in sells]}")
        
        except KeyboardInterrupt:
            print("\n👋 Goodbye!")
            break
        except Exception as e:
            print(f"❌ Error: {e}")


def print_help():
    """Print help information"""
    help_text = """
🔧 INTERACTIVE COMMANDS:
- AAPL              - Analyze single stock (detailed binary decision)
- AAPL,MSFT,GOOGL   - Analyze multiple stocks (summary view)
- scan              - Find and analyze top trading opportunities
- quit or q         - Exit the program
- help              - Show this help message

🎯 BINARY DECISION MODE:
- Every analysis gives BUY or SELL (no HOLD)
- Confidence scores from 1-10
- Target prices and stop losses included
- Focus on 1-5 day trading timeframes

💡 TIPS:
- Use uppercase ticker symbols (AAPL, not aapl)  
- Single symbols give detailed analysis
- Multiple symbols give quick summary
- 'scan' finds the hottest stocks automatically
- Wait for analysis to complete before new commands
"""
    print(help_text)


if __name__ == "__main__":
    if len(sys.argv) == 1:
        # No arguments provided, run interactive mode
        run_interactive_mode()
    else:
        # Arguments provided, run CLI mode
        main()
