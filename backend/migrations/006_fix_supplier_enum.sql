-- Migration to fix the supplier enum type
-- The previous migration was applied but had incorrect enum type name

-- Step 1: Drop existing tables to recreate with correct enum
DROP TABLE IF EXISTS supplier_steps CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;

-- Step 2: Drop and recreate the enum type with correct lowercase name
DROP TYPE IF EXISTS supplieronboardingstep CASCADE;
CREATE TYPE supplieronboardingstep AS ENUM (
    'nda',
    'security',
    'quality',
    'sample',
    'commercial',
    'pilot',
    'production'
);

-- Step 3: Recreate suppliers table
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

-- Step 4: Create index on user_id
CREATE INDEX idx_suppliers_user_id ON suppliers(user_id);

-- Step 5: Recreate supplier_steps table with correct enum type
CREATE TABLE supplier_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    step_id supplieronboardingstep NOT NULL,
    step_order INTEGER NOT NULL,
    title VARCHAR NOT NULL,
    description TEXT,
    completed BOOLEAN DEFAULT FALSE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Step 6: Create index on supplier_id
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
