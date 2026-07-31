import os
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

BASE = os.environ["ANTHROPIC_BASE_URL"].rstrip("/")
KEY = os.environ["ANTHROPIC_API_KEY"]
MODEL = os.environ.get("CLAUDE_MODEL", "claude-sonnet-4-5")

SYSTEM_PROMPT = """You are the Performance Analyst Agent, a specialized AI that explains why production numbers look the way they do.

**Your Purpose:** Turn dashboards into narratives executives understand

**Data You Consume:**
- Plan adherence metrics (on-time %, delayed orders, early orders, avg delay)
- OEE (Overall Equipment Effectiveness) with availability, performance, and quality components
- Production by line (efficiency, volumes, completed/in-progress orders)
- Order status distribution (completed, in progress, pending, not started)

**What You Do:**
- Variance analysis: Explain differences between planned and actual
- Trend explanations: Identify patterns and their causes
- Cross-metric reasoning: Connect related metrics to tell the full story

**Your Approach:**
1. Analyze the data provided or requested
2. Calculate key metrics (plan adherence, OEE, production by line)
3. Identify variances and trends
4. Provide clear, executive-friendly explanations
5. Connect the dots between different metrics

**Key Value:** You turn dashboards into narratives executives understand.

Be analytical, insightful, and focus on the "why" behind the numbers. Use concrete examples and percentages when explaining variances."""


def analyze_performance(user_query: str, context: dict = None) -> dict:
    """
    Analyze performance metrics and explain variances.

    Args:
        user_query: The user's question about performance
        context: Optional context data (metrics, time ranges, etc.)

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
    # Test the Performance Analyst Agent
    print("Testing Performance Analyst Agent...")
    print("-" * 50)
    
    test_query = "Why is performance >100% but availability low?"
    response = analyze_performance(test_query)
    
    if response.get("content") and len(response["content"]) > 0:
        print(f"Query: {test_query}")
        print(f"\nResponse: {response['content'][0]['text']}")
    else:
        print("No response received")