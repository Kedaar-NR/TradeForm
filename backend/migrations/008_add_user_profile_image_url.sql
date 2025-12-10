-- Add profile_image_url column to users table for storing Google profile pictures
-- This column stores the URL to the user's profile picture from OAuth providers

ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_url VARCHAR;
