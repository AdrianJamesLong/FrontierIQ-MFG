# Application Overview

**Last Updated:** December 19, 2025
**Version:** 1.2.0
**Status:** Active - Amplify Beverages WestPlant Bottling Operations

---

## What is the WestPlant Operations Application?

The WestPlant Operations Application is an **AI-powered manufacturing operations intelligence system** specifically built for **Amplify Beverages's WestPlant Bottling Operations**. It provides dashboard-based insights and AI-powered operational intelligence for the WestPlant production facility.

### Core Value Proposition

**For Operations Teams:**
- Real-time production monitoring and insights
- AI-powered analysis of production performance
- Interactive dashboards for 4 production lines
- Actionable recommendations for improvement

**For Executives:**
- High-level KPI summaries and trends
- Executive briefings on facility performance
- Strategic insights for decision-making
- Performance variance analysis

**For Engineering Teams:**
- Configuration-driven architecture
- Clear separation of concerns
- Easy to extend and scale
- Maintainable codebase

**For Data Analysts:**
- Direct access to production data
- Custom analysis capabilities
- Data quality monitoring
- Flexible querying tools

---

## Key Features

### 1. AI-Powered Intelligence
- 8 specialized AI agents for WestPlant bottling operations
- Tool-based agent architecture
- Real-time analysis and recommendations
- Audit trail for all AI interactions
- Token usage tracking

### 2. Configuration-Driven Architecture
Everything is configurable without code changes:
- UI elements (pages, navigation, features)
- AI agents and their tools
- Data access and connections
- Branding and visual identity
- Permissions and security
- Resource limits and quotas

### 3. Granular Control
Configuration at multiple levels:
- Agent level (individual agent configs)
- Tool level (specific tool access)
- Page level (UI visibility)
- Data level (table access)
- API level (endpoint control)

### 4. Real-Time Data Integration
- Direct connection to Microsoft Fabric Eventhouse
- KQL-based data queries
- 4 production lines monitored (APB-L01, APB-L02, APB-L03, APB-L04)
- Multiple data sources integrated

### 5. Enterprise-Ready
- Multi-layer security model
- Health monitoring and observability
- Audit trails and compliance
- Rate limiting and resource control
- Scalable architecture

---

## Use Cases

### Amplify Beverages WestPlant Bottling Operations

**Primary Use Case:** Dashboard-based operational insights for the WestPlant bottling facility

### Manufacturing Operations
- Production monitoring and optimization across 4 production lines (APB-L01, APB-L02, APB-L03, APB-L04)
- Quality control and analysis for beverage production
- Downtime root cause analysis for bottling equipment
- Performance analytics and OEE tracking
- Line operations management and comparison

### Executive Dashboards
- High-level KPI summaries for WestPlant facility leadership
- Executive briefings on production performance
- Performance trends and variance analysis
- Strategic insights for bottling operations

### Data Science & Analytics
- Data exploration and quality checks on production data
- Custom analysis workflows for WestPlant operations
- Bottleneck and constraint analysis
- Throughput optimization

### Operations Teams
- Real-time production monitoring for shift supervisors
- Issue identification and resolution for line operators
- Shift handoff reports and performance summaries
- Operational recommendations for continuous improvement

---

## Technical Architecture

### Backend
- **Framework:** FastAPI (Python)
- **AI:** Azure AI Foundry (Claude Sonnet 4.5)
- **Data:** Microsoft Fabric Eventhouse (Kusto/KQL)
- **Auth:** Azure AD Service Principal
- **Config:** File-based JSON storage

### Frontend
- **Framework:** React 18
- **Build:** Vite
- **Routing:** React Router v6
- **State:** React Context API
- **Styling:** CSS Modules
- **Icons:** Lucide React

### Infrastructure
- **Development:** Local servers (Backend: 8000, Frontend: 5173)
- **Production:** Azure-ready architecture
- **Storage:** File system for configs, Eventhouse for data
- **Monitoring:** Built-in health tracking and logging

---

## Success Metrics

### Platform Health
- System uptime and availability
- API response times
- Agent execution performance
- Error rates and resolution

### Product Adoption
- Number of active products
- User engagement per product
- Feature utilization rates
- Configuration changes frequency

### AI Performance
- Agent response accuracy
- Tool usage patterns
- Token efficiency
- User satisfaction with AI responses

### Business Impact
- Time to deploy new products
- Reduction in custom development
- User productivity improvements
- Cost per product deployment

---

## Roadmap

### Current State (v1.2)
✅ Configuration engine and management
✅ 8 production AI agents for WestPlant operations
✅ Dynamic UI adaptation
✅ Health monitoring and audit trails
✅ WestPlant bottling facility data integration
✅ Real-time dashboards and analytics

### Next Phase (v1.3)
🔄 User authentication and authorization
🔄 Enhanced agent capabilities
🔄 Advanced analytics features
🔄 Mobile-responsive improvements

### Future Vision (v2.0+)
📋 Predictive maintenance capabilities
📋 Advanced scheduling optimization
📋 Extended data source integration
📋 Custom report builder
📋 Enhanced visualization options

---

## Getting Started

### For Operations Users
1. Explore the dashboard pages
2. Interact with AI agents
3. Review production line performance
4. Generate reports and insights
5. Monitor real-time metrics

### For Administrators
1. Review configuration schema
2. Understand agent framework
3. Configure application settings
4. Manage user access
5. Monitor system health

### For Developers
1. Review configuration schema
2. Understand agent framework
3. Explore API endpoints
4. Study component architecture
5. Follow coding standards

---

## Support & Resources

- **Design Library:** Comprehensive documentation in-app
- **API Documentation:** Auto-generated FastAPI docs at `/docs`
- **Code Repository:** Version-controlled configurations
- **Health Dashboard:** Real-time system monitoring
- **Audit Trails:** Complete interaction history
