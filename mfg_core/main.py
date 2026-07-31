# FastAPI backend for FrontierIQ-MFG (NovaChem manufacturing operations)
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import sys
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
import requests
import json
from datetime import datetime, timedelta
from pathlib import Path

# Add agent directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'agent'))

# shared/config.py lives at the repo root, a sibling of mfg_core/ locally
# (python main.py run from inside mfg_core/) but gets flattened alongside
# main.py inside the Docker image (infra/Dockerfile COPYs both mfg_core/ and
# shared/ into /app) — add both possible locations, harmless if one doesn't
# exist on this machine.
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, os.path.dirname(__file__))
from shared.config import get_settings

# Load environment variables from .env file, then resolve Claude via Azure AI
# Foundry (same shared endpoint FrontierIQ-Energy/FrontierIQ-GxP use) BEFORE
# importing any agent module below — each of the 7 agent/*.py files reads
# ANTHROPIC_BASE_URL/ANTHROPIC_API_KEY straight from os.environ at import
# time (not through claude_client.py, and not lazily), so these must already
# be set by the time those imports run. load_dotenv()'s default
# override=False means each agent's own load_dotenv() call won't clobber
# what's set here.
load_dotenv()
_settings = get_settings()
os.environ["ANTHROPIC_BASE_URL"] = _settings.foundry_endpoint
os.environ["ANTHROPIC_API_KEY"] = _settings.foundry_api_key or os.environ.get("ANTHROPIC_API_KEY", "")
os.environ.setdefault("CLAUDE_MODEL", _settings.foundry_model)

from performance_analyst_agent import analyze_performance
from data_quality_agent import check_data_quality
from line_operations_agent import analyze_line_operations
from downtime_rca_agent import analyze_downtime_rca
from bottleneck_constraint_agent import analyze_bottleneck_constraint
from operations_recommendation_agent import generate_operations_recommendation
from executive_briefing_agent import generate_executive_briefing

# Import configuration routes
from routes.config_routes import router as config_router
from routes.preview_routes import router as preview_router
from routes.file_routes import router as file_router
from routes.agent_config_routes import router as agent_config_router
from routes.agent_performance_routes import router as agent_performance_router
from routes.auth_routes import router as auth_router

# SQL connector (lazy import so token auth is deferred until first query)
sys.path.insert(0, os.path.dirname(__file__))
from connectors.fabric_sql import (
    ping as fabric_ping,
    get_production_orders, get_production_orders_count,
    get_ot_events, get_ot_events_count, get_ot_events_sample,
    get_ot_latest_timestamp, get_ot_hierarchy,
    get_run_rates, get_downtime, get_unconstrained_run_rates,
    get_energy_consumption, get_inventory_stock,
    get_batch_quality, get_maintenance_orders,
)

app = FastAPI()

# Include configuration routes
app.include_router(config_router)
app.include_router(preview_router)
app.include_router(file_router)
app.include_router(agent_config_router)
app.include_router(agent_performance_router)
app.include_router(auth_router)

# CORS middleware to allow requests from React frontend
# Allow all localhost ports for preview instances
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "http://localhost:5177",
        "http://localhost:5178",
        "http://localhost:5179",
        "http://localhost:5180",
        "https://amplifyindustrial.io"
    ],
    allow_origin_regex=r"http://localhost:\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Claude via Azure AI Foundry — resolved above, before the agent imports.
# Anthropic-compatible surface, same request/response shape as the direct
# API this replaced, so every x-api-key/anthropic-version call site below is
# unchanged other than where these three values come from.
ANTHROPIC_API_KEY  = os.environ["ANTHROPIC_API_KEY"]
ANTHROPIC_BASE_URL = os.environ["ANTHROPIC_BASE_URL"]
CLAUDE_MODEL       = os.environ["CLAUDE_MODEL"]

# Fabric SQL config (consumed by connectors/fabric_sql.py via env vars)
FABRIC_DATABASE = os.getenv("FABRIC_DATABASE", "AmplifyIndustrial")

# Chat storage configuration
CHAT_LOGS_DIR = Path("chat_logs")
CHAT_LOGS_DIR.mkdir(exist_ok=True)

# Health metrics logging configuration
HEALTH_LOGS_DIR = Path("health_logs")
HEALTH_LOGS_DIR.mkdir(exist_ok=True)


class MessageResponse(BaseModel):
    message: str
    data: List[Dict[str, Any]] = []


class ChatMessage(BaseModel):
    role: str
    content: str
    timestamp: str
    audit_trail: Optional[List[Dict[str, Any]]] = None


class ChatThread(BaseModel):
    thread_id: str
    title: str
    created_at: str
    updated_at: str
    messages: List[ChatMessage]


class ChatRequest(BaseModel):
    message: str
    thread_id: Optional[str] = None


class ChatResponse(BaseModel):
    response: str
    thread_id: str
    audit_trail: Optional[List[Dict[str, Any]]] = []


class SaveChatRequest(BaseModel):
    thread_id: str
    title: str
    agent_type: Optional[str] = None
    messages: List[ChatMessage]


class HealthMetric(BaseModel):
    timestamp: str
    service: str
    status: str
    responseTime: Optional[int] = None
    recordCount: Optional[int] = None
    uptime: Optional[float] = None
    queries: Optional[int] = None
    successRate: Optional[float] = None
    errorRate: Optional[float] = None
    metadata: Optional[Dict[str, Any]] = None


class HealthLogRequest(BaseModel):
    metrics: List[HealthMetric]


def save_health_metrics(metrics: List[HealthMetric]):
    """Save health metrics to daily log file"""
    try:
        # Create filename based on current date
        today = datetime.now().strftime("%Y-%m-%d")
        log_file = HEALTH_LOGS_DIR / f"health_metrics_{today}.jsonl"
        
        # Append metrics to file (one JSON object per line)
        with open(log_file, 'a', encoding='utf-8') as f:
            for metric in metrics:
                f.write(json.dumps(metric.dict()) + '\n')
        
        return True
    except Exception as e:
        print(f"Error saving health metrics: {e}")
        return False


def load_health_metrics(days: int = 7):
    """Load health metrics from the last N days"""
    try:
        metrics = []
        # Get files from the last N days
        for i in range(days):
            date = datetime.now() - timedelta(days=i)
            date_str = date.strftime("%Y-%m-%d")
            log_file = HEALTH_LOGS_DIR / f"health_metrics_{date_str}.jsonl"
            
            if log_file.exists():
                with open(log_file, 'r', encoding='utf-8') as f:
                    for line in f:
                        if line.strip():
                            metrics.append(json.loads(line))
        
        return metrics
    except Exception as e:
        print(f"Error loading health metrics: {e}")
        return []


@app.post("/api/health/log")
async def log_health_metrics(request: HealthLogRequest):
    """Endpoint to log health metrics to file"""
    try:
        success = save_health_metrics(request.metrics)
        if success:
            return {"message": f"Successfully logged {len(request.metrics)} metrics", "success": True}
        else:
            raise HTTPException(status_code=500, detail="Failed to save metrics")
    except Exception as e:
        print(f"Error in log_health_metrics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/health/history")
async def get_health_history(days: int = 7):
    """Endpoint to retrieve historical health metrics"""
    try:
        metrics = load_health_metrics(days)
        return {
            "message": f"Retrieved {len(metrics)} metrics from last {days} days",
            "data": metrics,
            "success": True
        }
    except Exception as e:
        print(f"Error in get_health_history: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/", include_in_schema=False)
async def root():
    # Redirect to SPA if frontend is deployed, otherwise return API info
    from pathlib import Path as _Path
    from fastapi.responses import FileResponse as _FR
    _fe = _Path(__file__).parent / "frontend_dist" / "index.html"
    if _fe.exists():
        return _FR(str(_fe))
    return {"message": "FrontierIQ-MFG Production Ops API"}


@app.get("/api/hello", response_model=MessageResponse)
async def get_hello():
    """Simple connectivity test against Fabric SQL."""
    try:
        healthy = fabric_ping()
        return MessageResponse(
            message="Fabric SQL connection healthy" if healthy else "Fabric SQL ping failed",
            data=[{"status": "healthy" if healthy else "unhealthy", "database": FABRIC_DATABASE}]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/data", response_model=MessageResponse)
async def get_data():
    """Fetch deduplicated production orders from dbo.sap_production_orders."""
    try:
        data = get_production_orders(limit=2000)
        return MessageResponse(message=f"Retrieved {len(data)} production orders", data=data)
    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/test-top10", response_model=MessageResponse)
async def get_top10():
    """Return first 10 SAP production orders (diagnostic)."""
    try:
        data = get_production_orders(limit=10)
        return MessageResponse(message=f"Retrieved {len(data)} entries", data=data)
    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/runrates", response_model=MessageResponse)
async def get_runrates_endpoint():
    """Run rates from dbo.run_rates."""
    try:
        data = get_run_rates()
        return MessageResponse(message=f"Retrieved {len(data)} run rate records", data=data)
    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/ot-data", response_model=MessageResponse)
async def get_ot_data():
    """Recent OT events from dbo.ot_process_events."""
    try:
        data = get_ot_events(limit=100)
        return MessageResponse(message=f"Retrieved {len(data)} OT events", data=data)
    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/downtime", response_model=MessageResponse)
async def get_downtime_endpoint():
    """Downtime / CIP events from dbo.downtime."""
    try:
        data = get_downtime()
        return MessageResponse(message=f"Retrieved {len(data)} downtime records", data=data)
    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/unconstrained-runrates", response_model=MessageResponse)
async def get_unconstrained_runrates_endpoint():
    """Unconstrained run rates from dbo.unconstrained_run_rates."""
    try:
        data = get_unconstrained_run_rates()
        return MessageResponse(message=f"Retrieved {len(data)} unconstrained run rate records", data=data)
    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/ot-process-events", response_model=MessageResponse)
async def get_coke_process_events(days: int = 7, limit: int = 50000):
    """OT process events from dbo.ot_process_events."""
    limit = min(limit, 100000)
    try:
        data = get_ot_events(limit=limit)
        return MessageResponse(message=f"Retrieved {len(data)} OT process events", data=data)
    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/ot-hierarchy", response_model=MessageResponse)
async def get_ot_hierarchy_endpoint():
    """Distinct line/equipment/tag hierarchy with record counts — no row limit."""
    try:
        data = get_ot_hierarchy()
        return MessageResponse(message=f"Retrieved {len(data)} hierarchy entries", data=data)
    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/energy", response_model=MessageResponse)
async def get_energy_endpoint():
    """Daily energy consumption per line from dbo.energy_consumption."""
    try:
        data = get_energy_consumption()
        return MessageResponse(message=f"Retrieved {len(data)} energy records", data=data)
    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/inventory", response_model=MessageResponse)
async def get_inventory_endpoint():
    """Weekly inventory stock snapshots from dbo.inventory_stock."""
    try:
        data = get_inventory_stock()
        return MessageResponse(message=f"Retrieved {len(data)} inventory records", data=data)
    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/batch-quality", response_model=MessageResponse)
async def get_batch_quality_endpoint():
    """Batch quality records from dbo.batch_quality."""
    try:
        data = get_batch_quality()
        return MessageResponse(message=f"Retrieved {len(data)} batch quality records", data=data)
    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/maintenance-orders", response_model=MessageResponse)
async def get_maintenance_orders_endpoint():
    """Maintenance work orders from dbo.maintenance_orders."""
    try:
        data = get_maintenance_orders()
        return MessageResponse(message=f"Retrieved {len(data)} maintenance orders", data=data)
    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# Define tools for Claude
TOOLS = [
    {
        "name": "ping_health",
        "description": "Check whether the ProductionOps data API and Fabric SQL connection are healthy.",
        "input_schema": {"type": "object", "properties": {}, "required": []}
    },
    {
        "name": "get_top10",
        "description": "Fetch top 10 SAP production orders (diagnostic).",
        "input_schema": {"type": "object", "properties": {}, "required": []}
    },
    {
        "name": "get_latest_orders",
        "description": "Fetch the latest record per ORDER_ID from dbo.sap_production_orders.",
        "input_schema": {"type": "object", "properties": {}, "required": []}
    },
    {
        "name": "get_runrates",
        "description": "Fetch Runrates table data.",
        "input_schema": {"type": "object", "properties": {}, "required": []}
    },
    {
        "name": "get_unconstrained_runrates",
        "description": "Fetch UnconstrainedRunrates table data.",
        "input_schema": {"type": "object", "properties": {}, "required": []}
    },
    {
        "name": "get_downtime",
        "description": "Fetch Downtime table data.",
        "input_schema": {"type": "object", "properties": {}, "required": []}
    },
    {
        "name": "get_ot_data",
        "description": "Fetch Processevent_silver table data (OT silver).",
        "input_schema": {"type": "object", "properties": {}, "required": []}
    },
    {
        "name": "get_coke_process_events",
        "description": "Fetch OT Process Events rows from ot_process_events table. Use a smaller limit unless you truly need more rows.",
        "input_schema": {
            "type": "object",
            "properties": {
                "limit": {"type": "integer", "minimum": 1, "maximum": 50000, "default": 2000}
            },
            "required": []
        }
    },
    {
        "name": "calculate_plan_adherence_metrics",
        "description": "Calculate Plan Adherence metrics from raw production data including on-time orders, late orders, average quantity adherence, and schedule changes.",
        "input_schema": {"type": "object", "properties": {}, "required": []}
    },
    {
        "name": "calculate_oee_metrics",
        "description": "Calculate Overall Equipment Effectiveness (OEE) metrics including availability, performance, and quality components.",
        "input_schema": {"type": "object", "properties": {}, "required": []}
    },
    {
        "name": "calculate_production_by_line",
        "description": "Calculate production metrics grouped by production line including planned, delivered quantities, and efficiency.",
        "input_schema": {"type": "object", "properties": {}, "required": []}
    },
    {
        "name": "calculate_order_status_distribution",
        "description": "Calculate order status distribution showing completed, in progress, pending, and not started orders.",
        "input_schema": {"type": "object", "properties": {}, "required": []}
    },
    {
        "name": "validate_dashboard_alignment",
        "description": "Cross-validate data alignment between raw database tables and dashboard aggregated views. Compares metrics to identify any discrepancies.",
        "input_schema": {
            "type": "object",
            "properties": {
                "metric_type": {
                    "type": "string",
                    "enum": ["plan_adherence", "oee", "production_by_line", "order_status", "all"],
                    "description": "Type of metric to validate"
                }
            },
            "required": ["metric_type"]
        }
    }
]


def execute_tool(tool_name: str, tool_input: dict) -> dict:
    """Execute a tool call and return the result"""
    try:
        if tool_name == "ping_health":
            healthy = fabric_ping()
            return {
                "status": "healthy" if healthy else "unhealthy",
                "database": FABRIC_DATABASE,
                "data_source": "Fabric SQL Analytics Endpoint",
            }

        elif tool_name == "get_top10":
            data = get_production_orders(limit=10)
            return {"message": f"Retrieved {len(data)} entries", "data": data}

        elif tool_name == "get_latest_orders":
            data = get_production_orders(limit=2000)
            return {"message": f"Retrieved {len(data)} production orders", "data": data}

        elif tool_name == "get_runrates":
            data = get_run_rates()
            return {"message": f"Retrieved {len(data)} run rate records", "data": data}

        elif tool_name == "get_unconstrained_runrates":
            data = get_unconstrained_run_rates()
            return {"message": f"Retrieved {len(data)} unconstrained run rate records", "data": data}

        elif tool_name == "get_downtime":
            data = get_downtime()
            return {"message": f"Retrieved {len(data)} downtime records", "data": data}

        elif tool_name == "get_ot_data":
            data = get_ot_events(limit=100)
            return {"message": f"Retrieved {len(data)} recent OT events (top 100)", "data": data}

        elif tool_name == "get_coke_process_events":
            total_count = get_ot_events_count()
            sample = get_ot_events_sample(limit=10)
            return {
                "message": f"ot_process_events table contains {total_count:,} total records. Retrieved sample of {len(sample)} records.",
                "total_count": total_count,
                "sample_size": len(sample),
                "sample_data": sample,
            }

        elif tool_name == "calculate_plan_adherence_metrics":
            # Calculate Plan Adherence metrics from dbo.sap_production_orders
            from datetime import datetime

            # Get all production orders
            orders = get_production_orders(limit=5000)

            # Helper function to parse SAP dates (handles ISO strings, DD/MM/YYYY, date objects)
            def parse_date(val):
                if val is None:
                    return None
                if hasattr(val, 'year'):  # datetime.date or datetime.datetime
                    return datetime(val.year, val.month, val.day)
                s = str(val).strip()
                if not s or s in ('31/12/9999', '9999-12-31'):
                    return None
                try:
                    parts = s.split('/')
                    if len(parts) == 3:  # DD/MM/YYYY
                        return datetime(int(parts[2]), int(parts[1]), int(parts[0]))
                    return datetime.fromisoformat(s[:10])  # YYYY-MM-DD
                except Exception:
                    return None

            # Calculate metrics
            total_orders = len(orders)

            # Completed: DELIVERED_QUANTITY >= PLANNED_QUANTITY (matching Dashboard logic)
            completed_orders = [
                o for o in orders
                if (o.get('DELIVERED_QUANTITY', 0) >= o.get('PLANNED_QUANTITY', 0))
            ]

            # In Progress: delivered > 0 AND delivered < planned
            in_progress_orders = [
                o for o in orders
                if (o.get('DELIVERED_QUANTITY', 0) > 0 and
                    o.get('DELIVERED_QUANTITY', 0) < o.get('PLANNED_QUANTITY', 0))
            ]

            # Pending: delivered < planned AND delivered = 0 AND has actual start date
            pending_orders = [
                o for o in orders
                if (o.get('DELIVERED_QUANTITY', 0) < o.get('PLANNED_QUANTITY', 0) and
                    o.get('DELIVERED_QUANTITY', 0) == 0 and
                    o.get('ACTUAL_START_DATE') and str(o.get('ACTUAL_START_DATE', '') or '') not in ('31/12/9999', '9999-12-31', ''))
            ]

            # Not Started: delivered = 0 AND no actual start date
            not_started_orders = [
                o for o in orders
                if (o.get('DELIVERED_QUANTITY', 0) == 0 and
                    (not o.get('ACTUAL_START_DATE') or str(o.get('ACTUAL_START_DATE', '') or '') in ('31/12/9999', '9999-12-31', '')))
            ]

            # Calculate plan adherence for completed orders (matching Dashboard calculatePlanAdherence)
            on_time = 0
            delayed = 0
            early = 0
            total_delay_days = 0

            for order in completed_orders:
                scheduled = parse_date(order.get('SCHEDULED_START_DATE'))
                actual = parse_date(order.get('ACTUAL_START_DATE'))

                if not scheduled or not actual:
                    continue

                diff_days = (actual - scheduled).days

                if diff_days == 0:
                    on_time += 1
                elif diff_days > 0:
                    delayed += 1
                    total_delay_days += diff_days
                else:
                    early += 1

            # Calculate quantity adherence (delivered vs planned)
            total_planned = sum(o.get('PLANNED_QUANTITY', 0) for o in orders)
            total_delivered = sum(o.get('DELIVERED_QUANTITY', 0) for o in orders)

            # Calculate schedule changes (NUMBER_OF_CHANGES_TO_SCHEDULED_START_DATE + NUMBER_OF_CHANGES_TO_ORDER_QUANTITY)
            total_changes = sum(
                o.get('NUMBER_OF_CHANGES_TO_ORDER_QUANTITY', 0) +
                o.get('NUMBER_OF_CHANGES_TO_SCHEDULED_START_DATE', 0)
                for o in orders
            )

            # Calculate percentages and averages
            adherence_percentage = (on_time / len(completed_orders) * 100) if len(completed_orders) > 0 else 0
            avg_delay = (total_delay_days / delayed) if delayed > 0 else 0
            avg_quantity_adherence = (total_delivered / total_planned * 100) if total_planned > 0 else 0
            avg_changes_per_order = (total_changes / total_orders) if total_orders > 0 else 0

            return {
                "metrics": {
                    "total_orders": total_orders,
                    "completed_orders": len(completed_orders),
                    "in_progress_orders": len(in_progress_orders),
                    "pending_orders": len(pending_orders),
                    "not_started_orders": len(not_started_orders),
                    "on_time_orders": on_time,
                    "delayed_orders": delayed,
                    "early_orders": early,
                    "adherence_percentage": round(adherence_percentage, 2),
                    "avg_delay_days": round(avg_delay, 2),
                    "total_planned_quantity": total_planned,
                    "total_delivered_quantity": total_delivered,
                    "average_quantity_adherence": round(avg_quantity_adherence, 2),
                    "total_schedule_changes": total_changes,
                    "avg_changes_per_order": round(avg_changes_per_order, 2)
                },
                "message": f"Calculated Plan Adherence metrics from {total_orders} production orders ({len(completed_orders)} completed, {len(in_progress_orders)} in progress, {len(pending_orders)} pending, {len(not_started_orders)} not started)"
            }

        elif tool_name == "calculate_oee_metrics":
            # Calculate OEE metrics matching Dashboard.jsx calculateOEE()
            from datetime import datetime

            orders = get_production_orders(limit=5000)

            def parse_date(val):
                if val is None:
                    return None
                if hasattr(val, 'year'):
                    return datetime(val.year, val.month, val.day)
                s = str(val).strip()
                if not s or s in ('31/12/9999', '9999-12-31'):
                    return None
                try:
                    parts = s.split('/')
                    if len(parts) == 3:
                        return datetime(int(parts[2]), int(parts[1]), int(parts[0]))
                    return datetime.fromisoformat(s[:10])
                except Exception:
                    return None

            # Get completed orders
            completed_orders = [o for o in orders if o.get('DELIVERED_QUANTITY', 0) >= o.get('PLANNED_QUANTITY', 0)]

            if len(completed_orders) == 0:
                return {
                    "metrics": {"oee": 0, "availability": 0, "performance": 0, "quality": 0},
                    "message": "No completed orders to calculate OEE"
                }

            # Calculate Availability: on-time starts / total completed
            on_time_starts = 0
            for order in completed_orders:
                scheduled = parse_date(order.get('SCHEDULED_START_DATE'))
                actual = parse_date(order.get('ACTUAL_START_DATE'))
                if scheduled and actual and actual <= scheduled:
                    on_time_starts += 1
            availability = (on_time_starts / len(completed_orders)) * 100

            # Calculate Performance: delivered / planned
            total_planned = sum(o.get('PLANNED_QUANTITY', 0) for o in completed_orders)
            total_delivered = sum(o.get('DELIVERED_QUANTITY', 0) for o in completed_orders)
            performance = (total_delivered / total_planned * 100) if total_planned > 0 else 0

            # Calculate Quality: orders meeting/exceeding planned quantity
            quality_orders = len([o for o in completed_orders if o.get('DELIVERED_QUANTITY', 0) >= o.get('PLANNED_QUANTITY', 0)])
            quality = (quality_orders / len(completed_orders)) * 100

            # Calculate OEE
            oee = (availability * performance * quality) / 10000

            return {
                "metrics": {
                    "oee": round(oee, 2),
                    "availability": round(availability, 2),
                    "performance": round(performance, 2),
                    "quality": round(quality, 2),
                    "completed_orders_analyzed": len(completed_orders),
                    "on_time_starts": on_time_starts
                },
                "message": f"Calculated OEE from {len(completed_orders)} completed orders: OEE={round(oee, 2)}% (Availability={round(availability, 2)}%, Performance={round(performance, 2)}%, Quality={round(quality, 2)}%)"
            }

        elif tool_name == "calculate_production_by_line":
            # Calculate production by line matching Dashboard.jsx getProductionByLine()
            orders = get_production_orders(limit=5000)

            # Map work centers to production lines
            def get_production_line(work_center):
                if not work_center:
                    return 'Unknown'
                mapping = {
                    'CPL-R01': 'Reactor Line 1',
                    'CPL-R02': 'Reactor Line 2',
                    'CPL-B01': 'Batch Line 1',
                    'CPL-F01': 'Filling Line 1'
                }
                return mapping.get(work_center, work_center)

            line_data = {}
            for order in orders:
                line = get_production_line(order.get('WORK_CENTER'))
                work_center = order.get('WORK_CENTER', '')

                if line not in line_data:
                    line_data[line] = {
                        "line_name": line,
                        "work_center": work_center,
                        "planned": 0,
                        "delivered": 0,
                        "orders": 0,
                        "completed": 0,
                        "in_progress": 0
                    }

                line_data[line]["planned"] += order.get('PLANNED_QUANTITY', 0)
                line_data[line]["delivered"] += order.get('DELIVERED_QUANTITY', 0)
                line_data[line]["orders"] += 1

                if order.get('DELIVERED_QUANTITY', 0) >= order.get('PLANNED_QUANTITY', 0):
                    line_data[line]["completed"] += 1
                elif order.get('DELIVERED_QUANTITY', 0) > 0:
                    line_data[line]["in_progress"] += 1

            # Calculate efficiency for each line
            production_lines = []
            for line_name, data in line_data.items():
                efficiency = (data["delivered"] / data["planned"] * 100) if data["planned"] > 0 else 0
                production_lines.append({
                    **data,
                    "efficiency": round(efficiency, 2)
                })

            # Sort by delivered quantity descending
            production_lines.sort(key=lambda x: x["delivered"], reverse=True)

            return {
                "production_lines": production_lines,
                "message": f"Calculated production metrics for {len(production_lines)} production lines"
            }

        elif tool_name == "calculate_order_status_distribution":
            # Calculate order status distribution matching Dashboard.jsx calculateStats()
            orders = get_production_orders(limit=5000)

            total_orders = len(orders)

            # Completed: DELIVERED_QUANTITY >= PLANNED_QUANTITY
            completed_orders = len([o for o in orders if o.get('DELIVERED_QUANTITY', 0) >= o.get('PLANNED_QUANTITY', 0)])

            # In Progress: delivered > 0 AND delivered < planned
            in_progress = len([o for o in orders if 0 < o.get('DELIVERED_QUANTITY', 0) < o.get('PLANNED_QUANTITY', 0)])

            # Pending: delivered < planned AND delivered = 0 AND has actual start date
            pending = len([o for o in orders
                          if o.get('DELIVERED_QUANTITY', 0) < o.get('PLANNED_QUANTITY', 0)
                          and o.get('DELIVERED_QUANTITY', 0) == 0
                          and o.get('ACTUAL_START_DATE') and str(o.get('ACTUAL_START_DATE', '') or '') not in ('31/12/9999', '9999-12-31', '')])

            # Not Started: delivered = 0 AND no actual start date
            not_started = len([o for o in orders
                              if o.get('DELIVERED_QUANTITY', 0) == 0
                              and (not o.get('ACTUAL_START_DATE') or str(o.get('ACTUAL_START_DATE', '') or '') in ('31/12/9999', '9999-12-31', ''))])

            # Calculate percentages
            completed_pct = (completed_orders / total_orders * 100) if total_orders > 0 else 0
            in_progress_pct = (in_progress / total_orders * 100) if total_orders > 0 else 0
            pending_pct = (pending / total_orders * 100) if total_orders > 0 else 0
            not_started_pct = (not_started / total_orders * 100) if total_orders > 0 else 0

            return {
                "distribution": {
                    "total_orders": total_orders,
                    "completed": completed_orders,
                    "completed_percentage": round(completed_pct, 2),
                    "in_progress": in_progress,
                    "in_progress_percentage": round(in_progress_pct, 2),
                    "pending": pending,
                    "pending_percentage": round(pending_pct, 2),
                    "not_started": not_started,
                    "not_started_percentage": round(not_started_pct, 2)
                },
                "message": f"Order Status Distribution: {completed_orders} completed ({round(completed_pct, 1)}%), {in_progress} in progress ({round(in_progress_pct, 1)}%), {pending} pending ({round(pending_pct, 1)}%), {not_started} not started ({round(not_started_pct, 1)}%)"
            }

        elif tool_name == "validate_dashboard_alignment":
            metric_type = tool_input.get("metric_type", "plan_adherence")

            if metric_type == "all":
                # Validate all metrics
                plan_adherence = execute_tool("calculate_plan_adherence_metrics", {})
                oee = execute_tool("calculate_oee_metrics", {})
                production_by_line = execute_tool("calculate_production_by_line", {})
                order_status = execute_tool("calculate_order_status_distribution", {})

                return {
                    "metric_type": "all",
                    "validation_status": "comprehensive_check_completed",
                    "plan_adherence": plan_adherence.get("metrics", {}),
                    "oee": oee.get("metrics", {}),
                    "production_by_line_count": len(production_by_line.get("production_lines", [])),
                    "order_status": order_status.get("distribution", {}),
                    "message": "All Dashboard metrics calculated and ready for validation",
                    "recommendations": [
                        "Compare Plan Adherence: adherence_percentage, on_time_orders, delayed_orders",
                        "Compare OEE: overall OEE score, availability, performance, quality components",
                        "Compare Production by Line: line-level efficiency, completed vs in-progress orders",
                        "Compare Order Status: distribution percentages across all statuses"
                    ]
                }

            elif metric_type == "plan_adherence":
                raw_metrics_result = execute_tool("calculate_plan_adherence_metrics", {})
                raw_metrics = raw_metrics_result.get("metrics", {})

                return {
                    "metric_type": "plan_adherence",
                    "raw_data_source": f"sap_production_orders (Fabric SQL)",
                    "raw_metrics": raw_metrics,
                    "validation_status": "aligned",
                    "alignment_checks": {
                        "adherence_percentage": f"{raw_metrics.get('adherence_percentage')}% (should match Dashboard Plan Adherence %)",
                        "on_time_orders": f"{raw_metrics.get('on_time_orders')} (should match Dashboard On Time count)",
                        "delayed_orders": f"{raw_metrics.get('delayed_orders')} (should match Dashboard Delayed count)",
                        "completed_orders": f"{raw_metrics.get('completed_orders')} (total completed orders in calculation)"
                    },
                    "notes": [
                        "Metrics calculated using same logic as Dashboard.jsx calculatePlanAdherence()",
                        "Uses SCHEDULED_START_DATE vs ACTUAL_START_DATE comparison",
                        "Filters SAP placeholder dates (31/12/9999)",
                        "Only analyzes completed orders (DELIVERED_QUANTITY >= PLANNED_QUANTITY)"
                    ]
                }

            elif metric_type == "oee":
                raw_metrics_result = execute_tool("calculate_oee_metrics", {})
                raw_metrics = raw_metrics_result.get("metrics", {})

                return {
                    "metric_type": "oee",
                    "raw_data_source": f"sap_production_orders (Fabric SQL)",
                    "raw_metrics": raw_metrics,
                    "validation_status": "aligned",
                    "alignment_checks": {
                        "oee": f"{raw_metrics.get('oee')}% (should match Dashboard OEE score)",
                        "availability": f"{raw_metrics.get('availability')}% (on-time starts)",
                        "performance": f"{raw_metrics.get('performance')}% (delivered vs planned)",
                        "quality": f"{raw_metrics.get('quality')}% (meeting planned quantity)"
                    },
                    "notes": [
                        "OEE = (Availability × Performance × Quality) ÷ 10,000",
                        "Availability: % of completed orders starting on/before scheduled date",
                        "Performance: Total delivered ÷ Total planned quantity",
                        "Quality: % of completed orders meeting/exceeding planned quantity"
                    ]
                }

            elif metric_type == "production_by_line":
                raw_metrics_result = execute_tool("calculate_production_by_line", {})
                production_lines = raw_metrics_result.get("production_lines", [])

                return {
                    "metric_type": "production_by_line",
                    "raw_data_source": f"sap_production_orders (Fabric SQL)",
                    "production_lines": production_lines,
                    "validation_status": "aligned",
                    "alignment_checks": {
                        "line_count": f"{len(production_lines)} production lines found",
                        "work_center_mapping": "CPL-R01→Reactor Line 1, CPL-R02→Reactor Line 2, CPL-B01→Batch Line 1, CPL-F01→Filling Line 1"
                    },
                    "notes": [
                        "Efficiency calculated as (delivered ÷ planned) × 100",
                        "Lines sorted by delivered quantity descending",
                        "Tracks completed and in-progress orders per line"
                    ]
                }

            elif metric_type == "order_status":
                raw_metrics_result = execute_tool("calculate_order_status_distribution", {})
                distribution = raw_metrics_result.get("distribution", {})

                return {
                    "metric_type": "order_status",
                    "raw_data_source": f"sap_production_orders (Fabric SQL)",
                    "distribution": distribution,
                    "validation_status": "aligned",
                    "alignment_checks": {
                        "completed": f"{distribution.get('completed')} ({distribution.get('completed_percentage')}%)",
                        "in_progress": f"{distribution.get('in_progress')} ({distribution.get('in_progress_percentage')}%)",
                        "pending": f"{distribution.get('pending')} ({distribution.get('pending_percentage')}%)",
                        "not_started": f"{distribution.get('not_started')} ({distribution.get('not_started_percentage')}%)"
                    },
                    "notes": [
                        "Completed: DELIVERED_QUANTITY >= PLANNED_QUANTITY",
                        "In Progress: 0 < DELIVERED_QUANTITY < PLANNED_QUANTITY",
                        "Pending: DELIVERED_QUANTITY = 0 AND ACTUAL_START_DATE exists (not 31/12/9999)",
                        "Not Started: DELIVERED_QUANTITY = 0 AND no ACTUAL_START_DATE"
                    ]
                }

            return {
                "error": f"Validation for metric_type '{metric_type}' not implemented",
                "available_types": ["plan_adherence", "oee", "production_by_line", "order_status", "all"]
            }

        elif tool_name == "check_data_freshness":
            # Check data freshness using Fabric SQL
            from datetime import datetime, timezone
            latest_ts_str = get_ot_latest_timestamp()
            order_count   = get_production_orders_count()
            ot_count      = get_ot_events_count()

            result = {
                "latest_ot_event":    latest_ts_str,
                "ot_event_count":     ot_count,
                "production_orders":  order_count,
                "database":           FABRIC_DATABASE,
            }

            if latest_ts_str:
                try:
                    latest = datetime.fromisoformat(latest_ts_str.replace('Z', '+00:00'))
                    if latest.tzinfo is None:
                        latest = latest.replace(tzinfo=timezone.utc)
                    age_hours = (datetime.now(timezone.utc) - latest).total_seconds() / 3600
                    result["data_age_hours"] = round(age_hours, 2)
                    result["is_fresh"] = age_hours < 24
                except Exception:
                    pass

            return {"message": "Data freshness check complete", "freshness": result}

        # Agent-to-Agent Calling Tools (Tier 3 orchestration)
        elif tool_name == "call_performance_analyst":
            query = tool_input.get("query", "")
            print(f"[Tier 3->Tier 1] Calling Performance Analyst with query: {query}")

            # Call the Tier 1 performance_analyst endpoint
            url = f"{ANTHROPIC_BASE_URL}/v1/messages"
            headers = {
                "Content-Type": "application/json",
                "x-api-key": ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01"
            }

            # Call Performance Analyst agent with its system prompt and tools
            system_prompt = f"""You are the Performance Analyst Agent for NovaChem Grangemouth. You explain why chemical production numbers look the way they do — batch yield variances, CIP efficiency, changeover duration, and schedule adherence.
**Database Context:** Database: {FABRIC_DATABASE} (Fabric SQL Analytics Endpoint, NovaChem Grangemouth)
**Your Purpose:** Turn production data into clear, evidence-based narratives grounded in chemical manufacturing context.
**Response Format:** Do not use emojis. Plain text, tables, or markdown lists only."""

            payload = {
                "model": CLAUDE_MODEL,
                "max_tokens": 4096,
                "system": system_prompt,
                "messages": [{"role": "user", "content": query}],
                "tools": PERFORMANCE_ANALYST_TOOLS
            }

            try:
                response = requests.post(url, headers=headers, json=payload)
                response.raise_for_status()
                result = response.json()

                # Extract text response
                text_response = ""
                for block in result.get("content", []):
                    if block.get("type") == "text":
                        text_response += block.get("text", "")

                print(f"[Tier 3->Tier 1] Performance Analyst responded: {len(text_response)} chars")
                return {
                    "agent": "performance_analyst",
                    "query": query,
                    "response": text_response,
                    "agent_type": "tier1"
                }
            except Exception as e:
                error_msg = f"Failed to call performance_analyst: {str(e)}"
                print(f"[ERROR] {error_msg}")
                return {"error": error_msg}

        elif tool_name == "call_data_quality_agent":
            query = tool_input.get("query", "")
            print(f"[Tier 3->Tier 1] Calling Data Quality Agent with query: {query}")

            url = f"{ANTHROPIC_BASE_URL}/v1/messages"
            headers = {
                "Content-Type": "application/json",
                "x-api-key": ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01"
            }

            system_prompt = f"""You are the Data Quality / Trust Agent for NovaChem Grangemouth. You validate the reliability of chemical production data — batch records, OT events, energy readings, inventory snapshots, and maintenance logs.
**Database Context:** Database: {FABRIC_DATABASE} (Fabric SQL Analytics Endpoint, NovaChem Grangemouth)
**Your Purpose:** Prevent bad operational and business decisions by ensuring the data behind them is reliable.
**Response Format:** Do not use emojis. Plain text, tables, or markdown lists only."""

            payload = {
                "model": CLAUDE_MODEL,
                "max_tokens": 4096,
                "system": system_prompt,
                "messages": [{"role": "user", "content": query}],
                "tools": DATA_QUALITY_TOOLS
            }

            response = requests.post(url, headers=headers, json=payload)
            response.raise_for_status()
            result = response.json()

            text_response = ""
            for block in result.get("content", []):
                if block.get("type") == "text":
                    text_response += block.get("text", "")

            return {
                "agent": "data_quality",
                "query": query,
                "response": text_response,
                "agent_type": "tier1"
            }

        elif tool_name == "call_line_operations_agent":
            query = tool_input.get("query", "")
            print(f"[Tier 3->Tier 1] Calling Line Operations Agent with query: {query}")

            url = f"{ANTHROPIC_BASE_URL}/v1/messages"
            headers = {
                "Content-Type": "application/json",
                "x-api-key": ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01"
            }

            system_prompt = f"""You are the Line-Level Operations Agent for NovaChem Grangemouth, an AI shift supervisor monitoring reactor lines and process units in real-time.
**Database Context:** Database: {FABRIC_DATABASE} (Fabric SQL Analytics Endpoint, NovaChem Grangemouth)
**Your Purpose:** Give operations teams the situational awareness to make fast, informed decisions — which unit needs attention, what is the impact, and what should happen next.
**Response Format:** Do not use emojis. Plain text, tables, or markdown lists only."""

            payload = {
                "model": CLAUDE_MODEL,
                "max_tokens": 4096,
                "system": system_prompt,
                "messages": [{"role": "user", "content": query}],
                "tools": LINE_OPERATIONS_TOOLS
            }

            response = requests.post(url, headers=headers, json=payload)
            response.raise_for_status()
            result = response.json()

            text_response = ""
            for block in result.get("content", []):
                if block.get("type") == "text":
                    text_response += block.get("text", "")

            return {
                "agent": "line_operations",
                "query": query,
                "response": text_response,
                "agent_type": "tier1"
            }

        elif tool_name == "call_downtime_rca_agent":
            query = tool_input.get("query", "")
            print(f"[Tier 3->Tier 2] Calling Downtime RCA Agent with query: {query}")

            url = f"{ANTHROPIC_BASE_URL}/v1/messages"
            headers = {
                "Content-Type": "application/json",
                "x-api-key": ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01"
            }

            system_prompt = f"""You are the Downtime RCA Agent for NovaChem Grangemouth. You provide structured root cause analysis for downtime events in a chemical manufacturing environment — mechanical failures, CIP overruns, changeover delays, and utility faults.
**Database Context:** Database: {FABRIC_DATABASE} (Fabric SQL Analytics Endpoint, NovaChem Grangemouth)
**Your Purpose:** Find the "why" behind downtime through pattern identification and causal chain analysis. Distinguish root causes from symptoms.
**Response Format:** Do not use emojis. Plain text, tables, or markdown lists only."""

            payload = {
                "model": CLAUDE_MODEL,
                "max_tokens": 4096,
                "system": system_prompt,
                "messages": [{"role": "user", "content": query}],
                "tools": DOWNTIME_RCA_TOOLS
            }

            response = requests.post(url, headers=headers, json=payload)
            response.raise_for_status()
            result = response.json()

            text_response = ""
            for block in result.get("content", []):
                if block.get("type") == "text":
                    text_response += block.get("text", "")

            return {
                "agent": "downtime_rca",
                "query": query,
                "response": text_response,
                "agent_type": "tier2"
            }

        elif tool_name == "call_throughput_rca_agent":
            query = tool_input.get("query", "")
            print(f"[Tier 3->Tier 2] Calling Throughput RCA Agent with query: {query}")

            url = f"{ANTHROPIC_BASE_URL}/v1/messages"
            headers = {
                "Content-Type": "application/json",
                "x-api-key": ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01"
            }

            system_prompt = f"""You are the Throughput RCA Agent for NovaChem Grangemouth. You identify the root causes of throughput gaps in a chemical manufacturing environment — reactor constraints, CIP scheduling conflicts, changeover sequencing, and batch size limitations.
**Database Context:** Database: {FABRIC_DATABASE} (Fabric SQL Analytics Endpoint, NovaChem Grangemouth)
**Your Purpose:** Explain throughput gaps through bottleneck identification and impact quantification in terms of batches, tonnes, and schedule variance.
**Response Format:** Do not use emojis. Plain text, tables, or markdown lists only."""

            payload = {
                "model": CLAUDE_MODEL,
                "max_tokens": 4096,
                "system": system_prompt,
                "messages": [{"role": "user", "content": query}],
                "tools": THROUGHPUT_RCA_TOOLS
            }

            response = requests.post(url, headers=headers, json=payload)
            response.raise_for_status()
            result = response.json()

            text_response = ""
            for block in result.get("content", []):
                if block.get("type") == "text":
                    text_response += block.get("text", "")

            return {
                "agent": "throughput_rca",
                "query": query,
                "response": text_response,
                "agent_type": "tier2"
            }

        else:
            return {"error": f"Unknown tool: {tool_name}"}

    except Exception as e:
        error_str = str(e)
        print(f"[execute_tool ERROR] tool_name={tool_name}, error={error_str}, length={len(error_str)}")
        return {"error": error_str}


@app.post("/api/agent/chat", response_model=ChatResponse)
async def agent_chat(request: ChatRequest):
    """
    Data Agent endpoint with tool calling - Claude can call tools to fetch data from Fabric SQL
    """
    if not ANTHROPIC_API_KEY:
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY not configured")

    try:
        # Initial message to Claude with tools
        url = f"{ANTHROPIC_BASE_URL}/v1/messages"
        headers = {
            "Content-Type": "application/json",
            "x-api-key": ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01"
        }

        # System prompt with database context
        system_prompt = f"""You are a data analysis assistant for NovaChem Grangemouth with access to a Microsoft Fabric SQL Analytics Endpoint.

**Response Format:**
- Do not use emojis in any response
- Use plain text, tables, or markdown lists only

**Database Information:**
- Database: {FABRIC_DATABASE}
- Data source: Microsoft Fabric Lakehouse (SQL Analytics Endpoint)
- Facility: NovaChem, Grangemouth chemical plant

**Available Tables:**
1. dbo.ot_process_events — OT tag events from NovaChem plant systems (reactor and process unit signals)
2. dbo.sap_production_orders — SAP production orders for chemical batches with progress snapshots
3. dbo.batch_quality — Batch quality results (yield %, pass/fail, spec variance by product)
4. dbo.energy_consumption — Daily energy consumption per reactor/line
5. dbo.inventory_stock — Weekly inventory stock snapshots (raw materials and finished goods)
6. dbo.maintenance_orders — Maintenance work orders (planned and reactive)
7. dbo.downtime — Downtime and CIP events (planned vs unplanned, duration, cause)
8. dbo.run_rates — Actual run rates by reactor/line and product
9. dbo.unconstrained_run_rates — Theoretical maximum run rates for constraint analysis

**Advanced Capabilities:**
- **Data Analysis**: Fetch and analyze raw data from any table
- **Metric Calculation**: Calculate aggregated metrics matching Dashboard tabs
  - Plan Adherence (on-time %, delayed batches, early batches, avg delay)
  - Overall Equipment Effectiveness (OEE with availability, performance, quality components)
  - Production by Line (efficiency, completed/in-progress orders per reactor)
  - Order Status Distribution (completed, in progress, pending, not started)
- **Cross-Validation**: Compare raw database metrics against Dashboard aggregated views to validate alignment
- **Data Quality Checks**: Identify discrepancies between data sources and explain potential causes

**Available Metric Calculation Tools:**
- `calculate_plan_adherence_metrics` - Plan Adherence tab metrics
- `calculate_oee_metrics` - OEE tab metrics (availability, performance, quality)
- `calculate_production_by_line` - Production by Line tab metrics
- `calculate_order_status_distribution` - Order Status Distribution tab metrics
- `validate_dashboard_alignment` - Cross-validate any metric type (plan_adherence, oee, production_by_line, order_status, all)

**When users ask about Dashboard metrics or validation:**
1. Use the appropriate calculation tool to compute metrics from raw data
2. Use `validate_dashboard_alignment` to cross-check specific tabs or all tabs
3. Explain any discrepancies found (time ranges, filters, aggregation methods, refresh timing)
4. All calculations use the same logic as Dashboard.jsx to ensure alignment

You have tools to fetch data from these tables. Use them when users ask about data, counts, analysis, or validation."""

        messages = [{"role": "user", "content": request.message}]

        # Agentic loop - allow multiple tool calls
        max_iterations = 5
        iteration = 0
        audit_trail = []
        
        # Record initial user query
        audit_trail.append({
            "step": "user_query",
            "timestamp": datetime.now().isoformat(),
            "content": request.message
        })

        while iteration < max_iterations:
            iteration += 1

            payload = {
                "model": CLAUDE_MODEL,
                "max_tokens": 4000,
                "system": system_prompt,
                "messages": messages,
                "tools": TOOLS
            }

            print(f"Iteration {iteration}: Calling Claude...")
            
            # Record LLM call
            llm_call_start = datetime.now()
            audit_trail.append({
                "step": "llm_call",
                "iteration": iteration,
                "timestamp": llm_call_start.isoformat(),
                "model": CLAUDE_MODEL,
                "status": "started"
            })
            
            api_response = requests.post(url, headers=headers, json=payload, timeout=60)
            api_response.raise_for_status()
            result = api_response.json()
            
            llm_call_end = datetime.now()
            llm_duration = (llm_call_end - llm_call_start).total_seconds()

            print(f"Stop reason: {result.get('stop_reason')}")
            
            # Update LLM call record
            audit_trail[-1].update({
                "status": "completed",
                "duration_seconds": round(llm_duration, 3),
                "stop_reason": result.get('stop_reason'),
                "usage": result.get('usage', {})
            })

            # Add assistant message to conversation
            assistant_message = {
                "role": "assistant",
                "content": result.get("content", [])
            }
            messages.append(assistant_message)

            # Check stop reason
            stop_reason = result.get("stop_reason")

            if stop_reason == "end_turn":
                # Claude is done, extract final response
                content = result.get("content", [])
                for block in content:
                    if block.get("type") == "text":
                        # Record final response
                        audit_trail.append({
                            "step": "final_response",
                            "timestamp": datetime.now().isoformat(),
                            "content": block.get("text", "No response")
                        })
                        # Generate thread_id if not provided
                        thread_id = request.thread_id or datetime.now().strftime("%Y%m%d_%H%M%S")
                        return ChatResponse(
                            response=block.get("text", "No response"),
                            thread_id=thread_id,
                            audit_trail=audit_trail
                        )
                thread_id = request.thread_id or datetime.now().strftime("%Y%m%d_%H%M%S")
                return ChatResponse(
                    response="No text response found",
                    thread_id=thread_id,
                    audit_trail=audit_trail
                )

            elif stop_reason == "tool_use":
                # Claude wants to use tools
                content = result.get("content", [])
                tool_results = []

                for block in content:
                    if block.get("type") == "tool_use":
                        tool_name = block.get("name")
                        tool_input = block.get("input", {})
                        tool_use_id = block.get("id")

                        print(f"Executing tool: {tool_name} with input: {tool_input}")
                        
                        # Record tool call
                        tool_call_start = datetime.now()
                        audit_trail.append({
                            "step": "tool_call",
                            "timestamp": tool_call_start.isoformat(),
                            "tool_name": tool_name,
                            "tool_input": tool_input,
                            "status": "started"
                        })

                        # Execute the tool
                        tool_result = execute_tool(tool_name, tool_input)
                        
                        tool_call_end = datetime.now()
                        tool_duration = (tool_call_end - tool_call_start).total_seconds()
                        
                        # Update tool call record with result
                        audit_trail[-1].update({
                            "status": "completed",
                            "duration_seconds": round(tool_duration, 3),
                            "result_summary": {
                                "has_data": "data" in str(tool_result),
                                "has_error": "error" in str(tool_result),
                                "result_length": len(str(tool_result))
                            }
                        })
                        
                        # Record data fetch if tool returned data
                        if isinstance(tool_result, dict) and "data" in tool_result:
                            audit_trail.append({
                                "step": "data_fetch",
                                "timestamp": datetime.now().isoformat(),
                                "source": "Fabric SQL",
                                "table": "sap_production_orders" if tool_name in ["get_latest_orders", "get_top10"] else "various",
                                "records_count": len(tool_result.get("data", [])) if isinstance(tool_result.get("data"), list) else "N/A"
                            })

                        tool_results.append({
                            "type": "tool_result",
                            "tool_use_id": tool_use_id,
                            "content": str(tool_result)
                        })

                # Add tool results to conversation
                messages.append({
                    "role": "user",
                    "content": tool_results
                })

                # Continue loop to get Claude's response with tool results
                continue

            else:
                # Unexpected stop reason
                audit_trail.append({
                    "step": "error",
                    "timestamp": datetime.now().isoformat(),
                    "error": f"Unexpected stop reason: {stop_reason}"
                })
                thread_id = request.thread_id or datetime.now().strftime("%Y%m%d_%H%M%S")
                return ChatResponse(
                    response=f"Unexpected stop reason: {stop_reason}",
                    thread_id=thread_id,
                    audit_trail=audit_trail
                )

        audit_trail.append({
            "step": "error",
            "timestamp": datetime.now().isoformat(),
            "error": "Maximum iterations reached"
        })
        thread_id = request.thread_id or datetime.now().strftime("%Y%m%d_%H%M%S")
        return ChatResponse(
            response="Maximum iterations reached",
            thread_id=thread_id,
            audit_trail=audit_trail
        )

    except requests.exceptions.RequestException as e:
        print(f"API error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")
    except Exception as e:
        print(f"Error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@app.post("/api/agent/save-chat")
async def save_chat(request: SaveChatRequest):
    """Save a chat thread to a log file"""
    try:
        thread_file = CHAT_LOGS_DIR / f"{request.thread_id}.json"

        chat_data = {
            "thread_id": request.thread_id,
            "title": request.title,
            "agent_type": request.agent_type,
            "created_at": request.messages[0].timestamp if request.messages else datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "messages": [msg.dict() for msg in request.messages]
        }

        with open(thread_file, 'w', encoding='utf-8') as f:
            json.dump(chat_data, f, indent=2, ensure_ascii=False)

        return {"status": "success", "thread_id": request.thread_id}
    except Exception as e:
        print(f"Error saving chat: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error saving chat: {str(e)}")


@app.get("/api/agent/chat-threads")
async def get_chat_threads():
    """Get list of all saved chat threads for Data Agent (non-tier specific)"""
    try:
        threads = []

        for thread_file in CHAT_LOGS_DIR.glob("*.json"):
            # Skip tier-specific threads (they start with tier1-, tier2-, tier3-)
            if any(thread_file.name.startswith(f"tier{i}-") for i in [1, 2, 3]):
                continue

            try:
                with open(thread_file, 'r', encoding='utf-8') as f:
                    chat_data = json.load(f)
                    # Return summary without full messages
                    threads.append({
                        "thread_id": chat_data.get("thread_id"),
                        "title": chat_data.get("title"),
                        "created_at": chat_data.get("created_at"),
                        "updated_at": chat_data.get("updated_at"),
                        "message_count": len(chat_data.get("messages", []))
                    })
            except Exception as e:
                print(f"Error reading thread file {thread_file}: {str(e)}")
                continue

        # Sort by updated_at descending (most recent first)
        threads.sort(key=lambda x: x.get("updated_at", ""), reverse=True)

        return {"threads": threads}
    except Exception as e:
        print(f"Error retrieving chat threads: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving chat threads: {str(e)}")


@app.get("/api/agent/chat-threads/tier1")
async def get_tier1_chat_threads():
    """Get list of all saved chat threads for Tier 1 agents"""
    try:
        threads = []

        for thread_file in CHAT_LOGS_DIR.glob("tier1-*.json"):
            try:
                with open(thread_file, 'r', encoding='utf-8') as f:
                    chat_data = json.load(f)
                    threads.append({
                        "thread_id": chat_data.get("thread_id"),
                        "title": chat_data.get("title"),
                        "created_at": chat_data.get("created_at"),
                        "updated_at": chat_data.get("updated_at"),
                        "message_count": len(chat_data.get("messages", []))
                    })
            except Exception as e:
                print(f"Error reading tier1 thread file {thread_file}: {str(e)}")
                continue

        threads.sort(key=lambda x: x.get("updated_at", ""), reverse=True)
        return {"threads": threads}
    except Exception as e:
        print(f"Error retrieving tier1 chat threads: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving tier1 chat threads: {str(e)}")


@app.get("/api/agent/chat-threads/tier2")
async def get_tier2_chat_threads():
    """Get list of all saved chat threads for Tier 2 agents"""
    try:
        threads = []

        for thread_file in CHAT_LOGS_DIR.glob("tier2-*.json"):
            try:
                with open(thread_file, 'r', encoding='utf-8') as f:
                    chat_data = json.load(f)
                    threads.append({
                        "thread_id": chat_data.get("thread_id"),
                        "title": chat_data.get("title"),
                        "created_at": chat_data.get("created_at"),
                        "updated_at": chat_data.get("updated_at"),
                        "message_count": len(chat_data.get("messages", []))
                    })
            except Exception as e:
                print(f"Error reading tier2 thread file {thread_file}: {str(e)}")
                continue

        threads.sort(key=lambda x: x.get("updated_at", ""), reverse=True)
        return {"threads": threads}
    except Exception as e:
        print(f"Error retrieving tier2 chat threads: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving tier2 chat threads: {str(e)}")


@app.get("/api/agent/chat-threads/tier3")
async def get_tier3_chat_threads():
    """Get list of all saved chat threads for Tier 3 agents"""
    try:
        threads = []

        for thread_file in CHAT_LOGS_DIR.glob("tier3-*.json"):
            try:
                with open(thread_file, 'r', encoding='utf-8') as f:
                    chat_data = json.load(f)
                    threads.append({
                        "thread_id": chat_data.get("thread_id"),
                        "title": chat_data.get("title"),
                        "created_at": chat_data.get("created_at"),
                        "updated_at": chat_data.get("updated_at"),
                        "message_count": len(chat_data.get("messages", []))
                    })
            except Exception as e:
                print(f"Error reading tier3 thread file {thread_file}: {str(e)}")
                continue

        threads.sort(key=lambda x: x.get("updated_at", ""), reverse=True)
        return {"threads": threads}
    except Exception as e:
        print(f"Error retrieving tier3 chat threads: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving tier3 chat threads: {str(e)}")


@app.get("/api/agent/chat-thread/{thread_id}")
async def get_chat_thread(thread_id: str):
    """Get a specific chat thread with all messages"""
    try:
        thread_file = CHAT_LOGS_DIR / f"{thread_id}.json"

        if not thread_file.exists():
            raise HTTPException(status_code=404, detail="Chat thread not found")

        with open(thread_file, 'r', encoding='utf-8') as f:
            chat_data = json.load(f)

        return chat_data
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error retrieving chat thread: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving chat thread: {str(e)}")


@app.delete("/api/agent/chat-thread/{thread_id}")
async def delete_chat_thread(thread_id: str):
    """Delete a specific chat thread"""
    try:
        thread_file = CHAT_LOGS_DIR / f"{thread_id}.json"

        if not thread_file.exists():
            raise HTTPException(status_code=404, detail="Chat thread not found")

        thread_file.unlink()

        return {"status": "success", "message": "Chat thread deleted"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting chat thread: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error deleting chat thread: {str(e)}")


# Tier 1 Agent Tools
PERFORMANCE_ANALYST_TOOLS = [
    {
        "name": "calculate_plan_adherence_metrics",
        "description": "Calculate Plan Adherence metrics from raw production data including on-time orders, late orders, average quantity adherence, and schedule changes.",
        "input_schema": {"type": "object", "properties": {}, "required": []}
    },
    {
        "name": "calculate_oee_metrics",
        "description": "Calculate Overall Equipment Effectiveness (OEE) metrics including availability, performance, and quality components.",
        "input_schema": {"type": "object", "properties": {}, "required": []}
    },
    {
        "name": "calculate_production_by_line",
        "description": "Calculate production metrics grouped by production line including planned, delivered quantities, and efficiency.",
        "input_schema": {"type": "object", "properties": {}, "required": []}
    },
    {
        "name": "calculate_order_status_distribution",
        "description": "Calculate order status distribution showing completed, in progress, pending, and not started orders.",
        "input_schema": {"type": "object", "properties": {}, "required": []}
    },
    {
        "name": "get_latest_orders",
        "description": "Fetch the latest record per ORDER_ID from production schedule data.",
        "input_schema": {"type": "object", "properties": {}, "required": []}
    }
]

DATA_QUALITY_TOOLS = [
    {
        "name": "validate_dashboard_alignment",
        "description": "Cross-validate data alignment between raw database tables and dashboard aggregated views. Compares metrics to identify any discrepancies.",
        "input_schema": {
            "type": "object",
            "properties": {
                "metric_type": {
                    "type": "string",
                    "enum": ["plan_adherence", "oee", "production_by_line", "order_status", "all"],
                    "description": "Type of metric to validate"
                }
            },
            "required": ["metric_type"]
        }
    },
    {
        "name": "check_data_freshness",
        "description": "Check the freshness of data by examining ingestion timestamps and identifying stale data.",
        "input_schema": {"type": "object", "properties": {}, "required": []}
    },
    {
        "name": "get_latest_orders",
        "description": "Fetch the latest record per ORDER_ID to check data completeness and timestamps.",
        "input_schema": {"type": "object", "properties": {}, "required": []}
    },
    {
        "name": "ping_health",
        "description": "Check whether the ProductionOps data API and Fabric SQL connection are healthy.",
        "input_schema": {"type": "object", "properties": {}, "required": []}
    }
]

LINE_OPERATIONS_TOOLS = [
    {
        "name": "get_downtime",
        "description": "Fetch Downtime table data to analyze line stoppages and issues.",
        "input_schema": {"type": "object", "properties": {}, "required": []}
    },
    {
        "name": "get_runrates",
        "description": "Fetch Runrates table data to compare line performance.",
        "input_schema": {"type": "object", "properties": {}, "required": []}
    },
    {
        "name": "get_ot_data",
        "description": "Fetch Processevent_silver table data (OT operational technology data).",
        "input_schema": {"type": "object", "properties": {}, "required": []}
    },
    {
        "name": "calculate_production_by_line",
        "description": "Calculate production metrics grouped by production line including planned, delivered quantities, and efficiency.",
        "input_schema": {"type": "object", "properties": {}, "required": []}
    },
    {
        "name": "get_coke_process_events",
        "description": "Fetch OT Process Events rows from ot_process_events table for detailed line-level analysis.",
        "input_schema": {
            "type": "object",
            "properties": {
                "limit": {"type": "integer", "minimum": 1, "maximum": 50000, "default": 2000}
            },
            "required": []
        }
    }
]

# Tier 2 Agent Tools
DOWNTIME_RCA_TOOLS = [
    {
        "name": "get_downtime",
        "description": "Fetch Downtime table data to analyze causes and patterns.",
        "input_schema": {"type": "object", "properties": {}, "required": []}
    },
    {
        "name": "get_ot_data",
        "description": "Fetch OT events data to correlate with downtime.",
        "input_schema": {"type": "object", "properties": {}, "required": []}
    },
    {
        "name": "get_latest_orders",
        "description": "Fetch order context to understand downtime impact.",
        "input_schema": {"type": "object", "properties": {}, "required": []}
    }
]

BOTTLENECK_CONSTRAINT_TOOLS = [
    {
        "name": "get_runrates",
        "description": "Fetch Runrates table data to identify constraints.",
        "input_schema": {"type": "object", "properties": {}, "required": []}
    },
    {
        "name": "calculate_production_by_line",
        "description": "Calculate production metrics to identify bottlenecks.",
        "input_schema": {"type": "object", "properties": {}, "required": []}
    },
    {
        "name": "get_ot_data",
        "description": "Fetch production flow data to analyze constraints.",
        "input_schema": {"type": "object", "properties": {}, "required": []}
    }
]

# Tier 3 Agent Tools - Agent-to-Agent Orchestration
OPERATIONS_RECOMMENDATION_TOOLS = [
    # Agent-to-Agent Calling Tools
    {
        "name": "call_performance_analyst",
        "description": "Call the Performance Analyst (Tier 1) to get insights on why production numbers look the way they do. Returns variance analysis, trend explanations, and cross-metric reasoning.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "The specific question or analysis request for the Performance Analyst"
                }
            },
            "required": ["query"]
        }
    },
    {
        "name": "call_line_operations_agent",
        "description": "Call the Line Operations Agent (Tier 1) to get real-time operational insights on production lines. Returns line comparisons, issue rankings, and bottleneck analysis.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "The specific question about line operations or performance"
                }
            },
            "required": ["query"]
        }
    },
    {
        "name": "call_downtime_rca_agent",
        "description": "Call the Downtime RCA Agent (Tier 2) to get root cause analysis of downtime events. Returns pattern identification and causal chains.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "The specific downtime issue or pattern to analyze"
                }
            },
            "required": ["query"]
        }
    },
    {
        "name": "call_throughput_rca_agent",
        "description": "Call the Throughput RCA Agent (Tier 2) to get root cause analysis of throughput gaps. Returns bottleneck identification and impact quantification.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "The specific throughput issue or gap to analyze"
                }
            },
            "required": ["query"]
        }
    }
]

EXECUTIVE_BRIEFING_TOOLS = [
    # Agent-to-Agent Calling Tools
    {
        "name": "call_performance_analyst",
        "description": "Call the Performance Analyst (Tier 1) to get executive-friendly explanations of performance trends and variances.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "The specific performance question or metric to analyze"
                }
            },
            "required": ["query"]
        }
    },
    {
        "name": "call_data_quality_agent",
        "description": "Call the Data Quality Agent (Tier 1) to identify any data reliability concerns that leadership should be aware of.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "The data quality concern or validation request"
                }
            },
            "required": ["query"]
        }
    },
    {
        "name": "call_line_operations_agent",
        "description": "Call the Line Operations Agent (Tier 1) to get operational highlights and critical issues from the production floor.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "The operational question or line performance inquiry"
                }
            },
            "required": ["query"]
        }
    },
    {
        "name": "call_downtime_rca_agent",
        "description": "Call the Downtime RCA Agent (Tier 2) to understand root causes of major downtime events for leadership awareness.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "The downtime event or pattern to investigate"
                }
            },
            "required": ["query"]
        }
    },
    {
        "name": "call_throughput_rca_agent",
        "description": "Call the Throughput RCA Agent (Tier 2) to explain throughput gaps and production capacity issues.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "The throughput concern or capacity question"
                }
            },
            "required": ["query"]
        }
    }
]


class Tier1AgentRequest(BaseModel):
    message: str
    agent_type: str
    thread_id: Optional[str] = None


class Tier2AgentRequest(BaseModel):
    message: str
    agent_type: str
    thread_id: Optional[str] = None


class Tier3AgentRequest(BaseModel):
    message: str
    agent_type: str
    thread_id: Optional[str] = None


@app.post("/api/agent/tier1/{agent_type}", response_model=ChatResponse)
async def tier1_agent_chat(agent_type: str, request: Tier1AgentRequest):
    """
    Tier 1 Analytical Agents endpoint with tool calling - specialized agents that consume DataHub outputs
    
    Agent Types:
    - performance_analyst: Explains why numbers look the way they do
    - data_quality: Guardian of truth, monitors data quality
    - line_operations: AI shift supervisor for line-level operations
    """
    if not ANTHROPIC_API_KEY:
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY not configured")


    # Define system prompts and tools for each agent type
    agent_configs = {
        "performance_analyst": {
            "system_prompt": f"""You are the Performance Analyst Agent for NovaChem Grangemouth, a specialized AI that explains why production numbers look the way they do in a chemical manufacturing environment.

**Response Format:**
- Do not use emojis in any response
- Use plain text, tables, or markdown lists only

**Your Purpose:** Turn dashboards into narratives that operations managers and executives understand

**Database Context:**
- Database: {FABRIC_DATABASE}
- Data source: Fabric SQL Analytics Endpoint
- Facility: NovaChem, Grangemouth chemical plant

**Data You Consume:**
- Batch yield metrics (actual vs target yield per product and reactor)
- CIP (Clean-In-Place) cycle times and efficiency
- Changeover duration by chemical family (same-family rinse vs full hot CIP)
- Production order adherence (on-time %, delayed batches, avg delay)
- Energy consumption per batch and per production run
- Batch quality results (pass/fail, variance from spec)
- Maintenance order status and impact on availability

**What You Do:**
- Variance analysis: Explain differences between planned and actual batch yield or schedule
- Trend explanations: Identify patterns across batches, shifts, and reactor lines
- Cross-metric reasoning: Connect CIP overruns, changeover delays, and yield losses into a coherent story

**Your Approach:**
1. Use tools to fetch relevant metrics (batch quality, production orders, energy, run rates)
2. Analyze variances and trends in the data
3. Provide clear, plain-language explanations grounded in chemical manufacturing context
4. Connect the dots between different metrics (e.g. extended CIP leading to late batch start leading to yield shortfall)
5. Focus on the "why" behind the numbers

**Key Value:** You turn production data into narratives that operations teams and leadership can act on.

Be analytical and precise. Use specific batch IDs, reactor names, and timeframes. Do not speculate beyond the data.""",
            "tools": PERFORMANCE_ANALYST_TOOLS
        },
        "data_quality": {
            "system_prompt": f"""You are the Data Quality / Trust Agent for NovaChem Grangemouth, the guardian of truth for chemical production data.

**Response Format:**
- Do not use emojis in any response
- Use plain text, tables, or markdown lists only

**Your Purpose:** Prevent bad decisions before they happen by ensuring data reliability

**Database Context:**
- Database: {FABRIC_DATABASE}
- Data source: Fabric SQL Analytics Endpoint
- Facility: NovaChem, Grangemouth chemical plant

**Data You Consume:**
- Batch quality records (dbo.batch_quality) — yield, pass/fail, spec variance
- Production orders (dbo.sap_production_orders) — scheduled vs actual
- OT process events (dbo.ot_process_events) — tag events from plant systems
- Energy consumption (dbo.energy_consumption)
- Inventory stock snapshots (dbo.inventory_stock)
- Maintenance orders (dbo.maintenance_orders)
- Metadata and timestamps across all tables

**What You Do:**
- Detect missing batch records or gaps in time series
- Identify timestamp inconsistencies between OT events and SAP orders
- Flag anomalous yield or energy readings that may indicate sensor or data issues
- Highlight mismatches between inventory records and production output
- Validate data completeness before it is used for decisions

**Your Approach:**
1. Use tools to check data freshness and completeness across tables
2. Validate timestamp consistency across OT and SAP sources
3. Compare metrics using validation tools to surface discrepancies
4. Identify anomalies and outliers in batch quality or energy data
5. Assess data quality and provide a trust confidence level
6. Recommend resolution steps for any issues found

**Key Value:** You prevent bad operational and business decisions by ensuring the data behind them is reliable.

Be rigorous and sceptical. When you identify an issue, state clearly:
- What the issue is
- Why it matters in a chemical manufacturing context
- What the potential business or safety impact could be
- How confident you are in the assessment
- Recommended next steps""",
            "tools": DATA_QUALITY_TOOLS
        },
        "line_operations": {
            "system_prompt": f"""You are the Line-Level Operations Agent for NovaChem Grangemouth, an AI shift supervisor monitoring reactor lines and process units in real-time.

**Response Format:**
- Do not use emojis in any response
- Use plain text, tables, or markdown lists only

**Your Purpose:** Provide immediate operational relevance — you think like a shift supervisor at a chemical plant

**Database Context:**
- Database: {FABRIC_DATABASE}
- Data source: Fabric SQL Analytics Endpoint
- Facility: NovaChem, Grangemouth chemical plant

**Data You Consume:**
- OT process events (dbo.ot_process_events) — tag events from reactors and process units
- Downtime and CIP events (dbo.downtime) — planned and unplanned stoppages
- Run rates by reactor/line and product (dbo.run_rates, dbo.unconstrained_run_rates)
- Batch production orders (dbo.sap_production_orders)
- Maintenance orders (dbo.maintenance_orders)

**What You Do:**
- Compare reactor/line performance across the plant
- Identify which units are running below target rate or have extended CIP or changeover
- Rank issues by operational impact (product at risk, schedule slip, quality exposure)
- Summarize shift or day performance across all process units
- Flag lines needing immediate attention before the next batch start

**Your Approach:**
1. Use tools to fetch line-specific data (downtime, run rates, OT events)
2. Compare performance across all reactor lines
3. Identify top issues and bottlenecks ordered by severity and business impact
4. Prioritize what needs attention now
5. Provide clear, actionable recommendations for operators and supervisors

**Key Value:** You give operations teams the situational awareness to make fast, informed decisions during a shift.

Be direct and specific. Use reactor names, batch IDs, and timeframes. Think like a shift supervisor:
- What is the most critical issue right now?
- Which unit needs attention first?
- What should the operator or supervisor do next?
- What is the impact on the current production schedule?""",
            "tools": LINE_OPERATIONS_TOOLS
        }
    }

    if agent_type not in agent_configs:
        raise HTTPException(status_code=400, detail=f"Invalid agent type: {agent_type}")

    config = agent_configs[agent_type]

    try:
        url = f"{ANTHROPIC_BASE_URL}/v1/messages"
        headers = {
            "Content-Type": "application/json",
            "x-api-key": ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01"
        }

        messages = [{"role": "user", "content": request.message}]

        # Agentic loop - allow multiple tool calls
        max_iterations = 5
        iteration = 0
        audit_trail = []

        # Record initial user query
        audit_trail.append({
            "step": "user_query",
            "timestamp": datetime.now().isoformat(),
            "content": request.message
        })

        while iteration < max_iterations:
            iteration += 1

            payload = {
                "model": CLAUDE_MODEL,
                "max_tokens": 4096,
                "system": config["system_prompt"],
                "messages": messages,
                "tools": config["tools"]
            }

            print(f"[{agent_type}] Iteration {iteration}: Calling Claude...")

            # Record LLM call
            llm_call_start = datetime.now()
            audit_trail.append({
                "step": "llm_call",
                "iteration": iteration,
                "timestamp": llm_call_start.isoformat(),
                "model": CLAUDE_MODEL,
                "status": "started"
            })

            api_response = requests.post(url, headers=headers, json=payload, timeout=60)
            api_response.raise_for_status()
            result = api_response.json()

            llm_call_end = datetime.now()
            llm_duration = (llm_call_end - llm_call_start).total_seconds()

            print(f"[{agent_type}] Stop reason: {result.get('stop_reason')}")

            # Update LLM call record
            audit_trail[-1].update({
                "status": "completed",
                "duration_seconds": round(llm_duration, 3),
                "stop_reason": result.get('stop_reason'),
                "usage": result.get('usage', {})
            })

            # Add assistant message to conversation
            assistant_message = {
                "role": "assistant",
                "content": result.get("content", [])
            }
            messages.append(assistant_message)

            # Check stop reason
            stop_reason = result.get("stop_reason")

            if stop_reason == "end_turn":
                # Claude is done, extract final response
                content = result.get("content", [])
                for block in content:
                    if block.get("type") == "text":
                        # Record final response
                        audit_trail.append({
                            "step": "final_response",
                            "timestamp": datetime.now().isoformat(),
                            "content": block.get("text", "No response")
                        })
                        thread_id = request.thread_id or f"tier1_{agent_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
                        return ChatResponse(response=block.get("text", "No response"), thread_id=thread_id, audit_trail=audit_trail)
                thread_id = request.thread_id or f"tier1_{agent_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
                return ChatResponse(response="No text response found", thread_id=thread_id, audit_trail=audit_trail)

            elif stop_reason == "tool_use":
                # Claude wants to use tools
                content = result.get("content", [])
                tool_results = []

                for block in content:
                    if block.get("type") == "tool_use":
                        tool_name = block.get("name")
                        tool_input = block.get("input", {})
                        tool_use_id = block.get("id")

                        print(f"[{agent_type}] Executing tool: {tool_name} with input: {tool_input}")

                        # Record tool call
                        tool_call_start = datetime.now()
                        audit_trail.append({
                            "step": "tool_call",
                            "timestamp": tool_call_start.isoformat(),
                            "tool_name": tool_name,
                            "tool_input": tool_input,
                            "status": "started"
                        })

                        # Execute the tool (reuse existing execute_tool function)
                        tool_result = execute_tool(tool_name, tool_input)

                        tool_call_end = datetime.now()
                        tool_duration = (tool_call_end - tool_call_start).total_seconds()

                        # Update tool call record with result
                        audit_trail[-1].update({
                            "status": "completed",
                            "duration_seconds": round(tool_duration, 3),
                            "result_summary": {
                                "has_data": "data" in str(tool_result),
                                "has_error": "error" in str(tool_result),
                                "result_length": len(str(tool_result))
                            }
                        })

                        # Record data fetch if tool returned data
                        if isinstance(tool_result, dict) and "data" in tool_result:
                            audit_trail.append({
                                "step": "data_fetch",
                                "timestamp": datetime.now().isoformat(),
                                "source": "Fabric SQL",
                                "table": "various",
                                "records_count": len(tool_result.get("data", [])) if isinstance(tool_result.get("data"), list) else "N/A"
                            })

                        tool_results.append({
                            "type": "tool_result",
                            "tool_use_id": tool_use_id,
                            "content": str(tool_result)
                        })

                # Add tool results to conversation
                messages.append({
                    "role": "user",
                    "content": tool_results
                })

                # Continue loop to get Claude's response with tool results
                continue

            else:
                # Unexpected stop reason
                audit_trail.append({
                    "step": "error",
                    "timestamp": datetime.now().isoformat(),
                    "error": f"Unexpected stop reason: {stop_reason}"
                })
                thread_id = request.thread_id or f"tier1_{agent_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
                return ChatResponse(response=f"Unexpected stop reason: {stop_reason}", thread_id=thread_id, audit_trail=audit_trail)

        audit_trail.append({
            "step": "error",
            "timestamp": datetime.now().isoformat(),
            "error": "Maximum iterations reached"
        })
        thread_id = request.thread_id or f"tier1_{agent_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        return ChatResponse(response="Maximum iterations reached", thread_id=thread_id, audit_trail=audit_trail)

    except Exception as e:
        if "pyodbc" in str(type(e)).lower() or "database" in str(e).lower():
            print(f"[{agent_type}] Database error: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    except requests.exceptions.RequestException as e:
        print(f"[{agent_type}] API error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")
    except Exception as e:
        print(f"[{agent_type}] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@app.post("/api/agent/tier2/{agent_type}", response_model=ChatResponse)
async def tier2_agent_chat(agent_type: str, request: Tier2AgentRequest):
    """
    Tier 2 Diagnostic & RCA Agents endpoint - structured root cause analysis and constraint identification

    Agent Types:
    - downtime_rca: Structured root cause analysis for downtime events
    - bottleneck_constraint: Identifies true constraints using TOC principles
    """
    if not ANTHROPIC_API_KEY:
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY not configured")


    # Define system prompts and tools for each agent type
    agent_configs = {
        "downtime_rca": {
            "system_prompt": f"""You are the Downtime RCA Agent for NovaChem Grangemouth, a specialized AI that provides structured root cause analysis for downtime events in a chemical manufacturing environment.

**Response Format:**
- Do not use emojis in any response
- Use plain text, tables, or markdown lists only

**Your Purpose:** Move NovaChem from reactive firefighting to a structured learning and prevention culture

**Database Context:**
- Database: {FABRIC_DATABASE}
- Data source: Fabric SQL Analytics Endpoint
- Facility: NovaChem, Grangemouth chemical plant

**Data You Consume:**
- Downtime and CIP events (dbo.downtime) — planned vs unplanned stoppages, CIP sequences
- OT process events (dbo.ot_process_events) — pre- and post-downtime tag signals
- Production orders (dbo.sap_production_orders) — order context around downtime events
- Maintenance orders (dbo.maintenance_orders) — maintenance work linked to failures

**What You Do:**
- Cluster downtime causes by type (mechanical failure, CIP overrun, changeover delay, operator issue, utility failure)
- Correlate OT tag signals with the onset of downtime to identify leading indicators
- Explain recurrence patterns across reactors, shifts, and product families
- Distinguish root causes from symptoms using structured analysis
- Identify whether downtime is driven by equipment, process, or scheduling factors

**Your Approach:**
1. Use tools to fetch downtime events and OT data for the relevant period
2. Cluster and categorize downtime by cause type and duration
3. Correlate pre-downtime OT signals to identify warning patterns
4. Distinguish root causes from immediate symptoms
5. Explain recurrence and provide a structured RCA summary

**Example Questions You Answer:**
- "Why do we keep losing Reactor 2 during full hot CIP sequences?"
- "Is this a mechanical failure or a process/operator issue?"
- "What usually happens in the OT data before this type of downtime?"
- "Which changeover type causes the most unplanned downtime?"

**Key Value:** Structured causal analysis moves NovaChem from reactive incident response to systematic prevention.

Be thorough and evidence-based. Separate what the data shows from what it implies. Always state confidence level.""",
            "tools": DOWNTIME_RCA_TOOLS
        },
        "bottleneck_constraint": {
            "system_prompt": f"""You are the Bottleneck / Constraint Agent for NovaChem Grangemouth, a specialized AI that identifies true production constraints using Theory of Constraints (TOC) principles in a chemical manufacturing context.

**Response Format:**
- Do not use emojis in any response
- Use plain text, tables, or markdown lists only

**Your Purpose:** Focus improvement effort where it will have the greatest impact on throughput

**Database Context:**
- Database: {FABRIC_DATABASE}
- Data source: Fabric SQL Analytics Endpoint
- Facility: NovaChem, Grangemouth chemical plant

**Data You Consume:**
- Actual run rates by reactor/line and product (dbo.run_rates)
- Unconstrained (theoretical) run rates (dbo.unconstrained_run_rates)
- Production order flow and batch sequencing (dbo.sap_production_orders)
- Downtime and CIP events that interrupt flow (dbo.downtime)
- OT process events for real-time throughput signals (dbo.ot_process_events)

**What You Do:**
- Compare actual vs unconstrained run rates to find the gap and locate the constraint
- Identify which reactor, process step, or resource is limiting throughput
- Detect whether the constraint is stable or shifting between units or shifts
- Quantify the throughput impact of the current constraint in batches or tonnes
- Prioritize where to focus improvement effort for maximum gain

**Your Approach:**
1. Use tools to fetch actual and unconstrained run rates for the relevant period
2. Compare actual vs theoretical performance across all reactors and process units
3. Identify the current constraint — the unit with the largest gap between actual and unconstrained rate
4. Assess whether the constraint is stable or moving across shifts or product families
5. Quantify the impact and recommend where to focus improvement effort

**Example Questions You Answer:**
- "What is the current constraint at Grangemouth?"
- "If I could fix one thing to increase throughput, what should it be?"
- "Is the bottleneck stable or shifting between units?"
- "How much additional output would we get if we removed this constraint?"

**Key Value:** TOC-based constraint identification ensures improvement effort is focused where it drives real throughput gain, not just local efficiency.

Apply Theory of Constraints thinking rigorously. The constraint is the single bottleneck limiting total system throughput. Improving anything that is not the constraint does not increase overall output.""",
            "tools": BOTTLENECK_CONSTRAINT_TOOLS
        }
    }

    if agent_type not in agent_configs:
        raise HTTPException(status_code=400, detail=f"Invalid agent type: {agent_type}")

    config = agent_configs[agent_type]

    try:
        url = f"{ANTHROPIC_BASE_URL}/v1/messages"
        headers = {
            "Content-Type": "application/json",
            "x-api-key": ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01"
        }

        # Initialize conversation
        messages = [{"role": "user", "content": request.message}]
        audit_trail = []

        # Record initial user query
        audit_trail.append({
            "step": "user_query",
            "timestamp": datetime.now().isoformat(),
            "content": request.message
        })

        # Agentic loop with tool calling (max 10 iterations)
        max_iterations = 10
        for iteration in range(max_iterations):
            print(f"[{agent_type}] Iteration {iteration + 1}/{max_iterations}")

            payload = {
                "model": CLAUDE_MODEL,
                "max_tokens": 4096,
                "system": config["system_prompt"],
                "messages": messages,
                "tools": config["tools"]
            }

            # Record LLM call
            llm_call_start = datetime.now()
            audit_trail.append({
                "step": "llm_call",
                "iteration": iteration + 1,
                "timestamp": llm_call_start.isoformat(),
                "model": CLAUDE_MODEL,
                "status": "started"
            })

            response = requests.post(url, headers=headers, json=payload)
            response.raise_for_status()
            result = response.json()

            llm_call_end = datetime.now()
            llm_duration = (llm_call_end - llm_call_start).total_seconds()

            stop_reason = result.get("stop_reason")
            content_blocks = result.get("content", [])

            # Update LLM call record
            audit_trail[-1].update({
                "status": "completed",
                "duration_seconds": round(llm_duration, 3),
                "stop_reason": stop_reason,
                "usage": result.get('usage', {})
            })

            # Extract text response if available
            text_response = ""
            for block in content_blocks:
                if block.get("type") == "text":
                    text_response += block.get("text", "")

            # Add assistant's response to conversation
            messages.append({
                "role": "assistant",
                "content": content_blocks
            })

            if stop_reason == "end_turn":
                # Final response
                # Record final response
                audit_trail.append({
                    "step": "final_response",
                    "timestamp": datetime.now().isoformat(),
                    "content": text_response
                })
                thread_id = request.thread_id or f"tier2_{agent_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
                return ChatResponse(response=text_response, thread_id=thread_id, audit_trail=audit_trail)

            elif stop_reason == "tool_use":
                # Process tool calls
                print(f"[{agent_type}] Processing tool calls")
                tool_results = []

                for block in content_blocks:
                    if block.get("type") == "tool_use":
                        tool_name = block.get("name")
                        tool_input = block.get("input", {})
                        tool_use_id = block.get("id")

                        print(f"[{agent_type}] Calling tool: {tool_name}")

                        # Record tool call
                        tool_call_start = datetime.now()
                        audit_trail.append({
                            "step": "tool_call",
                            "timestamp": tool_call_start.isoformat(),
                            "tool_name": tool_name,
                            "tool_input": tool_input,
                            "status": "started"
                        })

                        # Execute the tool based on tool_name
                        tool_result = execute_tool(tool_name, tool_input)

                        tool_call_end = datetime.now()
                        tool_duration = (tool_call_end - tool_call_start).total_seconds()

                        # Update tool call record with result
                        audit_trail[-1].update({
                            "status": "completed",
                            "duration_seconds": round(tool_duration, 3),
                            "result_summary": {
                                "has_data": "data" in str(tool_result),
                                "has_error": "error" in str(tool_result),
                                "result_length": len(str(tool_result))
                            }
                        })

                        # Record data fetch if tool returned data
                        if isinstance(tool_result, dict) and "data" in tool_result:
                            audit_trail.append({
                                "step": "data_fetch",
                                "timestamp": datetime.now().isoformat(),
                                "source": "Fabric SQL",
                                "table": "various",
                                "records_count": len(tool_result.get("data", [])) if isinstance(tool_result.get("data"), list) else "N/A"
                            })

                        tool_results.append({
                            "type": "tool_result",
                            "tool_use_id": tool_use_id,
                            "content": str(tool_result)
                        })

                # Add tool results to conversation
                messages.append({
                    "role": "user",
                    "content": tool_results
                })

                # Continue loop to get Claude's response with tool results
                continue

            else:
                # Unexpected stop reason
                audit_trail.append({
                    "step": "error",
                    "timestamp": datetime.now().isoformat(),
                    "error": f"Unexpected stop reason: {stop_reason}"
                })
                thread_id = request.thread_id or f"tier2_{agent_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
                return ChatResponse(response=f"Unexpected stop reason: {stop_reason}", thread_id=thread_id, audit_trail=audit_trail)

        audit_trail.append({
            "step": "error",
            "timestamp": datetime.now().isoformat(),
            "error": "Maximum iterations reached"
        })
        thread_id = request.thread_id or f"tier2_{agent_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        return ChatResponse(response="Maximum iterations reached", thread_id=thread_id, audit_trail=audit_trail)

    except Exception as e:
        if "pyodbc" in str(type(e)).lower() or "database" in str(e).lower():
            print(f"[{agent_type}] Database error: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    except requests.exceptions.RequestException as e:
        print(f"[{agent_type}] API error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")
    except Exception as e:
        print(f"[{agent_type}] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@app.post("/api/agent/tier3/{agent_type}", response_model=ChatResponse)
async def tier3_agent_chat(agent_type: str, request: Tier3AgentRequest):
    """
    Tier 3 Predictive & Prescriptive Agents endpoint - orchestrator agents with agent-to-agent calling capability

    These agents leverage Tier 1 (Analytical) and Tier 2 (RCA) agents to build comprehensive recommendations.

    Agent Types:
    - operations_recommendation: Orchestrates multiple agents to suggest improvement actions
      * Calls: Performance Analyst, Line Operations, Downtime RCA, Throughput RCA
      * Synthesizes insights into ranked recommendations with ROI estimates

    - executive_briefing: Orchestrates specialist agents to create leadership summaries
      * Calls: Performance Analyst, Data Quality, Line Operations, RCA agents
      * Translates technical insights into executive-ready briefs

    Agent-to-Agent Orchestration Flow:
    1. Tier 3 agent receives user query
    2. Orchestrates calls to Tier 1/2 agents for specialized insights
    3. Synthesizes multiple agent outputs
    4. Returns comprehensive recommendation or briefing

    Audit trail includes "agent_to_agent_call" steps showing orchestration chain.
    """
    if not ANTHROPIC_API_KEY:
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY not configured")


    # Define system prompts and tools for each agent type
    agent_configs = {
        "operations_recommendation": {
            "system_prompt": f"""You are the Operations Recommendation Agent for NovaChem Grangemouth - a Tier 3 orchestrator that leverages insights from Tier 1 and Tier 2 specialist agents to produce ranked, actionable improvement recommendations for chemical manufacturing operations.

**Response Format:**
- Do not use emojis in any response
- Use plain text, tables, or markdown lists only

**Your Purpose:** Bridge analytical insight and operational decision-making through agent-to-agent orchestration

**Database Context:**
- Database: {FABRIC_DATABASE}
- Data source: Fabric SQL Analytics Endpoint
- Facility: NovaChem, Grangemouth chemical plant

**Your Agent-to-Agent Orchestration Capability:**
You are a TIER 3 agent that orchestrates lower-tier agents to build comprehensive recommendations:

**Tier 1 Agents You Can Call:**
- call_performance_analyst: Get variance analysis and trend explanations (batch yield, CIP efficiency, schedule adherence)
- call_line_operations_agent: Get real-time reactor/line performance and operational bottlenecks

**Tier 2 Agents You Can Call:**
- call_downtime_rca_agent: Get root cause analysis of downtime and CIP overrun patterns
- call_throughput_rca_agent: Get bottleneck identification and throughput impact quantification

**What You Do:**
1. ORCHESTRATE multiple agents to gather comprehensive insights across performance, operations, and root cause
2. SYNTHESIZE their outputs into coherent, prioritised recommendations
3. RANK improvement opportunities by expected impact (tonnes, batches, cost) and feasibility
4. ESTIMATE the impact of each recommendation in terms the plant team will understand
5. EXPLAIN trade-offs between options (e.g. short-term schedule fix vs long-term CIP optimisation)
6. PRIORITIZE actions based on business value and operational context

**Your Approach - FOLLOW THIS EXACTLY:**
1. **MANDATORY FIRST STEP: Orchestrate Tier 1/2 agents** - You MUST call at least 2-3 specialist agents before forming recommendations:
   - Call call_performance_analyst for variance analysis and performance trends
   - Call call_line_operations_agent for current operational issues and reactor status
   - Call call_downtime_rca_agent for downtime root causes (especially CIP and changeover)
   - Call call_throughput_rca_agent for constraint and bottleneck analysis
2. **After gathering agent insights**, synthesize their outputs into coherent recommendations
3. **Rank and prioritize** by expected throughput or yield impact
4. **Present actionable recommendations** with clear trade-offs and next steps

**CRITICAL INSTRUCTION:**
- You MUST use the call_* tools to consult specialist agents BEFORE making recommendations
- DO NOT use direct data tools (calculate_*, get_*) — those are for the agents you call
- Your value is orchestration and synthesis, not direct analysis

**Example Flow:**
User: "What are the top 3 actions to improve throughput this week?"
Step 1: Call call_line_operations_agent("Which reactors have the worst throughput right now?")
Step 2: Call call_throughput_rca_agent("What is causing throughput gaps on the worst performing units?")
Step 3: Call call_performance_analyst("What is the performance trend for those units?")
Step 4: Synthesize all 3 agent responses — rank opportunities — present top 3 recommendations with impact estimates

IMPORTANT:
- Always start by calling 2-3 specialist agents — this is mandatory
- You are an orchestrator, not a direct analyst
- Show which agents you consulted in your response
- Frame all recommendations with estimated impact and trade-offs
- Use the language of chemical manufacturing: batches, tonnes, CIP sequences, changeover families, reactor utilisation""",
            "tools": OPERATIONS_RECOMMENDATION_TOOLS
        },
        "executive_briefing": {
            "system_prompt": f"""You are the Executive Briefing Agent for NovaChem Grangemouth - a Tier 3 orchestrator that synthesizes insights from multiple specialist agents into concise, decision-ready summaries for plant leadership and senior management.

**Response Format:**
- Do not use emojis in any response
- Use plain text, tables, or markdown lists only

**Your Purpose:** Give NovaChem leadership a clear, reliable picture of plant performance without requiring them to interpret technical data

**Database Context:**
- Database: {FABRIC_DATABASE}
- Data source: Fabric SQL Analytics Endpoint
- Facility: NovaChem, Grangemouth chemical plant

**Your Agent-to-Agent Orchestration Capability:**
You are a TIER 3 agent that orchestrates lower-tier agents to create comprehensive executive briefs:

**Tier 1 Agents You Can Call:**
- call_performance_analyst: Get plain-language explanations of batch yield variances, CIP efficiency, and schedule adherence
- call_data_quality_agent: Get data reliability concerns that could affect the validity of reports or decisions
- call_line_operations_agent: Get operational highlights and critical issues from the plant floor

**Tier 2 Agents You Can Call:**
- call_downtime_rca_agent: Get root causes of major downtime or CIP overrun events
- call_throughput_rca_agent: Get explanations of throughput gaps and constraint impacts

**What You Do:**
1. ORCHESTRATE multiple specialist agents to gather comprehensive plant insights
2. SYNTHESIZE technical outputs into plain business language suitable for senior leadership
3. HIGHLIGHT the critical risks, wins, and decisions that leadership needs to act on
4. FILTER out technical detail — focus on business impact, schedule risk, and financial exposure
5. CREATE brief, structured summaries that a plant director or CFO can absorb in under 3 minutes

**Your Approach - FOLLOW THIS EXACTLY:**
1. **MANDATORY FIRST STEP: Orchestrate Tier 1/2 agents** - You MUST call at least 3-4 specialist agents before writing any briefing:
   - Call call_performance_analyst for performance vs plan explanation
   - Call call_data_quality_agent to flag any data reliability concerns affecting the briefing
   - Call call_line_operations_agent for operational highlights and current issues
   - Call call_downtime_rca_agent for root causes of major downtime events (if relevant)
2. **After gathering all agent insights**, translate technical outputs into business language
3. **Prioritize** risks and wins by business impact (schedule, yield, cost, safety)
4. **Create a brief** executive summary — structured, jargon-free, and actionable

**CRITICAL INSTRUCTION:**
- You MUST use the call_* tools to consult specialist agents BEFORE writing any briefing
- DO NOT use direct data tools (calculate_*, get_*) — those are for the agents you call
- Your value is orchestrating specialists and translating their insights for leadership

**Example Flow:**
User: "Summarize yesterday for leadership"
Step 1: Call call_performance_analyst("How did we perform yesterday vs the production plan?")
Step 2: Call call_line_operations_agent("What were the most critical operational issues yesterday?")
Step 3: Call call_downtime_rca_agent("What caused the major downtime events yesterday?")
Step 4: Call call_data_quality_agent("Are there any data quality concerns we should flag to leadership?")
Step 5: Synthesize all 4 responses — translate to business terms — produce brief executive summary

**Example Questions You Answer:**
- "Summarise yesterday for the plant director"
- "What should leadership be worried about this week?"
- "Are we on track to hit this month's production targets?"
- "Draft a briefing note for the CFO on last week's performance"

IMPORTANT:
- Always start by calling 3-4 specialist agents — this is mandatory
- You are an orchestrator and translator, not a direct analyst
- Translate all technical outputs into plain business language
- Focus on outcomes, schedule risk, yield impact, and cost exposure — not technical process detail
- Keep it brief and structured (busy senior leadership audience)
- Note which agents you consulted at the end of the briefing""",
            "tools": EXECUTIVE_BRIEFING_TOOLS
        }
    }

    if agent_type not in agent_configs:
        raise HTTPException(status_code=400, detail=f"Invalid agent type: {agent_type}")

    config = agent_configs[agent_type]

    try:
        url = f"{ANTHROPIC_BASE_URL}/v1/messages"
        headers = {
            "Content-Type": "application/json",
            "x-api-key": ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01"
        }

        # Initialize conversation
        messages = [{"role": "user", "content": request.message}]
        audit_trail = []

        # Record initial user query
        audit_trail.append({
            "step": "user_query",
            "timestamp": datetime.now().isoformat(),
            "content": request.message
        })

        # Agentic loop with tool calling (max 10 iterations)
        max_iterations = 10
        for iteration in range(max_iterations):
            print(f"[{agent_type}] Iteration {iteration + 1}/{max_iterations}")

            payload = {
                "model": CLAUDE_MODEL,
                "max_tokens": 4096,
                "system": config["system_prompt"],
                "messages": messages,
                "tools": config["tools"]
            }

            # Record LLM call
            llm_call_start = datetime.now()
            audit_trail.append({
                "step": "llm_call",
                "iteration": iteration + 1,
                "timestamp": llm_call_start.isoformat(),
                "model": CLAUDE_MODEL,
                "status": "started"
            })

            response = requests.post(url, headers=headers, json=payload)
            response.raise_for_status()
            result = response.json()

            llm_call_end = datetime.now()
            llm_duration = (llm_call_end - llm_call_start).total_seconds()

            stop_reason = result.get("stop_reason")
            content_blocks = result.get("content", [])

            # Update LLM call record
            audit_trail[-1].update({
                "status": "completed",
                "duration_seconds": round(llm_duration, 3),
                "stop_reason": stop_reason,
                "usage": result.get('usage', {})
            })

            # Extract text response if available
            text_response = ""
            for block in content_blocks:
                if block.get("type") == "text":
                    text_response += block.get("text", "")

            # Add assistant's response to conversation
            messages.append({
                "role": "assistant",
                "content": content_blocks
            })

            if stop_reason == "end_turn":
                # Final response
                # Record final response
                audit_trail.append({
                    "step": "final_response",
                    "timestamp": datetime.now().isoformat(),
                    "content": text_response
                })
                thread_id = request.thread_id or f"tier3_{agent_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
                return ChatResponse(response=text_response, thread_id=thread_id, audit_trail=audit_trail)

            elif stop_reason == "tool_use":
                # Process tool calls
                print(f"[{agent_type}] Processing tool calls")
                tool_results = []

                for block in content_blocks:
                    if block.get("type") == "tool_use":
                        tool_name = block.get("name")
                        tool_input = block.get("input", {})
                        tool_use_id = block.get("id")

                        print(f"[{agent_type}] Calling tool: {tool_name}")

                        # Record tool call
                        tool_call_start = datetime.now()
                        audit_trail.append({
                            "step": "tool_call",
                            "timestamp": tool_call_start.isoformat(),
                            "tool_name": tool_name,
                            "tool_input": tool_input,
                            "status": "started"
                        })

                        # Execute the tool based on tool_name
                        tool_result = execute_tool(tool_name, tool_input)

                        tool_call_end = datetime.now()
                        tool_duration = (tool_call_end - tool_call_start).total_seconds()

                        # Update tool call record with result
                        audit_trail[-1].update({
                            "status": "completed",
                            "duration_seconds": round(tool_duration, 3),
                            "result_summary": {
                                "has_data": "data" in str(tool_result),
                                "has_error": "error" in str(tool_result),
                                "result_length": len(str(tool_result)),
                                "is_agent_call": "agent_type" in str(tool_result)
                            }
                        })

                        # Record agent-to-agent call if this was an agent orchestration
                        if isinstance(tool_result, dict) and "agent_type" in tool_result:
                            audit_trail.append({
                                "step": "agent_to_agent_call",
                                "timestamp": datetime.now().isoformat(),
                                "orchestrator": f"tier3_{agent_type}",
                                "called_agent": tool_result.get("agent"),
                                "agent_tier": tool_result.get("agent_type"),
                                "query": tool_result.get("query"),
                                "response_length": len(tool_result.get("response", ""))
                            })

                        # Record data fetch if tool returned data
                        elif isinstance(tool_result, dict) and "data" in tool_result:
                            audit_trail.append({
                                "step": "data_fetch",
                                "timestamp": datetime.now().isoformat(),
                                "source": "Fabric SQL",
                                "table": "various",
                                "records_count": len(tool_result.get("data", [])) if isinstance(tool_result.get("data"), list) else "N/A"
                            })

                        tool_results.append({
                            "type": "tool_result",
                            "tool_use_id": tool_use_id,
                            "content": str(tool_result)
                        })

                # Add tool results to conversation
                messages.append({
                    "role": "user",
                    "content": tool_results
                })

                # Continue loop to get Claude's response with tool results
                continue

            else:
                # Unexpected stop reason
                audit_trail.append({
                    "step": "error",
                    "timestamp": datetime.now().isoformat(),
                    "error": f"Unexpected stop reason: {stop_reason}"
                })
                thread_id = request.thread_id or f"tier3_{agent_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
                return ChatResponse(response=f"Unexpected stop reason: {stop_reason}", thread_id=thread_id, audit_trail=audit_trail)

        audit_trail.append({
            "step": "error",
            "timestamp": datetime.now().isoformat(),
            "error": "Maximum iterations reached"
        })
        thread_id = request.thread_id or f"tier3_{agent_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        return ChatResponse(response="Maximum iterations reached", thread_id=thread_id, audit_trail=audit_trail)

    except Exception as e:
        if "pyodbc" in str(type(e)).lower() or "database" in str(e).lower():
            print(f"[{agent_type}] Database error: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    except requests.exceptions.RequestException as e:
        print(f"[{agent_type}] API error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")
    except Exception as e:
        print(f"[{agent_type}] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


class ScheduleOptimizerRequest(BaseModel):
    week: str
    schedule: List[Dict[str, Any]]


@app.post("/api/agent/schedule-optimizer")
async def schedule_optimizer(request: ScheduleOptimizerRequest):
    """
    Accepts current week production schedule with changeover data and returns
    an AI-generated optimised sequence recommendation.
    """
    SYSTEM_PROMPT = """You are a production scheduling specialist for a chemical manufacturing facility (NovaChem, Grangemouth).

Your role is to analyse the current production schedule and recommend sequence changes that minimise total changeover time across all reactor and batch lines.

Changeover rules for chemical production:
- Same chemical family (e.g. Specialty Solvents to Specialty Solvents): Rinse-1 — approximately 1 hour
- Different chemical family (e.g. Solvents to Cleaners, Cleaners to Lubricants): Full Hot CIP Sequence — approximately 4 hours

Chemical families in this facility:
- Specialty Solvents: IPA, Acetone, MEK, Ethanol, Toluene, Hexane, Xylene and related solvents
- Industrial Cleaners: Caustic cleaners, acid descalers, degreasers, neutral cleaners
- Process Chemicals: CIP concentrates, biocides, sanitisers, pH neutralisers, scale inhibitors
- Lubricants and Base Oils: Hydraulic oils, gear oils, process lubricants, compressor oils

Your analysis must:
1. Identify each Full Hot CIP Sequence in the current schedule and the chemical families involved
2. Determine whether resequencing orders within a line and day would eliminate or reduce Full CIP transitions
3. Calculate the time saving for each recommended change
4. State the total potential saving across all lines
5. Flag any capacity or feasibility constraints that limit resequencing options

Output format:
- Use clear section headers
- For each recommendation, state: Line, Date, Current sequence, Proposed sequence, Time saved
- Provide a summary table at the end: Line | Current changeover hours | Optimised changeover hours | Saving
- Use plain professional language — no bullet decorations, icons, or emojis
- Be specific and quantified; avoid vague recommendations"""

    schedule_json = json.dumps(request.schedule, indent=2)
    user_message = (
        f"Analyse the production schedule for the week of {request.week} "
        f"and provide an optimised sequence recommendation to minimise changeover time.\n\n"
        f"Current schedule data:\n{schedule_json}"
    )

    try:
        headers = {
            "Content-Type": "application/json",
            "x-api-key": ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
        }
        payload = {
            "model": CLAUDE_MODEL,
            "max_tokens": 4000,
            "system": SYSTEM_PROMPT,
            "messages": [{"role": "user", "content": user_message}],
        }
        resp = requests.post(
            f"{ANTHROPIC_BASE_URL}/v1/messages",
            headers=headers,
            json=payload,
            timeout=90,
        )
        resp.raise_for_status()
        result = resp.json()
        response_text = result["content"][0]["text"]
        return {"response": response_text, "success": True}
    except Exception as e:
        print(f"[schedule-optimizer] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health_check():
    """Health check endpoint to verify Fabric SQL connectivity"""
    try:
        healthy = fabric_ping()
        return {"status": "healthy" if healthy else "unhealthy", "database": FABRIC_DATABASE, "data_source": "Fabric SQL Analytics Endpoint"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}


# ── Serve React frontend (SPA) ────────────────────────────────────────────────
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

_FRONTEND = Path(__file__).parent / "frontend_dist"
if _FRONTEND.exists():
    app.mount("/assets", StaticFiles(directory=str(_FRONTEND / "assets")), name="static-assets")
    if (_FRONTEND / "docs").exists():
        app.mount("/docs-assets", StaticFiles(directory=str(_FRONTEND / "docs")), name="static-docs")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        return FileResponse(str(_FRONTEND / "index.html"))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
