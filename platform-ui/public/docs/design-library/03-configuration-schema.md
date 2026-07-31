# Application Settings Reference

**Last Updated:** December 19, 2025  
**Document Version:** 2.0.0

---

## Application Settings Overview

This document provides reference information for the WestPlant Operations Application settings. This is a **focused application** for WestPlant bottling operations - it is not a multi-product platform with dynamic configuration management.

---

## Application Identity

- **Name:** Amplify Beverages WestPlant Bottling Operations
- **Purpose:** Production operations monitoring and AI-powered analytics
- **Facility:** WestPlant Bottling Plant
- **Production Lines:** 4 lines (APB-L01, APB-L02, APB-L03, APB-L04)

---

## Branding

The application uses Amplify Beverages branding:

- **Name:** Amplify Beverages WestPlant Bottling Operations
- **Primary Color:** #F40009 (Coca-Cola Red)
- **Secondary Color:** #8B0005 (Dark Red)
- **Logo:** Amplify Beverages logo
- **Favicon:** Amplify Beverages favicon

---

## AI Agents

The application includes 8 specialized AI agents for WestPlant bottling operations:

| Agent | Purpose | Key Capabilities |
|-------|---------|------------------|
| **Data Agent** | Data exploration | Execute KQL queries, explore tables |
| **Performance Analyst** | KPI analysis | Plan adherence, OEE metrics |
| **Data Quality Agent** | Data validation | Data freshness, metric validation |
| **Line Operations Agent** | Line analysis | Line performance, comparisons |
| **Downtime RCA Agent** | Root cause analysis | Downtime pattern analysis |
| **Bottleneck Constraint Agent** | Throughput analysis | Identify bottlenecks |
| **Operations Recommendation Agent** | Recommendations | Orchestrate agents, generate recommendations |
| **Executive Briefing Agent** | Executive summaries | High-level summaries |

All agents are enabled and configured for WestPlant operations. See [`04-agent-framework.md`](04-agent-framework.md) for detailed agent documentation.

---

## User Interface

The application provides a comprehensive UI for WestPlant operations:

### Navigation Sections
- **Dashboards:** Overview, Production Ops, Production Schedule, Plant Performance
- **AI Agents:** Data Agent, Tier 1/2/3 Analytical Agents
- **AI Studio:** Foundations, Analysis, Agent Builder, Trust & Control, Operations
- **Data Tools:** Data Explorer, Data Quality, App Health
- **System:** Settings, Help Centre, Design Library

### Features
- Chat history and conversation management
- Audit trail for agent interactions
- Health monitoring dashboard
- Data exploration tools
- Agent interfaces for all 8 specialized agents

---

## Data Connections

The application connects to Microsoft Fabric Eventhouse for WestPlant operations data.

### Eventhouse Tables

| Table Name | Description | Data Type |
|------------|-------------|-----------|
| `ProductionScheduleWestPlant` | Production schedules | IT/Planning |
| `Amp MaxProcessEvents` | Process events | OT/Real-time |
| `Runrates` | Production rates | IT/Metrics |
| `Downtime` | Downtime events | OT/Events |
| `UnconstrainedRunrates` | Theoretical capacity | IT/Planning |
| `Processevent_silver` | Silver layer OT data | OT/Processed |

### Connection Details
- **Technology:** Kusto (KQL)
- **Authentication:** Azure AD Service Principal
- **Access Mode:** Read-only
- **Database:** WestPlant Production Database

---

## API Endpoints

The application provides REST API endpoints for data access and agent interactions:

| Endpoint | Description | Methods |
|----------|-------------|---------|
| `/api/data` | Production data queries | GET |
| `/api/chat` | Agent chat interactions | POST |
| `/api/health/*` | Health monitoring | GET, POST |
| `/health` | Health check | GET |

---

## Security & Permissions

User authentication and authorization (Azure AD integration planned):

### User Roles
- **Operations Manager:** Full access to all features
- **Line Supervisor:** Access to line-specific data and agents
- **Analyst:** Read-only access to data and reports
- **Viewer:** Limited read-only access

### Capabilities
- Data access based on role
- Agent interaction permissions
- Audit trail visibility
- Export capabilities

---

## Resource Limits

Application resource limits for WestPlant operations:

- **Concurrent Chat Sessions:** 10
- **Chat History Retention:** 90 days
- **Max Agent Calls Per Request:** 10
- **API Rate Limit:** 120 requests/minute

---

## Environment Variables

Key environment variables for application configuration:

### Azure AI Foundry
- `AZURE_OPENAI_API_KEY`: API key for Claude access
- `AZURE_OPENAI_ENDPOINT`: Azure AI Foundry endpoint
- `AZURE_OPENAI_DEPLOYMENT_NAME`: Claude deployment name

### Eventhouse Connection
- `EVENTHOUSE_CLUSTER_URI`: Kusto cluster URI
- `EVENTHOUSE_DATABASE`: Database name
- `AZURE_CLIENT_ID`: Service principal client ID
- `AZURE_CLIENT_SECRET`: Service principal secret
- `AZURE_TENANT_ID`: Azure tenant ID

### Application Settings
- `PORT`: Backend server port (default: 8000)
- `CORS_ORIGINS`: Allowed CORS origins
- `LOG_LEVEL`: Logging level (INFO, DEBUG, ERROR)

---

## Deployment Configuration

### Development
- Local development server
- Hot reload enabled
- Debug logging
- No authentication required

### Production (Planned)
- Azure App Service for backend
- Azure Static Web App for frontend
- Azure AD authentication
- SSL/TLS encryption
- Application Insights monitoring

---

## Related Documentation

- [System Architecture](02-architecture.md) - Technical architecture details
- [AI Agent Framework](04-agent-framework.md) - Agent documentation
- [Deployment Guide](05-deployment-guide.md) - Deployment procedures
- [Application Health](07-application-health.md) - Health monitoring

---

**Last Review Date:** December 19, 2025  
**Next Review Date:** March 19, 2026
