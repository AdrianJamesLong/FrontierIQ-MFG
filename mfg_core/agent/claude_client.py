import os
import sys
import anthropic
from dotenv import load_dotenv

load_dotenv()

# shared/config.py — see main.py's own path comment for why both locations
# are added (local dev vs. the Docker image's flattened layout).
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from shared.config import get_settings

_settings = get_settings()
MODEL = os.environ.get("CLAUDE_MODEL", _settings.foundry_model)

_client: anthropic.Anthropic | None = None


def _get_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        # Azure AI Foundry first (same shared endpoint Energy/GxP use),
        # falling back to a direct console.anthropic.com key if that's all
        # that's configured locally.
        api_key = _settings.foundry_api_key or os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            raise RuntimeError("No Claude credentials set — AMPLIFYIQ_FOUNDRY_API_KEY or ANTHROPIC_API_KEY must be in .env")
        kwargs = {"api_key": api_key}
        if _settings.foundry_api_key:
            kwargs["base_url"] = _settings.foundry_endpoint
        _client = anthropic.Anthropic(**kwargs)
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
