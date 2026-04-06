-- Add saved_maps table
CREATE TABLE IF NOT EXISTS saved_maps (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    map_name VARCHAR(255) NOT NULL,
    map_description VARCHAR(500),
    map_config JSONB NOT NULL,
    basemap VARCHAR(100) DEFAULT 'Open Street Map',
    center_lat FLOAT DEFAULT 13.4124,
    center_lng FLOAT DEFAULT 122.5619,
    zoom_level INTEGER DEFAULT 6,
    layers_config JSONB,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add download_requests table
CREATE TABLE IF NOT EXISTS download_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    layer_id INTEGER REFERENCES map_layers(id) ON DELETE SET NULL,
    layer_name VARCHAR(255) NOT NULL,
    official_email VARCHAR(100) NOT NULL,
    client_name VARCHAR(100) NOT NULL,
    sex VARCHAR(20) DEFAULT 'Not Specified',
    address VARCHAR(500),
    office_agency VARCHAR(255),
    sector VARCHAR(100),
    purpose VARCHAR(500),
    official_contact_no VARCHAR(50),
    agree_terms BOOLEAN DEFAULT FALSE,
    certify_info BOOLEAN DEFAULT FALSE,
    bbox JSONB,
    map_extent JSONB,
    requested_format VARCHAR(50) DEFAULT 'shapefile',
    request_id VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    download_link VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

-- Create indexes for saved_maps
CREATE INDEX IF NOT EXISTS idx_saved_maps_user_id ON saved_maps(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_maps_is_public ON saved_maps(is_public);
CREATE INDEX IF NOT EXISTS idx_saved_maps_created_at ON saved_maps(created_at);

-- Create indexes for download_requests
CREATE INDEX IF NOT EXISTS idx_download_requests_user_id ON download_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_download_requests_layer_id ON download_requests(layer_id);
CREATE INDEX IF NOT EXISTS idx_download_requests_request_id ON download_requests(request_id);
CREATE INDEX IF NOT EXISTS idx_download_requests_status ON download_requests(status);
CREATE INDEX IF NOT EXISTS idx_download_requests_created_at ON download_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_download_requests_expires_at ON download_requests(expires_at);

-- Update existing map_layers table to add is_downloadable if not exists
ALTER TABLE map_layers ADD COLUMN IF NOT EXISTS is_downloadable BOOLEAN DEFAULT FALSE;
