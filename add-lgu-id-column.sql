-- Add missing lgu_id column to map_layers table
ALTER TABLE map_layers 
ADD COLUMN IF NOT EXISTS lgu_id INTEGER;

-- Add foreign key constraint if city_muni_master table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'city_muni_master') THEN
        ALTER TABLE map_layers 
        ADD CONSTRAINT fk_map_layers_lgu_id 
        FOREIGN KEY (lgu_id) REFERENCES city_muni_master(id) 
        ON DELETE NO ACTION ON UPDATE NO ACTION;
    END IF;
END $$;
