# Deployment & Operations Guide

**Last Updated:** December 17, 2025  
**Target Audience:** DevOps, Platform Engineers, System Administrators

---

## Deployment Overview

This guide covers deploying the WestPlant Operations Application from development to production environments.

---

## Architecture Deployment Model

```
Production Environment
├── Frontend (Azure Static Web Apps)
│   ├── React SPA
│   ├── CDN Distribution
│   └── Custom Domain
├── Backend (Azure App Service)
│   ├── FastAPI Application
│   ├── Auto-scaling
│   └── Health Monitoring
├── Configuration (Azure Blob Storage)
│   ├── Product Configs
│   ├── Backups
│   └── Version History
├── Data (Microsoft Fabric Eventhouse)
│   └── Production Data
├── AI (Azure AI Foundry)
│   └── Claude API
└── Monitoring (Application Insights)
    ├── Logs
    ├── Metrics
    └── Alerts
```

---

## Prerequisites

### Development Environment
- Node.js 18+ and npm
- Python 3.10+
- Git
- VS Code (recommended)

### Azure Resources
- Azure subscription
- Resource group
- Azure AD tenant
- Service Principal with appropriate permissions

### Required Services
- Microsoft Fabric Eventhouse (existing)
- Azure AI Foundry with Claude access
- Azure App Service (for backend)
- Azure Static Web Apps (for frontend)
- Azure Blob Storage (for configs)
- Application Insights (for monitoring)

---

## Environment Configuration

### Environment Variables

**Backend (.env)**
```bash
# Azure AD Authentication
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret

# Eventhouse Configuration
EVENTHOUSE_URL=https://your-eventhouse.kusto.fabric.microsoft.com
EVENTHOUSE_DATABASE=ProductionDB
TABLE_NAME=ProductionScheduleWestPlant

# Azure AI Foundry
ANTHROPIC_BASE_URL=https://your-foundry.services.ai.azure.com/anthropic
ANTHROPIC_API_KEY=your-api-key
CLAUDE_MODEL=claude-sonnet-4-5

# Application Settings
ENVIRONMENT=production
DEBUG_MODE=false
LOG_LEVEL=INFO

# CORS Settings
ALLOWED_ORIGINS=https://your-domain.com

# Configuration Storage
CONFIG_STORAGE_TYPE=blob  # or 'file'
AZURE_STORAGE_CONNECTION_STRING=your-connection-string
CONFIG_CONTAINER_NAME=product-configs
```

**Frontend (.env.production)**
```bash
VITE_API_BASE_URL=https://your-backend.azurewebsites.net
VITE_ENVIRONMENT=production
```

---

## Local Development Setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd agentic-platform
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your credentials
python main.py
```

### 3. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with your settings
npm run dev
```

### 4. Verify Setup
- Backend: http://localhost:8000
- Frontend: http://localhost:5173
- API Docs: http://localhost:8000/docs

---

## Production Deployment

### Step 1: Prepare Azure Resources

**Create Resource Group**
```bash
az group create \
  --name rg-agentic-platform-prod \
  --location eastus2
```

**Create App Service Plan**
```bash
az appservice plan create \
  --name plan-agentic-platform \
  --resource-group rg-agentic-platform-prod \
  --sku P1V2 \
  --is-linux
```

**Create App Service (Backend)**
```bash
az webapp create \
  --name app-agentic-platform-backend \
  --resource-group rg-agentic-platform-prod \
  --plan plan-agentic-platform \
  --runtime "PYTHON:3.10"
```

**Create Static Web App (Frontend)**
```bash
az staticwebapp create \
  --name swa-agentic-platform-frontend \
  --resource-group rg-agentic-platform-prod \
  --location eastus2
```

**Create Storage Account (Configs)**
```bash
az storage account create \
  --name stagentic<unique> \
  --resource-group rg-agentic-platform-prod \
  --location eastus2 \
  --sku Standard_LRS

az storage container create \
  --name product-configs \
  --account-name stagentic<unique>
```

**Create Application Insights**
```bash
az monitor app-insights component create \
  --app ai-agentic-platform \
  --location eastus2 \
  --resource-group rg-agentic-platform-prod
```

### Step 2: Configure Backend

**Set Environment Variables**
```bash
az webapp config appsettings set \
  --name app-agentic-platform-backend \
  --resource-group rg-agentic-platform-prod \
  --settings \
    AZURE_TENANT_ID="<value>" \
    AZURE_CLIENT_ID="<value>" \
    AZURE_CLIENT_SECRET="<value>" \
    EVENTHOUSE_URL="<value>" \
    EVENTHOUSE_DATABASE="<value>" \
    ANTHROPIC_BASE_URL="<value>" \
    ANTHROPIC_API_KEY="<value>" \
    ENVIRONMENT="production" \
    CONFIG_STORAGE_TYPE="blob" \
    AZURE_STORAGE_CONNECTION_STRING="<value>"
```

**Deploy Backend**
```bash
cd backend
zip -r deploy.zip .
az webapp deployment source config-zip \
  --name app-agentic-platform-backend \
  --resource-group rg-agentic-platform-prod \
  --src deploy.zip
```

### Step 3: Configure Frontend

**Build Frontend**
```bash
cd frontend
npm run build
```

**Deploy Frontend**
```bash
# Using Azure Static Web Apps CLI
npm install -g @azure/static-web-apps-cli
swa deploy ./dist \
  --app-name swa-agentic-platform-frontend \
  --resource-group rg-agentic-platform-prod
```

### Step 4: Configure Custom Domain (Optional)

**Backend**
```bash
az webapp config hostname add \
  --webapp-name app-agentic-platform-backend \
  --resource-group rg-agentic-platform-prod \
  --hostname api.yourdomain.com
```

**Frontend**
```bash
az staticwebapp hostname set \
  --name swa-agentic-platform-frontend \
  --resource-group rg-agentic-platform-prod \
  --hostname app.yourdomain.com
```

### Step 5: Configure SSL Certificates

Azure App Service and Static Web Apps provide free SSL certificates for custom domains.

```bash
# Enable HTTPS only
az webapp update \
  --name app-agentic-platform-backend \
  --resource-group rg-agentic-platform-prod \
  --https-only true
```

---

## Configuration Management

### File-Based (Development)
```
configs/
└── products/
    ├── .active_product
    ├── platform-full-access.json
    └── [other-products].json
```

### Blob Storage (Production)
```
Container: product-configs
├── .active_product
├── platform-full-access.json
├── [other-products].json
└── backups/
    └── [timestamped-backups].json
```

### Migration to Blob Storage

**Update config_engine.py**
```python
from azure.storage.blob import BlobServiceClient

class ConfigurationEngine:
    def __init__(self, storage_type='file'):
        if storage_type == 'blob':
            self.blob_client = BlobServiceClient.from_connection_string(
                os.getenv('AZURE_STORAGE_CONNECTION_STRING')
            )
            self.container = os.getenv('CONFIG_CONTAINER_NAME')
```

---

## Monitoring & Observability

### Application Insights Integration

**Backend (main.py)**
```python
from opencensus.ext.azure.log_exporter import AzureLogHandler
import logging

# Configure logging
logger = logging.getLogger(__name__)
logger.addHandler(AzureLogHandler(
    connection_string=os.getenv('APPLICATIONINSIGHTS_CONNECTION_STRING')
))
```

### Key Metrics to Monitor

**Application Metrics**
- Request rate (requests/minute)
- Response time (p50, p95, p99)
- Error rate (%)
- Availability (%)

**Agent Metrics**
- Agent execution time
- Token usage
- Tool execution time
- Agent error rate

**Data Metrics**
- Query execution time
- Data freshness
- Query success rate
- Connection health

**Business Metrics**
- Active users
- Products deployed
- Configuration changes
- Feature usage

### Alerts Configuration

**Critical Alerts**
- Backend down (availability < 99%)
- High error rate (> 5%)
- Database connection failure
- AI service unavailable

**Warning Alerts**
- High response time (> 2s)
- Elevated error rate (> 1%)
- High token usage
- Low data freshness

---

## Backup & Disaster Recovery

### Configuration Backups

**Automated Backup Script**
```bash
#!/bin/bash
# backup-configs.sh

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups/$TIMESTAMP"

mkdir -p $BACKUP_DIR
cp configs/products/*.json $BACKUP_DIR/

# Upload to Azure Blob Storage
az storage blob upload-batch \
  --destination product-configs/backups/$TIMESTAMP \
  --source $BACKUP_DIR \
  --account-name stagentic<unique>
```

**Schedule with cron**
```bash
# Daily backup at 2 AM
0 2 * * * /path/to/backup-configs.sh
```

### Disaster Recovery Plan

**RTO (Recovery Time Objective):** 1 hour  
**RPO (Recovery Point Objective):** 24 hours

**Recovery Steps:**
1. Restore configuration from backup
2. Redeploy backend application
3. Redeploy frontend application
4. Verify data connections
5. Test critical workflows
6. Monitor for issues

---

## Scaling Strategy

### Horizontal Scaling

**Backend Auto-scaling**
```bash
az monitor autoscale create \
  --resource-group rg-agentic-platform-prod \
  --resource app-agentic-platform-backend \
  --resource-type Microsoft.Web/sites \
  --name autoscale-backend \
  --min-count 2 \
  --max-count 10 \
  --count 2

az monitor autoscale rule create \
  --resource-group rg-agentic-platform-prod \
  --autoscale-name autoscale-backend \
  --condition "CpuPercentage > 70 avg 5m" \
  --scale out 1
```

### Vertical Scaling

**Upgrade App Service Plan**
```bash
az appservice plan update \
  --name plan-agentic-platform \
  --resource-group rg-agentic-platform-prod \
  --sku P2V2
```

---

## Security Hardening

### Network Security

**Enable Private Endpoints**
```bash
# Create VNet
az network vnet create \
  --name vnet-agentic-platform \
  --resource-group rg-agentic-platform-prod \
  --address-prefix 10.0.0.0/16

# Create subnet for private endpoints
az network vnet subnet create \
  --name subnet-private-endpoints \
  --vnet-name vnet-agentic-platform \
  --resource-group rg-agentic-platform-prod \
  --address-prefix 10.0.1.0/24
```

### Secrets Management

**Use Azure Key Vault**
```bash
# Create Key Vault
az keyvault create \
  --name kv-agentic-platform \
  --resource-group rg-agentic-platform-prod \
  --location eastus2

# Store secrets
az keyvault secret set \
  --vault-name kv-agentic-platform \
  --name "AZURE-CLIENT-SECRET" \
  --value "<secret-value>"

# Grant App Service access
az webapp identity assign \
  --name app-agentic-platform-backend \
  --resource-group rg-agentic-platform-prod

az keyvault set-policy \
  --name kv-agentic-platform \
  --object-id <app-service-identity> \
  --secret-permissions get list
```

### Update Backend to Use Key Vault
```python
from azure.identity import DefaultAzureCredential
from azure.keyvault.secrets import SecretClient

credential = DefaultAzureCredential()
client = SecretClient(
    vault_url="https://kv-agentic-platform.vault.azure.net/",
    credential=credential
)

AZURE_CLIENT_SECRET = client.get_secret("AZURE-CLIENT-SECRET").value
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

**.github/workflows/deploy.yml**
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.10'
      
      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
      
      - name: Run tests
        run: |
          cd backend
          pytest
      
      - name: Deploy to Azure
        uses: azure/webapps-deploy@v2
        with:
          app-name: app-agentic-platform-backend
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
          package: backend

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install and build
        run: |
          cd frontend
          npm ci
          npm run build
      
      - name: Deploy to Azure Static Web Apps
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: "upload"
          app_location: "frontend"
          output_location: "dist"
```

---

## Maintenance Procedures

### Regular Maintenance Tasks

**Daily**
- Monitor health dashboards
- Review error logs
- Check alert notifications

**Weekly**
- Review performance metrics
- Analyze token usage
- Check backup integrity
- Update dependencies (if needed)

**Monthly**
- Security updates
- Performance optimization
- Capacity planning review
- Cost analysis

**Quarterly**
- Disaster recovery drill
- Security audit
- Architecture review
- User feedback analysis

### Update Procedures

**Backend Updates**
1. Test in development
2. Deploy to staging
3. Run integration tests
4. Deploy to production
5. Monitor for issues
6. Rollback if needed

**Frontend Updates**
1. Build and test locally
2. Deploy to staging
3. User acceptance testing
4. Deploy to production
5. Verify functionality

**Configuration Updates**
1. Backup current config
2. Make changes in UI
3. Test in preview mode
4. Activate new config
5. Monitor for issues

---

## Troubleshooting

### Common Issues

**Backend Not Starting**
- Check environment variables
- Verify Azure credentials
- Check Eventhouse connectivity
- Review application logs

**Frontend Not Loading**
- Check API endpoint configuration
- Verify CORS settings
- Check browser console
- Review network requests

**Agent Errors**
- Verify AI Foundry connection
- Check token limits
- Review agent configuration
- Check tool availability

**Data Access Issues**
- Verify Eventhouse connection
- Check table permissions
- Review KQL queries
- Check data freshness

### Log Analysis

**View Backend Logs**
```bash
az webapp log tail \
  --name app-agentic-platform-backend \
  --resource-group rg-agentic-platform-prod
```

**Query Application Insights**
```kusto
traces
| where timestamp > ago(1h)
| where severityLevel >= 3
| order by timestamp desc
```

---

## Cost Optimization

### Cost Breakdown

**Estimated Monthly Costs (Production)**
- App Service (P1V2): $150
- Static Web App: $10
- Storage Account: $5
- Application Insights: $50
- AI Foundry (Claude): Variable ($100-500)
- Eventhouse: Existing

**Total: ~$315-715/month**

### Optimization Strategies

1. **Right-size App Service**
   - Start with lower tier
   - Scale up based on usage

2. **Optimize Token Usage**
   - Set appropriate maxTokens
   - Cache frequent queries
   - Use lower temperature when possible

3. **Efficient Data Queries**
   - Limit result sets
   - Use time-based filtering
   - Cache query results

4. **Monitor and Adjust**
   - Review cost reports monthly
   - Identify optimization opportunities
   - Adjust resources as needed

---

## Compliance & Governance

### Data Residency
- Configure Azure regions appropriately
- Ensure data stays in required geography
- Document data flows

### Audit Requirements
- Enable audit logging
- Retain logs per policy
- Regular compliance reviews

### Access Control
- Implement RBAC
- Regular access reviews
- Principle of least privilege

---

## Support & Escalation

### Support Tiers

**Tier 1: Self-Service**
- Documentation
- Health dashboard
- Error messages

**Tier 2: Platform Team**
- Configuration issues
- Performance problems
- Feature requests

**Tier 3: Engineering**
- Critical bugs
- Architecture changes
- Security incidents

### Escalation Path

1. Check documentation
2. Review health dashboard
3. Contact platform team
4. Escalate to engineering
5. Engage vendor support (Azure, AI Foundry)

---

## Appendix

### Useful Commands

**Check Backend Health**
```bash
curl https://your-backend.azurewebsites.net/health
```

**View Configuration**
```bash
curl https://your-backend.azurewebsites.net/api/config/current
```

**Test Agent**
```bash
curl -X POST https://your-backend.azurewebsites.net/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is our OEE?"}'
```

### Resource Links

- [Azure App Service Docs](https://docs.microsoft.com/azure/app-service/)
- [Azure Static Web Apps Docs](https://docs.microsoft.com/azure/static-web-apps/)
- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [React Docs](https://react.dev/)
- [Microsoft Fabric Docs](https://docs.microsoft.com/fabric/)
