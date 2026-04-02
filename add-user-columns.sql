-- Add created_by and location columns to public.users table

DO $$
BEGIN
    -- Add created_by column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='created_by' AND table_schema='public') THEN
        ALTER TABLE public.users ADD COLUMN created_by VARCHAR(50);
        RAISE NOTICE 'Added created_by column to public.users table';
    ELSE
        RAISE NOTICE 'created_by column already exists in public.users table';
    END IF;
    
    -- Add location column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='location' AND table_schema='public') THEN
        ALTER TABLE public.users ADD COLUMN location VARCHAR(255);
        RAISE NOTICE 'Added location column to public.users table';
    ELSE
        RAISE NOTICE 'location column already exists in public.users table';
    END IF;
    
    RAISE NOTICE 'Users table columns updated successfully!';
END $$;

-- Verify the columns were added
SELECT 
    column_name, 
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
AND column_name IN ('created_by', 'location')
ORDER BY column_name;
