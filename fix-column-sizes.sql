-- Fix column size issues for viewer user creation
-- Run this if you get "value too long for type character varying(10)" error

DO $$
BEGIN
    -- Fix role column if it's too small
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'role' 
        AND (data_type = 'character varying' AND character_maximum_length < 20)
    ) THEN
        ALTER TABLE users ALTER COLUMN role TYPE VARCHAR(20);
        RAISE NOTICE 'Fixed users.role column size to VARCHAR(20)';
    END IF;

    -- Fix password_hash column if it's not TEXT
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'password_hash' 
        AND data_type != 'text'
    ) THEN
        ALTER TABLE users ALTER COLUMN password_hash TYPE TEXT;
        RAISE NOTICE 'Fixed users.password_hash column type to TEXT';
    END IF;

    -- Fix created_by column if needed
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'created_by' 
        AND (data_type = 'character varying' AND character_maximum_length < 50)
    ) THEN
        ALTER TABLE users ALTER COLUMN created_by TYPE VARCHAR(50);
        RAISE NOTICE 'Fixed users.created_by column size to VARCHAR(50)';
    END IF;

    -- Fix audit_logs.action column if needed  
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'audit_logs' 
        AND column_name = 'action' 
        AND (data_type = 'character varying' AND character_maximum_length < 100)
    ) THEN
        ALTER TABLE audit_logs ALTER COLUMN action TYPE VARCHAR(100);
        RAISE NOTICE 'Fixed audit_logs.action column size to VARCHAR(100)';
    END IF;

    RAISE NOTICE 'Database column size fixes applied successfully!';
END $$;

-- Verify current column sizes
SELECT 
    table_name,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('users', 'audit_logs')
ORDER BY table_name, ordinal_position;
