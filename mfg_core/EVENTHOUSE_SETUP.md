# Microsoft Fabric Eventhouse Setup Guide

This guide explains how to configure the backend to connect to Microsoft Fabric Eventhouse (Kusto).

## Overview

The backend has been updated to connect to Microsoft Fabric Eventhouse instead of a Lakehouse SQL endpoint. Eventhouse uses Kusto Query Language (KQL) for data queries.

## Configuration

### 1. Environment Variables

Copy the `.env.example` file to `.env` and update with your Eventhouse details:

```bash
cp .env.example .env
```

### 2. Required Environment Variables

```env
# Eventhouse URL (Kusto cluster endpoint)
EVENTHOUSE_URL=https://trd-szqf95sekry8ym8fh7.z8.kusto.fabric.microsoft.com

# Eventhouse Database name
EVENTHOUSE_DATABASE=your_database_name

# Table name to query
TABLE_NAME=helloworld

# Azure AD Service Principal Authentication (recommended)
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret
```

### 3. Authentication Methods

The application supports two authentication methods:

#### Service Principal (Recommended for Production)
- Provide `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, and `AZURE_CLIENT_SECRET`
- The service principal must have permissions to query the Eventhouse database

#### Default Azure Credential (Development)
- If Service Principal credentials are not provided, the app falls back to Default Azure Credential
- This includes interactive login, managed identity, Azure CLI credentials, etc.

## Installation

Install the required dependencies:

```bash
pip install -r requirements.txt
```

Key dependencies:
- `azure-kusto-data`: Kusto client library for querying Eventhouse
- `azure-identity`: Azure authentication library

## API Endpoints

### GET /api/hello
Simple test endpoint that executes a basic KQL query.

**Response:**
```json
{
  "message": "Data fetched successfully from Eventhouse",
  "data": [{"message": "Hello World from Eventhouse!"}]
}
```

### GET /api/data
Fetches the top 4 records from the configured table.

**KQL Query:** `{TABLE_NAME} | take 4`

**Response:**
```json
{
  "message": "Retrieved 4 entries from helloworld",
  "data": [...]
}
```

### GET /health
Health check endpoint to verify Eventhouse connectivity.

**Response:**
```json
{
  "status": "healthy",
  "eventhouse": "connected",
  "url": "https://trd-szqf95sekry8ym8fh7.z8.kusto.fabric.microsoft.com"
}
```

## KQL Query Examples

The application uses Kusto Query Language (KQL) instead of SQL:

```kql
# Get top 4 records
helloworld | take 4

# Filter and sort
helloworld | where timestamp > ago(1d) | sort by timestamp desc | take 10

# Aggregations
helloworld | summarize count() by category

# Project specific columns
helloworld | project id, name, timestamp
```

## Running the Server

```bash
cd backend
python main.py
```

Or using uvicorn directly:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Troubleshooting

### Connection Issues
1. Verify the `EVENTHOUSE_URL` is correct
2. Ensure the database name is correct
3. Check that your service principal has the necessary permissions
4. Test connectivity using the `/health` endpoint

### Authentication Issues
1. Verify your Azure credentials are correct
2. Ensure the service principal has "Viewer" or "User" role on the Eventhouse database
3. Check that the tenant ID matches your Azure AD tenant

### Query Issues
1. Verify the table name exists in your database
2. Use KQL syntax instead of SQL
3. Test queries directly in the Eventhouse query editor first

## Migration from SQL Server

Key changes from the previous SQL Server implementation:

1. **Client Library**: Changed from `pyodbc` + `sqlalchemy` to `azure-kusto-data`
2. **Query Language**: Changed from SQL to KQL (Kusto Query Language)
3. **Connection**: Direct Kusto client connection instead of ODBC
4. **Authentication**: Azure AD authentication (Service Principal or Default Credential)

### Query Syntax Changes

| SQL | KQL |
|-----|-----|
| `SELECT TOP 4 * FROM table` | `table \| take 4` |
| `SELECT * FROM table WHERE id = 1` | `table \| where id == 1` |
| `SELECT COUNT(*) FROM table` | `table \| count` |
| `SELECT * FROM table ORDER BY date DESC` | `table \| sort by date desc` |

## Additional Resources

- [Kusto Query Language (KQL) Documentation](https://learn.microsoft.com/en-us/azure/data-explorer/kusto/query/)
- [Azure Kusto Python SDK](https://github.com/Azure/azure-kusto-python)
- [Microsoft Fabric Eventhouse Documentation](https://learn.microsoft.com/en-us/fabric/real-time-analytics/eventhouse)