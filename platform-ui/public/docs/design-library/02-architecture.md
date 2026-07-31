# System Architecture

**Last Updated:** December 19, 2025
**Document Owner:** Application Architecture Team

---

## Architecture Overview

The WestPlant Operations Application follows a modern, cloud-native architecture with clear separation of concerns and configuration-driven design principles.

```
┌─────────────────────────────────────────────────────────────┐
│                     USER INTERFACE LAYER                     │
│         React Frontend (Vite) - WestPlant Operations          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                         │
│  FastAPI Backend - REST APIs, Business Logic, Orchestration │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                  ┌──────────────────────────┐
                  │    AI AGENT FRAMEWORK    │
                  │  8 Specialized Agents    │
                  └──────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                        DATA LAYER                             │
│         Eventhouse (Kusto) | Logs (JSONL)                    │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                          │
│  Azure AI Foundry (Claude) | Azure AD | External APIs        │
└──────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

### 1. Frontend Layer

#### Technology Stack
- **React 18:** Component-based UI framework
- **Vite:** Fast build tool and dev server
- **React Router v6:** Client-side routing
- **React Context:** Global state management
- **Lucide React:** Icon library
- **CSS Modules:** Scoped styling

#### Key Components

**App.jsx**
- Root component with routing
- Context providers wrapper
- Layout structure (Sidebar + TopBar + Content)

**Sidebar.jsx**
- Configuration-driven navigation
- Dynamic section rendering
- Active route highlighting
- Collapsible sections

**Context Providers**
- `CustomAgentsProvider`: Agent state management

**Page Components** (30+ pages)
- Dashboard pages (overview, production, quality)
- AI Studio suite (foundations, analysis, agent builder)
- Configuration management
- Data tools (explorer, quality, health)
- Agent interfaces (Tier 1/2/3)

#### State Management Pattern

```javascript
// Agent Context
CustomAgentsContext
  ├── agents: Agent[]
  ├── activeAgent: Agent | null
  ├── setActiveAgent: (agent) => void
  └── agentHistory: Message[]
```

---

### 2. Backend Layer

#### Technology Stack
- **FastAPI:** Modern Python web framework
- **Pydantic:** Data validation and serialization
- **Azure SDK:** Azure service integration
- **Python 3.10+:** Core language

#### Core Modules

**main.py**
- FastAPI application initialization
- CORS middleware configuration
- Route registration
- Kusto client setup
- Tool definitions for agents
- Chat and health endpoints

**Routes**
- `file_routes.py`: File operation endpoints

**Models**
- `product_config.py`: Pydantic models for configuration
- Request/response models
- Validation schemas

#### API Architecture

```
/api
├── /data
│   ├── GET  /                     # Production schedule data
│   ├── GET  /runrates             # Runrate data
│   ├── GET  /downtime             # Downtime events
│   ├── GET  /ot-data              # OT process events
│   └── GET  /coke-process-events  # Process events
├── /chat
│   ├── POST /                     # Send chat message
│   ├── GET  /threads              # List chat threads
│   └── POST /save                 # Save chat thread
└── /health
    ├── POST /log                  # Log health metrics
    └── GET  /history              # Get health history
```

---

### 3. AI Agent Framework

#### Agent Architecture

Each agent follows a consistent pattern:

```python
class Agent:
    def __init__(self, config: AgentConfig):
        self.config = config
        self.claude_client = ClaudeClient()
        self.tools = self._load_tools()
    
    def execute(self, message: str, context: dict) -> Response:
        # 1. Prepare system prompt
        # 2. Call Claude with tools
        # 3. Execute tool calls
        # 4. Return response with audit trail
        pass
    
    def _load_tools(self) -> List[Tool]:
        # Load tools based on configuration
        pass
```

#### Agent Catalog

| Agent | Purpose | Key Tools |
|-------|---------|-----------|
| **Data Agent** | Data exploration and queries | execute_kql_query, get_table_schema |
| **Performance Analyst** | KPI analysis and metrics | calculate_plan_adherence, get_oee_metrics |
| **Data Quality** | Data validation and quality | check_data_freshness, validate_metrics |
| **Line Operations** | Production line analysis | get_line_performance, compare_lines |
| **Downtime RCA** | Root cause analysis | analyze_downtime_patterns, identify_root_causes |
| **Bottleneck Constraint** | Throughput analysis | identify_bottlenecks, analyze_throughput |
| **Operations Recommendation** | Orchestrator with recommendations | call_other_agents, generate_recommendations |
| **Executive Briefing** | High-level summaries | call_other_agents, create_summary |

#### Tool Execution Flow

```
User Message
    ↓
Agent receives message
    ↓
Claude API call with tools
    ↓
Claude requests tool use
    ↓
Backend executes tool
    ↓
Tool result returned to Claude
    ↓
Claude generates response
    ↓
Response + Audit Trail to user
```

---

### 4. Data Layer

#### Data Sources

**Microsoft Fabric Eventhouse (Primary)**
- **Technology:** Kusto (KQL)
- **Connection:** Azure AD Service Principal
- **Tables:**
  - `ProductionScheduleWestPlant`: Production schedules
  - `Amp MaxProcessEvents`: Process event data
  - `Runrates`: Production rates
  - `Downtime`: Downtime events
  - `UnconstrainedRunrates`: Theoretical capacity
  - `Processevent_silver`: OT data

**Logging Storage**
- **Chat Logs:** `chat_logs/` directory (JSONL format)
- **Health Logs:** `health_logs/` directory (JSONL format)
- **Retention:** 90 days

#### Data Access Patterns

**Read Pattern**
```python
# 1. Validate user permissions
# 2. Execute KQL query
# 3. Transform results
# 4. Return data with metadata
```

---

## Security Architecture

### Multi-Layer Security Model

#### Layer 1: Agent-Level Control
- Tool-level restrictions
- Token and rate limits
- Custom prompts for behavior control

#### Layer 2: Data-Level Security
- Table-level access control
- Query validation
- Read-only data access

#### Layer 3: API-Level Security
- Rate limiting
- Request size limits
- CORS configuration

### Authentication & Authorization Flow

```
User Request
    ↓
[Future] Azure AD Authentication
    ↓
Check User Permissions
    ↓
Validate Resource Access
    ↓
Execute Request
    ↓
Audit Log
    ↓
Return Response
```

---

## Scalability Considerations

### Horizontal Scaling
- **Frontend:** Static assets via CDN
- **Backend:** Multiple FastAPI instances behind load balancer
- **Agents:** Async execution, queue-based processing

### Vertical Scaling
- **Memory:** Efficient data caching
- **CPU:** Async operations for concurrent requests
- **Storage:** Efficient file formats (JSONL for logs)

### Performance Optimizations
1. **Query Optimization:** Limited result sets, time-based filtering
2. **Frontend Optimization:** Code splitting, lazy routes
3. **API Optimization:** Response compression, pagination
4. **Data Caching:** Cache frequently accessed data

---

## Deployment Architecture

### Development Environment
```
Local Machine
├── Backend (localhost:8000)
│   └── Python main.py
└── Frontend (localhost:5173)
    └── npm run dev
```

### Production Environment (Planned)
```
Azure Cloud
├── App Service (Backend)
│   ├── Multiple instances
│   ├── Auto-scaling
│   └── Health monitoring
├── Static Web App (Frontend)
│   ├── CDN distribution
│   └── Custom domain
├── Eventhouse (Data)
│   └── Existing connection
├── AI Foundry (Claude)
│   └── Existing connection
└── Application Insights
    └── Monitoring & logging
```

---

## Integration Points

### External Services

**Azure AI Foundry**
- **Purpose:** Claude API access
- **Authentication:** API key
- **Usage:** Agent responses
- **Monitoring:** Token tracking

**Microsoft Fabric Eventhouse**
- **Purpose:** Production data storage
- **Authentication:** Service Principal
- **Usage:** Data queries via KQL
- **Monitoring:** Query performance

**Azure AD** (Future)
- **Purpose:** User authentication
- **Authentication:** OAuth 2.0
- **Usage:** SSO, user management
- **Monitoring:** Auth events

### Internal Integrations

**Agents ↔ Data**
- Agents query data via tools
- Data access validated
- Results cached when appropriate

---

## Monitoring & Observability

### Health Monitoring
- **Service Health:** Eventhouse, API, Agents
- **Response Times:** API endpoints, agent execution
- **Error Rates:** Failed requests, agent errors
- **Resource Usage:** Memory, CPU, tokens

### Audit Trail
- **Agent Interactions:** All conversations and tool uses
- **Data Access:** Query logs, table access
- **System Events:** Errors, warnings, info

### Logging Strategy
- **Application Logs:** Structured JSON logs
- **Chat Logs:** JSONL format, one message per line
- **Health Logs:** JSONL format, daily files
- **Retention:** 90 days

---

## Technology Decisions & Rationale

### Why FastAPI?
- Modern, fast Python framework
- Automatic API documentation
- Type hints and validation
- Async support
- Easy integration with Azure services

### Why React?
- Component-based architecture
- Large ecosystem
- Excellent developer experience
- Strong community support
- Easy to find talent


### Why Eventhouse?
- Already in use by customer
- Powerful KQL query language
- Scalable for large datasets
- Azure integration
- Real-time capabilities

### Why Claude (Azure AI Foundry)?
- Superior reasoning capabilities
- Tool use support
- Long context windows
- Azure integration
- Enterprise support

---

## Future Architecture Enhancements

### Phase 1: Production Readiness
- Redis for caching
- Message queue for async processing
- Load balancer setup
- SSL/TLS certificates

### Phase 2: Enterprise Features
- Advanced RBAC
- SSO integration
- Audit log database
- Advanced monitoring

### Phase 3: Scale & Performance
- Microservices architecture
- Event-driven design
- Distributed caching
- CDN for static assets

---

## Architecture Principles

1. **Separation of Concerns:** Clear boundaries between layers
2. **Single Responsibility:** Each component has one clear purpose
3. **Open/Closed Principle:** Open for extension, closed for modification
4. **Dependency Inversion:** Depend on abstractions, not concretions
5. **Fail Fast:** Validate early, fail with clear errors
6. **Observability First:** Log, monitor, and trace everything
7. **Security by Design:** Security at every layer
8. **Performance Matters:** Optimize for common cases
9. **Developer Experience:** Make it easy to understand and extend
