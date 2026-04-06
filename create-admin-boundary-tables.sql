-- Administrative Boundary Locations Table
CREATE TABLE IF NOT EXISTS administrative_boundary_locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    location_type VARCHAR(50) NOT NULL DEFAULT 'boundary_point', -- boundary_point, barangay_center, landmark
    boundary_type VARCHAR(50) NOT NULL DEFAULT 'municipal', -- municipal, barangay, special
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Administrative Boundary Areas Table
CREATE TABLE IF NOT EXISTS administrative_boundary_areas (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    area_type VARCHAR(50) NOT NULL DEFAULT 'municipal', -- municipal, barangay, zone
    boundary_type VARCHAR(50) NOT NULL DEFAULT 'circle', -- circle, polygon, rectangle
    center_latitude DECIMAL(10, 8) NOT NULL,
    center_longitude DECIMAL(11, 8) NOT NULL,
    radius_km DECIMAL(8, 3), -- For circular boundaries
    polygon_coordinates JSONB, -- For polygon boundaries
    rectangle_bounds JSONB, -- For rectangular boundaries {north, south, east, west}
    color VARCHAR(7) DEFAULT '#dc2626',
    fill_opacity DECIMAL(3, 2) DEFAULT 0.2,
    stroke_weight INTEGER DEFAULT 3,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_boundary_locations_active ON administrative_boundary_locations(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_boundary_locations_type ON administrative_boundary_locations(location_type);
CREATE INDEX IF NOT EXISTS idx_admin_boundary_areas_active ON administrative_boundary_areas(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_boundary_areas_type ON administrative_boundary_areas(area_type);

-- Insert initial Ibaan boundary data
INSERT INTO administrative_boundary_areas (
    name, area_type, boundary_type, center_latitude, center_longitude, radius_km, color, fill_opacity, stroke_weight
) VALUES (
    'Ibaan Municipality Boundary', 'municipal', 'circle', 13.7588, 121.1250, 4.5, '#dc2626', 0.15, 4
) ON CONFLICT DO NOTHING;

-- Insert boundary location points from shapefile data
INSERT INTO administrative_boundary_locations (name, description, latitude, longitude, location_type, boundary_type) VALUES
('Barangay San Isidro', 'Northern boundary of Ibaan municipality', 13.7756, 121.1250, 'barangay_center', 'barangay'),
('Barangay Sabang', 'Southern boundary of Ibaan municipality', 13.7421, 121.1250, 'barangay_center', 'barangay'),
('Barangay Tala', 'Eastern boundary of Ibaan municipality', 13.7588, 121.1412, 'barangay_center', 'barangay'),
('Barangay Paligawan', 'Western boundary of Ibaan municipality', 13.7588, 121.1089, 'barangay_center', 'barangay'),
('Ibaan Town Proper', 'Municipal center of Ibaan', 13.7588, 121.1250, 'municipal_center', 'municipal'),
('San Jose Access Point', 'Western access to San Jose', 13.7421, 121.1089, 'landmark', 'access_point'),
('Batangas City Boundary', 'Northern boundary towards Batangas City', 13.7756, 121.1412, 'landmark', 'boundary_point'),
('Lipa City Access', 'Eastern access to Lipa City', 13.7421, 121.1089, 'landmark', 'access_point'),
('Malarayat Area', 'Central area for development', 13.7620, 121.1280, 'landmark', 'development_area'),
('Rosario Junction', 'Major road junction near Rosario', 13.7520, 121.1180, 'landmark', 'junction')
ON CONFLICT DO NOTHING;

-- Add comments
COMMENT ON TABLE administrative_boundary_locations IS 'Stores specific location points within administrative boundaries';
COMMENT ON TABLE administrative_boundary_areas IS 'Stores boundary area definitions (circles, polygons, etc.)';
COMMENT ON COLUMN administrative_boundary_locations.location_type IS 'Type of location: boundary_point, barangay_center, landmark, etc.';
COMMENT ON COLUMN administrative_boundary_areas.boundary_type IS 'Shape type: circle, polygon, rectangle';
