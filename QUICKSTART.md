# Quick Start Guide

## Option 1: Docker Compose (Easiest)

1. **Start Docker Desktop** (if not already running)

2. **Start all services:**
   ```bash
   docker-compose up -d
   ```

3. **Access the app:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

4. **Stop services:**
   ```bash
   docker-compose down
   ```

## Option 2: Manual Setup

### Prerequisites
- Python 3.11+ 
- Node.js 18+
- PostgreSQL 15+ (or use Docker just for PostgreSQL)

### Step 1: Set up PostgreSQL

**Option A: Using Docker (just for database)**
```bash
docker run -d \
  --name tradeform_postgres \
  -e POSTGRES_DB=tradeform \
  -e POSTGRES_USER=tradeform_user \
  -e POSTGRES_PASSWORD=tradeform_password \
  -p 5432:5432 \
  postgres:15-alpine
```

**Option B: Local PostgreSQL**
```bash
# Create database
createdb tradeform
# Or using psql:
psql -U postgres -c "CREATE DATABASE tradeform;"
```

### Step 2: Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # On macOS/Linux
# OR on Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables
export DATABASE_URL="postgresql://tradeform_user:tradeform_password@localhost:5432/tradeform"
# OR if using local PostgreSQL:
# export DATABASE_URL="postgresql://your_user:your_password@localhost:5432/tradeform"

# Run the backend
uvicorn app.main:app --reload
```

Backend will run on: http://localhost:8000

### Step 3: Frontend Setup

Open a **new terminal window** and run:

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

Frontend will run on: http://localhost:3000

## Troubleshooting

### Database Connection Issues
- Make sure PostgreSQL is running
- Check your DATABASE_URL matches your PostgreSQL setup
- Verify database exists: `psql -l | grep tradeform`

### Port Already in Use
- Backend (8000): Change port with `uvicorn app.main:app --reload --port 8001`
- Frontend (3000): React will prompt to use a different port automatically

### Missing Dependencies
- Backend: Make sure virtual environment is activated before installing
- Frontend: Delete `node_modules` and `package-lock.json`, then run `npm install` again

