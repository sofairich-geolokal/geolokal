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

// Main sync function for specific layers
async function syncGeoportalData() {
    const startTime = Date.now();
    let totalProcessed = 0;
    let totalAdded = 0;
    let totalUpdated = 0;
    let errorMessage = null;

    try {
        console.log('🚀 Starting GeoPortal sync for specific layers...');
        
        // Import our updated GeoPortal service to fetch the three specific layers
        const { GeoPortalService } = await import('@/lib/geoportal');
        
        // Fetch the three specific layers you requested
        const [landCover, climateType, landslideSusceptibility] = await Promise.all([
            GeoPortalService.fetchLandCoverRegion4A(),
            GeoPortalService.fetchClimateType(),
            GeoPortalService.fetchLandslideSusceptibility()
        ]);

        const layers = [landCover, climateType, landslideSusceptibility].filter(Boolean);
        
        console.log(`📋 Found ${layers.length} GeoPortal layers to process`);

        // Process each layer
        for (const layer of layers) {
            totalProcessed++;
            
            try {
                // Import prisma dynamically
                const { prisma } = await import('@/lib/prisma');
                
                // Check if layer already exists in map_layers table
                if (!layer || !layer.title) {
                    console.log('⚠️ Skipping invalid layer');
                    continue;
                }

                const existingLayer = await prisma.map_layers.findFirst({
                    where: {
                        layer_name: layer.title
                    }
                });

                if (existingLayer) {
                    console.log(`🔄 Updating existing layer: ${layer.title}`);
                    
                    // Update existing layer with GeoPortal data
                    const updatedLayer = await prisma.map_layers.update({
                        where: { id: existingLayer.id },
                        data: {
                            layer_name: layer.title,
                            layer_type: 'wms',
                            metadata: {
                                geojson: layer.geometry,
                                source: 'geoportal',
                                description: layer.description,
                                properties: layer.properties,
                                wmsUrl: layer.wmsUrl,
                                wmsLayer: layer.wmsLayer,
                                lastSync: new Date().toISOString()
                            },
                            style_config: layer.style,
                            is_visible: true,
                            is_downloadable: false,
                            attribution: layer.attribution,
                            updated_at: new Date()
                        } as any,
                    });

                    totalUpdated++;
                } else {
                    console.log(`➕ Creating new layer: ${layer.title}`);
                    
                    // Create new layer
                    const newLayer = await prisma.map_layers.create({
                        data: {
                            layer_name: layer.title,
                            layer_type: 'wms',
                            metadata: {
                                geojson: layer.geometry,
                                source: 'geoportal',
                                description: layer.description,
                                properties: layer.properties,
                                wmsUrl: layer.wmsUrl,
                                wmsLayer: layer.wmsLayer
                            },
                            style_config: layer.style,
                            is_visible: true,
                            is_downloadable: false,
                            attribution: layer.attribution,
                            // Create category if needed
                            category_id: layer.category ? await getOrCreateCategory(layer.category) : null
                        } as any,
                    });

                    totalAdded++;
                }
            } catch (error) {
                console.error(`❌ Failed to process layer ${layer?.title || 'unknown'}:`, error);
                errorMessage = error instanceof Error ? error.message : 'Unknown error';
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

// Helper function to get or create category
async function getOrCreateCategory(categoryName: string): Promise<number> {
    try {
        // Check if category already exists
        let category = await query(`
            SELECT id FROM project_categories 
            WHERE name = $1
        `, [categoryName]);

        if (category.rows.length === 0) {
            // Create new category if it doesn't exist
            const newCategory = await query(`
                INSERT INTO project_categories (name)
                VALUES ($1)
                RETURNING id
            `, [categoryName]);

            const categoryId = newCategory.rows[0]?.id;
            console.log(`✅ Created new category: ${categoryName} (ID: ${categoryId})`);
            return categoryId || 1;
        }

        return category.rows[0]?.id || 1;
    } catch (error) {
        console.error('Error getting/creating category:', error);
        // Return a default category ID or null
        return 1; // Default category
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
