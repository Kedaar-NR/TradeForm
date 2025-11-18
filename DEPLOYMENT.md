# Deployment Guide

## Architecture

This project uses a **split deployment** strategy:
- **Frontend**: Deployed to Vercel
- **Backend**: Deployed separately (Railway, Render, or Fly.io recommended)

This approach is more reliable for apps with databases, background tasks, and long-running processes.

## Prerequisites

- A Vercel account connected to your GitHub repository
- A hosting platform for the backend (Railway, Render, or Fly.io)
- PostgreSQL database (can be provided by your backend hosting platform)

## Step 1: Deploy Backend

### Option A: Railway (Recommended)

1. Go to [Railway.app](https://railway.app) and sign up
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your TradeForm repository
4. Set root directory to `backend/`
5. Railway will auto-detect Python and create a PostgreSQL database
6. Add environment variables in Railway dashboard:

```bash
# AI API Keys
GEMINI_API_KEY=your_gemini_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# Application Settings
SECRET_KEY=your_secret_key_here
ENVIRONMENT=production
CORS_ORIGINS=https://your-vercel-domain.vercel.app
# Or allow all origins: ALLOW_ALL_ORIGINS=true

# Database URL is automatically provided by Railway
# Redis URL (if using Railway Redis addon)
```

7. Copy your Railway backend URL (e.g., `https://your-app.railway.app`)

### Option B: Render

1. Go to [Render.com](https://render.com) and create a new Web Service
2. Connect your GitHub repository
3. Configure:
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add a PostgreSQL database from Render dashboard
5. Set environment variables (same as Railway above)

### Option C: Fly.io

Follow [Fly.io Python deployment guide](https://fly.io/docs/languages-and-frameworks/python/)

## Step 2: Deploy Frontend to Vercel

### Environment Variables

Configure these in your Vercel project settings:

```bash
# Backend API URL (from Step 1)
REACT_APP_API_URL=https://your-backend-url.railway.app

# Frontend Gemini API Key (for client-side features)
REACT_APP_GEMINI_API_KEY=your_gemini_api_key_here
```

### Setting Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the variables above
4. Make sure to add them for **Production**, **Preview**, and **Development** environments

### Deployment

1. **Commit and Push Changes** (if any)
   ```bash
   git add .
   git commit -m "Update deployment configuration"
   git push origin main
   ```

2. **Automatic Deployment**
   - Vercel will automatically deploy when you push to your repository
   - Monitor the deployment in the Vercel dashboard

3. The frontend build will succeed and deploy to Vercel

## Troubleshooting

### Frontend Build Errors (Vercel)

- Check the build logs in Vercel dashboard
- Ensure `REACT_APP_API_URL` is set correctly
- Verify all dependencies in `frontend/package.json` are installable

### Backend Deployment Issues

- Check backend platform logs (Railway/Render/Fly.io)
- Verify all environment variables are set
- Ensure database connection string is correct
- Check that `backend/requirements.txt` has all necessary dependencies

### CORS Errors

- Verify `CORS_ORIGINS` or `ALLOW_ALL_ORIGINS` is set in backend environment variables
- Check that your frontend URL is allowed in backend CORS settings
- Ensure backend is accepting requests from your Vercel domain

### API Not Responding

- Check backend platform logs for errors
- Verify backend URL in Vercel environment variables
- Test backend health endpoint: `https://your-backend.railway.app/health`
- Ensure backend service is running and not sleeping (some free tiers have sleep modes)

## Post-Deployment Testing

1. **Test Frontend**: Visit `https://your-domain.vercel.app`
2. **Test Backend**: Visit `https://your-backend.railway.app/health`
3. **Test API Connection**:
   - Open browser console on your frontend
   - Check if API calls are reaching the backend
   - Verify no CORS errors

## Cost Considerations

### Free Tier Options:
- **Vercel**: Free for personal projects (includes generous bandwidth)
- **Railway**: $5 free credit monthly (enough for small apps)
- **Render**: Free tier available (with limitations)
- **Supabase**: Free PostgreSQL database (500MB)

### Recommended Setup for MVP:
- Frontend: Vercel (Free)
- Backend: Railway Starter Plan ($5/month)
- Database: Included with Railway PostgreSQL

## Important Notes

- Video files (~90MB total) will be deployed with the frontend
- For better performance, consider hosting videos on a CDN
- Backend has database and background task dependencies (Celery, Redis)
- This split deployment strategy is more reliable and scalable than serverless
