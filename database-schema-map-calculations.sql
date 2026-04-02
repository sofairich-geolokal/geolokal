-- Map Calculations and Customizations Schema

-- Table for map calculations
CREATE TABLE IF NOT EXISTS map_calculations (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255),
    title VARCHAR(255) NOT NULL,
    calculation_type VARCHAR(100) NOT NULL, -- 'area', 'distance', 'buffer', 'elevation', etc.
    input_data JSONB NOT NULL,
    result_data JSONB NOT NULL,
    units VARCHAR(50) DEFAULT 'metric',
    map_state JSONB, -- Map center, zoom, layers, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for saved map states/customizations
CREATE TABLE IF NOT EXISTS map_customizations (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    map_config JSONB NOT NULL, -- Layers, basemap, styles, etc.
    view_state JSONB, -- Center, zoom, bearing, pitch
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for map measurement tools
CREATE TABLE IF NOT EXISTS map_measurements (
    id SERIAL PRIMARY KEY,
    calculation_id INTEGER REFERENCES map_calculations(id),
    measurement_type VARCHAR(100) NOT NULL, -- 'point', 'line', 'polygon', 'circle'
    coordinates JSONB NOT NULL,
    properties JSONB, -- Additional properties like radius, style, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for calculation templates
CREATE TABLE IF NOT EXISTS calculation_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    calculation_type VARCHAR(100) NOT NULL,
    template_config JSONB NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_map_calculations_user_id ON map_calculations(user_id);
CREATE INDEX IF NOT EXISTS idx_map_calculations_type ON map_calculations(calculation_type);
CREATE INDEX IF NOT EXISTS idx_map_calculations_created_at ON map_calculations(created_at);
CREATE INDEX IF NOT EXISTS idx_map_customizations_user_id ON map_customizations(user_id);
CREATE INDEX IF NOT EXISTS idx_map_customizations_public ON map_customizations(is_public);
CREATE INDEX IF NOT EXISTS idx_map_measurements_calculation_id ON map_measurements(calculation_id);

-- Insert some default calculation templates
INSERT INTO calculation_templates (name, description, calculation_type, template_config, is_default) VALUES
('Area Measurement', 'Calculate area of drawn polygons', 'area', '{"units": ["hectares", "sqmeters", "sqkilometers"], "defaultUnit": "hectares", "precision": 2}', true),
('Distance Measurement', 'Measure distance between points or along lines', 'distance', '{"units": ["meters", "kilometers", "miles"], "defaultUnit": "kilometers", "precision": 2}', true),
('Buffer Analysis', 'Create buffer zones around features', 'buffer', '{"units": ["meters", "kilometers"], "defaultUnit": "meters", "precision": 0}', true),
('Elevation Profile', 'Analyze elevation along a path', 'elevation', '{"units": ["meters", "feet"], "defaultUnit": "meters", "precision": 1}', true),
('Volume Calculation', 'Calculate volume for 3D analysis', 'volume', '{"units": ["cubic_meters", "cubic_kilometers"], "defaultUnit": "cubic_meters", "precision": 2}', false)
ON CONFLICT DO NOTHING;
