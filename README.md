# AI Stock Analyzer 🚀

An intelligent stock analysis tool that uses GPT-5 with web search capabilities to provide **BINARY trading decisions** (BUY/SELL only) for short-term trading opportunities (1-5 day cycles).

## 🎯 Key Features

- **Binary Decision Mode**: Every analysis provides clear BUY or SELL decisions (no holds)
- **GPT-5 Web Search**: Leverages OpenAI's GPT-5 with financial domain web search
- **Two-Step Workflow**: 
  1. **Find top stocks** using AI-powered web search for catalysts and momentum
  2. **Analyze each stock** for binary trading decisions with confidence scores
- **Real-time Data**: Fetches live market data and technical indicators
- **Visual CLI**: Rich terminal interface with color-coded decisions and progress tracking
- **Catalyst Detection**: Identifies news events, earnings, upgrades that drive short-term moves
- **Risk Management**: Provides target prices, stop-losses, and confidence ratings

## Installation

1. **Clone or download the project**
   ```bash
   cd /Users/user/prjs/ai-agent-stocks
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up your OpenAI API key**
   
   Create a `.env` file in the project root:
   ```bash
   echo "OPENAI_API_KEY=your_openai_api_key_here" > .env
   ```
   
   Or set it as an environment variable:
   ```bash
   export OPENAI_API_KEY="your_openai_api_key_here"
   ```

## 🚀 Usage

### Complete Workflow (Recommended)

**Find top stocks + Binary analysis:**
```bash
python main.py
# Finds 8 top trading candidates, analyzes each for BUY/SELL decisions
```

**Custom number of stocks:**
```bash
python main.py --count 5
# Find and analyze top 5 stocks
```

### Analyze Specific Stocks

**Single stock binary decision:**
```bash
python main.py --single AAPL
# Detailed BUY/SELL analysis for Apple
```

**Multiple specific stocks:**
```bash
python main.py --stocks "AAPL,MSFT,GOOGL"
# Binary analysis for specific stocks
```

### Interactive Mode

**Run without arguments:**
```bash
python main.py
```

**Interactive commands:**
- `AAPL` - Detailed binary analysis for single stock
- `AAPL,MSFT` - Quick analysis of multiple stocks  
- `scan` - Find and analyze top stocks automatically
- `help` - Show all commands
- `quit` - Exit

### Output Options

**Save results to JSON:**
```bash
python main.py --count 10 --output results.json
```

### Command Line Options

- `--count`: Number of top stocks to find and analyze (default: 8)
- `--single`: Analyze single stock with detailed binary decision
- `--stocks`: Analyze specific comma-separated stock symbols
- `--output`: Save detailed results to JSON file

## Configuration

You can customize the analysis by setting environment variables:

```bash
# Stock analysis settings
export DEFAULT_STOCKS="AAPL,GOOGL,MSFT,TSLA,NVDA"
export ANALYSIS_TIMEFRAME="5"  # days
export MAX_STOCKS_TO_ANALYZE="10"
export RISK_TOLERANCE="medium"  # low, medium, high

# GPT-5 analysis settings
export REASONING_EFFORT="medium"  # low, medium, high
export USE_DOMAIN_RESTRICTIONS="false"  # true to limit to financial domains
```

## 📊 Example Output

### Complete Workflow
```
🚀 AI STOCK ANALYZER - BINARY DECISION MODE
============================================================

📈 STEP 1: Finding Top Short-Term Trading Candidates
--------------------------------------------------
🔍 Searching for top 5 short-term trading opportunities...
🎯 Found potential stocks: NVDA,TSLA,AAPL,AMD,GOOGL
✅ Selected 5 stocks for analysis: NVDA, TSLA, AAPL, AMD, GOOGL

🔬 STEP 2: Binary Analysis of 5 Stocks
--------------------------------------------------

[1/5] 🎯 ANALYZING NVDA
──────────────────────────────
  📊 Fetching market data for NVDA...
  🌐 Searching for latest news and catalysts...
  🤖 Running GPT-5 analysis...
  ✅ 🟢 BUY | Confidence: 8/10 | Target: $125.50
  💡 Catalyst: AI chip demand surge, positive earnings outlook

[2/5] 🎯 ANALYZING TSLA
──────────────────────────────
  📊 Fetching market data for TSLA...
  🌐 Searching for latest news and catalysts...
  🤖 Running GPT-5 analysis...
  ✅ 🔴 SELL | Confidence: 7/10 | Target: $240.00
  💡 Catalyst: Production concerns, analyst downgrades

============================================================
📊 BINARY ANALYSIS SUMMARY
============================================================

🟢 BUY RECOMMENDATIONS (2 stocks):
----------------------------------------
1. NVDA | Confidence: 8/10
   Current: $118.50 → Target: $125.50 | Stop: $115.00
   Catalyst: AI chip demand surge, positive earnings outlook

2. AAPL | Confidence: 7/10
   Current: $180.25 → Target: $185.00 | Stop: $175.00
   Catalyst: iPhone 15 strong sales, services growth

🔴 SELL RECOMMENDATIONS (3 stocks):
----------------------------------------
1. TSLA | Confidence: 7/10
   Current: $250.00 → Target: $240.00 | Stop: $255.00
   Catalyst: Production concerns, analyst downgrades

📈 STATISTICS:
   Total Analyzed: 5
   Buy Signals: 2 (40.0%)
   Sell Signals: 3 (60.0%)
   Avg Confidence: 7.4/10

⚠️  DISCLAIMER: This is for educational purposes only.
   Always do your own research before trading!
```

## Project Structure

```
ai-agent-stocks/
├── src/
│   ├── __init__.py
│   ├── config.py          # Configuration management
│   ├── market_data.py     # Stock data fetching and processing
│   └── stock_analyzer.py  # Main GPT-5 analysis engine
├── main.py               # CLI application entry point
├── requirements.txt      # Python dependencies
└── README.md            # This file
```

## Technical Details

### Data Sources
- **Stock Data**: Yahoo Finance API (yfinance) for real-time prices and technical indicators
- **News & Analysis**: GPT-5 web search with configurable domain restrictions
- **Market Indicators**: Real-time market data for S&P 500, Dow, Nasdaq, VIX

### Analysis Components
1. **Catalyst Detection**: Breaking news, earnings, FDA approvals, analyst changes
2. **Technical Indicators**: RSI, Moving Averages, Volume spikes, Breakout patterns
3. **Sentiment Analysis**: Social media trends, options flow, institutional activity
4. **Risk Management**: Stop-loss levels, target prices, position sizing

### Enhanced GPT-5 Features
- **Configurable Reasoning**: Low/Medium/High effort levels
- **Unrestricted Web Search**: Searches across all domains for comprehensive data
- **Specialized Prompts**: Optimized for momentum trading and catalyst detection
- **Binary Decision Framework**: Eliminates ambiguous "hold" recommendations

### Optional Financial Domains (if restrictions enabled)
- finance.yahoo.com, marketwatch.com, bloomberg.com
- reuters.com, cnbc.com, sec.gov, benzinga.com
- seeking.alpha.com, finviz.com, zacks.com, morningstar.com

## Requirements

- Python 3.8+
- OpenAI API key with GPT-5 access
- Internet connection for real-time data

## Limitations & Disclaimers

⚠️ **IMPORTANT DISCLAIMERS:**

1. **Educational Purpose Only**: This tool is for educational and research purposes only
2. **Not Financial Advice**: Do not use this as sole basis for investment decisions
3. **Risk Warning**: Short-term trading involves significant risk of loss
4. **Due Diligence**: Always conduct your own research and analysis
5. **Market Volatility**: Past performance does not guarantee future results

## Contributing

This is a demonstration project. Feel free to fork and enhance with additional features:

- Additional data sources (Alpha Vantage, Polygon, etc.)
- More sophisticated technical indicators
- Backtesting capabilities
- Portfolio optimization
- Risk management tools

## License

This project is for educational purposes. Please ensure compliance with:
- OpenAI's usage policies
- Financial data provider terms of service
- Local financial regulations

---

**Remember**: Always trade responsibly and never risk more than you can afford to lose! 📊💰
