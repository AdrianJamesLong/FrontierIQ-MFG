# Health Metrics Logging System

## Overview
The Application Health & Monitoring system now includes automatic logging of all health metrics to local files for historical analysis, auditing, and compliance purposes.

## Features

### 1. Automatic Logging
- Health metrics are automatically logged every 10 seconds when the health check runs
- Logs are stored in the `backend/health_logs/` directory
- Each day's metrics are stored in a separate file: `health_metrics_YYYY-MM-DD.jsonl`

### 2. Metrics Logged
Each log entry includes:
- **Timestamp**: ISO 8601 format timestamp
- **Service Name**: Backend API, SAP Data, Process Events, etc.
- **Status**: healthy, degraded, error, warning
- **Response Time**: API response time in milliseconds
- **Record Count**: Number of records retrieved
- **Success Rate**: Percentage of successful operations
- **Error Rate**: Percentage of failed operations
- **Metadata**: Additional context (uptime, last sync time, etc.)

### 3. File Format
Logs are stored in JSONL (JSON Lines) format - one JSON object per line:
```json
{"timestamp": "2025-12-16T15:30:00.000Z", "service": "Backend API", "status": "healthy", "responseTime": 245, "metadata": {"uptime": 3600000}}
{"timestamp": "2025-12-16T15:30:00.000Z", "service": "SAP Data", "status": "healthy", "recordCount": 330, "metadata": {"lastSync": "2025-12-16T15:30:00.000Z"}}
```

## API Endpoints

### POST /api/health/log
Logs health metrics to file.

**Request Body:**
```json
{
  "metrics": [
    {
      "timestamp": "2025-12-16T15:30:00.000Z",
      "service": "Backend API",
      "status": "healthy",
      "responseTime": 245,
      "metadata": {"uptime": 3600000}
    }
  ]
}
```

**Response:**
```json
{
  "message": "Successfully logged 1 metrics",
  "success": true
}
```

### GET /api/health/history?days=7
Retrieves historical health metrics from the last N days (default: 7).

**Response:**
```json
{
  "message": "Retrieved 1440 metrics from last 7 days",
  "data": [
    {
      "timestamp": "2025-12-16T15:30:00.000Z",
      "service": "Backend API",
      "status": "healthy",
      "responseTime": 245
    }
  ],
  "success": true
}
```

## File Storage

### Location
- **Directory**: `backend/health_logs/`
- **File Pattern**: `health_metrics_YYYY-MM-DD.jsonl`
- **Example**: `health_metrics_2025-12-16.jsonl`

### Retention
- Files are kept indefinitely by default
- Implement a cleanup script if needed to remove old logs
- Recommended retention: 90 days for compliance

### File Size
- Approximately 500-1000 bytes per metric entry
- With logging every 10 seconds: ~8,640 entries per day
- Estimated daily file size: 4-8 MB per day

## Usage Examples

### Analyzing Historical Data
```python
import json
from pathlib import Path

# Read a day's metrics
log_file = Path("health_logs/health_metrics_2025-12-16.jsonl")
metrics = []
with open(log_file, 'r') as f:
    for line in f:
        metrics.append(json.loads(line))

# Calculate average response time
backend_metrics = [m for m in metrics if m['service'] == 'Backend API']
avg_response = sum(m['responseTime'] for m in backend_metrics) / len(backend_metrics)
print(f"Average response time: {avg_response}ms")
```

### Generating Reports
```python
# Find all degraded services
degraded = [m for m in metrics if m['status'] == 'degraded']
print(f"Found {len(degraded)} degraded service instances")

# Calculate uptime percentage
total = len(metrics)
healthy = len([m for m in metrics if m['status'] == 'healthy'])
uptime = (healthy / total) * 100
print(f"System uptime: {uptime:.2f}%")
```

## Integration with Frontend

The frontend automatically logs metrics through the `logHealthMetrics()` function in `AppHealth.jsx`:
- Called after each health check (every 10 seconds)
- Sends metrics to `/api/health/log` endpoint
- Runs silently in the background
- Errors are logged to console but don't affect UI

## Monitoring & Alerts

### Future Enhancements
1. **Automated Alerts**: Set up alerts when error rates exceed thresholds
2. **Dashboard Integration**: Display historical trends in Analytics tab
3. **Export Functionality**: Add CSV/Excel export for audit reports
4. **Retention Policy**: Implement automatic cleanup of old logs
5. **Compression**: Compress old log files to save space

## Compliance & Auditing

### Audit Trail
- All health checks are logged with precise timestamps
- Immutable log files (append-only)
- Can be used for compliance reporting
- Supports forensic analysis of incidents

### Data Privacy
- No personally identifiable information (PII) is logged
- Only system metrics and performance data
- Safe for long-term retention

## Troubleshooting

### Logs Not Being Created
1. Check backend is running: `python backend/main.py`
2. Verify `health_logs` directory exists
3. Check file permissions on the directory
4. Review backend console for errors

### Large File Sizes
1. Implement log rotation
2. Compress old files
3. Reduce logging frequency if needed
4. Archive old logs to external storage

## Maintenance

### Regular Tasks
- **Weekly**: Review log file sizes
- **Monthly**: Archive logs older than 30 days
- **Quarterly**: Generate compliance reports
- **Annually**: Review retention policy

### Backup Recommendations
- Include `health_logs/` in regular backups
- Consider cloud storage for long-term retention
- Test restore procedures periodically