"""
Agent Performance Metrics Routes
Analyzes chat logs to extract real-time agent performance data
"""

from fastapi import APIRouter, HTTPException
from pathlib import Path
import json
from datetime import datetime, timedelta
from typing import Dict, List, Any
from collections import defaultdict
import statistics

router = APIRouter()

# Chat logs directory
CHAT_LOGS_DIR = Path("chat_logs")


def analyze_chat_logs() -> Dict[str, Any]:
    """
    Analyze all chat logs to extract agent performance metrics
    Returns aggregated performance data for all agents
    """
    agent_data = defaultdict(lambda: {
        'executions': [],
        'token_usage': [],
        'durations': [],
        'tool_calls': [],
        'success_count': 0,
        'failure_count': 0,
        'last_execution': None
    })

    # Agent mapping from thread_id prefix to agent ID
    agent_mapping = {
        'tier0': 'smart_assistant',
        'tier1': 'performance_analyst',  # Default for tier1
        'tier2': 'root_cause_analysis',  # Default for tier2
        'tier3': 'operations_recommendation'  # Default for tier3
    }

    try:
        # Read all chat log files
        if not CHAT_LOGS_DIR.exists():
            return {}

        for log_file in CHAT_LOGS_DIR.glob("*.json"):
            try:
                with open(log_file, 'r', encoding='utf-8') as f:
                    chat_data = json.load(f)

                thread_id = chat_data.get('thread_id', '')

                # Determine agent from thread_id prefix
                agent_id = None
                for prefix, agent in agent_mapping.items():
                    if thread_id.startswith(prefix):
                        agent_id = agent
                        break

                if not agent_id:
                    continue

                # Parse timestamp from thread_id or updated_at
                timestamp_str = chat_data.get('updated_at', chat_data.get('created_at', ''))
                if timestamp_str:
                    try:
                        timestamp = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
                    except:
                        # Try parsing from thread_id
                        parts = thread_id.split('-')
                        if len(parts) >= 2:
                            timestamp = datetime.fromisoformat(parts[-1])
                        else:
                            continue
                else:
                    continue

                # Analyze messages for audit trail data
                for message in chat_data.get('messages', []):
                    audit_trail = message.get('audit_trail', [])
                    if not audit_trail:
                        continue

                    # Extract execution metrics from audit trail
                    total_duration = 0
                    total_tokens_in = 0
                    total_tokens_out = 0
                    tool_call_count = 0
                    has_error = False

                    for entry in audit_trail:
                        step = entry.get('step', '')

                        if step == 'llm_call':
                            # Extract token usage
                            usage = entry.get('usage', {})
                            total_tokens_in += usage.get('input_tokens', 0)
                            total_tokens_out += usage.get('output_tokens', 0)
                            total_duration += entry.get('duration_seconds', 0)

                            # Check for errors
                            if entry.get('status') == 'error':
                                has_error = True

                        elif step == 'tool_call':
                            tool_call_count += 1
                            total_duration += entry.get('duration_seconds', 0)

                            # Check for tool errors
                            if entry.get('status') == 'error' or entry.get('result_summary', {}).get('has_error'):
                                has_error = True

                    # Record execution
                    if total_duration > 0:
                        agent_data[agent_id]['executions'].append(timestamp)
                        agent_data[agent_id]['durations'].append(total_duration)
                        agent_data[agent_id]['token_usage'].append({
                            'input': total_tokens_in,
                            'output': total_tokens_out
                        })
                        agent_data[agent_id]['tool_calls'].append(tool_call_count)

                        if has_error:
                            agent_data[agent_id]['failure_count'] += 1
                        else:
                            agent_data[agent_id]['success_count'] += 1

                        # Update last execution
                        if (agent_data[agent_id]['last_execution'] is None or
                            timestamp > agent_data[agent_id]['last_execution']):
                            agent_data[agent_id]['last_execution'] = timestamp

            except Exception as e:
                print(f"Error processing log file {log_file}: {e}")
                continue

        # Calculate aggregated metrics for each agent
        performance_data = {}
        now = datetime.now()

        for agent_id, data in agent_data.items():
            if not data['executions']:
                continue

            # Calculate time-based metrics
            executions_last_24h = sum(1 for dt in data['executions'] if (now - dt.replace(tzinfo=None)) < timedelta(days=1))
            executions_last_7d = len(data['executions'])

            # Calculate averages
            avg_duration = statistics.mean(data['durations']) if data['durations'] else 0
            peak_duration = max(data['durations']) if data['durations'] else 0
            min_duration = min(data['durations']) if data['durations'] else 0

            avg_tokens_in = statistics.mean([t['input'] for t in data['token_usage']]) if data['token_usage'] else 0
            avg_tokens_out = statistics.mean([t['output'] for t in data['token_usage']]) if data['token_usage'] else 0

            avg_tool_calls = statistics.mean(data['tool_calls']) if data['tool_calls'] else 0

            total_executions = data['success_count'] + data['failure_count']
            success_rate = (data['success_count'] / total_executions * 100) if total_executions > 0 else 0

            performance_data[agent_id] = {
                'totalExecutions': total_executions,
                'successfulExecutions': data['success_count'],
                'failedExecutions': data['failure_count'],
                'successRate': round(success_rate, 1),
                'avgDuration': round(avg_duration, 2),
                'peakDuration': round(peak_duration, 2),
                'minDuration': round(min_duration, 2),
                'avgTokensIn': int(avg_tokens_in),
                'avgTokensOut': int(avg_tokens_out),
                'avgToolCalls': round(avg_tool_calls, 1),
                'last24h': executions_last_24h,
                'last7d': executions_last_7d,
                'lastExecution': data['last_execution'].isoformat() if data['last_execution'] else None
            }

        return performance_data

    except Exception as e:
        print(f"Error analyzing chat logs: {e}")
        return {}


@router.get("/api/agent-performance/metrics")
async def get_agent_performance_metrics():
    """
    Endpoint to get real-time agent performance metrics from chat logs
    """
    try:
        metrics = analyze_chat_logs()
        return {
            "success": True,
            "data": metrics,
            "message": f"Retrieved metrics for {len(metrics)} agents"
        }
    except Exception as e:
        print(f"Error in get_agent_performance_metrics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/agent-performance/metrics/{agent_id}")
async def get_single_agent_metrics(agent_id: str):
    """
    Endpoint to get performance metrics for a specific agent
    """
    try:
        all_metrics = analyze_chat_logs()

        if agent_id not in all_metrics:
            raise HTTPException(status_code=404, detail=f"No performance data found for agent: {agent_id}")

        return {
            "success": True,
            "data": all_metrics[agent_id],
            "agent_id": agent_id
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in get_single_agent_metrics: {e}")
        raise HTTPException(status_code=500, detail=str(e))
