"""
Configuration settings for the AI Stock Analyzer
"""
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    """Configuration class for stock analysis application"""
    
    # OpenAI Configuration
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
    
    # Stock Analysis Settings
    DEFAULT_STOCKS = os.getenv('DEFAULT_STOCKS', 'AAPL,GOOGL,MSFT,TSLA,NVDA,META,AMZN,SPY,QQQ,IWM').split(',')
    ANALYSIS_TIMEFRAME = int(os.getenv('ANALYSIS_TIMEFRAME', '5'))  # days
    MAX_STOCKS_TO_ANALYZE = int(os.getenv('MAX_STOCKS_TO_ANALYZE', '10'))
    RISK_TOLERANCE = os.getenv('RISK_TOLERANCE', 'medium')  # low, medium, high
    
    # GPT-5 Analysis Settings
    REASONING_EFFORT = os.getenv('REASONING_EFFORT', 'medium')  # low, medium, high
    USE_DOMAIN_RESTRICTIONS = os.getenv('USE_DOMAIN_RESTRICTIONS', 'false').lower() == 'true'
    
    # Optional web search domains (only used if USE_DOMAIN_RESTRICTIONS=true)
    PREFERRED_DOMAINS = [
        "finance.yahoo.com",
        "marketwatch.com", 
        "bloomberg.com",
        "reuters.com",
        "cnbc.com",
        "sec.gov",
        "investor.gov",
        "finviz.com",
        "seeking.alpha.com",
        "benzinga.com",
        "fool.com",
        "zacks.com",
        "morningstar.com"
    ]
    
    @classmethod
    def validate_config(cls):
        """Validate that required configuration is present"""
        if not cls.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY is required. Please set it in your environment or .env file")
        
        return True
