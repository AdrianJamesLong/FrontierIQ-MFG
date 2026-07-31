# Microsoft Fabric Lakehouse SQL Endpoint Setup Guide

This guide will help you connect your FastAPI backend to the Microsoft Fabric Lakehouse SQL endpoint.

## Your Configuration

- **SQL Endpoint**: `7hl3dpror3ce3a56dehlz23q5i-fswhiyjufmferbkc5hioni2zvq.datawarehouse.fabric.microsoft.com`
- **Lakehouse ID**: `9a533647-a84e-42c5-a606-e304d13e63d1`
- **Table**: `dbo.helloworld`

## Prerequisites

1. **ODBC Driver 18 for SQL Server** must be installed on your system.

### Install ODBC Driver

**Windows:**
Download and install from: https://learn.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server

**macOS:**
```bash
brew install msodbcsql18
```

**Linux (Ubuntu/Debian):**
```bash
curl https://packages.microsoft.com/keys/microsoft.asc | sudo apt-key add -
curl https://packages.microsoft.com/config/ubuntu/$(lsb_release -rs)/prod.list | sudo tee /etc/apt/sources.list.d/mssql-release.list
sudo apt-get update
sudo ACCEPT_EULA=Y apt-get install -y msodbcsql18
```

## Configuration Steps

### 1. The `.env` file has been pre-configured

A `.env` file has been created in the `backend` directory with your lakehouse configuration.

**The file is configured to use Azure Active Directory Interactive Authentication** (recommended for Microsoft Fabric).

If you need to modify it, the file contains:

```env
DATABASE_URL=mssql+pyodbc://7hl3dpror3ce3a56dehlz23q5i-fswhiyjufmferbkc5hioni2zvq.datawarehouse.fabric.microsoft.com:1433/9a533647-a84e-42c5-a606-e304d13e63d1?driver=ODBC+Driver+18+for+SQL+Server&Authentication=ActiveDirectoryInteractive&Encrypt=yes&TrustServerCertificate=no

DATABASE_NAME=9a533647-a84e-42c5-a606-e304d13e63d1
TABLE_NAME=dbo.helloworld
```

### 2. Authentication Options

#### Option A: Azure Active Directory Interactive (Pre-configured - RECOMMENDED)

This is the default configuration. When you run the application, it will:
1. Open a browser window for authentication
2. Ask you to sign in with your Microsoft account
3. Use your credentials to access the Fabric Lakehouse

**No username/password needed in the connection string!**

#### Option B: SQL Authentication (If you have credentials)

If you have SQL username and password, update the `.env` file:

```env
DATABASE_URL=mssql+pyodbc://YOUR_USERNAME:YOUR_PASSWORD@7hl3dpror3ce3a56dehlz23q5i-fswhiyjufmferbkc5hioni2zvq.datawarehouse.fabric.microsoft.com:1433/9a533647-a84e-42c5-a606-e304d13e63d1?driver=ODBC+Driver+18+for+SQL+Server&Encrypt=yes&TrustServerCertificate=no
```

### 3. Install Python Dependencies

```bash
# Activate your virtual environment first
# Windows:
venv\Scripts\activate

# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 4. Test the Connection

Run the FastAPI server:

```bash
python main.py
```

Visit the health endpoint to verify database connectivity:
```
http://localhost:8000/health
```

You should see:
```json
{
  "status": "healthy",
  "database": "connected"
}
```

### 5. Test the Data Endpoint

Visit:
```
http://localhost:8000/api/data
```

This should return the 4 entries from your table.

## Common Issues

### Issue: "Can't open lib 'ODBC Driver 18 for SQL Server'"
**Solution:** Install the ODBC Driver 18 for SQL Server (see Prerequisites above)

### Issue: "Login failed for user"
**Solution:**
- Verify your username and password are correct
- Check that your user has access to the specified database and table
- Try using Azure AD authentication instead

### Issue: "Invalid object name 'tablename'"
**Solution:**
- Verify the table name in your `.env` file is correct
- Check that the table exists in your database
- Try querying with the schema: `dbo.your_table_name`

### Issue: URL Encoding Special Characters in Password
If your password contains special characters, they need to be URL encoded:
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `%` → `%25`
- `&` → `%26`

## Next Steps

Once connected:
1. Modify the SQL query in `main.py` to select specific columns
2. Update the frontend to display data in a more user-friendly format
3. Add additional endpoints for different queries

## Need Help?

1. Check the FastAPI logs for detailed error messages
2. Verify your Microsoft Fabric SQL endpoint is accessible
3. Test connectivity using a SQL client like Azure Data Studio
