-- Add missing columns to map_layers table
-- This script fixes the database schema to match the Prisma schema

-- Add layer_type column
ALTER TABLE map_layers 
ADD COLUMN IF NOT EXISTS layer_type VARCHAR(50);

-- Add style_config column  
ALTER TABLE map_layers 
ADD COLUMN IF NOT EXISTS style_config JSONB;

-- Add bbox column
ALTER TABLE map_layers 
ADD COLUMN IF NOT EXISTS bbox JSONB;

-- Add projection column with default
ALTER TABLE map_layers 
ADD COLUMN IF NOT EXISTS projection VARCHAR(20) DEFAULT 'EPSG:4326';

-- Add min_zoom column with default
ALTER TABLE map_layers 
ADD COLUMN IF NOT EXISTS min_zoom INTEGER DEFAULT 0;

-- Add max_zoom column with default  
ALTER TABLE map_layers 
ADD COLUMN IF NOT EXISTS max_zoom INTEGER DEFAULT 20;

-- Add attribution column
ALTER TABLE map_layers 
ADD COLUMN IF NOT EXISTS attribution TEXT;

-- Add opacity column with default
ALTER TABLE map_layers 
ADD COLUMN IF NOT EXISTS opacity DECIMAL(3,2) DEFAULT 1.0;

-- Add z_index column with default
ALTER TABLE map_layers 
ADD COLUMN IF NOT EXISTS z_index INTEGER DEFAULT 0;

-- Add is_visible column with default
ALTER TABLE map_layers 
ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT true;

-- Add is_downloadable column with default
ALTER TABLE map_layers 
ADD COLUMN IF NOT EXISTS is_downloadable BOOLEAN DEFAULT false;

-- Add is_active column with default
ALTER TABLE map_layers 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add demographic columns
ALTER TABLE map_layers 
ADD COLUMN IF NOT EXISTS population INTEGER;

ALTER TABLE map_layers 
ADD COLUMN IF NOT EXISTS households INTEGER;

ALTER TABLE map_layers 
ADD COLUMN IF NOT EXISTS poverty_rate VARCHAR(10);

ALTER TABLE map_layers 
ADD COLUMN IF NOT EXISTS employment_rate VARCHAR(10);

ALTER TABLE map_layers 
ADD COLUMN IF NOT EXISTS demographic_status VARCHAR(50);

ALTER TABLE map_layers 
ADD COLUMN IF NOT EXISTS demographic_last_updated TIMESTAMP(6);

-- Add legacy name column if it doesn't exist
ALTER TABLE map_layers 
ADD COLUMN IF NOT EXISTS name VARCHAR(255);

-- Add legacy source column if it doesn't exist  
ALTER TABLE map_layers 
ADD COLUMN IF NOT EXISTS source VARCHAR(255);

-- Add lgu_id column
ALTER TABLE map_layers 
ADD COLUMN IF NOT EXISTS lgu_id INTEGER;

-- Add foreign key constraint if city_muni_master table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'city_muni_master') THEN
        ALTER TABLE map_layers 
        ADD CONSTRAINT IF NOT EXISTS fk_map_layers_lgu_id 
        FOREIGN KEY (lgu_id) REFERENCES city_muni_master(id) 
        ON DELETE NO ACTION ON UPDATE NO ACTION;
    END IF;
END $$;

COMMIT;
