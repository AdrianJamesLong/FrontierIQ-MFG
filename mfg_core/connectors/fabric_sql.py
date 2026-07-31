"""
Microsoft Fabric SQL Analytics Endpoint connector — FrontierIQ-MFG

Tables (dbo schema in the "AmplifyIndustrial" Lakehouse — real deployed
Fabric database name, inherited from this app's origin repo, not renamed):
  ot_process_events    — OT tag events from NovaChem Grangemouth
      timestamp, tag, val, enterprise, site, area, line, equipment,
      sub_equipment, uns_namespace, EventProcessedUtcTime

  sap_production_orders — SAP production orders (with progress snapshots)
      ORDER_ID, SCHEDULED_START_DATE, ACTUAL_START_DATE, ACTUAL_FINISH_DATE,
      MATERIAL_ID, MATERIAL_DESC, WORK_CENTER,
      PLANNED_QUANTITY, DELIVERED_QUANTITY, CONFIRMED_QUANTITY_0_DAY_PRIOR

Auth:
  Production (Azure): ClientSecretCredential via AZURE_TENANT_ID / AZURE_CLIENT_ID / AZURE_CLIENT_SECRET
  Local dev: AzureCliCredential (az login)
"""
import os
import struct
import threading
import time
from datetime import datetime

import pyodbc
from azure.identity import AzureCliCredential, ClientSecretCredential

SERVER   = os.getenv("FABRIC_SERVER",   "4dnqrejc4e6ufhtysugphcd3tm-6w6zvkrxt63upcgzkjpzd2u24a.datawarehouse.fabric.microsoft.com")
DATABASE = os.getenv("FABRIC_DATABASE", "AmplifyIndustrial")
SCOPE    = "https://analysis.windows.net/powerbi/api/.default"

# Single shared connection + per-query lock.
# Concurrent pyodbc.connect() calls from multiple threads fail with ODBC driver errors;
# serialising via _db_lock eliminates both connection-creation races and "busy" errors.
_db_lock           = threading.Lock()
_token_lock        = threading.Lock()
_cached_token:     str | None = None
_token_expires_at: float      = 0.0   # Unix timestamp; 0 = not yet fetched
_shared_conn:      pyodbc.Connection | None = None


def _make_credential():
    """Service principal in production (env vars set), CLI for local dev."""
    tenant_id = os.getenv("AZURE_TENANT_ID")
    client_id = os.getenv("AZURE_CLIENT_ID")
    client_secret = os.getenv("AZURE_CLIENT_SECRET")
    if tenant_id and client_id and client_secret:
        return ClientSecretCredential(tenant_id, client_id, client_secret)
    return AzureCliCredential()


def _get_token() -> str:
    """Return a valid bearer token, refreshing automatically 5 min before expiry."""
    global _cached_token, _token_expires_at, _shared_conn
    with _token_lock:
        if _cached_token is None or time.time() >= _token_expires_at - 300:
            tok = _make_credential().get_token(SCOPE)
            _cached_token     = tok.token
            _token_expires_at = float(tok.expires_on)
            # Force connection rebuild with the new token
            _shared_conn = None
    return _cached_token


def _get_conn() -> pyodbc.Connection:
    """Return the shared pyodbc connection, creating it on first use (must be called under _db_lock)."""
    global _shared_conn
    if _shared_conn is None:
        token        = _get_token()
        token_bytes  = token.encode("utf-16-le")
        token_struct = struct.pack(f"<I{len(token_bytes)}s", len(token_bytes), token_bytes)
        conn_str = (
            "Driver={ODBC Driver 18 for SQL Server};"
            f"Server={SERVER},1433;"
            f"Database={DATABASE};"
            "Encrypt=yes;TrustServerCertificate=no;"
        )
        _shared_conn = pyodbc.connect(conn_str, attrs_before={1256: token_struct})
    return _shared_conn


def _run(sql: str, params: tuple = ()) -> list[dict]:
    global _shared_conn
    with _db_lock:
        for attempt in range(2):
            try:
                conn   = _get_conn()
                cursor = conn.cursor()
                cursor.execute(sql, params)
                cols = [d[0] for d in cursor.description]
                rows = cursor.fetchall()
                cursor.close()
                return [{cols[i]: row[i] for i in range(len(cols))} for row in rows]
            except pyodbc.Error as e:
                # 08S01 = Communication link failure (stale/dropped connection)
                if attempt == 0 and e.args[0] in ("08S01", "08003", "HYT00"):
                    _shared_conn = None  # force reconnect on next attempt
                    continue
                raise


def _serialize(val) -> object:
    """Convert non-JSON-serialisable types (date, datetime) to strings."""
    if val is None:
        return None
    if hasattr(val, "isoformat"):
        return val.isoformat()
    return val


def _serialize_row(row: dict) -> dict:
    return {k: _serialize(v) for k, v in row.items()}


# ---------------------------------------------------------------------------
# Production Orders — SAP
# ---------------------------------------------------------------------------

def get_production_orders(limit: int = 2000) -> list[dict]:
    """
    Latest unique production orders from dbo.sap_production_orders.
    Uses MAX(DELIVERED_QUANTITY) per ORDER_ID to collapse progress snapshots
    to one representative row per order.
    """
    rows = _run(f"""
        SELECT TOP {limit}
               ORDER_ID,
               MAX(CONVERT(VARCHAR, SCHEDULED_START_DATE, 23)) AS SCHEDULED_START_DATE,
               MAX(CONVERT(VARCHAR, ACTUAL_START_DATE,    23)) AS ACTUAL_START_DATE,
               MAX(CONVERT(VARCHAR, ACTUAL_FINISH_DATE,   23)) AS ACTUAL_FINISH_DATE,
               MAX(MATERIAL_ID)                                AS MATERIAL_ID,
               MAX(MATERIAL_DESC)                              AS MATERIAL_DESC,
               MAX(WORK_CENTER)                                AS WORK_CENTER,
               MAX(CAST(PLANNED_QUANTITY   AS FLOAT))          AS PLANNED_QUANTITY,
               MAX(CAST(DELIVERED_QUANTITY AS FLOAT))          AS DELIVERED_QUANTITY,
               MAX(CAST(CONFIRMED_QUANTITY_0_DAY_PRIOR AS FLOAT)) AS CONFIRMED_QUANTITY_0_DAY_PRIOR
        FROM dbo.sap_production_orders
        GROUP BY ORDER_ID
        ORDER BY MAX(SCHEDULED_START_DATE) DESC
    """)
    return [_serialize_row(r) for r in rows]


def get_production_orders_count() -> int:
    rows = _run("SELECT COUNT(DISTINCT ORDER_ID) AS cnt FROM dbo.sap_production_orders")
    return int(rows[0]["cnt"] or 0) if rows else 0


# ---------------------------------------------------------------------------
# OT Process Events
# ---------------------------------------------------------------------------

def get_ot_events(limit: int = 100) -> list[dict]:
    """Recent OT events, ordered newest-first."""
    rows = _run(f"""
        SELECT TOP {limit}
               timestamp, tag, val, equipment, line, area, site, enterprise
        FROM dbo.ot_process_events
        ORDER BY timestamp DESC
    """)
    return [_serialize_row(r) for r in rows]


def get_ot_events_count() -> int:
    rows = _run("SELECT COUNT(*) AS cnt FROM dbo.ot_process_events")
    return int(rows[0]["cnt"] or 0) if rows else 0


def get_ot_events_sample(limit: int = 10) -> list[dict]:
    """Small sample for tool context — avoids token overruns."""
    rows = _run(f"""
        SELECT TOP {limit}
               timestamp, tag, val, equipment, line
        FROM dbo.ot_process_events
        ORDER BY timestamp DESC
    """)
    return [_serialize_row(r) for r in rows]


def get_ot_latest_timestamp() -> str | None:
    rows = _run("SELECT MAX(timestamp) AS ts FROM dbo.ot_process_events")
    val = rows[0]["ts"] if rows else None
    return _serialize(val)


def get_ot_hierarchy() -> list[dict]:
    """Distinct line/equipment/tag combinations with record counts — no row limit."""
    rows = _run("""
        SELECT line, equipment, tag,
               COUNT(*) AS record_count,
               MAX(timestamp) AS latest_timestamp
        FROM dbo.ot_process_events
        GROUP BY line, equipment, tag
        ORDER BY line, equipment, tag
    """)
    return [_serialize_row(r) for r in rows]


# ---------------------------------------------------------------------------
# Reference tables
# ---------------------------------------------------------------------------

def get_run_rates() -> list[dict]:
    rows = _run("""
        SELECT LINE, MATERIAL, MAT_DESCRIPTION, UNITS_PH
        FROM dbo.run_rates
        ORDER BY LINE, MATERIAL
    """)
    return [_serialize_row(r) for r in rows]


def get_downtime() -> list[dict]:
    rows = _run("""
        SELECT LINE, DOWNTIME_TYPE, DURATION_HRS
        FROM dbo.downtime
        ORDER BY LINE, DOWNTIME_TYPE
    """)
    return [_serialize_row(r) for r in rows]


def get_unconstrained_run_rates() -> list[dict]:
    rows = _run("""
        SELECT LINE, CONTAINER_TYPE, UNCONSTRAINED_UNITS_PH
        FROM dbo.unconstrained_run_rates
        ORDER BY LINE, CONTAINER_TYPE
    """)
    return [_serialize_row(r) for r in rows]


# ---------------------------------------------------------------------------
# Energy Consumption
# ---------------------------------------------------------------------------

def get_energy_consumption(limit: int = 2000) -> list[dict]:
    """Daily energy consumption per line from dbo.energy_consumption."""
    rows = _run(f"""
        SELECT TOP {limit}
               DATE, LINE, ENERGY_KWH, PEAK_DEMAND_KW,
               OFF_PEAK_KWH, ON_PEAK_KWH, ENERGY_COST_GBP,
               CARBON_KG, PRODUCTION_UNITS,
               ENERGY_INTENSITY_KWH_PER_UNIT, TARIFF_TYPE
        FROM dbo.energy_consumption
        ORDER BY DATE DESC, LINE
    """)
    return [_serialize_row(r) for r in rows]


# ---------------------------------------------------------------------------
# Inventory Stock
# ---------------------------------------------------------------------------

def get_inventory_stock(limit: int = 5000) -> list[dict]:
    """Weekly stock snapshots from dbo.inventory_stock."""
    rows = _run(f"""
        SELECT TOP {limit}
               SNAPSHOT_DATE, MATERIAL_ID, MATERIAL_DESC, WORK_CENTER,
               STOCK_LEVEL_UNITS, REORDER_POINT_UNITS, SAFETY_STOCK_UNITS,
               MAX_STOCK_UNITS, DAYS_OF_COVER, LEAD_TIME_DAYS,
               STOCK_STATUS, UNIT_COST_GBP, STOCK_VALUE_GBP,
               ACTUAL_DEMAND_UNITS, FORECAST_DEMAND_UNITS,
               ABC_CLASS, WAREHOUSE_LOCATION, PENDING_ORDERS_UNITS
        FROM dbo.inventory_stock
        ORDER BY SNAPSHOT_DATE DESC, MATERIAL_ID
    """)
    return [_serialize_row(r) for r in rows]


# ---------------------------------------------------------------------------
# Batch Quality
# ---------------------------------------------------------------------------

def get_batch_quality(limit: int = 2000) -> list[dict]:
    """Batch quality records from dbo.batch_quality."""
    rows = _run(f"""
        SELECT TOP {limit}
               BATCH_ID, ORDER_ID, WORK_CENTER, MATERIAL_ID, MATERIAL_DESC,
               PRODUCTION_DATE, BATCH_SIZE_UNITS, ACTUAL_YIELD_UNITS,
               YIELD_PCT, QUALITY_SCORE, PURITY_PCT, PH_VALUE,
               FLASH_POINT_PASS, VISCOSITY_PASS, TEST_RESULT,
               DEFECT_CATEGORY, DEFECT_COUNT, CIP_SEQUENCE_USED,
               ANALYST_ID, RELEASE_STATUS, SHELF_LIFE_DAYS
        FROM dbo.batch_quality
        ORDER BY PRODUCTION_DATE DESC
    """)
    return [_serialize_row(r) for r in rows]


# ---------------------------------------------------------------------------
# Maintenance Orders
# ---------------------------------------------------------------------------

def get_maintenance_orders(limit: int = 2000) -> list[dict]:
    """Maintenance work orders from dbo.maintenance_orders."""
    rows = _run(f"""
        SELECT TOP {limit}
               MAINTENANCE_ORDER_ID, EQUIPMENT_ID, LINE, LINE_FULL,
               ORDER_TYPE, PRIORITY, DESCRIPTION, STATUS,
               PLANNED_START_DATE, PLANNED_END_DATE,
               ACTUAL_START_DATE, ACTUAL_END_DATE,
               PLANNED_DURATION_HRS, ACTUAL_DURATION_HRS,
               FAILURE_MODE, FAILURE_CAUSE, MAINTENANCE_TEAM,
               LABOUR_HRS, LABOUR_COST_GBP, PARTS_COST_GBP,
               TOTAL_COST_GBP, DOWNTIME_HRS, WORK_COMPLETED_DESC
        FROM dbo.maintenance_orders
        ORDER BY PLANNED_START_DATE DESC
    """)
    return [_serialize_row(r) for r in rows]


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

def ping() -> bool:
    try:
        _run("SELECT 1 AS ok")
        return True
    except Exception:
        return False
