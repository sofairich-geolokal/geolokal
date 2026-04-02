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
