-- Create waterways table similar to roadnetworks structure
CREATE TABLE IF NOT EXISTS waterways (
    id SERIAL PRIMARY KEY,
    properties JSONB,
    geometry JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for better performance on geometry queries
CREATE INDEX IF NOT EXISTS idx_waterways_geometry ON waterways USING GIN (geometry);

-- Create index for properties queries
CREATE INDEX IF NOT EXISTS idx_waterways_properties ON waterways USING GIN (properties);
