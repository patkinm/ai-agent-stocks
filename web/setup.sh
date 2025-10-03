#!/bin/bash

echo "🚀 AI Stock Analyzer - Web App Setup"
echo "===================================="
echo ""

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Please install it first:"
    echo "   npm install -g pnpm"
    exit 1
fi

echo "✅ pnpm is installed"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local template..."
    cat > .env.local << 'EOF'
# MongoDB
MONGODB_URI=mongodb://localhost:27017/ai-agent-stocks

# OpenAI
OPENAI_API_KEY=your_openai_api_key_here

# Stock Analysis Settings (Optional)
DEFAULT_STOCKS=AAPL,GOOGL,MSFT,TSLA,NVDA,META,AMZN,SPY,QQQ,IWM
ANALYSIS_TIMEFRAME=5
MAX_STOCKS_TO_ANALYZE=10
RISK_TOLERANCE=medium
REASONING_EFFORT=medium
USE_DOMAIN_RESTRICTIONS=false
INCLUDE_EXTENDED_HOURS=true
EOF
    echo "⚠️  Please edit .env.local and add your:"
    echo "   - MONGODB_URI (default: mongodb://localhost:27017/ai-agent-stocks)"
    echo "   - OPENAI_API_KEY"
    echo ""
else
    echo "✅ .env.local already exists"
    echo ""
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env.local with your credentials"
echo "2. Make sure MongoDB is running"
echo "3. Run 'pnpm dev' to start the development server"
echo "4. Open http://localhost:3000"
echo ""
echo "For production:"
echo "- Run 'pnpm build' to create optimized build"
echo "- Run 'pnpm start' to start production server"
echo ""


