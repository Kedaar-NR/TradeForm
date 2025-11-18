# Vercel Deployment Guide

## Prerequisites

- A Vercel account connected to your GitHub repository
- PostgreSQL database (recommended: Vercel Postgres, Supabase, or Neon)

## Environment Variables

Configure these environment variables in your Vercel project settings:

### Required Variables

```bash
# Database Configuration
DATABASE_URL=postgresql://user:password@host:port/database

# AI API Keys
GEMINI_API_KEY=your_gemini_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# Application Settings
SECRET_KEY=your_secret_key_here
ENVIRONMENT=production
ALLOW_ALL_ORIGINS=true

# Frontend (build-time variables - prefix with REACT_APP_)
REACT_APP_API_URL=/api
REACT_APP_GEMINI_API_KEY=your_gemini_api_key_here
```

## Setting Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable above with their corresponding values
4. Make sure to add them for **Production**, **Preview**, and **Development** environments

## Database Setup

### Option 1: Vercel Postgres (Recommended)

1. In your Vercel project, go to **Storage** → **Create Database**
2. Select **Postgres** and create a new database
3. Vercel will automatically add the `DATABASE_URL` environment variable

### Option 2: External PostgreSQL (Supabase, Neon, etc.)

1. Create a PostgreSQL database on your preferred platform
2. Copy the connection string
3. Add it to Vercel as the `DATABASE_URL` environment variable

## Deployment Steps

1. **Commit and Push Changes**
   ```bash
   git add .
   git commit -m "Configure Vercel deployment"
   git push origin main
   ```

2. **Automatic Deployment**
   - Vercel will automatically deploy when you push to your repository
   - Monitor the deployment in the Vercel dashboard

3. **Manual Deployment** (if needed)
   ```bash
   vercel --prod
   ```

## Troubleshooting

### Build Errors

- Check the build logs in Vercel dashboard
- Ensure all environment variables are set correctly
- Verify that `api/requirements.txt` has all necessary dependencies

### Database Connection Issues

- Verify `DATABASE_URL` is correctly set
- Check if your database provider allows external connections
- For Vercel Postgres, ensure the database is in the same region as your deployment

### API Not Working

- Check that `/api` routes are properly configured in `vercel.json`
- Verify CORS settings if getting cross-origin errors
- Check function logs in Vercel dashboard

## Post-Deployment

1. Visit your deployed site URL
2. Test the API endpoint at `https://your-domain.vercel.app/api/health`
3. Verify frontend can communicate with the API

## Important Notes

- **SQLite will not work** on Vercel - you must use PostgreSQL or another external database
- Serverless functions have a **60-second timeout** (on Pro plan)
- For background tasks (Celery/Redis), consider using a separate service like Railway or Render for the backend
- Static files are served from the frontend build directory

## Alternative Deployment Strategy

If you encounter issues with serverless deployment or need background task support:

1. Deploy only the frontend to Vercel
2. Deploy the backend separately to Railway, Render, or Fly.io
3. Update `REACT_APP_API_URL` to point to your backend URL

For backend-only deployment, use the `backend/` directory and configure environment variables on your chosen platform.
