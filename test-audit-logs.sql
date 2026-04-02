-- Test script to create sample audit logs
-- Run this to populate audit_logs table with test data

DO $$
BEGIN
    -- Get first LGU and user for testing
    DECLARE
        lgu_record RECORD;
        user_record RECORD;
    BEGIN
        -- Get first LGU
        SELECT id, name INTO lgu_record FROM city_muni_master LIMIT 1;
        
        IF lgu_record IS NOT NULL THEN
            -- Get first user from this LGU
            SELECT id, username INTO user_record FROM users WHERE lgu_id = lgu_record.id LIMIT 1;
            
            IF user_record IS NOT NULL THEN
                -- Insert sample audit logs
                INSERT INTO audit_logs (actor, action, details, lgu_id, created_by, timestamp) VALUES
                    (user_record.username, 'USER_LOGIN', 'User logged in successfully', lgu_record.id, user_record.username, NOW() - INTERVAL '1 hour'),
                    (user_record.username, 'LAYER_VIEW', 'Viewed layer: Base Map', lgu_record.id, user_record.username, NOW() - INTERVAL '45 minutes'),
                    (user_record.username, 'MEASUREMENT_CREATE', 'Created measurement: Distance', lgu_record.id, user_record.username, NOW() - INTERVAL '30 minutes'),
                    (user_record.username, 'BOOKMARK_CREATE', 'Created bookmark: My Location', lgu_record.id, user_record.username, NOW() - INTERVAL '20 minutes'),
                    (user_record.username, 'EXPORT_REQUEST', 'Requested GeoJSON export', lgu_record.id, user_record.username, NOW() - INTERVAL '10 minutes');
                    
                RAISE NOTICE 'Created 5 sample audit logs for LGU: %, User: %', lgu_record.name, user_record.username;
            ELSE
                RAISE NOTICE 'No users found for LGU: %', lgu_record.name;
            END IF;
        ELSE
            RAISE NOTICE 'No LGU found in database';
        END IF;
    END;
END $$;

-- Verify the logs were created
SELECT 
    to_char(timestamp, 'Mon DD, YYYY HH:MI AM') as timestamp,
    actor, 
    action, 
    created_by,
    details,
    id
FROM audit_logs 
ORDER BY timestamp DESC
LIMIT 10;
