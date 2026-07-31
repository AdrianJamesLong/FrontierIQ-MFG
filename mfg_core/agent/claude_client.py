import os
import anthropic
from dotenv import load_dotenv

load_dotenv()

MODEL = os.environ.get("CLAUDE_MODEL", "claude-sonnet-4-6")

_client: anthropic.Anthropic | None = None


def _get_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            raise RuntimeError("ANTHROPIC_API_KEY not set in .env")
        _client = anthropic.Anthropic(api_key=api_key)
    return _client


def claude_message(user_text: str, max_tokens: int = 800, system: str | None = None) -> dict:
    """
    Send a message to Claude via the Anthropic API.
    Returns a response dict compatible with the original Azure AI Foundry format.
    """
    client = _get_client()

    kwargs = {
        "model": MODEL,
        "max_tokens": max_tokens,
        "messages": [{"role": "user", "content": user_text}],
    }
    if system:
        kwargs["system"] = system

    message = client.messages.create(**kwargs)

    # Return in same shape as original so all agents work unchanged
    return {
        "id": message.id,
        "type": "message",
        "role": message.role,
        "content": [{"type": b.type, "text": b.text} for b in message.content],
        "model": message.model,
        "stop_reason": message.stop_reason,
        "usage": {
            "input_tokens": message.usage.input_tokens,
            "output_tokens": message.usage.output_tokens,
        },
    }


if __name__ == "__main__":
    response = claude_message("Hello! Can you confirm you're working?")
    print(response["content"][0]["text"])
