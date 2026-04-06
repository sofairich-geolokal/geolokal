-- URGENT FIX: Direct column type changes for viewer creation
-- Run this in your database immediately

-- Force password_hash to TEXT (handles any size hash)
ALTER TABLE users ALTER COLUMN password_hash TYPE TEXT;

-- Ensure role can fit 'Viewer' and other roles
ALTER TABLE users ALTER COLUMN role TYPE VARCHAR(20);

-- Ensure created_by fits usernames
ALTER TABLE users ALTER COLUMN created_by TYPE VARCHAR(50);

-- Fix audit_logs action column
ALTER TABLE audit_logs ALTER COLUMN action TYPE VARCHAR(100);

-- Verify the changes
SELECT 
    column_name,
    data_type,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('password_hash', 'role', 'created_by');
