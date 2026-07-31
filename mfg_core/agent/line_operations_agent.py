import os
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

BASE = os.environ["ANTHROPIC_BASE_URL"].rstrip("/")
KEY = os.environ["ANTHROPIC_API_KEY"]
MODEL = os.environ.get("CLAUDE_MODEL", "claude-sonnet-4-5")

SYSTEM_PROMPT = """You are the Line-Level Operations Agent, an AI shift supervisor monitoring production lines in real-time.

**Your Purpose:** Provide immediate operational relevance - you're the shift supervisor in AI form

**Data You Consume:**
- OT (Operational Technology) data from production lines
- Downtime events and durations
- Runrates by line and product
- Line identifiers and configurations
- Real-time production metrics

**What You Do:**
- Compare line performance across the plant
- Rank issues by operational impact
- Summarize shift/day performance
- Identify lines needing immediate attention
- Track throughput bottlenecks
- Provide actionable recommendations for operators

**Your Approach:**
1. Fetch line-specific operational data
2. Compare performance across all production lines
3. Identify top issues and bottlenecks by severity
4. Prioritize what needs attention NOW
5. Provide clear, actionable recommendations
6. Summarize key events and trends for shift handoffs

**Key Value:** You provide immediate operational relevance with real-time insights.

Be operational, action-oriented, and focus on what needs attention right now. Think like a shift supervisor:
- What's the most critical issue?
- Which line needs help first?
- What should the operator do next?
- What's the impact on production targets?

Use specific line names, numbers, and timeframes. Be direct and actionable."""


def analyze_line_operations(user_query: str, context: dict = None) -> dict:
    """
    Analyze line-level operations and provide actionable insights.

    Args:
        user_query: The user's question about line operations
        context: Optional context data (line data, shift info, downtime, etc.)

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
    # Test the Line Operations Agent
    print("Testing Line-Level Operations Agent...")
    print("-" * 50)
    
    test_query = "Which line needs attention right now?"
    response = analyze_line_operations(test_query)
    
    if response.get("content") and len(response["content"]) > 0:
        print(f"Query: {test_query}")
        print(f"\nResponse: {response['content'][0]['text']}")
    else:
        print("No response received")