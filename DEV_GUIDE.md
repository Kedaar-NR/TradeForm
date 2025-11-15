# TradeForm Development

## Quick Start

### Option 1: Run Everything at Once (Recommended)
```bash
npm run dev
```
This will start both the backend (port 8000) and frontend (port 3000) concurrently.

### Option 2: Initial Setup Only
```bash
npm run setup
```
This installs all dependencies for both backend and frontend.

### Option 3: Run Individually
**Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm start
```

## Features
- AI-powered component scoring
- Excel import/export
- Multi-sheet trade study reports
- Automated criteria suggestions

## Requirements
- Node.js 16+ and npm
- Python 3.8+ and pip

