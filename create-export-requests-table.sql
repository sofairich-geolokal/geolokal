-- Create export_requests table for tracking data export requests
CREATE TABLE IF NOT EXISTS export_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    export_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    file_path VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_export_requests_user_id ON export_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_export_requests_status ON export_requests(status);
CREATE INDEX IF NOT EXISTS idx_export_requests_created_at ON export_requests(created_at);
