import { useState } from 'react'
import Breadcrumb from '../components/Breadcrumb'
import { Code, FileText, Download, Copy, Check, ExternalLink, Layers, Database, Zap, Shield, Activity, Settings } from 'lucide-react'
import './Dashboard.css'

function MigrationImplementation() {
  const [activeSection, setActiveSection] = useState('overview')
  const [copiedSection, setCopiedSection] = useState(null)

  const sections = [
    { id: 'overview', name: 'Overview', icon: FileText },
    { id: 'base-agent', name: 'Base Agent', icon: Code },
    { id: 'orchestrator', name: 'Orchestration', icon: Layers },
    { id: 'state', name: 'State Management', icon: Database },
    { id: 'events', name: 'Event Triggers', icon: Zap },
    { id: 'infrastructure', name: 'Infrastructure', icon: Settings },
    { id: 'api-gateway', name: 'API Gateway', icon: Shield }
  ]

  const codeExamples = {
    'base-agent': {
      title: 'Base Agent Class',
      description: 'Foundation class for all agents using Semantic Kernel with Azure AI Foundry integration',
      language: 'python',
      code: `from semantic_kernel import Kernel
from semantic_kernel.connectors.ai.anthropic import AnthropicChatCompletion
from azure.cosmos import CosmosClient
from azure.identity import DefaultAzureCredential
import os

class BaseAgent:
    """Base class for all agents using Semantic Kernel"""
    
    def __init__(self, agent_name: str, system_prompt: str):
        self.agent_name = agent_name
        self.system_prompt = system_prompt
        self.kernel = self._initialize_kernel()
        self.state_store = self._initialize_state_store()
    
    def _initialize_kernel(self) -> Kernel:
        """Initialize Semantic Kernel with Claude via Azure AI Foundry"""
        kernel = Kernel()
        
        # Add Claude service via Azure AI Foundry
        kernel.add_service(
            AnthropicChatCompletion(
                service_id="claude",
                api_key=os.getenv("ANTHROPIC_API_KEY"),
                base_url=os.getenv("ANTHROPIC_BASE_URL"),
                model_id="claude-sonnet-4"
            )
        )
        
        return kernel
    
    def _initialize_state_store(self):
        """Initialize Cosmos DB for state persistence"""
        client = CosmosClient(
            url=os.getenv("COSMOS_ENDPOINT"),
            credential=DefaultAzureCredential()
        )
        database = client.get_database_client("agent_state")
        return database.get_container_client("conversations")
    
    async def process(self, user_input: str, session_id: str) -> dict:
        """Process user input and return response"""
        # Load conversation state
        state = await self._load_state(session_id)
        
        # Execute agent logic
        result = await self._execute(user_input, state)
        
        # Save updated state
        await self._save_state(session_id, result)
        
        return result`,
      highlights: [
        'Semantic Kernel integration with Azure AI Foundry',
        'Claude Sonnet 4 via Anthropic connector',
        'Cosmos DB for distributed state management',
        'Async/await pattern for scalability',
        'Managed identity authentication'
      ]
    },
    'orchestrator': {
      title: 'Multi-Agent Orchestrator',
      description: 'Coordinate multiple agents in complex workflows with sequential and parallel execution',
      language: 'python',
      code: `from typing import Dict, List, Any
import asyncio

class AgentOrchestrator:
    """Orchestrate multiple agents in workflows"""
    
    def __init__(self):
        self.agents: Dict[str, BaseAgent] = {}
        self.workflows: Dict[str, dict] = {}
    
    def register_agent(self, agent_type: str, agent_instance: BaseAgent):
        """Register an agent for use in workflows"""
        self.agents[agent_type] = agent_instance
    
    def define_workflow(self, name: str, steps: List[dict]):
        """Define a multi-step workflow"""
        self.workflows[name] = {
            "steps": steps,
            "metadata": {"created_at": datetime.utcnow()}
        }
    
    async def execute_workflow(
        self, 
        workflow_name: str, 
        initial_input: dict,
        session_id: str
    ) -> dict:
        """Execute a workflow with multiple agents"""
        workflow = self.workflows[workflow_name]
        context = initial_input
        
        for step in workflow["steps"]:
            if step["type"] == "sequential":
                context = await self._execute_sequential(step, context, session_id)
            elif step["type"] == "parallel":
                context = await self._execute_parallel(step, context, session_id)
            elif step["type"] == "conditional":
                context = await self._execute_conditional(step, context, session_id)
        
        return context
    
    async def _execute_sequential(self, step: dict, context: dict, session_id: str):
        """Execute agents sequentially"""
        for agent_type in step["agents"]:
            agent = self.agents[agent_type]
            result = await agent.process(context["input"], session_id)
            context["input"] = result["response"]
            context["history"].append(result)
        return context
    
    async def _execute_parallel(self, step: dict, context: dict, session_id: str):
        """Execute multiple agents in parallel"""
        tasks = [
            self.agents[agent_type].process(context["input"], session_id)
            for agent_type in step["agents"]
        ]
        results = await asyncio.gather(*tasks)
        context["parallel_results"] = results
        return context`,
      highlights: [
        'Multi-agent workflow coordination',
        'Sequential and parallel execution patterns',
        'Conditional branching support',
        'Context passing between agents',
        'Async parallel processing with asyncio.gather'
      ]
    },
    'state': {
      title: 'State Management',
      description: 'Distributed conversation state with Cosmos DB for multi-turn conversations',
      language: 'python',
      code: `from azure.cosmos import CosmosClient, PartitionKey
from azure.identity import DefaultAzureCredential
from datetime import datetime
import json

class ConversationStateManager:
    """Manage conversation state in Cosmos DB"""
    
    def __init__(self):
        self.client = CosmosClient(
            url=os.getenv("COSMOS_ENDPOINT"),
            credential=DefaultAzureCredential()
        )
        self.database = self.client.get_database_client("agent_state")
        self.container = self.database.get_container_client("conversations")
    
    async def load_state(self, session_id: str) -> dict:
        """Load conversation state for a session"""
        try:
            item = self.container.read_item(
                item=session_id,
                partition_key=session_id
            )
            return item
        except Exception:
            # Create new state if not exists
            return {
                "id": session_id,
                "conversation_history": [],
                "context": {},
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
    
    async def save_state(self, session_id: str, result: dict):
        """Save conversation state"""
        state = await self.load_state(session_id)
        
        # Append to conversation history
        state["conversation_history"].append({
            "timestamp": datetime.utcnow().isoformat(),
            "query": result.get("query"),
            "response": result.get("response"),
            "agent": result.get("agent_name"),
            "metadata": result.get("metadata", {})
        })
        
        # Update context
        state["context"].update(result.get("context", {}))
        state["updated_at"] = datetime.utcnow().isoformat()
        
        # Upsert to Cosmos DB
        self.container.upsert_item(state)
    
    async def clear_state(self, session_id: str):
        """Clear conversation state"""
        try:
            self.container.delete_item(
                item=session_id,
                partition_key=session_id
            )
        except Exception:
            pass`,
      highlights: [
        'Cosmos DB for distributed state storage',
        'Session-based conversation tracking',
        'Multi-turn conversation history',
        'Context persistence across interactions',
        'Automatic state creation and cleanup'
      ]
    },
    'events': {
      title: 'Event-Driven Triggers',
      description: 'Azure Functions for event-driven agent execution with Event Grid integration',
      language: 'python',
      code: `import azure.functions as func
from azure.eventgrid import EventGridEvent
import logging

app = func.FunctionApp()

@app.event_grid_trigger(arg_name="event")
async def production_anomaly_trigger(event: func.EventGridEvent):
    """Trigger agent on production anomaly events"""
    
    logging.info(f"Received event: {event.event_type}")
    
    # Parse event data
    anomaly_data = event.get_json()
    
    # Initialize orchestrator
    orchestrator = AgentOrchestrator()
    orchestrator.register_agent("performance", PerformanceAnalystAgent())
    orchestrator.register_agent("rca", DowntimeRCAAgent())
    
    # Execute investigation workflow
    result = await orchestrator.execute_workflow(
        workflow_name="production_issue_investigation",
        initial_input={
            "input": anomaly_data,
            "history": []
        },
        session_id=f"event_{event.id}"
    )
    
    # Send alerts if critical
    if result.get("severity") == "critical":
        await send_alert_to_teams(result)
        await create_incident_ticket(result)
    
    logging.info(f"Investigation complete: {result.get('summary')}")

@app.timer_trigger(schedule="0 */15 * * * *", arg_name="timer")
async def scheduled_data_quality_check(timer: func.TimerRequest):
    """Run data quality checks every 15 minutes"""
    
    logging.info("Starting scheduled data quality check")
    
    agent = DataQualityAgent()
    result = await agent.process(
        user_input="Run comprehensive data quality check",
        session_id=f"scheduled_{datetime.utcnow().isoformat()}"
    )
    
    # Log results to Application Insights
    logging.info(f"Data quality score: {result.get('quality_score')}")
    
    if result.get("issues_found"):
        await send_quality_report(result)

async def send_alert_to_teams(result: dict):
    """Send alert to Microsoft Teams"""
    # Implementation for Teams webhook
    pass

async def create_incident_ticket(result: dict):
    """Create incident in ticketing system"""
    # Implementation for incident creation
    pass`,
      highlights: [
        'Event Grid triggers for real-time responses',
        'Timer triggers for scheduled tasks',
        'Automatic agent orchestration on events',
        'Integration with alerting systems',
        'Application Insights logging'
      ]
    }
  }

  const getSectionContent = () => {
    const sectionData = {
      overview: {
        title: 'Implementation Overview',
        description: 'Production-ready code examples and templates for implementing agents using Microsoft Agent Framework with Semantic Kernel.',
        highlights: [
          'Base Agent Class: Foundation for all agents with Semantic Kernel integration',
          'State Management: Conversation state with Cosmos DB persistence',
          'Orchestration: Multi-agent workflows and coordination',
          'Event Triggers: Azure Functions for event-driven execution',
          'Infrastructure: Complete IaC templates with Bicep',
          'API Gateway: Azure API Management configuration'
        ]
      },
      infrastructure: {
        title: 'Infrastructure as Code',
        description: 'Complete Infrastructure as Code templates using Azure Bicep for all required services.',
        highlights: [
          'Azure Bicep Templates: Complete infrastructure definitions for all Azure services',
          'GitHub Actions Workflows: CI/CD pipelines with blue-green deployment',
          'Azure Functions: Event-driven agent triggers and scheduled tasks',
          'API Management: Gateway configuration with policies',
          'Cosmos DB: State storage with automatic scaling',
          'Application Insights: Monitoring and observability'
        ]
      },
      'api-gateway': {
        title: 'API Gateway Configuration',
        description: 'Azure API Management policies and configuration for agent endpoints.',
        highlights: [
          'Authentication & Authorization: JWT validation with Microsoft Entra ID',
          'Rate Limiting & Throttling: Protect against abuse and ensure fair usage',
          'Logging & Monitoring: Comprehensive request/response logging',
          'CORS Configuration: Cross-origin resource sharing setup',
          'Response Caching: Improve performance with intelligent caching',
          'Error Handling: Standardized error responses'
        ]
      }
    }

    return sectionData[activeSection] || sectionData.overview
  }

  const handleCopy = (code, id) => {
    navigator.clipboard.writeText(code)
    setCopiedSection(id)
    setTimeout(() => setCopiedSection(null), 2000)
  }

  const content = getSectionContent()
  const Icon = sections.find(s => s.id === activeSection)?.icon || FileText
  const currentCodeExample = codeExamples[activeSection]

  return (
    <div className="page-container">
      <Breadcrumb 
        items={[
          { label: 'Migration Planning', path: '/migration-executive-summary' },
          { label: 'Implementation Guide' }
        ]} 
      />
      
      <div className="page-header">
        <div className="header-content">
          <div className="header-icon" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)' }}>
            <Code size={28} />
          </div>
          <div>
            <h1>Implementation Guide</h1>
            <p className="page-subtitle">Code Examples & Templates for Migration</p>
          </div>
        </div>
        <a 
          href="/plans/agent-framework-implementation-examples.md" 
          download
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            background: '#1e3a8a',
            color: 'white',
            borderRadius: '8px',
            textDecoration: 'none',
            fontSize: '0.875rem',
            fontWeight: '500',
            transition: 'background 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = '#1e40af'}
          onMouseOut={(e) => e.currentTarget.style.background = '#1e3a8a'}
        >
          <Download size={18} />
          Download Full Guide
        </a>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '2rem', marginTop: '2rem' }}>
        {/* Navigation Sidebar */}
        <div style={{ position: 'sticky', top: '2rem', height: 'fit-content' }}>
          <div className="card" style={{ padding: '1rem' }}>
            <h3 style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Sections
            </h3>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {sections.map(section => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  style={{
                    padding: '0.75rem',
                    textAlign: 'left',
                    background: activeSection === section.id ? '#eff6ff' : 'transparent',
                    color: activeSection === section.id ? '#1e3a8a' : '#475569',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: activeSection === section.id ? '600' : '400',
                    transition: 'all 0.2s',
                    borderLeft: activeSection === section.id ? '3px solid #3b82f6' : '3px solid transparent',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                  onMouseOver={(e) => {
                    if (activeSection !== section.id) {
                      e.currentTarget.style.background = '#f8fafc'
                    }
                  }}
                  onMouseOut={(e) => {
                    if (activeSection !== section.id) {
                      e.currentTarget.style.background = 'transparent'
                    }
                  }}
                >
                  <section.icon size={16} />
                  {section.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div>
          <div className="card">
            <div className="card-content" style={{ padding: '2.5rem' }}>
              <div style={{ maxWidth: '900px' }}>
                {/* Section Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                  <div style={{ padding: '1rem', background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', borderRadius: '12px' }}>
                    <Icon size={32} color="#1e3a8a" />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#1e3a8a', marginBottom: '0.5rem' }}>
                      {content.title}
                    </h2>
                    <p style={{ fontSize: '1rem', color: '#64748b', margin: 0 }}>
                      {content.description}
                    </p>
                  </div>
                </div>

                {/* Code Example (for code sections) */}
                {currentCodeExample && (
                  <div style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1e3a8a' }}>
                        Code Example
                      </h3>
                      <button
                        onClick={() => handleCopy(currentCodeExample.code, activeSection)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem 1rem',
                          background: copiedSection === activeSection ? '#1e3a8a' : '#f8fafc',
                          color: copiedSection === activeSection ? 'white' : '#475569',
                          border: copiedSection === activeSection ? 'none' : '1px solid #e2e8f0',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => {
                          if (copiedSection !== activeSection) {
                            e.currentTarget.style.background = '#eff6ff'
                            e.currentTarget.style.borderColor = '#bfdbfe'
                          }
                        }}
                        onMouseOut={(e) => {
                          if (copiedSection !== activeSection) {
                            e.currentTarget.style.background = '#f8fafc'
                            e.currentTarget.style.borderColor = '#e2e8f0'
                          }
                        }}
                      >
                        {copiedSection === activeSection ? (
                          <>
                            <Check size={16} />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy size={16} />
                            Copy Code
                          </>
                        )}
                      </button>
                    </div>
                    <pre style={{
                      background: '#0f172a',
                      color: '#e2e8f0',
                      padding: '1.5rem',
                      borderRadius: '8px',
                      overflow: 'auto',
                      fontSize: '0.875rem',
                      lineHeight: '1.7',
                      margin: 0,
                      border: '1px solid #1e293b'
                    }}>
                      <code>{currentCodeExample.code}</code>
                    </pre>
                  </div>
                )}

                {/* Key Highlights */}
                <div style={{ background: '#f8fafc', padding: '2rem', borderRadius: '12px', marginBottom: '2rem', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1e3a8a', marginBottom: '1.5rem' }}>
                    📋 Key Highlights
                  </h3>
                  <ul style={{ margin: 0, paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {content.highlights.map((highlight, idx) => (
                      <li key={idx} style={{ fontSize: '0.9375rem', color: '#475569', lineHeight: '1.7' }}>
                        <strong style={{ color: '#1e3a8a' }}>{highlight.split(':')[0]}</strong>
                        {highlight.includes(':') ? ':' + highlight.split(':').slice(1).join(':') : ''}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Documentation Links */}
                <div style={{ 
                  padding: '2rem', 
                  background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', 
                  borderRadius: '12px',
                  border: '1px solid #bfdbfe'
                }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#1e3a8a', marginBottom: '1rem' }}>
                    📚 Additional Resources
                  </h4>
                  <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '1.5rem', lineHeight: '1.7' }}>
                    Access comprehensive documentation and implementation guides:
                  </p>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <a 
                      href="/plans/agent-framework-implementation-examples.md" 
                      download
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1.5rem',
                        background: '#1e3a8a',
                        color: 'white',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        transition: 'background 0.2s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = '#1e40af'}
                      onMouseOut={(e) => e.currentTarget.style.background = '#1e3a8a'}
                    >
                      <Download size={16} />
                      Download Complete Guide
                    </a>
                    <a 
                      href="https://learn.microsoft.com/en-us/semantic-kernel/" 
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1.5rem',
                        background: 'white',
                        color: '#1e3a8a',
                        border: '1px solid #bfdbfe',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = '#eff6ff'
                        e.currentTarget.style.borderColor = '#3b82f6'
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'white'
                        e.currentTarget.style.borderColor = '#bfdbfe'
                      }}
                    >
                      Semantic Kernel Docs <ExternalLink size={16} />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MigrationImplementation