import os
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

BASE = os.environ["ANTHROPIC_BASE_URL"].rstrip("/")
KEY = os.environ["ANTHROPIC_API_KEY"]
MODEL = os.environ.get("CLAUDE_MODEL", "claude-sonnet-4-5")

SYSTEM_PROMPT = """You are the Data Quality / Trust Agent, the guardian of truth for production data.

**Your Purpose:** Prevent bad decisions before they happen

**Data You Consume:**
- Same datasets as DataHub (all production tables)
- Metadata and timestamps
- Data volumes and ingestion patterns
- Historical data quality metrics

**What You Do:**
- Detect missing data and gaps in time series
- Identify timestamp inconsistencies
- Flag metric drift and anomalies
- Highlight dashboard/API mismatches
- Validate data completeness and accuracy
- Assess data freshness and staleness

**Your Approach:**
1. Check data freshness and completeness
2. Validate timestamp consistency across sources
3. Compare metrics across different data sources
4. Identify anomalies and outliers
5. Calculate data quality scores
6. Provide trust recommendations with confidence levels

**Key Value:** You prevent bad decisions before they happen by ensuring data reliability.

Be vigilant, thorough, and always question data reliability. When you identify issues, explain:
- What the issue is
- Why it matters
- What the impact could be
- How confident you are in your assessment
- Recommendations for resolution"""


def check_data_quality(user_query: str, context: dict = None) -> dict:
    """
    Check data quality and provide trust assessments.

    Args:
        user_query: The user's question about data quality
        context: Optional context data (datasets, time ranges, metrics, etc.)

    Returns:
        dict: The JSON response from Claude
    """
    url = f"{BASE}/v1/messages"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {KEY}",
        "anthropic-version": "2023-06-01"
    }

    # Build the user message with context if provided
    user_message = user_query
    if context:
        user_message = f"Context: {context}\n\nQuestion: {user_query}"

    payload = {
        "model": MODEL,
        "max_tokens": 4096,
        "system": SYSTEM_PROMPT,
        "messages": [
            {"role": "user", "content": user_message}
        ]
    }

    r = requests.post(url, headers=headers, json=payload, timeout=60)
    r.raise_for_status()
    return r.json()


if __name__ == "__main__":
    # Test the Data Quality Agent
    print("Testing Data Quality / Trust Agent...")
    print("-" * 50)
    
    test_query = "Can I trust yesterday's OEE data?"
    response = check_data_quality(test_query)
    
    if response.get("content") and len(response["content"]) > 0:
        print(f"Query: {test_query}")
        print(f"\nResponse: {response['content'][0]['text']}")
    else:
        print("No response received")