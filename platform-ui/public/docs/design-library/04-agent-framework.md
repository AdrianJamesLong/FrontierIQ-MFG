# AI Agent Framework

**Last Updated:** December 19, 2025
**Framework Version:** 1.1.0
**Deployment:** Amplify Beverages WestPlant Bottling Operations

---

## Agent Framework Overview

The WestPlant Operations Application includes a sophisticated AI agent framework powered by Claude (via Azure AI Foundry). The framework provides **8 specialized production agents** for WestPlant bottling operations, each with specific tools and capabilities tailored to beverage manufacturing.

### Agent Catalog Quick Reference

| # | Agent Name | Tier | Status | Purpose |
|---|------------|------|--------|---------|
| 1 | DataHub Agent | Tier 0 | 🟢 Production | Data exploration and KQL query execution |
| 2 | Performance Analyst | Tier 1 | 🟢 Production | KPI analysis and performance metrics |
| 3 | Data Quality Guardian | Tier 1 | 🟢 Production | Data validation and quality monitoring |
| 4 | Line Operations AI Supervisor | Tier 1 | 🟢 Production | Production line analysis and comparison |
| 5 | Downtime RCA Agent | Tier 2 | 🟢 Production | Root cause analysis for downtime |
| 6 | Bottleneck / Constraint Agent | Tier 2 | 🟢 Production | Throughput analysis and bottleneck identification |
| 7 | Operations Recommendation | Tier 3 | 🟢 Production | Orchestrator for actionable recommendations |
| 8 | Executive Briefing | Tier 3 | 🟢 Production | High-level summaries and executive insights |

---

## Agent Architecture

### Core Components

```
Agent Instance
├── Configuration (from product config)
├── Claude Client (Azure AI Foundry)
├── Tool Registry (available tools)
├── System Prompt (behavior definition)
└── Audit Logger (interaction tracking)
```

### Agent Lifecycle

```
1. Initialization
   ├── Load product configuration
   ├── Initialize Claude client
   ├── Register available tools
   └── Set system prompt

2. Execution
   ├── Receive user message
   ├── Call Claude API with tools
   ├── Process tool use requests
   ├── Execute tools
   ├── Return results to Claude
   └── Generate final response

3. Logging
   ├── Log user message
   ├── Log tool executions
   ├── Log Claude responses
   ├── Track token usage
   └── Create audit trail
```

---

## Agent Catalog

### 1. Data Agent

**Purpose:** Data exploration and KQL query execution for WestPlant production data

**Agent ID:** `data_agent`

**Capabilities:**
- Execute KQL queries against WestPlant Eventhouse database
- Retrieve table schemas from ProductionDB
- Explore WestPlant production data structures
- Validate data access and freshness

**Available Tools:**
- `execute_kql_query`: Run KQL queries
- `get_table_schema`: Get table structure

**WestPlant Data Sources:**
- **ProductionScheduleWestPlant**: Production schedule and order data
- **Amp MaxProcessEvents**: Process events from production lines
- **Runrates**: Actual production runrates by line
- **Downtime**: Downtime events and reasons
- **UnconstrainedRunrates**: Theoretical maximum runrates
- **Processevent_silver**: Cleaned and enriched process events

**Typical Use Cases:**
- "Show me the last 10 production orders from WestPlant"
- "What columns are in the ProductionScheduleWestPlant table?"
- "Query downtime events from last week for APB-L01"
- "Show me today's runrates for all lines"

**Configuration Example:**
```json
{
  "data_agent": {
    "enabled": true,
    "tools": ["execute_kql_query", "get_table_schema"],
    "disabledTools": [],
    "systemPromptOverride": null,
    "maxTokens": 4096,
    "temperature": 0.7
  }
}
```

---

### 2. Performance Analyst Agent

**Purpose:** KPI analysis and performance metrics calculation

**Agent ID:** `performance_analyst`

**Capabilities:**
- Calculate plan adherence metrics
- Compute OEE (Overall Equipment Effectiveness)
- Analyze variance and trends
- Generate performance reports

**Available Tools:**
- `calculate_plan_adherence`: Schedule adherence metrics
- `get_oee_metrics`: OEE calculation
- `analyze_variance`: Variance analysis

**Typical Use Cases:**
- "What's our current OEE?"
- "Show me plan adherence for this week"
- "Analyze performance variance by line"

**Key Metrics:**
- **Plan Adherence:** On-time vs delayed orders
- **OEE:** Availability × Performance × Quality
- **Variance:** Planned vs actual quantities

---

### 3. Data Quality Agent

**Purpose:** Data validation and quality monitoring

**Agent ID:** `data_quality`

**Capabilities:**
- Check data freshness
- Validate metric completeness
- Detect anomalies
- Assess data quality scores

**Available Tools:**
- `check_data_freshness`: Last update timestamps
- `validate_metrics`: Metric completeness
- `detect_anomalies`: Outlier detection
- `validate_data`: Data integrity checks
- `check_completeness`: Missing data analysis

**Typical Use Cases:**
- "Is our production data up to date?"
- "Check for missing values in today's data"
- "Detect any anomalies in runrate data"

**Quality Dimensions:**
- **Freshness:** Data recency
- **Completeness:** Missing values
- **Accuracy:** Data validity
- **Consistency:** Cross-table alignment

---

### 4. Line Operations Agent

**Purpose:** Production line analysis and comparison for WestPlant bottling facility

**Agent ID:** `line_operations`

**Capabilities:**
- Analyze individual line performance across WestPlant's 4 production lines
- Compare multiple lines for shift and daily performance
- Identify line-specific issues and bottlenecks
- Track line efficiency and OEE by line

**Available Tools:**
- `get_line_performance`: Line metrics
- `compare_lines`: Multi-line comparison
- `get_downtime_events`: Line downtime

**Typical Use Cases:**
- "How is Line 3 performing today?"
- "Compare all lines for this shift"
- "Which line has the most downtime?"
- "Show me APB-L01 performance vs target"

**WestPlant Line Mapping:**
- **APB-L01** → LINE 01 (PET Bottle Line 1)
- **APB-L02** → LINE 02 (PET Bottle Line 2)
- **APB-L03** → LINE 03 (Can Line)
- **APB-L04** → LINE 04 (Bag-in-Box Line)

---

### 5. Downtime RCA Agent

**Purpose:** Root cause analysis for downtime events

**Agent ID:** `downtime_rca`

**Capabilities:**
- Analyze downtime patterns
- Identify root causes
- Categorize downtime types
- Recommend preventive actions

**Available Tools:**
- `analyze_downtime_patterns`: Pattern analysis
- `identify_root_causes`: RCA methodology

**Typical Use Cases:**
- "What caused the downtime on Line 2?"
- "Analyze downtime patterns this month"
- "What are the top 3 downtime reasons?"

**Analysis Approach:**
1. Gather downtime events
2. Identify patterns and trends
3. Correlate with other data
4. Determine root causes
5. Suggest preventive measures

---

### 6. Bottleneck & Constraint Agent

**Purpose:** Throughput analysis and bottleneck identification

**Agent ID:** `bottleneck_constraint`

**Capabilities:**
- Identify production bottlenecks
- Analyze throughput constraints
- Compare actual vs theoretical capacity
- Recommend optimization strategies

**Available Tools:**
- `identify_bottlenecks`: Bottleneck detection
- `analyze_throughput`: Throughput analysis

**Typical Use Cases:**
- "Where are our production bottlenecks?"
- "What's limiting our throughput?"
- "Compare actual vs unconstrained runrates"

**Analysis Factors:**
- Equipment capacity
- Material availability
- Labor constraints
- Process limitations

---

### 7. Operations Recommendation Agent

**Purpose:** Orchestrator agent that generates actionable recommendations

**Agent ID:** `operations_recommendation`

**Capabilities:**
- Call other agents for data gathering
- Synthesize insights from multiple sources
- Generate prioritized recommendations
- Provide implementation guidance

**Available Tools:**
- `call_performance_analyst`: Get performance data
- `call_line_operations_agent`: Get line data
- `call_downtime_rca_agent`: Get downtime analysis
- `call_throughput_rca_agent`: Get throughput analysis
- `generate_recommendations`: Create action items

**Typical Use Cases:**
- "What should we focus on to improve OEE?"
- "Give me recommendations for Line 3"
- "How can we reduce downtime?"

**Recommendation Structure:**
1. **Issue Identification:** What's the problem?
2. **Root Cause:** Why is it happening?
3. **Impact:** What's the business impact?
4. **Recommendation:** What should be done?
5. **Priority:** High/Medium/Low
6. **Implementation:** How to execute

---

### 8. Executive Briefing Agent

**Purpose:** High-level summaries and executive insights

**Agent ID:** `executive_briefing`

**Capabilities:**
- Generate executive summaries
- Highlight key metrics and trends
- Identify critical issues
- Provide strategic insights

**Available Tools:**
- `call_performance_analyst`: Performance overview
- `call_data_quality_agent`: Data health
- `call_line_operations_agent`: Operations status
- `call_downtime_rca_agent`: Issue analysis
- `create_summary`: Summary generation
- `generate_insights`: Strategic insights

**Typical Use Cases:**
- "Give me an executive summary for today"
- "What are the top 3 issues this week?"
- "Prepare a briefing for the leadership team"

**Briefing Structure:**
1. **Executive Summary:** 2-3 sentence overview
2. **Key Metrics:** Critical KPIs with trends
3. **Highlights:** Positive developments
4. **Concerns:** Issues requiring attention
5. **Recommendations:** Strategic actions
6. **Outlook:** Forward-looking insights


---

## Tool-Based Architecture

### Tool Definition

```python
{
    "name": "tool_name",
    "description": "What the tool does",
    "input_schema": {
        "type": "object",
        "properties": {
            "param1": {
                "type": "string",
                "description": "Parameter description"
            }
        },
        "required": ["param1"]
    }
}
```

### Tool Execution Flow

```
1. Claude decides to use a tool
2. Claude sends tool use request
3. Backend validates tool availability
4. Backend executes tool function
5. Backend returns result to Claude
6. Claude processes result
7. Claude generates response or uses another tool
```

### Tool Categories

**Data Access Tools:**
- Query execution
- Schema retrieval
- Data validation

**Calculation Tools:**
- Metric computation
- Statistical analysis
- Aggregation

**Agent Orchestration Tools:**
- Call other agents
- Combine insights
- Generate summaries

---

## Agent Configuration

### Configuration Levels

**1. Product Level**
```json
{
  "agents": {
    "enabled": ["data_agent", "performance_analyst"],
    "disabled": []
  }
}
```

**2. Agent Level**
```json
{
  "data_agent": {
    "enabled": true,
    "tools": ["execute_kql_query"],
    "maxTokens": 4096,
    "temperature": 0.7
  }
}
```

**3. Tool Level**
```json
{
  "tools": ["execute_kql_query", "get_table_schema"],
  "disabledTools": ["dangerous_tool"]
}
```

### Configuration Parameters

**maxTokens**
- Controls response length
- Range: 1000-8192
- Default: 4096
- Higher = longer responses

**temperature**
- Controls creativity/randomness
- Range: 0.0-1.0
- Default: 0.7
- Lower = more focused, Higher = more creative

**systemPromptOverride**
- Custom behavior instructions
- Overrides default prompt
- Use for specialized behavior
- Example: "Always respond in bullet points"

---

## Agent Communication Patterns

### Single Agent Pattern
```
User → Agent → Tools → Response
```

### Multi-Agent Pattern (Orchestration)
```
User → Orchestrator Agent
         ├→ Agent 1 → Tools → Result 1
         ├→ Agent 2 → Tools → Result 2
         └→ Agent 3 → Tools → Result 3
              ↓
         Synthesize Results
              ↓
         Final Response
```

### Sequential Pattern
```
User → Agent 1 → Result 1
         ↓
      Agent 2 (uses Result 1) → Result 2
         ↓
      Agent 3 (uses Result 2) → Final Response
```

---

## Audit Trail

Every agent interaction is logged with:

```json
{
  "timestamp": "2025-12-17T16:00:00Z",
  "agent": "performance_analyst",
  "user_message": "What's our OEE?",
  "tools_used": [
    {
      "tool": "calculate_oee_metrics",
      "input": {},
      "output": {"oee": 85.5},
      "execution_time_ms": 234
    }
  ],
  "response": "Current OEE is 85.5%...",
  "tokens_used": {
    "input": 150,
    "output": 200,
    "total": 350
  },
  "cost_usd": 0.0042
}
```

### Audit Trail Uses
- Debugging agent behavior
- Performance optimization
- Cost tracking
- Compliance and governance
- User behavior analysis

---

## Best Practices

### Agent Selection
- Use specific agents for specific tasks
- Start with single agents before orchestration
- Use orchestrator agents for complex queries

### Tool Configuration
- Enable only necessary tools
- Disable dangerous or expensive tools
- Test tool combinations

### Prompt Engineering
- Be specific in user messages
- Provide context when needed
- Use examples for complex requests

### Performance Optimization
- Set appropriate token limits
- Use lower temperature for factual queries
- Cache frequently used data

### Security
- Validate all tool inputs
- Restrict data access via configuration
- Monitor agent behavior
- Log all interactions

---

## Troubleshooting

### Agent Not Responding
1. Check agent is enabled in configuration
2. Verify tools are available
3. Check token limits
4. Review system logs

### Incorrect Results
1. Verify data quality
2. Check tool implementation
3. Review agent configuration
4. Adjust temperature setting

### Performance Issues
1. Reduce maxTokens
2. Limit tool availability
3. Optimize queries
4. Use caching

### Tool Errors
1. Validate tool inputs
2. Check data availability
3. Review error logs
4. Test tool independently

---

## Future Enhancements

### Planned Features
- Custom agent creation UI
- Agent performance analytics
- A/B testing for prompts
- Agent marketplace
- Multi-modal agents (vision, audio)
- Streaming responses
- Agent memory/context persistence

### Research Areas
- Agent learning and adaptation
- Automated prompt optimization
- Multi-agent collaboration protocols
- Cost optimization strategies
- Real-time agent monitoring

---

## Agent Development Guide

### Creating a New Agent

**1. Define Purpose**
- What problem does it solve?
- Who will use it?
- What data does it need?

**2. Design Tools**
- What operations are needed?
- What parameters are required?
- What data is returned?

**3. Implement Agent**
```python
# agent/new_agent.py
def analyze_new_metric(message: str, context: dict) -> dict:
    # Agent implementation
    pass
```

**4. Register Tools**
```python
TOOLS = [
    {
        "name": "new_tool",
        "description": "Tool description",
        "input_schema": {...}
    }
]
```

**5. Add to Configuration**
```json
{
  "agents": {
    "enabled": ["new_agent"],
    "configurations": {
      "new_agent": {...}
    }
  }
}
```

**6. Test Thoroughly**
- Unit tests for tools
- Integration tests for agent
- User acceptance testing
- Performance testing

---

## Agent Metrics

### Performance Metrics
- Average response time
- Token usage per request
- Tool execution time
- Error rate

### Quality Metrics
- User satisfaction
- Response accuracy
- Tool success rate
- Retry rate

### Business Metrics
- Cost per interaction
- Value delivered
- User engagement
- Problem resolution rate

---

## Compliance & Governance

### Data Privacy
- No PII in logs (configurable)
- Data retention policies
- Access controls
- Audit trails

### AI Ethics
- Transparent AI decisions
- Explainable recommendations
- Bias monitoring
- Human oversight

### Regulatory Compliance
- Industry-specific regulations
- Data sovereignty
- Audit requirements
- Retention policies
