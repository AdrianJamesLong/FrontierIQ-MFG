# Application Health & Monitoring

**Last Updated:** December 18, 2025  
**Version:** 1.0.0

---

## Overview

The **Application Health & Monitoring** system provides comprehensive real-time monitoring and observability for the WestPlant Operations Application. It tracks system health, performance metrics, data flow, and service availability across all components including backend services, databases, AI agents, and frontend applications.

**Route:** `/app-health`

---

## Key Features

### Real-Time Health Monitoring
- **Automated Health Checks:** Every 10 seconds
- **Multi-Service Monitoring:** Backend API, databases, data sources, AI agents
- **Status Tracking:** Healthy, Warning, Critical, Checking states
- **Response Time Measurement:** Millisecond-level precision
- **Record Count Tracking:** Data availability verification

### Comprehensive Service Coverage

**Monitored Services:**
1. Backend API (FastAPI Server)
2. SAP Data (ProductionScheduleWestPlant - Kusto)
3. Process Events (Amp MaxProcessEvents - Kusto)
4. Runrates (Kusto)
5. Downtime (Kusto)
6. Unconstrained Runrates (Kusto)
7. OT Data (Processevent_silver - Kusto)
8. Data Agent AI (Claude Sonnet 4.5)
9. Frontend App (React + Vite)

---

## Dashboard Tabs

### 1. Overview Tab

**Purpose:** High-level system health status and key metrics

**Key Metrics Displayed:**
- **Overall Status:** System-wide health indicator (Healthy/Warning/Critical)
- **Backend Status:** API availability and response time
- **SAP Data:** Record count and connection status
- **Process Events:** Event count and data freshness
- **Success Rate:** Percentage of successful API requests
- **Average Latency:** Mean response time across all requests
- **Recent Latency:** Last 10 requests average
- **Errors:** Total error count and error rate
- **Total Requests:** Cumulative request counter

**Visual Components:**
- Status badges with color coding (Green/Yellow/Red)
- Real-time metric cards
- Service health cards with detailed status
- Response time trend chart

### 2. Services Tab

**Purpose:** Detailed status of individual services

**Service Information:**
- Service name and type
- Connection status
- Record counts
- Last sync timestamp
- Response times
- Health indicators

**Service Categories:**
- **Backend Services:** API servers and endpoints
- **Data Sources:** Kusto tables and databases
- **AI Services:** Agent availability and status
- **Frontend:** Application runtime status

### 3. Performance Tab

**Purpose:** Performance metrics and trends

**Metrics Tracked:**
- Response time trends (last 20 data points)
- Request throughput
- Latency distribution
- Performance degradation detection
- Peak load identification

**Visualizations:**
- Line charts for response time trends
- Bar charts for request distribution
- Performance comparison over time

### 4. Data Flow Tab

**Purpose:** Monitor data pipeline health

**Data Flow Monitoring:**
- Data ingestion rates
- Record counts per source
- Data freshness indicators
- Sync status tracking
- Data quality metrics

**Data Sources:**
- ProductionScheduleWestPlant (SAP Data)
- Amp MaxProcessEvents (Process Events)
- Runrates
- Downtime
- UnconstrainedRunrates
- Processevent_silver (OT Data)

### 5. Request Logs Tab

**Purpose:** Detailed request history and debugging

**Log Information:**
- Timestamp
- Endpoint
- HTTP Method
- Status (Success/Failed)
- Duration (ms)
- Record count
- Error messages (if applicable)

**Features:**
- Last 50 requests displayed
- Real-time log updates
- Filterable by status
- Sortable by timestamp
- Export capability

### 6. Analytics Tab

**Purpose:** Historical analysis and trends

**Analytics Features:**
- Success rate trends
- Error rate analysis
- Performance patterns
- Usage statistics
- Capacity planning insights

### 7. Agents Overview Tab

**Purpose:** AI agent health monitoring

**Agent Monitoring:**
- Agent availability status
- Response times per agent
- Tool execution success rates
- Token usage tracking
- Error rates by agent

---

## Health Status Indicators

### Status Levels

**Healthy (Green)**
- All services operational
- Response times within acceptable range
- No errors detected
- Data freshness confirmed

**Warning (Yellow)**
- Some services degraded
- Response times elevated
- Minor errors detected
- Data slightly stale

**Critical (Red)**
- Services offline or failing
- Response times unacceptable
- High error rates
- Data unavailable or very stale

**Checking (Gray)**
- Initial health check in progress
- Status not yet determined

### Status Calculation

**Overall Health Algorithm:**
```
IF any service = ERROR → Critical
ELSE IF any service = WARNING → Warning
ELSE IF all services = HEALTHY → Healthy
ELSE → Checking
```

---

## Monitoring Architecture

### Health Check Flow

```
┌─────────────────────────────────────────────────┐
│  Health Check Scheduler (Every 10 seconds)      │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  Parallel Service Checks                         │
│  ├─ Backend API                                  │
│  ├─ SAP Data (Kusto)                            │
│  ├─ Process Events (Kusto)                      │
│  ├─ Runrates (Kusto)                            │
│  ├─ Downtime (Kusto)                            │
│  ├─ Unconstrained Runrates (Kusto)              │
│  └─ OT Data (Kusto)                             │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  Status Aggregation & Analysis                   │
│  ├─ Calculate response times                     │
│  ├─ Count records                                │
│  ├─ Determine health status                      │
│  └─ Update metrics                               │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  Logging & Persistence                           │
│  ├─ Log health metrics to file                   │
│  ├─ Update performance history                   │
│  ├─ Store request logs                           │
│  └─ Calculate analytics                          │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  Dashboard Update                                │
│  └─ Real-time UI refresh                         │
└─────────────────────────────────────────────────┘
```

### API Endpoints Monitored

| Endpoint | Purpose | Expected Response |
|----------|---------|-------------------|
| `/api/data` | SAP production data | 200 OK with records |
| `/api/coke-process-events` | Process events | 200 OK with events |
| `/api/runrates` | Production rates | 200 OK with rates |
| `/api/downtime` | Downtime events | 200 OK with events |
| `/api/unconstrained-runrates` | Theoretical capacity | 200 OK with rates |
| `/api/ot-data` | OT system data | 200 OK with records |

---

## Metrics & KPIs

### Performance Metrics

**Response Time:**
- Average response time (all requests)
- Recent average (last 10 requests)
- Min/Max response times
- 95th percentile latency

**Throughput:**
- Requests per second
- Total request count
- Request distribution by endpoint

**Reliability:**
- Success rate (%)
- Error rate (%)
- Uptime percentage
- Mean time between failures (MTBF)

### Data Quality Metrics

**Freshness:**
- Last sync timestamp
- Data age
- Staleness indicators

**Completeness:**
- Record counts
- Expected vs actual records
- Missing data detection

**Availability:**
- Service uptime
- Connection success rate
- Data source availability

---

## Alerting & Notifications

### Alert Conditions

**Critical Alerts:**
- Backend API offline
- Database connection lost
- Error rate > 10%
- Response time > 5000ms
- Zero records in critical tables

**Warning Alerts:**
- Response time > 2000ms
- Error rate > 5%
- Data staleness > 5 minutes
- Record count drop > 50%

**Info Alerts:**
- Service restart detected
- Configuration change
- Maintenance mode activated

### Alert Channels

**Supported Channels:**
- Email notifications
- Slack integration
- Webhook callbacks
- In-app notifications
- SMS alerts (configurable)

---

## Health Logging

### Log Structure

```json
{
  "timestamp": "2025-12-18T18:00:00Z",
  "service": "Backend API",
  "status": "healthy",
  "responseTime": 234,
  "metadata": {
    "uptime": 3600000,
    "recordCount": 1250,
    "lastSync": "2025-12-18T17:59:50Z"
  }
}
```

### Log Storage

**Location:** `health_logs/` directory

**File Format:** JSON Lines (JSONL)

**Retention:** Configurable (default: 30 days)

**Rotation:** Daily log files

---

## Best Practices

### Monitoring Strategy

1. **Regular Review:** Check dashboard daily
2. **Trend Analysis:** Monitor performance trends weekly
3. **Alert Configuration:** Set appropriate thresholds
4. **Log Analysis:** Review logs for patterns
5. **Capacity Planning:** Use metrics for scaling decisions

### Performance Optimization

1. **Response Time:** Target < 500ms average
2. **Success Rate:** Maintain > 99%
3. **Error Rate:** Keep < 1%
4. **Data Freshness:** Update within 1 minute
5. **Uptime:** Achieve 99.9% availability

### Troubleshooting

**High Response Times:**
1. Check database query performance
2. Review network latency
3. Analyze concurrent request load
4. Optimize slow queries
5. Consider caching strategies

**Service Failures:**
1. Check service logs
2. Verify network connectivity
3. Confirm authentication credentials
4. Review recent configuration changes
5. Restart services if necessary

**Data Staleness:**
1. Verify data pipeline status
2. Check ingestion processes
3. Review sync schedules
4. Confirm source system availability
5. Investigate transformation errors

---

## Integration Points

### Backend Integration

**Health Check API:**
```
POST /api/health/log
Content-Type: application/json

{
  "metrics": [
    {
      "timestamp": "2025-12-18T18:00:00Z",
      "service": "Backend API",
      "status": "healthy",
      "responseTime": 234
    }
  ]
}
```

### Data Source Integration

**Kusto Queries:**
- Automatic query execution
- Record count validation
- Timestamp verification
- Connection health checks

### AI Agent Integration

**Agent Health Monitoring:**
- Agent availability checks
- Response time tracking
- Tool execution monitoring
- Error rate calculation

---

## Security & Compliance

### Data Privacy

- No PII in health logs
- Sanitized error messages
- Secure log storage
- Access control on logs

### Audit Requirements

- Complete health history
- Tamper-proof logging
- Retention compliance
- Export capabilities

### Access Control

- Role-based dashboard access
- Read-only for most users
- Admin access for configuration
- Audit log for all access

---

## Future Enhancements

### Planned Features

- Predictive failure detection
- Automated remediation
- Custom alert rules
- Advanced analytics dashboard
- Mobile app for monitoring
- Integration with external monitoring tools (Datadog, New Relic)
- Machine learning for anomaly detection
- Automated capacity scaling recommendations

### Research Areas

- AI-powered root cause analysis
- Predictive maintenance for services
- Intelligent alert prioritization
- Self-healing capabilities
- Performance optimization automation

---

## Related Documentation

- [System Architecture](02-architecture.md) - Technical architecture details
- [Deployment Guide](05-deployment-guide.md) - Deployment procedures

---

## Glossary

**Health Check:** Automated verification of service availability and performance  
**Response Time:** Time taken for a service to respond to a request  
**Success Rate:** Percentage of successful requests out of total requests  
**Data Freshness:** How recently data was updated or synced  
**Uptime:** Percentage of time a service is available and operational  
**MTBF:** Mean Time Between Failures - average time between service failures  

---

**Last Review Date:** December 18, 2025  
**Next Review Date:** March 18, 2026  
**Document Owner:** Platform Operations Team
