# AI Stock Analyzer - Complete Project

This repository contains both the original Python implementation and the new Next.js web application for AI-powered stock analysis.

## 📁 Project Structure

```
ai-agent-stocks/
├── python/           # Original Python implementation
│   ├── src/         # Python source code
│   ├── main.py      # CLI application
│   └── README.md    # Python documentation
│
└── web/             # Next.js web application
    ├── app/         # Next.js pages and API routes
    ├── components/  # React components
    ├── lib/         # Services and utilities
    └── README.md    # Web app documentation
```

## 🚀 Quick Start

### Python Application

```bash
cd python
pip install -r requirements.txt
export OPENAI_API_KEY="your-key-here"
python main.py
```

See [python/README.md](python/README.md) for detailed documentation.

### Web Application

```bash
cd web
pnpm install
cp .env.example .env.local
# Edit .env.local with your credentials
pnpm dev
```

See [web/README.md](web/README.md) for detailed documentation.

## 🎯 Features

### Python CLI
- Command-line interface for stock analysis
- Interactive mode for quick queries
- JSON output for automation
- Binary BUY/SELL decisions with confidence scores

### Web Application
- **Modern UI**: Professional, minimalistic interface with grayish theme
- **Market Scanning**: AI-powered discovery of trading opportunities
- **Single Stock Analysis**: Detailed analysis of any stock symbol
- **Scan History**: Browse and review previous analysis sessions
- **Prediction Tracking**: Compare predictions with actual outcomes
- **Accuracy Metrics**: Track AI performance over time
- **Extended Hours**: Pre-market and after-hours data analysis

## 🔧 Technology Stack

### Python App
- Python 3.8+
- OpenAI GPT-5
- yfinance (market data)
- python-dotenv

### Web App
- Next.js 15 (App Router)
- TypeScript
- MongoDB (data persistence)
- OpenAI GPT-5
- Tailwind CSS
- Yahoo Finance API

## 📊 Key Capabilities

1. **Stock Discovery**: AI searches the web for trending stocks with catalysts
2. **Binary Analysis**: Clear BUY or SELL decisions (no ambiguous holds)
3. **Risk Management**: Target prices, stop losses, confidence scores
4. **Catalyst Detection**: Identifies news, earnings, FDA approvals, upgrades
5. **Technical Analysis**: RSI, moving averages, volume patterns
6. **Extended Hours**: Pre-market and after-hours trading analysis
7. **Prediction Tracking**: Validates AI accuracy over time

## ⚙️ Configuration

Both applications share similar configuration options:

```env
OPENAI_API_KEY=your_key_here
DEFAULT_STOCKS=AAPL,GOOGL,MSFT,TSLA,NVDA
REASONING_EFFORT=medium
USE_DOMAIN_RESTRICTIONS=false
INCLUDE_EXTENDED_HOURS=true
```

### Web-Only Configuration

```env
MONGODB_URI=mongodb://localhost:27017/ai-agent-stocks
```

## 🚨 Important Disclaimers

⚠️ **Educational Purpose Only**

This tool is designed for educational and research purposes only. It is **NOT** financial advice.

- Always conduct your own research
- Understand the risks involved in trading
- Never invest more than you can afford to lose
- Past performance does not guarantee future results
- Consult with a licensed financial advisor before making investment decisions

## 📖 Usage Examples

### Python CLI

```bash
# Analyze single stock
python main.py --single AAPL

# Scan and analyze top 5 stocks
python main.py --count 5

# Analyze specific stocks
python main.py --stocks "AAPL,MSFT,GOOGL"

# Save results to JSON
python main.py --count 10 --output results.json
```

### Web Application

1. **Single Analysis**: Enter a symbol and click "Analyze"
2. **Market Scan**: Set count and click "Start Scan"
3. **View History**: Navigate to "Scans" to browse past analyses
4. **Track Predictions**: Check "Predictions" for accuracy metrics
5. **Search Symbols**: Use "Symbols" for quick access to popular stocks

## 🔍 How It Works

1. **Data Collection**
   - Real-time stock prices from Yahoo Finance
   - Technical indicators (RSI, MA, volume)
   - Extended hours trading data
   - Market overview (S&P 500, Nasdaq, VIX)

2. **AI Analysis**
   - GPT-5 with web search capabilities
   - Searches for catalysts (news, earnings, upgrades)
   - Analyzes technical setups and momentum
   - Considers extended hours activity
   - Evaluates risk/reward ratios

3. **Binary Decision**
   - Clear BUY or SELL (no holds)
   - Confidence score (1-10)
   - Target price and stop loss
   - Primary catalyst identification
   - Timeframe (1-5 days)

4. **Result Storage** (Web Only)
   - MongoDB stores all analyses
   - Tracks predictions over time
   - Calculates accuracy metrics
   - Enables historical comparisons

## 🛠️ Development

### Python

```bash
cd python
pip install -r requirements.txt
python example.py  # Run examples
python main.py     # Run CLI
```

### Web

```bash
cd web
pnpm install
pnpm dev          # Development server
pnpm build        # Production build
pnpm start        # Production server
```

## 📝 License

This project is for educational purposes. Please ensure compliance with:
- OpenAI's usage policies
- Financial data provider terms of service
- Local financial regulations

## 🤝 Contributing

This is a demonstration project. Feel free to fork and enhance with:
- Additional data sources
- More technical indicators
- Backtesting capabilities
- Portfolio optimization
- Advanced risk management

## 📞 Support

For issues or questions:
1. Check the respective README files (python/ or web/)
2. Review the API documentation
3. Ensure all dependencies are installed
4. Verify API keys and environment variables

---

**Remember**: This is an educational tool. Always do your own research and trade responsibly! 📊💼


