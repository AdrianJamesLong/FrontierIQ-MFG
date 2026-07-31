# Tier 1 Analytical Agents

This directory contains the specialized Tier 1 agents that consume DataHub outputs for production intelligence.

## Agent Architecture

Each agent is a standalone Python module with:
- Specialized system prompts tailored to their domain
- Direct integration with Azure AI Foundry Claude API
- Context-aware analysis capabilities
- Testable main functions for validation

## Available Agents

### 1️⃣ Performance Analyst Agent (`performance_analyst_agent.py`)

**Purpose:** Explain why numbers look the way they do

**Consumes:**
- Plan adherence metrics
- OEE (Overall Equipment Effectiveness)
- Production by line
- Order status distribution

**Key Capabilities:**
- Variance analysis
- Trend explanations
- Cross-metric reasoning

**Key Value:** Turns dashboards into narratives executives understand

**Usage:**
```python
from performance_analyst_agent import analyze_performance

response = analyze_performance(
    "Why is performance >100% but availability low?",
    context={"database": "ProductionDB"}
)
```

### 2️⃣ Data Quality / Trust Agent (`data_quality_agent.py`)

**Purpose:** Be the guardian of truth

**Consumes:**
- Same datasets as DataHub
- Metadata and timestamps
- Data volumes and ingestion patterns

**Key Capabilities:**
- Detect missing data
- Identify timestamp inconsistencies
- Flag metric drift
- Highlight dashboard/API mismatches

**Key Value:** Prevents bad decisions before they happen

**Usage:**
```python
from data_quality_agent import check_data_quality

response = check_data_quality(
    "Can I trust yesterday's OEE?",
    context={"database": "ProductionDB"}
)
```

### 3️⃣ Line-Level Operations Agent (`line_operations_agent.py`)

**Purpose:** Shift supervisor in AI form

**Consumes:**
- OT (Operational Technology) data
- Downtime events
- Runrates by line
- Line identifiers

**Key Capabilities:**
- Compare line performance
- Rank issues by impact
- Summarize shift/day performance

**Key Value:** Immediate operational relevance

**Usage:**
```python
from line_operations_agent import analyze_line_operations

response = analyze_line_operations(
    "Which line needs attention right now?",
    context={"database": "ProductionDB"}
)
```

## Testing Agents

Each agent can be tested independently:

```bash
# Test Performance Analyst Agent
cd agent
python performance_analyst_agent.py

# Test Data Quality Agent
python data_quality_agent.py

# Test Line Operations Agent
python line_operations_agent.py
```

## Environment Variables

All agents require the following environment variables (configured in `.env`):

```env
ANTHROPIC_BASE_URL=https://your-foundry-endpoint.azure.com/anthropic
ANTHROPIC_API_KEY=your-api-key
CLAUDE_MODEL=claude-sonnet-4-5
```

## Integration with Backend

The agents are integrated into the FastAPI backend via the `/api/agent/tier1/{agent_type}` endpoint:

- `POST /api/agent/tier1/performance_analyst`
- `POST /api/agent/tier1/data_quality`
- `POST /api/agent/tier1/line_operations`

## Frontend Integration

The agents are accessible through the Tier 1: Analytical Agents page in the frontend, which provides:
- Tab-based navigation between agents
- Chat interface for each agent
- Quick action prompts
- Real-time AI responses

## Adding New Agents

To add a new Tier 1 agent:

1. Create a new Python file in this directory (e.g., `new_agent.py`)
2. Define the system prompt with the agent's purpose and capabilities
3. Create a main function that calls the Claude API
4. Add a test section in `if __name__ == "__main__"`
5. Update `backend/main.py` to import and register the agent
6. Update the frontend to add a new tab for the agent

## Agent Design Principles

All Tier 1 agents follow these principles:

1. **Specialized Knowledge:** Each agent has domain-specific expertise
2. **DataHub Consumers:** They consume processed DataHub outputs, not raw data
3. **Context-Aware:** They understand the production environment and metrics
4. **Actionable Insights:** They provide clear, actionable recommendations
5. **Executive-Friendly:** They communicate in business language, not just technical terms