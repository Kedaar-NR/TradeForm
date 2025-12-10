-- Add file metadata columns to supplier_steps for task materials
ALTER TABLE supplier_steps
ADD COLUMN IF NOT EXISTS material_name VARCHAR,
ADD COLUMN IF NOT EXISTS material_description TEXT,
ADD COLUMN IF NOT EXISTS material_file_path VARCHAR,
ADD COLUMN IF NOT EXISTS material_mime_type VARCHAR,
ADD COLUMN IF NOT EXISTS material_original_filename VARCHAR,
ADD COLUMN IF NOT EXISTS material_size_bytes INTEGER,
ADD COLUMN IF NOT EXISTS material_updated_at TIMESTAMPTZ;
