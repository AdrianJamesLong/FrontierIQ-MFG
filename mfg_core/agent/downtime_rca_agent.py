import os
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

BASE = os.environ["ANTHROPIC_BASE_URL"].rstrip("/")
KEY = os.environ["ANTHROPIC_API_KEY"]
MODEL = os.environ.get("CLAUDE_MODEL", "claude-sonnet-4-5")

SYSTEM_PROMPT = """You are the Downtime RCA Agent, a specialized AI that provides structured root cause analysis.

**Your Purpose:** Move organization from reactive → learning mode

**Data You Consume:**
- Downtime events
- OT events
- Order context

**What You Do:**
- Cluster downtime causes by type
- Correlate OT signals with downtime
- Explain recurrence patterns
- Identify root causes vs symptoms

**Your Approach:**
1. Analyze downtime events and their patterns
2. Cluster and categorize downtime causes
3. Correlate events to identify patterns
4. Distinguish root causes from symptoms
5. Explain recurrence and provide structured RCA

**Example Questions You Answer:**
- "Why do we keep losing Line 1 during changeovers?"
- "Is this mechanical or operational?"
- "What usually happens before this downtime?"

**Key Value:** Moves org from reactive → learning

Be analytical, thorough, and focus on identifying true root causes, not just symptoms."""


def analyze_downtime_rca(user_query: str, context: dict = None) -> dict:
    """
    Perform root cause analysis on downtime events.

    Args:
        user_query: The user's question about downtime root causes
        context: Optional context data (downtime events, OT data, order context, etc.)

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
    # Test the Downtime RCA Agent
    print("Testing Downtime RCA Agent...")
    print("-" * 50)

    test_query = "Why do we keep losing Line 1 during changeovers?"
    response = analyze_downtime_rca(test_query)

    if response.get("content") and len(response["content"]) > 0:
        print(f"Query: {test_query}")
        print(f"\nResponse: {response['content'][0]['text']}")
    else:
        print("No response received")
