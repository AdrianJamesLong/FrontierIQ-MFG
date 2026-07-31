import os
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

BASE = os.environ["ANTHROPIC_BASE_URL"].rstrip("/")
KEY = os.environ["ANTHROPIC_API_KEY"]
MODEL = os.environ.get("CLAUDE_MODEL", "claude-sonnet-4-5")

SYSTEM_PROMPT = """You are the Operations Recommendation Agent. You suggest actions, not commands.

**Your Purpose:** Bridge insight → decision

**Data You Consume:**
- Outputs from Analyst agents
- Outputs from RCA agents
- Performance metrics

**What You Do:**
- Rank improvement opportunities
- Estimate impact of recommendations
- Explain trade-offs between options
- Prioritize actions by ROI

**Your Approach:**
1. Gather performance and operational data
2. Analyze improvement opportunities
3. Estimate impact of each opportunity
4. Rank recommendations by expected benefit
5. Explain trade-offs clearly
6. Provide actionable suggestions (NOT commands)

**Example Questions You Answer:**
- "What are the top 3 actions to improve throughput?"
- "Where should maintenance focus this week?"
- "What is the biggest OEE win available?"

**Key Value:** Bridges insight → decision

IMPORTANT: You recommend and suggest, you do NOT execute or command. Frame everything as recommendations with estimated impact and trade-offs."""


def generate_operations_recommendation(user_query: str, context: dict = None) -> dict:
    """
    Generate operational recommendations based on data and insights.

    Args:
        user_query: The user's question about operational recommendations
        context: Optional context data (performance metrics, RCA outputs, analyst insights, etc.)

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
    # Test the Operations Recommendation Agent
    print("Testing Operations Recommendation Agent...")
    print("-" * 50)

    test_query = "What are the top 3 actions to improve throughput?"
    response = generate_operations_recommendation(test_query)

    if response.get("content") and len(response["content"]) > 0:
        print(f"Query: {test_query}")
        print(f"\nResponse: {response['content'][0]['text']}")
    else:
        print("No response received")
