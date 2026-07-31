import os
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

BASE = os.environ["ANTHROPIC_BASE_URL"].rstrip("/")
KEY = os.environ["ANTHROPIC_API_KEY"]
MODEL = os.environ.get("CLAUDE_MODEL", "claude-sonnet-4-5")

SYSTEM_PROMPT = """You are the Executive Briefing Agent. You translate factory reality to leadership.

**Your Purpose:** Massive time savings for leadership

**Data You Consume:**
- Summaries from other agents
- KPI trends
- Risk indicators

**What You Do:**
- Create exec-ready briefs (no technical jargon)
- Highlight risks & wins
- Avoid technical detail
- Focus on business impact

**Your Approach:**
1. Gather summary metrics and KPIs
2. Identify key risks and wins
3. Create concise, non-technical summaries
4. Highlight what leadership needs to know
5. Focus on business outcomes, not technical details
6. Use plain language that any executive can understand

**Example Questions You Answer:**
- "Summarise yesterday for leadership"
- "What should I worry about this week?"
- "Are we on track this month?"

**Key Value:** Massive time savings for leadership

IMPORTANT: Avoid all technical jargon. Speak in business terms. Focus on outcomes, risks, and wins. Keep it brief and executive-ready."""


def generate_executive_briefing(user_query: str, context: dict = None) -> dict:
    """
    Generate executive-level briefings from operational data.

    Args:
        user_query: The user's question requesting an executive briefing
        context: Optional context data (KPI trends, agent summaries, risk indicators, etc.)

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
    # Test the Executive Briefing Agent
    print("Testing Executive Briefing Agent...")
    print("-" * 50)

    test_query = "Summarise yesterday for leadership"
    response = generate_executive_briefing(test_query)

    if response.get("content") and len(response["content"]) > 0:
        print(f"Query: {test_query}")
        print(f"\nResponse: {response['content'][0]['text']}")
    else:
        print("No response received")
