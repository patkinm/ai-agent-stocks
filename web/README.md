# AI Stock Analyzer - Web Application

A professional Next.js web application for AI-powered stock analysis with binary trading decisions (BUY/SELL). Built with TypeScript, Next.js 15, MongoDB, and OpenAI GPT-5.

## 🎯 Features

### Core Functionality
- **Single Stock Analysis**: Analyze any stock symbol with detailed AI insights
- **Market Scanning**: Automatically find and analyze top trading opportunities
- **Binary Decisions**: Clear BUY or SELL recommendations (no holds)
- **Confidence Scoring**: 1-10 scale confidence ratings
- **Extended Hours Data**: Pre-market and after-hours trading analysis

### Data Management
- **Scan History**: Browse all previous analysis sessions
- **Prediction Tracking**: Compare predictions with actual stock performance
- **Accuracy Metrics**: Track prediction accuracy and success rates
- **Symbol Search**: Quick access to popular stocks and custom searches

### UI/UX
- **Minimalistic Design**: Professional grayish color scheme
- **Responsive Layout**: Works on all screen sizes
- **Real-time Updates**: Live analysis results
- **Visual Indicators**: Color-coded buy/sell signals

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- MongoDB instance (local or Atlas)
- OpenAI API key with GPT-5 access

### Installation

1. **Install dependencies**
   ```bash
   cd web
   pnpm install
   ```

2. **Configure environment variables**
   
   Create `.env.local` file:
   ```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/ai-agent-stocks
   
   # OpenAI
   OPENAI_API_KEY=your_openai_api_key_here
   
   # Optional Configuration
   DEFAULT_STOCKS=AAPL,GOOGL,MSFT,TSLA,NVDA,META,AMZN,SPY,QQQ,IWM
   ANALYSIS_TIMEFRAME=5
   MAX_STOCKS_TO_ANALYZE=10
   RISK_TOLERANCE=medium
   REASONING_EFFORT=medium
   USE_DOMAIN_RESTRICTIONS=false
   INCLUDE_EXTENDED_HOURS=true
   ```

3. **Run the development server**
   ```bash
   pnpm dev
   ```

4. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
web/
├── app/                      # Next.js App Router
│   ├── api/                 # API routes
│   │   ├── analyze/         # Single stock analysis
│   │   ├── scan/            # Market scanning
│   │   ├── comparisons/     # Prediction tracking
│   │   └── analyses/        # Stock history
│   ├── comparisons/        # Prediction tracking page
│   ├── symbols/            # Symbol search page
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home page (analysis)
│   └── globals.css         # Global styles
├── components/             # React components
│   ├── Navigation.tsx      # Main navigation
│   └── AnalysisCard.tsx    # Analysis result card
├── lib/                    # Core libraries
│   ├── mongodb.ts          # MongoDB connection
│   ├── models/             # Data models
│   │   └── analysis.ts     # TypeScript interfaces
│   └── services/           # Business logic
│       ├── market-data.ts  # Market data fetching
│       ├── stock-analyzer.ts # AI analysis engine
│       └── database.ts     # Database operations
└── package.json
```

## 🔧 API Endpoints

### POST /api/analyze
Analyze a single stock symbol
```json
{
  "symbol": "AAPL"
}
```

### POST /api/scan
Scan market for top stocks
```json
{
  "count": 8,
  "symbols": ["AAPL", "MSFT"] // optional specific symbols
}
```

### GET /api/comparisons
Get analyses with prediction tracking and accuracy stats

### POST /api/comparisons
Update all pending analyses with current price data for prediction tracking

### GET /api/analyses/[symbol]
Get analysis history for a symbol

## 💾 Database Schema

### Collections

**analyses**: All analysis data (simplified from 3 collections to 1!)
- Core: Symbol, decision, confidence, prices, targets
- Technical indicators: RSI, MA, volume, etc.
- Extended hours data: Pre-market, after-hours prices
- AI reasoning: Raw response and analysis text
- Prediction tracking: Actual prices, accuracy scores, target achievement

## 🎨 UI Components

### Pages
- **/** - Main analysis interface (single stock or market scan)
- **/comparisons** - Prediction tracking and accuracy statistics
- **/symbols** - Symbol search and popular stocks

### Components
- **Navigation** - Top navigation bar
- **AnalysisCard** - Display analysis results with visual indicators

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | Required |
| `OPENAI_API_KEY` | OpenAI API key | Required |
| `DEFAULT_STOCKS` | Fallback stock list | AAPL,GOOGL,... |
| `REASONING_EFFORT` | GPT-5 reasoning level | medium |
| `USE_DOMAIN_RESTRICTIONS` | Limit web search domains | false |
| `INCLUDE_EXTENDED_HOURS` | Include pre/post market data | true |

## 🔍 How It Works

1. **Data Fetching**: Uses Yahoo Finance API to fetch real-time stock data, technical indicators, and extended hours activity

2. **AI Analysis**: GPT-5 with web search analyzes:
   - Breaking news and catalysts
   - Technical indicators and patterns
   - Extended hours momentum
   - Upcoming events

3. **Binary Decision**: AI provides clear BUY or SELL with:
   - Confidence score (1-10)
   - Target price and stop loss
   - Primary catalyst
   - Expected timeframe (1-5 days)

4. **Prediction Tracking**: System automatically:
   - Stores predictions in MongoDB
   - Updates actual results after timeframe
   - Calculates accuracy metrics

## 📊 Features in Detail

### Market Scanning
- AI searches web for top trading opportunities
- Identifies catalysts (earnings, FDA, upgrades, etc.)
- Analyzes 5-20 stocks automatically
- Prioritizes liquid stocks with clear catalysts

### Prediction Comparison
- Tracks all predictions automatically
- Compares predicted vs actual outcomes
- Calculates accuracy scores (-1 to +1)
- Shows target achievement rates
- Provides overall performance statistics

### Extended Hours Analysis
- Pre-market price and volume
- After-hours activity and reactions
- Institutional trading patterns
- Overnight news impact

## 🚨 Disclaimer

This application is for **educational purposes only**. It is not financial advice.

- Always conduct your own research
- Understand the risks of trading
- Never invest more than you can afford to lose
- Past performance does not guarantee future results
- Consult with a licensed financial advisor

## 🛠️ Development

### Build for production
```bash
pnpm build
```

### Start production server
```bash
pnpm start
```

### Linting
```bash
pnpm lint
```

## 📝 License

This project is for educational purposes.

## 🤝 Credits

Built with:
- Next.js 15
- TypeScript
- MongoDB
- OpenAI GPT-5
- Tailwind CSS
- Lucide Icons
- date-fns
- Recharts

---

**Remember**: Always trade responsibly! 📈📉
