-- Migration: Ensure scores.raw_value can store text with units
-- Convert raw_value column to TEXT to allow values like "45 dBi"

DO $$
BEGIN
    -- Check if column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'scores' AND column_name = 'raw_value'
    ) THEN
        -- Only convert if not already text/varchar
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'scores' 
              AND column_name = 'raw_value' 
              AND data_type NOT IN ('text', 'character varying', 'varchar')
        ) THEN
            -- Convert from numeric types to text, handling NULL values
            ALTER TABLE scores
            ALTER COLUMN raw_value TYPE TEXT USING 
                CASE 
                    WHEN raw_value IS NULL THEN NULL
                    ELSE raw_value::text
                END;
        END IF;
    ELSE
        -- Column doesn't exist, create it as TEXT
        ALTER TABLE scores
        ADD COLUMN raw_value TEXT;
    END IF;
END $$;
