-- Migration: Add project_groups support
-- This migration adds the project_groups table and project_group_id column to projects

-- 1. Create project_groups table if it doesn't exist
CREATE TABLE IF NOT EXISTS project_groups (
    id UUID PRIMARY KEY,
    name VARCHAR NOT NULL,
    description TEXT,
    icon VARCHAR DEFAULT 'folder',
    color VARCHAR DEFAULT '#6B7280',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add project_group_id column to projects table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'projects' AND column_name = 'project_group_id'
    ) THEN
        ALTER TABLE projects ADD COLUMN project_group_id UUID REFERENCES project_groups(id);
    END IF;
END $$;

-- 3. Add user_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY,
    user_id UUID UNIQUE NOT NULL REFERENCES users(id),
    onboarding_status VARCHAR DEFAULT 'not_started',
    onboarding_last_updated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Add user_documents table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_documents (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    type VARCHAR NOT NULL,
    storage_url VARCHAR NOT NULL,
    original_filename VARCHAR NOT NULL,
    mime_type VARCHAR NOT NULL,
    file_size INTEGER NOT NULL,
    onboarding_source BOOLEAN DEFAULT TRUE,
    processing_status VARCHAR DEFAULT 'uploaded',
    processing_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 5. Add user_document_contents table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_document_contents (
    id UUID PRIMARY KEY,
    user_document_id UUID UNIQUE NOT NULL REFERENCES user_documents(id),
    raw_text TEXT,
    parsed_json TEXT,
    embedding_id VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
