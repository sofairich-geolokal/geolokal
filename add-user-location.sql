-- Add location field to users table
ALTER TABLE users 
ADD COLUMN location VARCHAR(100);

-- Create index for location queries
CREATE INDEX idx_users_location ON users(location);

-- Update existing users with default location
UPDATE users 
SET location = 'Ibaan, Batangas' 
WHERE location IS NULL AND role = 'Viewer';
