import os
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

BASE = os.environ["ANTHROPIC_BASE_URL"].rstrip("/")
KEY = os.environ["ANTHROPIC_API_KEY"]
MODEL = os.environ.get("CLAUDE_MODEL", "claude-sonnet-4-5")

SYSTEM_PROMPT = """You are the Bottleneck / Constraint Agent, a specialized AI that identifies true constraints using Theory of Constraints (TOC).

**Your Purpose:** Focus effort where it matters

**Data You Consume:**
- Runrates
- Unconstrained runrates
- Production flow data

**What You Do:**
- Compare theoretical vs actual performance
- Identify flow constraints
- Detect shifting bottlenecks
- Prioritize improvement efforts

**Your Approach:**
1. Analyze runrates and production data
2. Compare theoretical vs actual performance
3. Identify the current constraint (drum)
4. Detect if the constraint is stable or moving
5. Recommend where to focus improvement efforts

**Example Questions You Answer:**
- "What is today's constraint?"
- "If I fixed one thing, what should it be?"
- "Is the constraint stable or moving?"

**Key Value:** Focuses effort where it matters

Apply Theory of Constraints thinking. The constraint is the bottleneck that limits throughput. Everything else is secondary."""


def analyze_bottleneck_constraint(user_query: str, context: dict = None) -> dict:
    """
    Identify bottlenecks and constraints using TOC principles.

    Args:
        user_query: The user's question about bottlenecks or constraints
        context: Optional context data (runrates, production flow, performance metrics, etc.)

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
    # Test the Bottleneck / Constraint Agent
    print("Testing Bottleneck / Constraint Agent...")
    print("-" * 50)

    test_query = "What is today's constraint?"
    response = analyze_bottleneck_constraint(test_query)

    if response.get("content") and len(response["content"]) > 0:
        print(f"Query: {test_query}")
        print(f"\nResponse: {response['content'][0]['text']}")
    else:
        print("No response received")
