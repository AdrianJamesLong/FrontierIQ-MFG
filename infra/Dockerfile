# ── FrontierIQ-MFG — mfg_core backend ────────────────────────────────────────
# Build context must be FrontierIQ-MFG/ (includes both mfg_core/ and platform-ui/)

FROM python:3.11-slim

# Install ODBC Driver 18 for SQL Server
RUN apt-get update && apt-get install -y --no-install-recommends \
        curl gnupg apt-transport-https ca-certificates \
    && curl -sSL https://packages.microsoft.com/keys/microsoft.asc \
        | gpg --dearmor -o /usr/share/keyrings/microsoft-prod.gpg \
    && curl -sSL https://packages.microsoft.com/config/debian/12/prod.list \
        > /etc/apt/sources.list.d/mssql-release.list \
    && apt-get update \
    && ACCEPT_EULA=Y apt-get install -y --no-install-recommends \
        msodbcsql18 unixodbc-dev \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY mfg_core/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend app code (includes agent/ as a subfolder now)
COPY mfg_core/ /app/

# Copy shared/ alongside main.py (flattened, not a repo-root sibling, in this
# image) — main.py's own sys.path insertion covers both layouts.
COPY shared/ /app/shared/

# Copy pre-built React frontend — served by FastAPI as SPA
COPY platform-ui/dist/ /app/frontend_dist/

EXPOSE 8000

# Pull AMPLIFYIQ_FOUNDRY_API_KEY from the shared kv-amplifyiq Key Vault at
# startup via the container's managed identity — same pattern Energy/GxP use.
# Only takes effect once this service's Container App is granted a Key Vault
# access policy for the "foundry-api-key" secret (backlog #9, not done yet).
ENV AMPLIFYIQ_USE_KEY_VAULT=true

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
