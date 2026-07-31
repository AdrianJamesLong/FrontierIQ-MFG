# FastAPI Backend

Python backend using FastAPI with SQL database connectivity.

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
```

2. Activate the virtual environment:
```bash
# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Configure database:
```bash
# Copy the example env file
cp .env.example .env

# Edit .env with your database credentials
```

5. Run the server:
```bash
python main.py
```

## API Documentation

Once the server is running, access the interactive API docs:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Endpoints

- `GET /` - Root endpoint returning hello message
- `GET /api/hello` - Returns hello message with SQL query result
- `GET /api/data` - Fetches sample data from database
- `GET /health` - Health check endpoint

## Database Setup

The application uses SQLAlchemy for database connectivity. Update your queries in [main.py](main.py) to match your database schema.

### Supported Databases

Install the appropriate driver:

**PostgreSQL:**
```bash
pip install psycopg2-binary
```

**MySQL:**
```bash
pip install pymysql
```

**SQL Server:**
```bash
pip install pyodbc
```

## Environment Variables

Create a `.env` file with:
```
DATABASE_URL=your_connection_string_here
```

See `.env.example` for connection string formats.
