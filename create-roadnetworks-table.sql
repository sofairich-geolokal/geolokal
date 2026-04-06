-- Create roadnetworks table similar to waterways structure
CREATE TABLE IF NOT EXISTS roadnetworks (
    id SERIAL PRIMARY KEY,
    properties JSONB,
    geometry JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for better performance on geometry queries
CREATE INDEX IF NOT EXISTS idx_roadnetworks_geometry ON roadnetworks USING GIN (geometry);

-- Create index for properties queries
CREATE INDEX IF NOT EXISTS idx_roadnetworks_properties ON roadnetworks USING GIN (properties);
