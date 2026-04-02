import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Geoportal API configuration
const GEOPORTAL_BASE_URL = 'https://geoportal.gov.ph';
const GEOPORTAL_REST_URL = 'https://geoportal.gov.ph/geoportal/rest';

// Types for geoportal data
interface GeoportalLayer {
    id: string;
    title: string;
    description?: string;
    abstract?: string;
    keywords?: string;
    type: string;
    owner: string;
    downloadURL?: string;
    serviceURL?: string;
    metadataURL?: string;
    extent?: {
        xmin: number;
        ymin: number;
        xmax: number;
        ymax: number;
    };
    spatialReference?: string;
}

interface GeoportalItem {
    id: string;
    title: string;
    type: string;
    owner: string;
    description?: string;
    links?: Array<{
        type: string;
        url: string;
    }>;
    extent?: any;
}

// Helper function to fetch data from geoportal REST API
async function fetchFromGeoportal(endpoint: string, params: Record<string, string> = {}) {
    try {
        const url = new URL(endpoint, GEOPORTAL_REST_URL);
        Object.entries(params).forEach(([key, value]) => {
            url.searchParams.append(key, value);
        });

        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout')), 30000);
        });

        // Create the fetch request
        const fetchPromise = fetch(url.toString(), {
            headers: {
                'User-Agent': 'Geolokal-Geoportal-Sync/1.0',
                'Accept': 'application/json',
            },
        });

        // Race between fetch and timeout
        const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`Error fetching from geoportal: ${endpoint}`, error);
        throw error;
    }
}

// Helper function to extract layer information from geoportal item
function extractLayerInfo(item: any): GeoportalLayer | null {
    try {
        const layer: GeoportalLayer = {
            id: item.id || '',
            title: item.title || '',
            type: item.type || '',
            owner: item.owner || '',
        };

        // Extract description
        if (item.description) {
            layer.description = item.description;
        }
        if (item.abstract) {
            layer.abstract = item.abstract;
        }

        // Extract keywords
        if (item.tags && item.tags.length > 0) {
            layer.keywords = item.tags.join(', ');
        }

        // Extract URLs from links
        if (item.links && Array.isArray(item.links)) {
            item.links.forEach((link: any) => {
                switch (link.type?.toLowerCase()) {
                    case 'download':
                        layer.downloadURL = link.url;
                        break;
                    case 'wms':
                        layer.serviceURL = link.url;
                        break;
                    case 'wfs':
                        // Could add WFS URL if needed
                        break;
                    case 'metadata':
                        layer.metadataURL = link.url;
                        break;
                }
            });
        }

        // Extract extent
        if (item.extent && item.extent.xmin !== undefined) {
            layer.extent = {
                xmin: parseFloat(item.extent.xmin),
                ymin: parseFloat(item.extent.ymin),
                xmax: parseFloat(item.extent.xmax),
                ymax: parseFloat(item.extent.ymax),
            };
        }

        // Extract spatial reference
        if (item.spatialReference) {
            layer.spatialReference = item.spatialReference.wkid || item.spatialReference.latestWkid || '4326';
        }

        return layer;
    } catch (error) {
        console.error('Error extracting layer info:', error);
        return null;
    }
}

// Helper function to store layer in database
async function storeLayerInDatabase(layer: GeoportalLayer) {
    try {
        // Check if layer already exists
        const existingLayer = await query(
            'SELECT id FROM geoportal_layers WHERE layer_id = $1',
            [layer.id]
        );

        if (existingLayer.rows.length > 0) {
            // Update existing layer
            await query(`
                UPDATE geoportal_layers SET 
                    title = $1, 
                    description = $2, 
                    abstract = $3, 
                    keywords = $4, 
                    data_type = $5, 
                    agency = $6, 
                    download_url = $7, 
                    service_url = $8, 
                    metadata_url = $9, 
                    bbox_xmin = $10, 
                    bbox_ymin = $11, 
                    bbox_xmax = $12, 
                    bbox_ymax = $13, 
                    coordinate_system = $14, 
                    last_updated = CURRENT_TIMESTAMP
                WHERE layer_id = $15
            `, [
                layer.title,
                layer.description,
                layer.abstract,
                layer.keywords,
                layer.type,
                layer.owner,
                layer.downloadURL,
                layer.serviceURL,
                layer.metadataURL,
                layer.extent?.xmin,
                layer.extent?.ymin,
                layer.extent?.xmax,
                layer.extent?.ymax,
                layer.spatialReference,
                layer.id
            ]);
            return 'updated';
        } else {
            // Insert new layer
            await query(`
                INSERT INTO geoportal_layers (
                    layer_id, title, description, abstract, keywords, 
                    data_type, agency, download_url, service_url, metadata_url,
                    bbox_xmin, bbox_ymin, bbox_xmax, bbox_ymax, coordinate_system
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            `, [
                layer.id,
                layer.title,
                layer.description,
                layer.abstract,
                layer.keywords,
                layer.type,
                layer.owner,
                layer.downloadURL,
                layer.serviceURL,
                layer.metadataURL,
                layer.extent?.xmin,
                layer.extent?.ymin,
                layer.extent?.xmax,
                layer.extent?.ymax,
                layer.spatialReference
            ]);
            return 'inserted';
        }
    } catch (error) {
        console.error('Error storing layer in database:', error);
        throw error;
    }
}

// Main sync function
async function syncGeoportalData() {
    const startTime = Date.now();
    let totalProcessed = 0;
    let totalAdded = 0;
    let totalUpdated = 0;
    let errorMessage = null;

    try {
        // Fetch all items from geoportal
        console.log('Fetching data from geoportal...');
        
        // Try different endpoints to find available data
        const endpoints = [
            '/find/document?f=json&start=1&max=1000',
            '/search?f=json&start=1&max=1000',
            '/items?f=json&start=1&max=1000'
        ];

        let geoportalData = null;
        let workingEndpoint = null;

        for (const endpoint of endpoints) {
            try {
                geoportalData = await fetchFromGeoportal(endpoint);
                workingEndpoint = endpoint;
                console.log(`Successfully fetched data from: ${endpoint}`);
                break;
            } catch (error) {
                console.log(`Failed to fetch from ${endpoint}, trying next...`);
                continue;
            }
        }

        if (!geoportalData) {
            throw new Error('Unable to fetch data from any geoportal endpoint');
        }

        // Process the data based on response structure
        let items = [];
        
        if (geoportalData.results) {
            items = geoportalData.results;
        } else if (geoportalData.items) {
            items = geoportalData.items;
        } else if (Array.isArray(geoportalData)) {
            items = geoportalData;
        } else {
            console.log('Geoportal response structure:', Object.keys(geoportalData));
            throw new Error('Unable to parse geoportal response structure');
        }

        console.log(`Found ${items.length} items to process`);

        // Process each item
        for (const item of items) {
            totalProcessed++;
            
            try {
                const layer = extractLayerInfo(item);
                if (layer && layer.id && layer.title) {
                    const result = await storeLayerInDatabase(layer);
                    if (result === 'inserted') {
                        totalAdded++;
                    } else if (result === 'updated') {
                        totalUpdated++;
                    }
                }
            } catch (error) {
                console.error(`Error processing item ${item.id || 'unknown'}:`, error);
                // Continue processing other items
            }
        }

        // Log the sync results
        const duration = Date.now() - startTime;
        await query(`
            INSERT INTO geoportal_sync_logs 
            (sync_type, status, records_processed, records_added, records_updated, sync_duration_ms)
            VALUES ($1, $2, $3, $4, $5, $6)
        `, ['full_sync', 'success', totalProcessed, totalAdded, totalUpdated, duration]);

        console.log(`Sync completed: ${totalProcessed} processed, ${totalAdded} added, ${totalUpdated} updated in ${duration}ms`);

    } catch (error) {
        errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Geoportal sync failed:', errorMessage);

        // Log the error
        const duration = Date.now() - startTime;
        await query(`
            INSERT INTO geoportal_sync_logs 
            (sync_type, status, records_processed, error_message, sync_duration_ms)
            VALUES ($1, $2, $3, $4, $5)
        `, ['full_sync', 'error', totalProcessed, errorMessage, duration]);

        throw error;
    }
}

// API endpoint to trigger sync
export async function POST() {
    try {
        await syncGeoportalData();
        
        return NextResponse.json({
            success: true,
            message: 'Geoportal data sync completed successfully',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        return NextResponse.json({
            success: false,
            message: 'Geoportal data sync failed',
            error: errorMessage,
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}

// API endpoint to get sync status and statistics
export async function GET() {
    try {
        // Get latest sync log
        const latestSync = await query(`
            SELECT * FROM geoportal_sync_logs 
            ORDER BY sync_date DESC 
            LIMIT 1
        `);

        // Get layer statistics
        const layerStats = await query(`
            SELECT 
                COUNT(*) as total_layers,
                COUNT(CASE WHEN is_active = true THEN 1 END) as active_layers,
                COUNT(CASE WHEN last_updated > NOW() - INTERVAL '7 days' THEN 1 END) as recently_updated,
                COUNT(DISTINCT agency) as unique_agencies,
                COUNT(DISTINCT data_type) as unique_types
            FROM geoportal_layers
        `);

        // Get layers by agency
        const layersByAgency = await query(`
            SELECT agency, COUNT(*) as count
            FROM geoportal_layers 
            WHERE is_active = true
            GROUP BY agency 
            ORDER BY count DESC
            LIMIT 10
        `);

        // Get layers by type
        const layersByType = await query(`
            SELECT data_type, COUNT(*) as count
            FROM geoportal_layers 
            WHERE is_active = true
            GROUP BY data_type 
            ORDER BY count DESC
            LIMIT 10
        `);

        return NextResponse.json({
            syncStatus: latestSync.rows[0] || null,
            statistics: layerStats.rows[0] || {},
            layersByAgency: layersByAgency.rows,
            layersByType: layersByType.rows,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        return NextResponse.json({
            success: false,
            message: 'Failed to fetch geoportal status',
            error: errorMessage
        }, { status: 500 });
    }
}
