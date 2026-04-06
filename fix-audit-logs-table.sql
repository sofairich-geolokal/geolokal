-- Add missing columns to audit_logs table

DO $$
BEGIN
    -- Add actor column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='actor' AND table_schema='public') THEN
        ALTER TABLE public.audit_logs ADD COLUMN actor TEXT;
        RAISE NOTICE 'Added actor column to public.audit_logs table';
    ELSE
        RAISE NOTICE 'actor column already exists in public.audit_logs table';
    END IF;
    
    -- Add created_by column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='created_by' AND table_schema='public') THEN
        ALTER TABLE public.audit_logs ADD COLUMN created_by TEXT;
        RAISE NOTICE 'Added created_by column to public.audit_logs table';
    ELSE
        RAISE NOTICE 'created_by column already exists in public.audit_logs table';
    END IF;
    
    -- Add actor_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='actor_id' AND table_schema='public') THEN
        ALTER TABLE public.audit_logs ADD COLUMN actor_id INTEGER;
        RAISE NOTICE 'Added actor_id column to public.audit_logs table';
    ELSE
        RAISE NOTICE 'actor_id column already exists in public.audit_logs table';
    END IF;
    
    -- Add lgu_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='lgu_id' AND table_schema='public') THEN
        ALTER TABLE public.audit_logs ADD COLUMN lgu_id INTEGER;
        RAISE NOTICE 'Added lgu_id column to public.audit_logs table';
    ELSE
        RAISE NOTICE 'lgu_id column already exists in public.audit_logs table';
    END IF;
    
    RAISE NOTICE 'Audit logs table columns updated successfully!';
END $$;

-- Verify the columns were added
SELECT 
    column_name, 
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'audit_logs' 
AND table_schema = 'public'
ORDER BY ordinal_position;
