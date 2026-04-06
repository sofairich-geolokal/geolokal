-- Complete Database Schema Update Query
-- Run this query to ensure all required columns exist for your API

DO $$
BEGIN
    -- Enable PostGIS extension if not already enabled
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') THEN
        CREATE EXTENSION postgis;
    END IF;

    -- Create core tables if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='map_layers') THEN
        CREATE TABLE map_layers (
            id SERIAL PRIMARY KEY,
            lgu_id INTEGER REFERENCES city_muni_master(id),
            category_id INTEGER REFERENCES project_categories(id),
            layer_name VARCHAR(100) NOT NULL,
            geom geometry,
            metadata JSONB,
            uploaded_by INTEGER REFERENCES users(id),
            created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
            layer_type VARCHAR(50),
            style_config JSONB,
            bbox JSONB,
            projection VARCHAR(20) DEFAULT 'EPSG:4326',
            min_zoom INTEGER DEFAULT 0,
            max_zoom INTEGER DEFAULT 20,
            attribution TEXT,
            opacity DECIMAL(3,2) DEFAULT 1.0,
            z_index INTEGER DEFAULT 0,
            is_visible BOOLEAN DEFAULT true,
            is_downloadable BOOLEAN DEFAULT false
        );
        
        -- Create spatial index for geometry
        CREATE INDEX idx_map_layers_geom ON map_layers USING GIST (geom);
    ELSE
        -- Update existing map_layers table with missing columns
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='map_layers' AND column_name='layer_type') THEN
            ALTER TABLE map_layers ADD COLUMN layer_type VARCHAR(50);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='map_layers' AND column_name='style_config') THEN
            ALTER TABLE map_layers ADD COLUMN style_config JSONB;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='map_layers' AND column_name='bbox') THEN
            ALTER TABLE map_layers ADD COLUMN bbox JSONB;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='map_layers' AND column_name='projection') THEN
            ALTER TABLE map_layers ADD COLUMN projection VARCHAR(20) DEFAULT 'EPSG:4326';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='map_layers' AND column_name='min_zoom') THEN
            ALTER TABLE map_layers ADD COLUMN min_zoom INTEGER DEFAULT 0;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='map_layers' AND column_name='max_zoom') THEN
            ALTER TABLE map_layers ADD COLUMN max_zoom INTEGER DEFAULT 20;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='map_layers' AND column_name='attribution') THEN
            ALTER TABLE map_layers ADD COLUMN attribution TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='map_layers' AND column_name='opacity') THEN
            ALTER TABLE map_layers ADD COLUMN opacity DECIMAL(3,2) DEFAULT 1.0;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='map_layers' AND column_name='z_index') THEN
            ALTER TABLE map_layers ADD COLUMN z_index INTEGER DEFAULT 0;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='map_layers' AND column_name='is_visible') THEN
            ALTER TABLE map_layers ADD COLUMN is_visible BOOLEAN DEFAULT true;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='map_layers' AND column_name='is_downloadable') THEN
            ALTER TABLE map_layers ADD COLUMN is_downloadable BOOLEAN DEFAULT false;
        END IF;
        
        -- Create spatial index if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='map_layers' AND indexname='idx_map_layers_geom') THEN
            CREATE INDEX idx_map_layers_geom ON map_layers USING GIST (geom);
        END IF;
    END IF;
    
    -- Update users table with all required columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='created_by') THEN
        ALTER TABLE users ADD COLUMN created_by VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='last_login') THEN
        ALTER TABLE users ADD COLUMN last_login TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='is_active') THEN
        ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='household_id') THEN
        ALTER TABLE users ADD COLUMN household_id INTEGER;
    END IF;
    
    -- Create additional tables needed by Prisma-based APIs
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='viewer_activity') THEN
        CREATE TABLE viewer_activity (
            id SERIAL PRIMARY KEY,
            session_id VARCHAR(255),
            user_id INTEGER REFERENCES users(id),
            activity_type VARCHAR(100),
            activity_data JSONB,
            ip_address VARCHAR(45),
            user_agent TEXT,
            map_bounds JSONB,
            zoom_level DECIMAL(10,6),
            active_layers JSONB,
            duration_ms INTEGER,
            layer_id INTEGER REFERENCES map_layers(id),
            timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='layer_bookmark') THEN
        CREATE TABLE layer_bookmark (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id),
            layer_id INTEGER REFERENCES map_layers(id),
            bookmark_name VARCHAR(255) NOT NULL,
            bookmark_config JSONB,
            is_public BOOLEAN DEFAULT false,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='drawing_data') THEN
        CREATE TABLE drawing_data (
            id SERIAL PRIMARY KEY,
            session_id VARCHAR(255),
            user_id INTEGER REFERENCES users(id),
            drawing_type VARCHAR(50),
            geometry JSONB,
            properties JSONB,
            layer_id INTEGER REFERENCES map_layers(id),
            is_saved BOOLEAN DEFAULT false,
            timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='measurement_data') THEN
        CREATE TABLE measurement_data (
            id SERIAL PRIMARY KEY,
            session_id VARCHAR(255),
            user_id INTEGER REFERENCES users(id),
            measurement_type VARCHAR(50),
            measurement_value DECIMAL(15,6),
            unit VARCHAR(20) DEFAULT 'meters',
            coordinates JSONB,
            layer_id INTEGER REFERENCES map_layers(id),
            timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='export_request') THEN
        CREATE TABLE export_request (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id),
            layers JSONB,
            format VARCHAR(20) DEFAULT 'geojson',
            bounds JSONB,
            projection VARCHAR(20) DEFAULT 'EPSG:4326',
            include_attributes BOOLEAN DEFAULT true,
            email VARCHAR(255),
            status VARCHAR(20) DEFAULT 'processing',
            requested_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            completed_at TIMESTAMPTZ
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='population_data') THEN
        CREATE TABLE population_data (
            id SERIAL PRIMARY KEY,
            household_id INTEGER,
            individual_id INTEGER,
            age INTEGER,
            gender VARCHAR(10),
            education_level VARCHAR(50),
            employment_status VARCHAR(50),
            income_level DECIMAL(10,2),
            lgu_id INTEGER REFERENCES city_muni_master(id),
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );
    END IF;
    
    -- Create indexes for better performance
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='viewer_activity' AND indexname='idx_viewer_activity_session') THEN
        CREATE INDEX idx_viewer_activity_session ON viewer_activity(session_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='viewer_activity' AND indexname='idx_viewer_activity_user') THEN
        CREATE INDEX idx_viewer_activity_user ON viewer_activity(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='layer_bookmark' AND indexname='idx_layer_bookmark_user') THEN
        CREATE INDEX idx_layer_bookmark_user ON layer_bookmark(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='layer_bookmark' AND indexname='idx_layer_bookmark_layer') THEN
        CREATE INDEX idx_layer_bookmark_layer ON layer_bookmark(layer_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='drawing_data' AND indexname='idx_drawing_data_session') THEN
        CREATE INDEX idx_drawing_data_session ON drawing_data(session_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='measurement_data' AND indexname='idx_measurement_data_session') THEN
        CREATE INDEX idx_measurement_data_session ON measurement_data(session_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='export_request' AND indexname='idx_export_request_user') THEN
        CREATE INDEX idx_export_request_user ON export_request(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='population_data' AND indexname='idx_population_data_household') THEN
        CREATE INDEX idx_population_data_household ON population_data(household_id);
    END IF;
    
    RAISE NOTICE 'Database schema updated successfully!';
END $$;

-- Verify the updates
SELECT 
    table_name, 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('map_layers', 'users', 'viewer_activity', 'layer_bookmark', 'drawing_data', 'measurement_data', 'export_request', 'population_data')
ORDER BY table_name, ordinal_position;
