"""
Common settings for the FrontierIQ-MFG services (currently just mfg_core).
Values come from environment variables / .env; secrets can also be pulled
live from Key Vault when AMPLIFYIQ_USE_KEY_VAULT=true.

Trimmed fork of FrontierIQ-GxP's shared/config.py (same shape, same
AMPLIFYIQ_ prefix, same Key Vault). guardrailiq_url/agent_url/mcp_server_url
are placeholders for backlog #6/#7 (routing the 7 in-process agents through
FrontierPlatform's governed agent/tool-use services and LoopIQ) — not wired
into mfg_core yet, kept here so that future work doesn't need a second pass
on this file.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="AMPLIFYIQ_", extra="ignore")

    # Azure AI Foundry (Claude) — same existing deployment Energy/GxP already
    # use, reused cross-resource-group. Anthropic-compatible endpoint is the
    # connected account's .services.ai.azure.com host + /anthropic (confirmed
    # working), not the Foundry *project* endpoint.
    foundry_endpoint: str = "https://adria-mok6bkgv-eastus2.services.ai.azure.com/anthropic"
    foundry_model: str = "claude-sonnet-4-6"
    foundry_api_key: str = ""

    # GuardrailIQ / amplifyiq-agent / mcpserver — lives in the FrontierPlatform
    # repo. Not called from mfg_core yet (backlog #6 decision pending); kept
    # here so wiring it up later is a one-line change, not a second config pass.
    guardrailiq_url: str = "http://localhost:8001"
    agent_url: str = "http://localhost:8002"
    mcp_server_url: str = "http://localhost:8008"

    # Splash-screen PIN gate (backlog #17, parity with Energy/GxP) — a
    # deterrent-only shared secret, not real auth. admin_pin is a separate
    # secret so approving/denying access requests isn't gated by the same
    # PIN handed to every demo user. Override via AMPLIFYIQ_SPLASH_PIN /
    # AMPLIFYIQ_ADMIN_PIN at deploy time.
    splash_pin: str = "1234"
    admin_pin: str = "9999"

    # Key Vault
    key_vault_name: str = "kv-amplifyiq"
    use_key_vault: bool = False
    local_dev: bool = False  # true on this dev machine only, see credential note below

    def resolve_secrets(self) -> "Settings":
        """Pull any blank secret fields live from Key Vault, if enabled."""
        if not self.use_key_vault:
            return self

        from azure.keyvault.secrets import SecretClient

        if self.local_dev:
            # On this dev machine, DefaultAzureCredential's chain aborts on a
            # broken Arc/ManagedIdentity check before ever reaching Azure CLI
            # auth, so we go straight to AzureCliCredential (az login is
            # already authenticated here).
            from azure.identity import AzureCliCredential
            credential = AzureCliCredential()
        else:
            # Deployed containers: use their assigned managed identity.
            from azure.identity import DefaultAzureCredential
            credential = DefaultAzureCredential()

        vault_url = f"https://{self.key_vault_name}.vault.azure.net/"
        client = SecretClient(vault_url=vault_url, credential=credential)

        if not self.foundry_api_key:
            self.foundry_api_key = client.get_secret("foundry-api-key").value
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings().resolve_secrets()
