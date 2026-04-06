-- Migration: Add source_types and project_source_links tables
-- This script links source types data with projects

-- Create source_types table
CREATE TABLE IF NOT EXISTS source_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description VARCHAR(500),
    color VARCHAR(7) DEFAULT '#3b82f6',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create project_source_links table for many-to-many relationship
CREATE TABLE IF NOT EXISTS project_source_links (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    source_type_id INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, source_type_id),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (source_type_id) REFERENCES source_types(id) ON DELETE CASCADE
);

-- Insert default source types based on current data sources
INSERT INTO source_types (name, description, color) VALUES
('Open Street Map (OSM)', 'Open source mapping data', '#1a1a1a'),
('Geo portal Gov-PH', 'Government geographic data', '#f9a825'),
('Community Monitoring System', 'CBMS indicators data', '#4caf50'),
('Tax Parcel Mapping', 'Tax parcel boundaries', '#ef5350')
ON CONFLICT (name) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_source_types_active ON source_types(is_active);
CREATE INDEX IF NOT EXISTS idx_project_source_links_project ON project_source_links(project_id);
CREATE INDEX IF NOT EXISTS idx_project_source_links_source ON project_source_links(source_type_id);

-- Add comments
COMMENT ON TABLE source_types IS 'Defines different types of data sources that can be linked to projects';
COMMENT ON TABLE project_source_links IS 'Many-to-many relationship between projects and source types';
