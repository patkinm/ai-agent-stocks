# Complete Setup Guide - AI Stock Analyzer

This guide will help you set up and run both the Python CLI and Next.js web application.

## 📋 Prerequisites

### Required Software
- **Node.js** 18+ and **pnpm**: For the web application
- **Python** 3.8+: For the Python CLI (optional)
- **MongoDB**: For data persistence (local or MongoDB Atlas)
- **OpenAI API Key**: With GPT-5 access

### Install pnpm (if not installed)
```bash
npm install -g pnpm
```

### Install MongoDB (if running locally)
- **macOS**: `brew install mongodb-community`
- **Ubuntu**: Follow [MongoDB Ubuntu Installation](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-ubuntu/)
- **Windows**: Download from [MongoDB Download Center](https://www.mongodb.com/try/download/community)

Or use **MongoDB Atlas** (cloud): https://www.mongodb.com/cloud/atlas

## 🚀 Web Application Setup (Recommended)

### 1. Navigate to Web Directory
```bash
cd web
```

### 2. Run Setup Script
```bash
./setup.sh
```

Or manually:
```bash
pnpm install
cp .env.example .env.local
```

### 3. Configure Environment Variables

Edit `.env.local`:

```env
# MongoDB - Choose one:
# Local MongoDB:
MONGODB_URI=mongodb://localhost:27017/ai-agent-stocks

# Or MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ai-agent-stocks

# OpenAI API Key (Required)
OPENAI_API_KEY=sk-proj-your-actual-openai-api-key-here

# Optional Configuration (defaults shown)
DEFAULT_STOCKS=AAPL,GOOGL,MSFT,TSLA,NVDA,META,AMZN,SPY,QQQ,IWM
ANALYSIS_TIMEFRAME=5
MAX_STOCKS_TO_ANALYZE=10
RISK_TOLERANCE=medium
REASONING_EFFORT=medium
USE_DOMAIN_RESTRICTIONS=false
INCLUDE_EXTENDED_HOURS=true
```

### 4. Start MongoDB (if local)
```bash
# macOS/Linux
mongod --dbpath=/path/to/data

# Or use brew services (macOS)
brew services start mongodb-community

# Windows - MongoDB runs as a service by default
```

### 5. Run Development Server
```bash
pnpm dev
```

### 6. Open Browser
Navigate to: **http://localhost:3000**

## 🎯 Using the Web Application

### Main Features

1. **Home Page (/)** - Analysis Dashboard
   - **Single Stock**: Enter symbol (e.g., AAPL) and click "Analyze"
   - **Market Scan**: Set count (5-20) and click "Start Scan"
   - View results with buy/sell signals, confidence scores, targets

2. **Scans (/scans)** - History
   - Browse all previous analysis sessions
   - Click any scan to view detailed results
   - See summary statistics for each scan

3. **Predictions (/comparisons)** - Accuracy Tracking
   - View prediction vs actual results
   - Track overall accuracy metrics
   - Click "Update All" to refresh with latest data

4. **Symbols (/symbols)** - Quick Access
   - Search any stock symbol
   - Browse popular stocks
   - One-click analysis

### Example Workflows

**Workflow 1: Analyze Specific Stock**
1. Go to home page
2. Select "Single Stock" mode
3. Enter "AAPL" and click Analyze
4. Wait 30-60 seconds for AI analysis
5. Review decision, confidence, target prices

**Workflow 2: Market Scan**
1. Go to home page
2. Select "Market Scan" mode
3. Set count to 8 stocks
4. Click "Start Scan"
5. Wait 5-10 minutes for complete analysis
6. Review all recommendations
7. Results saved in Scans history

**Workflow 3: Track Predictions**
1. Perform analyses (they're auto-saved)
2. Wait 1-5 days (prediction timeframe)
3. Go to Predictions page
4. Click "Update All" to compare with actual data
5. Review accuracy statistics

## 🐍 Python CLI Setup (Optional)

If you want to use the Python CLI:

### 1. Navigate to Python Directory
```bash
cd ../python  # from web directory
# or
cd python     # from root
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Set Environment Variables
```bash
export OPENAI_API_KEY="sk-proj-your-key-here"

# Optional
export REASONING_EFFORT="medium"
export USE_DOMAIN_RESTRICTIONS="false"
```

Or create `.env` file:
```env
OPENAI_API_KEY=sk-proj-your-key-here
REASONING_EFFORT=medium
USE_DOMAIN_RESTRICTIONS=false
```

### 4. Run CLI
```bash
# Interactive mode
python main.py

# Analyze single stock
python main.py --single AAPL

# Market scan
python main.py --count 5

# Specific stocks
python main.py --stocks "AAPL,MSFT,GOOGL"
```

## 🔧 Production Deployment

### Web Application

1. **Build for Production**
   ```bash
   cd web
   pnpm build
   ```

2. **Start Production Server**
   ```bash
   pnpm start
   ```

3. **Environment Variables**
   - Ensure `.env.local` is properly configured
   - For cloud deployment, set env vars in your platform:
     - Vercel: Project Settings → Environment Variables
     - Railway: Project → Variables
     - AWS/GCP: Configure in deployment settings

### Recommended Hosting

- **Vercel**: Easiest for Next.js (automatic deployments)
- **Railway**: Good for Next.js + MongoDB
- **DigitalOcean**: More control, need to configure
- **AWS/GCP**: Enterprise-grade, more complex

## 🐛 Troubleshooting

### MongoDB Connection Issues

**Error**: `MongoServerError: Authentication failed`
- Check username/password in connection string
- Verify database user has proper permissions
- For Atlas, check IP whitelist settings

**Error**: `connect ECONNREFUSED 127.0.0.1:27017`
- Ensure MongoDB is running: `brew services list` (macOS)
- Check MongoDB port: default is 27017
- Try: `mongod --dbpath=/path/to/data`

### OpenAI API Issues

**Error**: `Invalid API key`
- Verify key format: should start with `sk-proj-`
- Check key is set in `.env.local`
- Ensure no extra spaces or quotes

**Error**: `Rate limit exceeded`
- You've hit OpenAI rate limits
- Wait a few minutes and try again
- Upgrade your OpenAI plan if needed

### Next.js Build Issues

**Error**: `Cannot find module '@/lib/...'`
- Delete `.next` folder: `rm -rf .next`
- Delete `node_modules`: `rm -rf node_modules`
- Reinstall: `pnpm install`
- Rebuild: `pnpm build`

### Port Already in Use

**Error**: `Port 3000 is already in use`
- Kill the process: `lsof -ti:3000 | xargs kill`
- Or use different port: `PORT=3001 pnpm dev`

## 📊 Understanding the Results

### Confidence Scores
- **8-10**: Very high confidence, strong setup
- **6-7**: Good confidence, favorable odds
- **4-5**: Moderate confidence, mixed signals
- **1-3**: Low confidence, weak setup

### Decision Types
- **BUY**: Expected upward movement in 1-5 days
- **SELL**: Expected downward movement in 1-5 days
- No HOLD options - always binary decision

### Target & Stop Loss
- **Target**: Expected price if prediction is correct
- **Stop Loss**: Exit price if prediction is wrong
- Risk/Reward typically 2:1 to 4:1

## 🔒 Security Best Practices

1. **Never commit API keys**
   - `.env.local` is in `.gitignore`
   - Use environment variables in production

2. **MongoDB Security**
   - Use strong passwords
   - Enable authentication
   - Limit IP access (MongoDB Atlas)

3. **API Rate Limits**
   - Monitor OpenAI usage
   - Implement request throttling if needed

## 📈 Performance Tips

1. **Faster Analysis**
   - Set `REASONING_EFFORT=low` for quicker results
   - Reduce `MAX_STOCKS_TO_ANALYZE`

2. **Better Results**
   - Set `REASONING_EFFORT=high` for deeper analysis
   - Enable `USE_DOMAIN_RESTRICTIONS=true` for financial sources only

3. **Database Performance**
   - Create indexes on frequently queried fields
   - Regular database maintenance

## 📞 Getting Help

1. Check this guide first
2. Review main README.md
3. Check API endpoint documentation
4. Verify all prerequisites are installed
5. Ensure environment variables are set correctly

## ⚠️ Important Reminders

- This is an **educational tool**, not financial advice
- Always do your own research
- Never invest more than you can afford to lose
- Markets are unpredictable - no tool guarantees success
- Test with paper trading first

---

**Happy analyzing! 📊🚀**


