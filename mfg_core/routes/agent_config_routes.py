"""
Agent Configuration Routes
Provides API endpoints for managing agent configurations including temperature,
system prompts, and operational parameters.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional
import json
import os
from pathlib import Path

router = APIRouter()

# Configuration file path
CONFIG_DIR = Path(__file__).parent.parent / "config"
CONFIG_FILE = CONFIG_DIR / "agent_configs.json"

# Ensure config directory exists
CONFIG_DIR.mkdir(exist_ok=True)

class MetricsCategory(BaseModel):
    enabled: bool
    avgResponseTime: Optional[bool] = None
    tokenUsage: Optional[bool] = None
    toolExecutionTime: Optional[bool] = None
    errorRate: Optional[bool] = None
    userSatisfaction: Optional[bool] = None
    responseAccuracy: Optional[bool] = None
    toolSuccessRate: Optional[bool] = None
    retryRate: Optional[bool] = None
    costPerInteraction: Optional[bool] = None
    valueDelivered: Optional[bool] = None
    userEngagement: Optional[bool] = None
    problemResolutionRate: Optional[bool] = None

class AgentMetrics(BaseModel):
    performance: Optional[MetricsCategory] = None
    quality: Optional[MetricsCategory] = None
    business: Optional[MetricsCategory] = None

class AgentConfig(BaseModel):
    name: str
    description: str
    status: str
    temperature: float
    maxTokens: int
    systemPrompt: str
    dataScope: str
    confidenceThreshold: float
    enabled: bool
    metrics: Optional[AgentMetrics] = None

# Default agent configurations
DEFAULT_CONFIGS = {
    "performance_analyst": {
        "name": "Performance Analyst",
        "description": "Analyzes production performance metrics and KPIs",
        "status": "production",
        "temperature": 0.7,
        "maxTokens": 4000,
        "systemPrompt": "You are a performance analyst agent focused on analyzing production metrics, OEE, throughput, and operational KPIs.",
        "dataScope": "all",
        "confidenceThreshold": 0.8,
        "enabled": True,
        "metrics": {
            "performance": {"enabled": True, "avgResponseTime": True, "tokenUsage": True, "toolExecutionTime": True, "errorRate": True},
            "quality": {"enabled": True, "userSatisfaction": True, "responseAccuracy": True, "toolSuccessRate": True, "retryRate": True},
            "business": {"enabled": True, "costPerInteraction": True, "valueDelivered": True, "userEngagement": True, "problemResolutionRate": True}
        }
    },
    "data_quality": {
        "name": "Data Quality",
        "description": "Ensures data integrity and quality standards",
        "status": "production",
        "temperature": 0.6,
        "maxTokens": 3500,
        "systemPrompt": "You are a data quality agent focused on validating data integrity, detecting anomalies, and ensuring data quality standards.",
        "dataScope": "all",
        "confidenceThreshold": 0.85,
        "enabled": True,
        "metrics": {
            "performance": {"enabled": True, "avgResponseTime": True, "tokenUsage": True, "toolExecutionTime": True, "errorRate": True},
            "quality": {"enabled": True, "userSatisfaction": True, "responseAccuracy": True, "toolSuccessRate": True, "retryRate": True},
            "business": {"enabled": True, "costPerInteraction": True, "valueDelivered": True, "userEngagement": True, "problemResolutionRate": True}
        }
    },
    "line_operations": {
        "name": "Line Operations",
        "description": "Monitors production line operations and efficiency",
        "status": "production",
        "temperature": 0.7,
        "maxTokens": 4000,
        "systemPrompt": "You are a line operations agent focused on monitoring production lines, analyzing efficiency, and identifying operational issues.",
        "dataScope": "all",
        "confidenceThreshold": 0.8,
        "enabled": True,
        "metrics": {
            "performance": {"enabled": True, "avgResponseTime": True, "tokenUsage": True, "toolExecutionTime": True, "errorRate": True},
            "quality": {"enabled": True, "userSatisfaction": True, "responseAccuracy": True, "toolSuccessRate": True, "retryRate": True},
            "business": {"enabled": True, "costPerInteraction": True, "valueDelivered": True, "userEngagement": True, "problemResolutionRate": True}
        }
    },
    "downtime_rca": {
        "name": "Downtime RCA",
        "description": "Performs root cause analysis on downtime events",
        "status": "production",
        "temperature": 0.5,
        "maxTokens": 4500,
        "systemPrompt": "You are a root cause analysis agent focused on investigating downtime events, identifying causes, and recommending corrective actions.",
        "dataScope": "all",
        "confidenceThreshold": 0.85,
        "enabled": True,
        "metrics": {
            "performance": {"enabled": True, "avgResponseTime": True, "tokenUsage": True, "toolExecutionTime": True, "errorRate": True},
            "quality": {"enabled": True, "userSatisfaction": True, "responseAccuracy": True, "toolSuccessRate": True, "retryRate": True},
            "business": {"enabled": True, "costPerInteraction": True, "valueDelivered": True, "userEngagement": True, "problemResolutionRate": True}
        }
    },
    "bottleneck_constraint": {
        "name": "Bottleneck & Constraint",
        "description": "Identifies production bottlenecks and constraints",
        "status": "production",
        "temperature": 0.6,
        "maxTokens": 4000,
        "systemPrompt": "You are a bottleneck analysis agent focused on identifying production constraints, throughput limitations, and optimization opportunities.",
        "dataScope": "all",
        "confidenceThreshold": 0.8,
        "enabled": True,
        "metrics": {
            "performance": {"enabled": True, "avgResponseTime": True, "tokenUsage": True, "toolExecutionTime": True, "errorRate": True},
            "quality": {"enabled": True, "userSatisfaction": True, "responseAccuracy": True, "toolSuccessRate": True, "retryRate": True},
            "business": {"enabled": True, "costPerInteraction": True, "valueDelivered": True, "userEngagement": True, "problemResolutionRate": True}
        }
    },
    "operations_recommendation": {
        "name": "Operations Recommendation",
        "description": "Generates actionable operational recommendations",
        "status": "production",
        "temperature": 0.4,
        "maxTokens": 4000,
        "systemPrompt": "You are an operations recommendation agent focused on generating actionable recommendations to improve production efficiency and performance.",
        "dataScope": "all",
        "confidenceThreshold": 0.9,
        "enabled": True,
        "metrics": {
            "performance": {"enabled": True, "avgResponseTime": True, "tokenUsage": True, "toolExecutionTime": True, "errorRate": True},
            "quality": {"enabled": True, "userSatisfaction": True, "responseAccuracy": True, "toolSuccessRate": True, "retryRate": True},
            "business": {"enabled": True, "costPerInteraction": True, "valueDelivered": True, "userEngagement": True, "problemResolutionRate": True}
        }
    },
    "executive_briefing": {
        "name": "Executive Briefing",
        "description": "Creates executive-level summaries and insights",
        "status": "production",
        "temperature": 0.5,
        "maxTokens": 3500,
        "systemPrompt": "You are an executive briefing agent focused on creating concise, high-level summaries of production performance for executive decision-making.",
        "dataScope": "all",
        "confidenceThreshold": 0.85,
        "enabled": True,
        "metrics": {
            "performance": {"enabled": True, "avgResponseTime": True, "tokenUsage": True, "toolExecutionTime": True, "errorRate": True},
            "quality": {"enabled": True, "userSatisfaction": True, "responseAccuracy": True, "toolSuccessRate": True, "retryRate": True},
            "business": {"enabled": True, "costPerInteraction": True, "valueDelivered": True, "userEngagement": True, "problemResolutionRate": True}
        }
    },
    "analyze_performance": {
        "name": "Performance Analysis (Legacy)",
        "description": "Legacy performance analysis functionality",
        "status": "production",
        "temperature": 0.7,
        "maxTokens": 4000,
        "systemPrompt": "You are a performance analysis agent providing comprehensive production performance analysis and insights.",
        "dataScope": "all",
        "confidenceThreshold": 0.8,
        "enabled": True,
        "metrics": {
            "performance": {"enabled": True, "avgResponseTime": True, "tokenUsage": True, "toolExecutionTime": True, "errorRate": True},
            "quality": {"enabled": True, "userSatisfaction": True, "responseAccuracy": True, "toolSuccessRate": True, "retryRate": True},
            "business": {"enabled": True, "costPerInteraction": True, "valueDelivered": True, "userEngagement": True, "problemResolutionRate": True}
        }
    }
}

def load_configs() -> Dict[str, Any]:
    """Load agent configurations from file, or return defaults if file doesn't exist"""
    try:
        if CONFIG_FILE.exists():
            with open(CONFIG_FILE, 'r') as f:
                return json.load(f)
        else:
            # Create default config file
            save_configs(DEFAULT_CONFIGS)
            return DEFAULT_CONFIGS
    except Exception as e:
        print(f"Error loading configs: {e}")
        return DEFAULT_CONFIGS

def save_configs(configs: Dict[str, Any]) -> bool:
    """Save agent configurations to file"""
    try:
        with open(CONFIG_FILE, 'w') as f:
            json.dump(configs, f, indent=2)
        return True
    except Exception as e:
        print(f"Error saving configs: {e}")
        return False

@router.get("/api/agent/configs")
async def get_all_configs():
    """Get all agent configurations"""
    configs = load_configs()
    return {"configs": configs}

@router.get("/api/agent/config/{agent_id}")
async def get_agent_config(agent_id: str):
    """Get configuration for a specific agent"""
    configs = load_configs()

    if agent_id not in configs:
        raise HTTPException(status_code=404, detail=f"Agent {agent_id} not found")

    return {"agent_id": agent_id, "config": configs[agent_id]}

@router.put("/api/agent/config/{agent_id}")
async def update_agent_config(agent_id: str, config: AgentConfig):
    """Update configuration for a specific agent"""
    configs = load_configs()

    # Convert Pydantic model to dict
    config_dict = config.dict()

    # Update the configuration
    configs[agent_id] = config_dict

    # Save to file
    if save_configs(configs):
        return {
            "message": f"Configuration for {agent_id} updated successfully",
            "agent_id": agent_id,
            "config": config_dict
        }
    else:
        raise HTTPException(status_code=500, detail="Failed to save configuration")

@router.post("/api/agent/config/reset/{agent_id}")
async def reset_agent_config(agent_id: str):
    """Reset agent configuration to default"""
    if agent_id not in DEFAULT_CONFIGS:
        raise HTTPException(status_code=404, detail=f"Agent {agent_id} not found")

    configs = load_configs()
    configs[agent_id] = DEFAULT_CONFIGS[agent_id]

    if save_configs(configs):
        return {
            "message": f"Configuration for {agent_id} reset to default",
            "agent_id": agent_id,
            "config": configs[agent_id]
        }
    else:
        raise HTTPException(status_code=500, detail="Failed to reset configuration")

@router.post("/api/agent/config/reset-all")
async def reset_all_configs():
    """Reset all agent configurations to defaults"""
    if save_configs(DEFAULT_CONFIGS):
        return {
            "message": "All configurations reset to defaults",
            "configs": DEFAULT_CONFIGS
        }
    else:
        raise HTTPException(status_code=500, detail="Failed to reset configurations")

@router.get("/api/agent/config/{agent_id}/status")
async def get_agent_status(agent_id: str):
    """Get the enabled/disabled status of an agent"""
    configs = load_configs()

    if agent_id not in configs:
        raise HTTPException(status_code=404, detail=f"Agent {agent_id} not found")

    return {
        "agent_id": agent_id,
        "enabled": configs[agent_id].get("enabled", True)
    }
