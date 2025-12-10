-- Migration to add suppliers and supplier_steps tables
-- This migration handles the case where tables might already exist

-- Step 1: Create SupplierOnboardingStep enum if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'supplieronboardingstep') THEN
        CREATE TYPE SupplierOnboardingStep AS ENUM (
            'nda',
            'security',
            'quality',
            'sample',
            'commercial',
            'pilot',
            'production'
        );
    END IF;
END$$;

-- Step 2: Drop existing tables if they exist (to start fresh)
DROP TABLE IF EXISTS supplier_steps CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;

-- Step 3: Create suppliers table with all required columns
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    contact_name VARCHAR,
    contact_email VARCHAR,
    color VARCHAR DEFAULT '#0ea5e9',
    notes TEXT,
    grade VARCHAR,
    share_token VARCHAR UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Create index on user_id for faster queries
CREATE INDEX idx_suppliers_user_id ON suppliers(user_id);

-- Step 5: Create supplier_steps table
CREATE TABLE supplier_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    step_id SupplierOnboardingStep NOT NULL,
    step_order INTEGER NOT NULL,
    title VARCHAR NOT NULL,
    description TEXT,
    completed BOOLEAN DEFAULT FALSE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Step 6: Create index on supplier_id for faster queries
CREATE INDEX idx_supplier_steps_supplier_id ON supplier_steps(supplier_id);

-- Step 7: Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_suppliers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Create trigger
CREATE TRIGGER update_suppliers_updated_at
    BEFORE UPDATE ON suppliers
    FOR EACH ROW
    EXECUTE FUNCTION update_suppliers_updated_at();
