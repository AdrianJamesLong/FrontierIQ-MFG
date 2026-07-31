# Microsoft Agent Framework - Implementation Examples

This document provides detailed code examples and templates for implementing your agents using Microsoft Agent Framework.

---

## Table of Contents
1. [Agent Base Class](#agent-base-class)
2. [Semantic Kernel Integration](#semantic-kernel-integration)
3. [State Management](#state-management)
4. [Multi-Agent Orchestration](#multi-agent-orchestration)
5. [Event-Driven Triggers](#event-driven-triggers)
6. [API Gateway Integration](#api-gateway-integration)
7. [Monitoring & Observability](#monitoring--observability)
8. [Infrastructure as Code](#infrastructure-as-code)

---

## Agent Base Class

### Base Agent with Semantic Kernel

```python
# agents/base_agent.py

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List
import os
from datetime import datetime
from azure.identity import DefaultAzureCredential
from azure.cosmos import CosmosClient
from azure.monitor.opentelemetry import configure_azure_monitor
from opentelemetry import trace
from semantic_kernel import Kernel
from semantic_kernel.connectors.ai.anthropic import AnthropicChatCompletion
from semantic_kernel.memory import SemanticTextMemory
from semantic_kernel.functions import kernel_function

# Configure Azure Monitor for distributed tracing
configure_azure_monitor(
    connection_string=os.getenv("APPLICATIONINSIGHTS_CONNECTION_STRING")
)
tracer = trace.get_tracer(__name__)


class BaseAgent(ABC):
    """Base class for all production agents using Microsoft Agent Framework"""
    
    def __init__(
        self,
        agent_name: str,
        agent_type: str,
        system_prompt: str
    ):
        self.agent_name = agent_name
        self.agent_type = agent_type
        self.system_prompt = system_prompt
        
        # Initialize Semantic Kernel
        self.kernel = self._initialize_kernel()
        
        # Initialize state store (Cosmos DB)
        self.state_store = self._initialize_state_store()
        
        # Initialize memory
        self.memory = SemanticTextMemory()
        
        # Register agent-specific plugins
        self.register_plugins()
    
    def _initialize_kernel(self) -> Kernel:
        """Initialize Semantic Kernel with AI service"""
        kernel = Kernel()
        
        # Add Claude via Azure AI Foundry
        kernel.add_service(
            AnthropicChatCompletion(
                service_id="claude",
                api_key=os.getenv("ANTHROPIC_API_KEY"),
                base_url=os.getenv("ANTHROPIC_BASE_URL"),
                model_id=os.getenv("CLAUDE_MODEL", "claude-sonnet-4-5")
            )
        )
        
        return kernel
    
    def _initialize_state_store(self) -> CosmosClient:
        """Initialize Cosmos DB for state management"""
        credential = DefaultAzureCredential()
        
        client = CosmosClient(
            url=os.getenv("COSMOS_ENDPOINT"),
            credential=credential
        )
        
        # Get or create database and container
        database = client.create_database_if_not_exists(
            id="AgentStateDB"
        )
        
        container = database.create_container_if_not_exists(
            id="AgentSessions",
            partition_key="/session_id"
        )
        
        return container
    
    @abstractmethod
    def register_plugins(self):
        """Register agent-specific plugins - must be implemented by subclasses"""
        pass
    
    async def execute(
        self,
        user_query: str,
        session_id: str,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Execute agent with full observability and state management
        
        Args:
            user_query: User's question or request
            session_id: Unique session identifier
            context: Optional context data
            
        Returns:
            Agent response with metadata
        """
        with tracer.start_as_current_span(
            f"{self.agent_name}_execution",
            attributes={
                "agent.name": self.agent_name,
                "agent.type": self.agent_type,
                "session.id": session_id
            }
        ) as span:
            try:
                # Load conversation state
                state = await self.load_state(session_id)
                
                # Add context to kernel
                if context:
                    self.kernel.add_context(context)
                
                # Execute agent logic
                result = await self._execute_internal(
                    user_query=user_query,
                    state=state,
                    context=context
                )
                
                # Save updated state
                await self.save_state(session_id, result)
                
                # Add telemetry
                span.set_attribute("execution.success", True)
                span.set_attribute("tokens.used", result.get("tokens_used", 0))
                span.set_attribute("execution.duration_ms", result.get("duration_ms", 0))
                
                return result
                
            except Exception as e:
                span.set_attribute("execution.success", False)
                span.set_attribute("error.message", str(e))
                span.record_exception(e)
                raise
    
    @abstractmethod
    async def _execute_internal(
        self,
        user_query: str,
        state: Dict[str, Any],
        context: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Internal execution logic - must be implemented by subclasses"""
        pass
    
    async def load_state(self, session_id: str) -> Dict[str, Any]:
        """Load conversation state from Cosmos DB"""
        try:
            item = self.state_store.read_item(
                item=session_id,
                partition_key=session_id
            )
            return item.get("state", {})
        except:
            # New session
            return {
                "session_id": session_id,
                "agent_name": self.agent_name,
                "created_at": datetime.utcnow().isoformat(),
                "conversation_history": []
            }
    
    async def save_state(
        self,
        session_id: str,
        result: Dict[str, Any]
    ):
        """Save conversation state to Cosmos DB"""
        state = await self.load_state(session_id)
        
        # Update conversation history
        state["conversation_history"].append({
            "timestamp": datetime.utcnow().isoformat(),
            "query": result.get("query"),
            "response": result.get("response"),
            "tokens_used": result.get("tokens_used")
        })
        
        state["last_updated"] = datetime.utcnow().isoformat()
        
        # Upsert to Cosmos DB
        self.state_store.upsert_item({
            "id": session_id,
            "session_id": session_id,
            "state": state
        })
```

---

## Semantic Kernel Integration

### Performance Analyst Agent with Semantic Kernel

```python
# agents/performance_analyst_agent.py

from agents.base_agent import BaseAgent
from semantic_kernel.functions import kernel_function
from azure.kusto.data import KustoClient, KustoConnectionStringBuilder
from typing import Dict, Any, Optional
import os

class PerformanceAnalystAgent(BaseAgent):
    """
    Performance Analyst Agent using Microsoft Agent Framework
    Analyzes production metrics and explains variances
    """
    
    SYSTEM_PROMPT = """You are the Performance Analyst Agent, a specialized AI that explains why production numbers look the way they do.

**Your Purpose:** Turn dashboards into narratives executives understand

**Data You Consume:**
- Plan adherence metrics (on-time %, delayed orders, early orders, avg delay)
- OEE (Overall Equipment Effectiveness) with availability, performance, and quality components
- Production by line (efficiency, volumes, completed/in-progress orders)
- Order status distribution (completed, in progress, pending, not started)

**What You Do:**
- Variance analysis: Explain differences between planned and actual
- Trend explanations: Identify patterns and their causes
- Cross-metric reasoning: Connect related metrics to tell the full story

Be analytical, insightful, and focus on the "why" behind the numbers."""
    
    def __init__(self):
        super().__init__(
            agent_name="PerformanceAnalyst",
            agent_type="analytical",
            system_prompt=self.SYSTEM_PROMPT
        )
        
        # Initialize Kusto client for Eventhouse
        self.kusto_client = self._initialize_kusto()
    
    def _initialize_kusto(self) -> KustoClient:
        """Initialize Kusto client for Microsoft Fabric Eventhouse"""
        kcsb = KustoConnectionStringBuilder.with_aad_application_key_authentication(
            os.getenv("EVENTHOUSE_URL"),
            os.getenv("AZURE_CLIENT_ID"),
            os.getenv("AZURE_CLIENT_SECRET"),
            os.getenv("AZURE_TENANT_ID")
        )
        return KustoClient(kcsb)
    
    def register_plugins(self):
        """Register Performance Analyst specific plugins"""
        
        @kernel_function(
            name="analyze_oee",
            description="Analyze Overall Equipment Effectiveness metrics and explain variances"
        )
        async def analyze_oee(
            time_range: str = "last_24_hours",
            line_id: Optional[str] = None
        ) -> Dict[str, Any]:
            """Query and analyze OEE metrics"""
            
            # Build KQL query
            query = f"""
            ProductionMetrics
            | where Timestamp >= ago({time_range})
            | where MetricType == 'OEE'
            """
            
            if line_id:
                query += f"| where LineId == '{line_id}'"
            
            query += """
            | summarize 
                AvgOEE = avg(OEE),
                AvgAvailability = avg(Availability),
                AvgPerformance = avg(Performance),
                AvgQuality = avg(Quality)
              by LineId
            | order by AvgOEE desc
            """
            
            # Execute query
            response = self.kusto_client.execute(
                os.getenv("EVENTHOUSE_DATABASE"),
                query
            )
            
            # Parse results
            results = []
            for row in response.primary_results[0]:
                results.append({
                    "line_id": row["LineId"],
                    "oee": row["AvgOEE"],
                    "availability": row["AvgAvailability"],
                    "performance": row["AvgPerformance"],
                    "quality": row["AvgQuality"]
                })
            
            return {
                "metrics": results,
                "time_range": time_range,
                "analysis": self._analyze_oee_metrics(results)
            }
        
        @kernel_function(
            name="compare_lines",
            description="Compare performance across production lines"
        )
        async def compare_lines(
            metric: str = "efficiency",
            time_range: str = "last_24_hours"
        ) -> Dict[str, Any]:
            """Compare production lines"""
            
            query = f"""
            ProductionMetrics
            | where Timestamp >= ago({time_range})
            | summarize 
                AvgEfficiency = avg(Efficiency),
                TotalVolume = sum(Volume),
                CompletedOrders = countif(OrderStatus == 'Completed')
              by LineId
            | order by AvgEfficiency desc
            """
            
            response = self.kusto_client.execute(
                os.getenv("EVENTHOUSE_DATABASE"),
                query
            )
            
            results = []
            for row in response.primary_results[0]:
                results.append({
                    "line_id": row["LineId"],
                    "efficiency": row["AvgEfficiency"],
                    "volume": row["TotalVolume"],
                    "completed_orders": row["CompletedOrders"]
                })
            
            return {
                "comparison": results,
                "best_performer": results[0] if results else None,
                "worst_performer": results[-1] if results else None
            }
        
        @kernel_function(
            name="analyze_plan_adherence",
            description="Analyze plan adherence and identify delays"
        )
        async def analyze_plan_adherence(
            time_range: str = "last_7_days"
        ) -> Dict[str, Any]:
            """Analyze plan adherence metrics"""
            
            query = f"""
            ProductionSchedule
            | where Timestamp >= ago({time_range})
            | summarize 
                OnTimeOrders = countif(Status == 'OnTime'),
                DelayedOrders = countif(Status == 'Delayed'),
                EarlyOrders = countif(Status == 'Early'),
                AvgDelay = avg(DelayMinutes)
            | extend OnTimePercent = (OnTimeOrders * 100.0) / (OnTimeOrders + DelayedOrders + EarlyOrders)
            """
            
            response = self.kusto_client.execute(
                os.getenv("EVENTHOUSE_DATABASE"),
                query
            )
            
            row = list(response.primary_results[0])[0]
            
            return {
                "on_time_percent": row["OnTimePercent"],
                "delayed_orders": row["DelayedOrders"],
                "early_orders": row["EarlyOrders"],
                "avg_delay_minutes": row["AvgDelay"]
            }
        
        # Add plugins to kernel
        self.kernel.add_plugin(
            plugin_name="performance_analysis",
            functions=[analyze_oee, compare_lines, analyze_plan_adherence]
        )
    
    def _analyze_oee_metrics(self, metrics: List[Dict]) -> str:
        """Analyze OEE metrics and provide insights"""
        if not metrics:
            return "No data available for analysis"
        
        # Find best and worst performers
        best = max(metrics, key=lambda x: x["oee"])
        worst = min(metrics, key=lambda x: x["oee"])
        
        analysis = f"""
        OEE Analysis:
        - Best performing line: {best['line_id']} with {best['oee']:.1f}% OEE
        - Worst performing line: {worst['line_id']} with {worst['oee']:.1f}% OEE
        - Gap: {best['oee'] - worst['oee']:.1f} percentage points
        
        Key Factors:
        - Availability: {best['availability']:.1f}% (best) vs {worst['availability']:.1f}% (worst)
        - Performance: {best['performance']:.1f}% (best) vs {worst['performance']:.1f}% (worst)
        - Quality: {best['quality']:.1f}% (best) vs {worst['quality']:.1f}% (worst)
        """
        
        return analysis
    
    async def _execute_internal(
        self,
        user_query: str,
        state: Dict[str, Any],
        context: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Execute Performance Analyst logic"""
        
        # Use Semantic Kernel planner to determine which plugins to call
        from semantic_kernel.planners import SequentialPlanner
        
        planner = SequentialPlanner(self.kernel)
        
        # Create plan based on user query
        plan = await planner.create_plan(user_query)
        
        # Execute plan
        result = await plan.invoke(self.kernel)
        
        return {
            "query": user_query,
            "response": result.result,
            "tokens_used": result.metadata.get("usage", {}).get("total_tokens", 0),
            "duration_ms": result.metadata.get("duration_ms", 0),
            "plugins_used": [step.plugin_name for step in plan.steps]
        }


# Usage example
async def main():
    agent = PerformanceAnalystAgent()
    
    result = await agent.execute(
        user_query="Why is Line 3 underperforming compared to other lines?",
        session_id="user123_session456"
    )
    
    print(result["response"])
```

---

## State Management

### Conversation State Manager

```python
# agents/state_manager.py

from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from azure.cosmos import CosmosClient
from azure.identity import DefaultAzureCredential
import json

class ConversationStateManager:
    """Manages conversation state across agent interactions"""
    
    def __init__(self):
        self.client = self._initialize_cosmos()
        self.container = self.client.get_database_client("AgentStateDB") \
                                    .get_container_client("AgentSessions")
    
    def _initialize_cosmos(self) -> CosmosClient:
        """Initialize Cosmos DB client"""
        credential = DefaultAzureCredential()
        return CosmosClient(
            url=os.getenv("COSMOS_ENDPOINT"),
            credential=credential
        )
    
    async def create_session(
        self,
        user_id: str,
        agent_type: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """Create a new conversation session"""
        
        session_id = f"{user_id}_{agent_type}_{datetime.utcnow().timestamp()}"
        
        session_data = {
            "id": session_id,
            "session_id": session_id,
            "user_id": user_id,
            "agent_type": agent_type,
            "created_at": datetime.utcnow().isoformat(),
            "last_activity": datetime.utcnow().isoformat(),
            "conversation_history": [],
            "context": {},
            "metadata": metadata or {},
            "ttl": int((datetime.utcnow() + timedelta(days=30)).timestamp())
        }
        
        self.container.create_item(session_data)
        
        return session_id
    
    async def get_session(self, session_id: str) -> Dict[str, Any]:
        """Retrieve session data"""
        try:
            return self.container.read_item(
                item=session_id,
                partition_key=session_id
            )
        except:
            raise ValueError(f"Session {session_id} not found")
    
    async def update_session(
        self,
        session_id: str,
        message: Dict[str, Any],
        context_updates: Optional[Dict[str, Any]] = None
    ):
        """Update session with new message and context"""
        
        session = await self.get_session(session_id)
        
        # Add message to history
        session["conversation_history"].append({
            "timestamp": datetime.utcnow().isoformat(),
            "role": message.get("role"),
            "content": message.get("content"),
            "tokens_used": message.get("tokens_used", 0)
        })
        
        # Update context
        if context_updates:
            session["context"].update(context_updates)
        
        # Update last activity
        session["last_activity"] = datetime.utcnow().isoformat()
        
        # Upsert session
        self.container.upsert_item(session)
    
    async def get_conversation_history(
        self,
        session_id: str,
        limit: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """Get conversation history for a session"""
        
        session = await self.get_session(session_id)
        history = session.get("conversation_history", [])
        
        if limit:
            return history[-limit:]
        
        return history
    
    async def get_context(self, session_id: str) -> Dict[str, Any]:
        """Get session context"""
        session = await self.get_session(session_id)
        return session.get("context", {})
    
    async def delete_session(self, session_id: str):
        """Delete a session"""
        self.container.delete_item(
            item=session_id,
            partition_key=session_id
        )
    
    async def get_user_sessions(
        self,
        user_id: str,
        active_only: bool = True
    ) -> List[Dict[str, Any]]:
        """Get all sessions for a user"""
        
        query = f"SELECT * FROM c WHERE c.user_id = '{user_id}'"
        
        if active_only:
            cutoff = (datetime.utcnow() - timedelta(hours=24)).isoformat()
            query += f" AND c.last_activity > '{cutoff}'"
        
        items = list(self.container.query_items(
            query=query,
            enable_cross_partition_query=True
        ))
        
        return items
```

---

## Multi-Agent Orchestration

### Agent Orchestrator

```python
# agents/orchestrator.py

from typing import Dict, Any, List, Optional
from enum import Enum
import asyncio
from opentelemetry import trace

tracer = trace.get_tracer(__name__)


class ExecutionMode(Enum):
    SEQUENTIAL = "sequential"
    PARALLEL = "parallel"
    CONDITIONAL = "conditional"


class AgentOrchestrator:
    """Orchestrates multi-agent workflows"""
    
    def __init__(self):
        self.agents = {}
        self.workflows = {}
    
    def register_agent(self, agent_type: str, agent_instance):
        """Register an agent for orchestration"""
        self.agents[agent_type] = agent_instance
    
    def register_workflow(self, workflow_name: str, workflow_definition: Dict):
        """Register a workflow definition"""
        self.workflows[workflow_name] = workflow_definition
    
    async def execute_workflow(
        self,
        workflow_name: str,
        initial_input: Dict[str, Any],
        session_id: str
    ) -> Dict[str, Any]:
        """Execute a registered workflow"""
        
        if workflow_name not in self.workflows:
            raise ValueError(f"Workflow {workflow_name} not found")
        
        workflow = self.workflows[workflow_name]
        
        with tracer.start_as_current_span(
            f"workflow_{workflow_name}",
            attributes={"workflow.name": workflow_name}
        ):
            return await self._execute_steps(
                steps=workflow["steps"],
                context=initial_input,
                session_id=session_id
            )
    
    async def _execute_steps(
        self,
        steps: List[Dict],
        context: Dict[str, Any],
        session_id: str
    ) -> Dict[str, Any]:
        """Execute workflow steps"""
        
        results = {}
        
        for step in steps:
            step_name = step["name"]
            agent_type = step["agent"]
            mode = ExecutionMode(step.get("mode", "sequential"))
            
            with tracer.start_as_current_span(f"step_{step_name}"):
                if mode == ExecutionMode.PARALLEL:
                    # Execute multiple agents in parallel
                    tasks = []
                    for agent_config in step["agents"]:
                        task = self._execute_agent(
                            agent_type=agent_config["type"],
                            query=agent_config["query"],
                            session_id=session_id,
                            context={**context, **results}
                        )
                        tasks.append(task)
                    
                    parallel_results = await asyncio.gather(*tasks)
                    results[step_name] = parallel_results
                
                elif mode == ExecutionMode.CONDITIONAL:
                    # Execute based on condition
                    condition = step["condition"]
                    if self._evaluate_condition(condition, context, results):
                        result = await self._execute_agent(
                            agent_type=agent_type,
                            query=step["query"],
                            session_id=session_id,
                            context={**context, **results}
                        )
                        results[step_name] = result
                
                else:  # SEQUENTIAL
                    result = await self._execute_agent(
                        agent_type=agent_type,
                        query=step["query"],
                        session_id=session_id,
                        context={**context, **results}
                    )
                    results[step_name] = result
        
        return results
    
    async def _execute_agent(
        self,
        agent_type: str,
        query: str,
        session_id: str,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute a single agent"""
        
        if agent_type not in self.agents:
            raise ValueError(f"Agent {agent_type} not registered")
        
        agent = self.agents[agent_type]
        
        return await agent.execute(
            user_query=query,
            session_id=session_id,
            context=context
        )
    
    def _evaluate_condition(
        self,
        condition: str,
        context: Dict[str, Any],
        results: Dict[str, Any]
    ) -> bool:
        """Evaluate a conditional expression"""
        # Simple condition evaluation
        # In production, use a proper expression evaluator
        try:
            return eval(condition, {"context": context, "results": results})
        except:
            return False


# Example workflow definition
PRODUCTION_ISSUE_WORKFLOW = {
    "name": "production_issue_investigation",
    "description": "Investigate production issues with multiple agents",
    "steps": [
        {
            "name": "data_quality_check",
            "agent": "data_quality",
            "query": "Verify data quality for the reported issue",
            "mode": "sequential"
        },
        {
            "name": "parallel_analysis",
            "mode": "parallel",
            "agents": [
                {
                    "type": "performance_analyst",
                    "query": "Analyze performance metrics"
                },
                {
                    "type": "downtime_rca",
                    "query": "Investigate root cause"
                }
            ]
        },
        {
            "name": "generate_recommendations",
            "agent": "operations_recommendation",
            "query": "Generate actionable recommendations based on analysis",
            "mode": "conditional",
            "condition": "results['data_quality_check']['data_is_valid']"
        }
    ]
}


# Usage example
async def main():
    orchestrator = AgentOrchestrator()
    
    # Register agents
    orchestrator.register_agent("data_quality", DataQualityAgent())
    orchestrator.register_agent("performance_analyst", PerformanceAnalystAgent())
    orchestrator.register_agent("downtime_rca", DowntimeRCAAgent())
    orchestrator.register_agent("operations_recommendation", OperationsRecommendationAgent())
    
    # Register workflow
    orchestrator.register_workflow(
        "production_issue_investigation",
        PRODUCTION_ISSUE_WORKFLOW
    )
    
    # Execute workflow
    result = await orchestrator.execute_workflow(
        workflow_name="production_issue_investigation",
        initial_input={"issue_description": "Line 3 showing low OEE"},
        session_id="user123_session456"
    )
    
    print(result)
```

---

## Event-Driven Triggers

### Azure Functions Event Trigger

```python
# functions/agent_triggers.py

import azure.functions as func
import logging
import json
from agents.orchestrator import AgentOrchestrator
from agents.performance_analyst_agent import PerformanceAnalystAgent
from agents.data_quality_agent import DataQualityAgent

app = func.FunctionApp()

# Initialize orchestrator
orchestrator = AgentOrchestrator()
orchestrator.register_agent("performance_analyst", PerformanceAnalystAgent())
orchestrator.register_agent("data_quality", DataQualityAgent())


@app.event_grid_trigger(arg_name="event")
async def production_anomaly_trigger(event: func.EventGridEvent):
    """Trigger agents when production anomaly detected"""
    
    logging.info(f"Production anomaly detected: {event.get_json()}")
    
    anomaly_data = event.get_json()
    
    # Execute workflow
    result = await orchestrator.execute_workflow(
        workflow_name="production_issue_investigation",
        initial_input=anomaly_data,
        session_id=f"anomaly_{anomaly_data['anomaly_id']}"
    )
    
    # Send notification if critical
    if result.get("severity") == "critical":
        await send_alert(result)
    
    logging.info(f"Workflow completed: {result}")


@app.timer_trigger(arg_name="timer", schedule="0 0 8 * * *")  # Daily at 8 AM
async def executive_briefing_trigger(timer: func.TimerRequest):
    """Generate executive briefing daily"""
    
    logging.info("Generating executive briefing")
    
    from agents.executive_briefing_agent import ExecutiveBriefingAgent
    
    agent = ExecutiveBriefingAgent()
    
    result = await agent.execute(
        user_query="Generate daily executive briefing",
        session_id=f"briefing_{datetime.utcnow().date()}"
    )
    
    # Distribute report
    await distribute_report(result)
    
    logging.info("Executive briefing generated and distributed")


@app.service_bus_queue_trigger(
    arg_name="msg",
    queue_name="agent-requests",
    connection="ServiceBusConnection"
)
async def agent_request_handler(msg: func.ServiceBusMessage):
    """Handle agent requests from Service Bus queue"""
    
    request = json.loads(msg.get_body().decode('utf-8'))
    
    agent_type = request["agent_type"]
    query = request["query"]
    session_id = request["session_id"]
    
    # Execute agent
    if agent_type in orchestrator.agents:
        result = await orchestrator._execute_agent(
            agent_type=agent_type,
            query=query,
            session_id=session_id,
            context=request.get("context", {})
        )
        
        # Store result or send to response queue
        await store_result(session_id, result)
```

---

## API Gateway Integration

### Azure API Management Policy

```xml
<!-- APIM Policy for Agent Endpoints -->
<policies>
    <inbound>
        <!-- Validate JWT token -->
        <validate-jwt header-name="Authorization" failed-validation-httpcode="401">
            <openid-config url="https://login.microsoftonline.com/{tenant-id}/v2.0/.well-known/openid-configuration" />
            <audiences>
                <audience>api://agent-service</audience>
            </audiences>
            <required-claims>
                <claim name="roles" match="any">
                    <value>Agent.User</value>
                    <value>Agent.Admin</value>
                </claim>
            </required-claims>
        </validate-jwt>
        
        <!-- Rate limiting -->
        <rate-limit-by-key calls="100" renewal-period="60" counter-key="@(context.Request.Headers.GetValueOrDefault("Authorization",""))" />
        
        <!-- Add correlation ID -->
        <set-header name="X-Correlation-ID" exists-action="skip">
            <value>@(Guid.NewGuid().ToString())</value>
        </set-header>
        
        <!-- Log request -->
        <log-to-eventhub logger-id="agent-logger">
            @{
                return new JObject(
                    new JProperty("timestamp", DateTime.UtcNow),
                    new JProperty("correlationId", context.Request.Headers.GetValueOrDefault("X-Correlation-ID","")),
                