# Amplify Beverages WestPlant Bottling Operations - Dashboard App

**Last Updated:** December 19, 2025  
**Version:** 1.1.0  
**Facility:** WestPlant Bottling Operations  
**Status:** Production

---

## Executive Summary

This application provides **dashboard-based operational insights** for Amplify Beverages's WestPlant bottling facility. It combines real-time production data with AI-powered analytics to deliver actionable intelligence for operations teams, supervisors, and leadership.

### Key Capabilities

✅ **Real-time Production Monitoring** - Track performance across 4 production lines  
✅ **AI-Powered Analytics** - 8 specialized agents for operational intelligence  
✅ **Data Quality Assurance** - Automated data validation and quality checks  
✅ **Root Cause Analysis** - Identify and resolve production issues faster  
✅ **Executive Briefings** - Leadership-ready summaries and insights  

---

## WestPlant Production Lines

The facility operates **4 production lines**, each with distinct capabilities:

| Line ID | Line Name | Type | Primary Products |
|---------|-----------|------|------------------|
| **APB-L01** | LINE 01 | PET Bottle Line 1 | Bottled beverages (PET) |
| **APB-L02** | LINE 02 | PET Bottle Line 2 | Bottled beverages (PET) |
| **APB-L03** | LINE 03 | Can Line | Canned beverages |
| **APB-L04** | LINE 04 | Bag-in-Box Line | Fountain/foodservice products |

---

## Data Sources

The application connects to **Microsoft Fabric Eventhouse** (ProductionDB) with the following WestPlant-specific data tables:

### Production Data Tables

1. **ProductionScheduleWestPlant**
   - Production schedule and order data
   - Planned vs actual quantities
   - Order priorities and due dates

2. **Amp MaxProcessEvents**
   - Real-time process events from production lines
   - Equipment status and state changes
   - Production milestones

3. **Runrates**
   - Actual production runrates by line
   - Units per hour performance
   - Efficiency metrics

4. **Downtime**
   - Downtime events and durations
   - Downtime reasons and categories
   - Impact on production

5. **UnconstrainedRunrates**
   - Theoretical maximum runrates
   - Capacity planning data
   - Bottleneck identification

6. **Processevent_silver**
   - Cleaned and enriched process events
   - Quality-assured production data
   - Analytics-ready dataset

---

## AI Agent Catalog (8 Production Agents)

### Tier 0: Data Foundation

#### 1. DataHub Agent
**Purpose:** Data exploration and KQL query execution  
**Use Cases:**
- Query production data directly
- Explore table schemas and structures
- Validate data availability
- Ad-hoc data analysis

---

### Tier 1: Analytical Agents

#### 2. Performance Analyst Agent
**Purpose:** KPI analysis and performance metrics  
**Key Metrics:**
- Overall Equipment Effectiveness (OEE)
- Plan Adherence (on-time vs delayed orders)
- Variance Analysis (planned vs actual)
- Production efficiency by line

**Use Cases:**
- "What's our current OEE?"
- "Show me plan adherence for this week"
- "Analyze performance variance by line"

---

#### 3. Data Quality Guardian Agent
**Purpose:** Data validation and quality monitoring  
**Key Capabilities:**
- Data freshness checks
- Completeness validation
- Anomaly detection
- Quality scoring

**Use Cases:**
- "Is our production data up to date?"
- "Check for missing values in today's data"
- "Detect any anomalies in runrate data"

---

#### 4. Line Operations AI Supervisor
**Purpose:** Production line analysis and comparison  
**Key Capabilities:**
- Individual line performance tracking
- Multi-line comparison
- Line-specific issue identification
- Shift performance summaries

**Use Cases:**
- "How is Line 3 performing today?"
- "Compare all lines for this shift"
- "Which line has the most downtime?"
- "Show me APB-L01 performance vs target"

---

### Tier 2: Diagnostic Agents

#### 5. Downtime RCA Agent
**Purpose:** Root cause analysis for downtime events  
**Key Capabilities:**
- Downtime pattern analysis
- Root cause identification
- Recurrence detection
- Preventive recommendations

**Use Cases:**
- "What caused the downtime on Line 2?"
- "Analyze downtime patterns this month"
- "What are the top 3 downtime reasons?"
- "Why do we keep losing Line 1 during changeovers?"

---

#### 6. Bottleneck & Constraint Agent
**Purpose:** Throughput analysis and bottleneck identification  
**Methodology:** Theory of Constraints (TOC)  
**Key Capabilities:**
- Identify production bottlenecks
- Compare actual vs theoretical capacity
- Detect shifting constraints
- Prioritize improvement efforts

**Use Cases:**
- "Where are our production bottlenecks?"
- "What's limiting our throughput?"
- "Compare actual vs unconstrained runrates"
- "If I fixed one thing, what should it be?"

---

### Tier 3: Orchestration Agents

#### 7. Operations Recommendation Agent
**Purpose:** Generate actionable recommendations  
**Key Capabilities:**
- Multi-agent orchestration
- Insight synthesis
- Prioritized recommendations
- Implementation guidance

**Recommendation Structure:**
1. Issue Identification
2. Root Cause Analysis
3. Business Impact Assessment
4. Recommended Actions
5. Priority Level (High/Medium/Low)
6. Implementation Steps

**Use Cases:**
- "What should we focus on to improve OEE?"
- "Give me recommendations for Line 3"
- "How can we reduce downtime?"

---

#### 8. Executive Briefing Agent
**Purpose:** Leadership-ready summaries and insights  
**Key Capabilities:**
- Executive summary generation
- Key metrics highlighting
- Risk and opportunity identification
- Strategic insights

**Briefing Structure:**
1. Executive Summary (2-3 sentences)
2. Key Metrics with trends
3. Highlights (positive developments)
4. Concerns (issues requiring attention)
5. Recommendations (strategic actions)
6. Outlook (forward-looking insights)

**Use Cases:**
- "Give me an executive summary for today"
- "What are the top 3 issues this week?"
- "Prepare a briefing for the leadership team"
- "Summarize yesterday for leadership"

---

## Key Performance Indicators (KPIs)

### Production Metrics
- **OEE (Overall Equipment Effectiveness)**: Availability × Performance × Quality
- **Plan Adherence**: % of orders completed on time
- **Throughput**: Units produced per hour by line
- **Downtime**: Total minutes of unplanned downtime
- **Changeover Time**: Setup time between product runs

### Quality Metrics
- **First Pass Yield**: % of products meeting quality standards
- **Defect Rate**: Defects per million units
- **Waste**: % of materials wasted

### Efficiency Metrics
- **Line Utilization**: % of available time in production
- **Speed Efficiency**: Actual vs theoretical runrate
- **Availability**: % of scheduled time available for production

---

## User Roles & Access

### Operations Teams
- Real-time production monitoring
- Line performance tracking
- Issue identification and resolution
- Shift handoff reports

### Supervisors & Managers
- Multi-line performance comparison
- Downtime root cause analysis
- Operational recommendations
- Performance trend analysis

### Leadership & Executives
- Executive briefings
- High-level KPI summaries
- Strategic insights
- Risk and opportunity identification

### Data Analysts
- Ad-hoc data exploration
- Custom analysis workflows
- Data quality validation
- Advanced analytics

---

## Technical Architecture

### Backend
- **Framework:** FastAPI (Python)
- **AI Engine:** Azure AI Foundry (Claude Sonnet 4.5)
- **Data Platform:** Microsoft Fabric Eventhouse
- **Query Language:** KQL (Kusto Query Language)
- **Authentication:** Azure AD Service Principal

### Frontend
- **Framework:** React 18
- **Build Tool:** Vite
- **Routing:** React Router v6
- **State Management:** React Context API
- **Styling:** CSS Modules

### Data Integration
- **Source:** WestPlant production systems
- **Database:** ProductionDB (Eventhouse)
- **Refresh:** Real-time and scheduled updates
- **Tables:** 6 primary data tables

---

## Getting Started

### For Operations Teams
1. Navigate to **Production Ops** page
2. Select your production line
3. View real-time performance metrics
4. Use AI agents for deeper analysis

### For Supervisors
1. Access **Line Operations Agent** for shift summaries
2. Use **Performance Analyst** for KPI tracking
3. Leverage **Downtime RCA Agent** for issue resolution
4. Review **Operations Recommendations** for improvements

### For Leadership
1. Access **Executive Briefing Agent** for daily summaries
2. Review key metrics on **Overview Dashboard**
3. Monitor trends and strategic insights
4. Identify risks and opportunities

### For Data Analysts
1. Use **DataHub Agent** for data exploration
2. Query production data with KQL
3. Validate data quality with **Data Quality Agent**
4. Perform custom analysis workflows

---

## Support & Resources

### Documentation
- **Design Library:** Complete technical documentation
- **API Documentation:** FastAPI auto-generated docs at `/docs`
- **Agent Framework:** Detailed agent capabilities and tools
- **Configuration Guide:** Product configuration reference

### Training
- Agent usage guides
- KQL query examples
- Dashboard navigation
- Best practices

### Contact
- **Technical Support:** Platform team
- **Operations Support:** WestPlant facility IT
- **Feature Requests:** Product backlog
- **Data Issues:** Data quality team

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-12-17 | Initial deployment |
| 1.1.0 | 2025-12-19 | WestPlant operations focus, 8 production agents |

---

## Future Enhancements

### Planned Features
- Mobile app for floor supervisors
- Predictive maintenance capabilities
- Advanced scheduling optimization
- Quality deviation detection
- Real-time alerting and notifications

### Under Consideration
- Integration with CMMS (Maintenance Management)
- Integration with ERP systems
- Advanced ML models for prediction
- Custom report builder
- Multi-facility expansion

---

**For Questions or Support:**  
Contact the Platform Team or refer to the complete Design Library documentation.

**Last Updated:** December 19, 2025
