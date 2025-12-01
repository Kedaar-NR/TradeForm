# Database Migrations

This folder contains SQL migration scripts for the TradeForm database.

## Running Migrations on Railway

### Option 1: Using Railway CLI (Recommended)

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login to Railway
railway login

# Link to your project
railway link

# Connect to the database and run migration
railway run psql $DATABASE_URL -f migrations/001_add_project_groups.sql
```

### Option 2: Using Railway Dashboard

1. Go to https://railway.app/dashboard
2. Open your TradeForm project
3. Click on your **Postgres** service
4. Click **Data** tab
5. Click **Query** button
6. Copy and paste the contents of `001_add_project_groups.sql`
7. Click **Run**

### Option 3: Copy Migration to Railway

1. In Railway dashboard, go to your **backend** service
2. Click on **Settings** → **Deploy Triggers**
3. Or simply redeploy after pushing the migration files
4. SSH into the Railway container:
   ```bash
   railway shell
   ```
5. Run the migration:
   ```bash
   psql $DATABASE_URL -f migrations/001_add_project_groups.sql
   ```

## Current Migrations

- `001_add_project_groups.sql`: Adds project_groups table, user_profiles, user_documents, and updates projects table
