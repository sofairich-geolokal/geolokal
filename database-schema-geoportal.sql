-- Geoportal Data Tables
-- These tables will store data fetched from https://geoportal.gov.ph/

-- Table for geoportal layers/datasets
CREATE TABLE IF NOT EXISTS geoportal_layers (
    id SERIAL PRIMARY KEY,
    layer_id VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    abstract TEXT,
    keywords TEXT,
    data_type VARCHAR(100),
    agency VARCHAR(255),
    download_url TEXT,
    service_url TEXT,
    wms_url TEXT,
    wfs_url TEXT,
    metadata_url TEXT,
    bbox_xmin DECIMAL,
    bbox_ymin DECIMAL,
    bbox_xmax DECIMAL,
    bbox_ymax DECIMAL,
    coordinate_system VARCHAR(100),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for geoportal categories
CREATE TABLE IF NOT EXISTS geoportal_categories (
    id SERIAL PRIMARY KEY,
    category_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_category VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for layer-category relationships
CREATE TABLE IF NOT EXISTS layer_categories (
    id SERIAL PRIMARY KEY,
    layer_id VARCHAR(255) REFERENCES geoportal_layers(layer_id),
    category_id VARCHAR(100) REFERENCES geoportal_categories(category_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(layer_id, category_id)
);

-- Table for geoportal agencies
CREATE TABLE IF NOT EXISTS geoportal_agencies (
    id SERIAL PRIMARY KEY,
    agency_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    acronym VARCHAR(50),
    website VARCHAR(500),
    contact_email VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for download requests
CREATE TABLE IF NOT EXISTS geoportal_download_requests (
    id SERIAL PRIMARY KEY,
    layer_id VARCHAR(255) REFERENCES geoportal_layers(layer_id),
    request_data JSONB,
    status VARCHAR(50) DEFAULT 'pending',
    download_url TEXT,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for sync logs
CREATE TABLE IF NOT EXISTS geoportal_sync_logs (
    id SERIAL PRIMARY KEY,
    sync_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    records_processed INTEGER DEFAULT 0,
    records_added INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    error_message TEXT,
    sync_duration_ms INTEGER,
    sync_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert some default categories
INSERT INTO geoportal_categories (category_id, name, description) VALUES
('boundaries', 'Administrative Boundaries', 'Administrative and political boundaries'),
('elevation', 'Elevation', 'Digital elevation models and terrain data'),
('hydrology', 'Hydrology', 'Water resources and hydrological features'),
('land_cover', 'Land Cover', 'Land use and land cover classifications'),
('transportation', 'Transportation', 'Roads, railways, and transportation networks'),
('utilities', 'Utilities', 'Utility infrastructure and services'),
('environment', 'Environment', 'Environmental and ecological data'),
('hazards', 'Hazards', 'Natural hazards and risk assessment'),
('imagery', 'Imagery', 'Satellite and aerial imagery'),
('demographics', 'Demographics', 'Population and demographic data')
ON CONFLICT (category_id) DO NOTHING;

-- Insert some default agencies
INSERT INTO geoportal_agencies (agency_id, name, acronym, website) VALUES
('NAMRIA', 'National Mapping and Resource Information Authority', 'NAMRIA', 'https://www.namria.gov.ph'),
('DENR', 'Department of Environment and Natural Resources', 'DENR', 'https://www.denr.gov.ph'),
('DOST', 'Department of Science and Technology', 'DOST', 'https://www.dost.gov.ph'),
('DPWH', 'Department of Public Works and Highways', 'DPWH', 'https://www.dpwh.gov.ph'),
('DA', 'Department of Agriculture', 'DA', 'https://www.da.gov.ph'),
('DOH', 'Department of Health', 'DOH', 'https://www.doh.gov.ph'),
('DepEd', 'Department of Education', 'DepEd', 'https://www.deped.gov.ph'),
('DILG', 'Department of the Interior and Local Government', 'DILG', 'https://www.dilg.gov.ph'),
('DOT', 'Department of Tourism', 'DOT', 'https://www.tourism.gov.ph'),
('PSA', 'Philippine Statistics Authority', 'PSA', 'https://psa.gov.ph')
ON CONFLICT (agency_id) DO NOTHING;

-- Indexes for better performance (create after tables are created)
CREATE INDEX IF NOT EXISTS idx_geoportal_layers_agency ON geoportal_layers(agency);
CREATE INDEX IF NOT EXISTS idx_geoportal_layers_data_type ON geoportal_layers(data_type);
CREATE INDEX IF NOT EXISTS idx_geoportal_layers_active ON geoportal_layers(is_active);
CREATE INDEX IF NOT EXISTS idx_geoportal_sync_logs_date ON geoportal_sync_logs(sync_date);
CREATE INDEX IF NOT EXISTS idx_geoportal_download_requests_status ON geoportal_download_requests(status);
