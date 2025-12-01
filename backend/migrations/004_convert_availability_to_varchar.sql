-- Migration: Convert componentavailability enum to VARCHAR
-- This allows storing lowercase values like "lead_time" without PostgreSQL enum type restrictions
-- SQLAlchemy will handle validation in Python code

DO $$
BEGIN
    -- Check if column exists and is enum type
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'components' 
          AND column_name = 'availability'
          AND udt_name = 'componentavailability'
    ) THEN
        -- Convert enum to VARCHAR
        ALTER TABLE components
        ALTER COLUMN availability TYPE VARCHAR(20) 
        USING availability::text;
        
        -- Also convert source enum if it exists
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'components' 
              AND column_name = 'source'
              AND udt_name = 'componentsource'
        ) THEN
            ALTER TABLE components
            ALTER COLUMN source TYPE VARCHAR(20)
            USING source::text;
        END IF;
    END IF;
END $$;

