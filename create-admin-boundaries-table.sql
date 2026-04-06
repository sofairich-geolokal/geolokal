-- Admin Boundaries Table for GeoJSON data
CREATE TABLE IF NOT EXISTS admin_boundaries (
    id SERIAL PRIMARY KEY,
    properties JSONB NOT NULL,
    geometry JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_boundaries_geometry ON admin_boundaries USING GIN (geometry);
CREATE INDEX IF NOT EXISTS idx_admin_boundaries_properties ON admin_boundaries USING GIN (properties);

-- Add comments
COMMENT ON TABLE admin_boundaries IS 'Stores administrative boundary data in GeoJSON format';
COMMENT ON COLUMN admin_boundaries.properties IS 'GeoJSON properties containing boundary attributes';
COMMENT ON COLUMN admin_boundaries.geometry IS 'GeoJSON geometry containing boundary coordinates';
