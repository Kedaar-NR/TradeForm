# TradeForm Deployment Guide

## Architecture Overview

TradeForm consists of two separate applications:
- **Frontend**: React application (can deploy to Vercel)
- **Backend**: Python/FastAPI API (requires separate deployment)

**IMPORTANT**: The backend cannot be deployed to Vercel because it uses:
- Python/FastAPI (not JavaScript/Node.js)
- SQLAlchemy ORM with SQLite database
- File storage for datasheets
- Long-running AI API calls

## Frontend Deployment (Vercel)

### 1. Deploy to Vercel

The frontend is pre-configured for Vercel deployment via `vercel.json`.

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy from project root
vercel
```

Or connect your GitHub repository to Vercel dashboard.

### 2. Configure Environment Variables

In Vercel dashboard, set:

```
REACT_APP_API_URL=https://your-backend-url.com
```

This points to where your backend API is deployed.

## Backend Deployment Options

### Option 1: Railway (Recommended)

Railway supports Python and provides free PostgreSQL:

1. Create account at [railway.app](https://railway.app)
2. New Project > Deploy from GitHub repo
3. Add environment variables:
   - `ANTHROPIC_API_KEY=your-key`
   - `CORS_ORIGINS=https://your-frontend.vercel.app`
   - `ALLOW_ALL_ORIGINS=false`
4. Railway auto-detects Python and deploys

### Option 2: Render

1. Create account at [render.com](https://render.com)
2. New > Web Service
3. Connect your repo
4. Configure:
   - Environment: Python
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Set environment variables

### Option 3: Fly.io

1. Install flyctl: `curl -L https://fly.io/install.sh | sh`
2. Create `fly.toml` in backend directory:

```toml
app = "tradeform-api"
primary_region = "sjc"

[env]
  PORT = "8080"

[http_service]
  internal_port = 8080
  force_https = true

[[vm]]
  memory = "256mb"
  cpu_kind = "shared"
  cpus = 1
```

3. Deploy: `fly deploy`

### Option 4: Local/VPS Deployment

For a VPS (DigitalOcean, AWS EC2, etc.):

```bash
# Install dependencies
cd backend
pip install -r requirements.txt

# Run with gunicorn
gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app --bind 0.0.0.0:8000
```

## Database Considerations

Currently using SQLite (file-based). For production:

1. **Switch to PostgreSQL** for scalability
2. Update `backend/app/database.py`:

```python
import os

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./trade_study.db"
)

# Convert postgres:// to postgresql:// for SQLAlchemy
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)
```

3. Add to requirements.txt:
```
psycopg2-binary
```

## CORS Configuration

Backend must allow frontend origin. In `backend/app/main.py`:

```python
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
```

Set `CORS_ORIGINS` environment variable to your Vercel domain:
```
CORS_ORIGINS=https://your-app.vercel.app
```

## File Storage (Datasheets)

Currently stores PDF files locally in `datasheets/` directory. For production:

1. **Option A**: Use cloud storage (AWS S3, Google Cloud Storage)
2. **Option B**: Use mounted volume (Railway, Fly.io support this)
3. **Option C**: Store in database as BLOBs (not recommended for large files)

## Environment Variables Summary

### Frontend (Vercel)
```
REACT_APP_API_URL=https://your-backend-url.com
```

### Backend (Railway/Render/etc.)
```
ANTHROPIC_API_KEY=sk-ant-...
CORS_ORIGINS=https://your-frontend.vercel.app
DATABASE_URL=postgresql://... (if using PostgreSQL)
```

## Testing Deployment

1. Deploy backend first
2. Note the backend URL
3. Deploy frontend with `REACT_APP_API_URL` pointing to backend
4. Test:
   - User registration/login
   - Project creation
   - AI features (requires valid ANTHROPIC_API_KEY)
   - Datasheet upload and querying

## Common Issues

### CORS Errors
- Ensure `CORS_ORIGINS` includes your frontend URL
- Don't include trailing slashes

### API Connection Failed
- Check `REACT_APP_API_URL` is set correctly in Vercel
- Verify backend is running and accessible
- Check for HTTPS vs HTTP mismatches

### Database Errors
- SQLite won't persist between deploys on some platforms
- Use PostgreSQL for production
- Check `DATABASE_URL` is set correctly

### AI Features Not Working
- Verify `ANTHROPIC_API_KEY` is set in backend environment
- Check API key has sufficient credits
- Monitor backend logs for errors

## Quick Start Checklist

- [ ] Deploy backend to Railway/Render/etc.
- [ ] Set `ANTHROPIC_API_KEY` in backend environment
- [ ] Set `CORS_ORIGINS` to allow frontend domain
- [ ] Note backend URL (e.g., `https://tradeform-api.up.railway.app`)
- [ ] Deploy frontend to Vercel
- [ ] Set `REACT_APP_API_URL` in Vercel environment
- [ ] Test login flow
- [ ] Test datasheet features
