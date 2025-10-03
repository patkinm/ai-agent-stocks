# 🚀 Quick Start Guide

Get up and running in 5 minutes!

## Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] pnpm installed (`npm install -g pnpm`)
- [ ] MongoDB running (local or Atlas URL)
- [ ] OpenAI API key ready

## Fast Setup (3 Steps)

### 1. Navigate and Install
```bash
cd web
pnpm install
```

### 2. Configure
```bash
# Copy environment template
cp .env.example .env.local

# Edit with your credentials
nano .env.local  # or use your favorite editor
```

Required in `.env.local`:
```env
MONGODB_URI=mongodb://localhost:27017/ai-agent-stocks
OPENAI_API_KEY=sk-proj-your-actual-key-here
```

### 3. Run
```bash
pnpm dev
```

Open: **http://localhost:3000** 🎉

## First Analysis

### Option A: Single Stock
1. Go to homepage
2. Enter "AAPL"
3. Click "Analyze"
4. Wait 30-60 seconds

### Option B: Market Scan
1. Go to homepage
2. Click "Market Scan"
3. Set count to "5"
4. Click "Start Scan"
5. Wait 3-5 minutes

## MongoDB Quick Setup

### Local MongoDB
```bash
# macOS
brew install mongodb-community
brew services start mongodb-community

# Ubuntu
sudo apt-get install mongodb
sudo systemctl start mongodb
```

### MongoDB Atlas (Cloud - Free Tier)
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create cluster (free tier)
4. Get connection string
5. Add to `.env.local`

Connection string format:
```
mongodb+srv://username:password@cluster.mongodb.net/ai-agent-stocks
```

## Common Commands

```bash
# Development
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run linter

# MongoDB (local)
mongod                # Start MongoDB
mongo                 # Open MongoDB shell
```

## Troubleshooting Fast Fixes

### Port 3000 in use?
```bash
lsof -ti:3000 | xargs kill
# or use different port
PORT=3001 pnpm dev
```

### MongoDB not connecting?
```bash
# Check if running
brew services list | grep mongodb
# or
sudo systemctl status mongodb
```

### API key not working?
- Check for spaces: `OPENAI_API_KEY=sk-proj-...` (no spaces)
- Verify key format starts with `sk-proj-`
- Restart dev server after changing `.env.local`

## Project Structure

```
ai-agent-stocks/
├── python/          # Original Python app
└── web/            # Next.js web app ⭐
    ├── app/        # Pages and API
    ├── components/ # React components
    └── lib/        # Services and utilities
```

## Key URLs

- **Homepage**: http://localhost:3000
- **Scans**: http://localhost:3000/scans
- **Predictions**: http://localhost:3000/comparisons
- **Symbols**: http://localhost:3000/symbols

## API Endpoints

```bash
# Test API directly
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"symbol":"AAPL"}'
```

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MONGODB_URI` | ✅ Yes | - | MongoDB connection |
| `OPENAI_API_KEY` | ✅ Yes | - | OpenAI API key |
| `REASONING_EFFORT` | No | medium | low/medium/high |
| `INCLUDE_EXTENDED_HOURS` | No | true | Pre/post market |

## Next Steps

After successful setup:

1. ✅ Analyze a few stocks
2. ✅ Try market scan
3. ✅ Check scans history
4. ✅ Review predictions (after 1-5 days)
5. ✅ Read full documentation in README.md

## Getting Help

1. Check `SETUP_GUIDE.md` for detailed instructions
2. Review `PROJECT_SUMMARY.md` for feature overview
3. See main `README.md` for complete documentation

## Important Reminders

⚠️ **This is for educational purposes only**
- Not financial advice
- Always do your own research
- Never invest more than you can afford to lose

---

**Enjoy analyzing! 📊✨**


