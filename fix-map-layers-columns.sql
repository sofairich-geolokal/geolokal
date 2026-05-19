-- Add missing columns to map_layers table
-- This script fixes the database schema to match the Prisma schema

-- Add layer_name column
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'map_layers' AND column_name = 'layer_name') THEN
        ALTER TABLE map_layers ADD COLUMN layer_name VARCHAR(100);
    END IF;
END $$;

-- Add metadata column
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'map_layers' AND column_name = 'metadata') THEN
        ALTER TABLE map_layers ADD COLUMN metadata JSONB;
    END IF;
END $$;

-- Add layer_type column
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'map_layers' AND column_name = 'layer_type') THEN
        ALTER TABLE map_layers ADD COLUMN layer_type VARCHAR(50);
    END IF;
END $$;

-- Add style_config column
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'map_layers' AND column_name = 'style_config') THEN
        ALTER TABLE map_layers ADD COLUMN style_config JSONB;
    END IF;
END $$;

-- Add bbox column
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'map_layers' AND column_name = 'bbox') THEN
        ALTER TABLE map_layers ADD COLUMN bbox JSONB;
    END IF;
END $$;

-- Add projection column with default
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'map_layers' AND column_name = 'projection') THEN
        ALTER TABLE map_layers ADD COLUMN projection VARCHAR(20) DEFAULT 'EPSG:4326';
    END IF;
END $$;

-- Add min_zoom column with default
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'map_layers' AND column_name = 'min_zoom') THEN
        ALTER TABLE map_layers ADD COLUMN min_zoom INTEGER DEFAULT 0;
    END IF;
END $$;

-- Add max_zoom column with default
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'map_layers' AND column_name = 'max_zoom') THEN
        ALTER TABLE map_layers ADD COLUMN max_zoom INTEGER DEFAULT 20;
    END IF;
END $$;

-- Add attribution column
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'map_layers' AND column_name = 'attribution') THEN
        ALTER TABLE map_layers ADD COLUMN attribution TEXT;
    END IF;
END $$;

-- Add opacity column with default
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'map_layers' AND column_name = 'opacity') THEN
        ALTER TABLE map_layers ADD COLUMN opacity DECIMAL(3,2) DEFAULT 1.0;
    END IF;
END $$;

-- Add z_index column with default
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'map_layers' AND column_name = 'z_index') THEN
        ALTER TABLE map_layers ADD COLUMN z_index INTEGER DEFAULT 0;
    END IF;
END $$;

-- Add is_visible column with default
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'map_layers' AND column_name = 'is_visible') THEN
        ALTER TABLE map_layers ADD COLUMN is_visible BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Add is_downloadable column with default
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'map_layers' AND column_name = 'is_downloadable') THEN
        ALTER TABLE map_layers ADD COLUMN is_downloadable BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Add is_active column with default
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'map_layers' AND column_name = 'is_active') THEN
        ALTER TABLE map_layers ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Add demographic columns
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'map_layers' AND column_name = 'population') THEN
        ALTER TABLE map_layers ADD COLUMN population INTEGER;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'map_layers' AND column_name = 'households') THEN
        ALTER TABLE map_layers ADD COLUMN households INTEGER;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'map_layers' AND column_name = 'poverty_rate') THEN
        ALTER TABLE map_layers ADD COLUMN poverty_rate VARCHAR(10);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'map_layers' AND column_name = 'employment_rate') THEN
        ALTER TABLE map_layers ADD COLUMN employment_rate VARCHAR(10);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'map_layers' AND column_name = 'demographic_status') THEN
        ALTER TABLE map_layers ADD COLUMN demographic_status VARCHAR(50);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'map_layers' AND column_name = 'demographic_last_updated') THEN
        ALTER TABLE map_layers ADD COLUMN demographic_last_updated TIMESTAMP(6);
    END IF;
END $$;

-- Add legacy name column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'map_layers' AND column_name = 'name') THEN
        ALTER TABLE map_layers ADD COLUMN name VARCHAR(255);
    END IF;
END $$;

-- Add legacy source column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'map_layers' AND column_name = 'source') THEN
        ALTER TABLE map_layers ADD COLUMN source VARCHAR(255);
    END IF;
END $$;

-- Add lgu_id column
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'map_layers' AND column_name = 'lgu_id') THEN
        ALTER TABLE map_layers ADD COLUMN lgu_id INTEGER;
    END IF;
END $$;

-- Add category_id column
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'map_layers' AND column_name = 'category_id') THEN
        ALTER TABLE map_layers ADD COLUMN category_id INTEGER;
    END IF;
END $$;

-- Add uploaded_by column
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'map_layers' AND column_name = 'uploaded_by') THEN
        ALTER TABLE map_layers ADD COLUMN uploaded_by INTEGER;
    END IF;
END $$;

-- Add foreign key constraint if city_muni_master table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'city_muni_master') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = 'map_layers' 
            AND constraint_name = 'fk_map_layers_lgu_id'
        ) THEN
            ALTER TABLE map_layers 
            ADD CONSTRAINT fk_map_layers_lgu_id 
            FOREIGN KEY (lgu_id) REFERENCES city_muni_master(id) 
            ON DELETE NO ACTION ON UPDATE NO ACTION;
        END IF;
    END IF;
END $$;

-- Add foreign key constraint for category_id if project_categories table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_categories') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = 'map_layers' 
            AND constraint_name = 'fk_map_layers_category_id'
        ) THEN
            ALTER TABLE map_layers 
            ADD CONSTRAINT fk_map_layers_category_id 
            FOREIGN KEY (category_id) REFERENCES project_categories(id) 
            ON DELETE NO ACTION ON UPDATE NO ACTION;
        END IF;
    END IF;
END $$;
