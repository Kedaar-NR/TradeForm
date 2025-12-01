-- Migration: Ensure componentavailability enum has all required values
-- This ensures the database enum matches the Python ComponentAvailability enum

DO $$
BEGIN
    -- Check if 'lead_time' exists in the enum, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'lead_time' 
        AND enumtypid = (
            SELECT oid FROM pg_type WHERE typname = 'componentavailability'
        )
    ) THEN
        -- Add 'lead_time' to the enum if it doesn't exist
        ALTER TYPE componentavailability ADD VALUE IF NOT EXISTS 'lead_time';
    END IF;
    
    -- Ensure other values exist (they should, but being safe)
    -- Note: PostgreSQL doesn't support IF NOT EXISTS for ADD VALUE in older versions
    -- So we check first, then add if needed
    
    -- Check and add 'obsolete' if needed
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'obsolete' 
        AND enumtypid = (
            SELECT oid FROM pg_type WHERE typname = 'componentavailability'
        )
    ) THEN
        ALTER TYPE componentavailability ADD VALUE 'obsolete';
    END IF;
END $$;

