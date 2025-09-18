#!/bin/bash
# Setup script for AI Stock Analyzer

echo "🚀 Setting up AI Stock Analyzer..."

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << 'EOF'
# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Stock Analysis Configuration (Optional)
DEFAULT_STOCKS=AAPL,GOOGL,MSFT,TSLA,NVDA,META,AMZN,SPY,QQQ,IWM
ANALYSIS_TIMEFRAME=5
MAX_STOCKS_TO_ANALYZE=10
RISK_TOLERANCE=medium

# GPT-5 Analysis Settings
REASONING_EFFORT=medium
USE_DOMAIN_RESTRICTIONS=false
EOF
    echo "✅ Created .env file"
    echo "⚠️  Please edit .env and add your OpenAI API key"
else
    echo "✅ .env file already exists"
fi

# Install dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

echo ""
echo "🎯 Setup complete! Next steps:"
echo "1. Edit .env file and add your OpenAI API key"
echo "2. Run: python main.py"
echo "3. Or try examples: python example.py"
echo ""
echo "🚀 Happy trading!"
