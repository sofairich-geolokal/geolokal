import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Types for API responses
interface GeoportalLayerResponse {
    id: string;
    title: string;
    description?: string;
    abstract?: string;
    keywords?: string;
    data_type: string;
    agency: string;
    download_url?: string;
    service_url?: string;
    metadata_url?: string;
    bbox_xmin?: number;
    bbox_ymin?: number;
    bbox_xmax?: number;
    bbox_ymax?: number;
    coordinate_system?: string;
    last_updated: string;
    is_active: boolean;
}

interface SearchFilters {
    search?: string;
    agency?: string;
    data_type?: string;
    category?: string;
    has_download?: boolean;
    bbox?: {
        xmin: number;
        ymin: number;
        xmax: number;
        ymax: number;
    };
}

// GET endpoint to search and retrieve geoportal layers
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        
        // Parse query parameters
        const page = parseInt(searchParams.get('page') || '1');
        const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100); // Max 100 per request
        const offset = (page - 1) * limit;
        
        const search = searchParams.get('search')?.trim();
        const agency = searchParams.get('agency')?.trim();
        const dataType = searchParams.get('data_type')?.trim();
        const category = searchParams.get('category')?.trim();
        const hasDownload = searchParams.get('has_download') === 'true';
        
        // Parse bounding box if provided
        let bboxFilter = null;
        const bboxXmin = searchParams.get('bbox_xmin');
        const bboxYmin = searchParams.get('bbox_ymin');
        const bboxXmax = searchParams.get('bbox_xmax');
        const bboxYmax = searchParams.get('bbox_ymax');
        
        if (bboxXmin && bboxYmin && bboxXmax && bboxYmax) {
            bboxFilter = {
                xmin: parseFloat(bboxXmin),
                ymin: parseFloat(bboxYmin),
                xmax: parseFloat(bboxXmax),
                ymax: parseFloat(bboxYmax)
            };
        }

        // Build WHERE clause
        const whereConditions: string[] = ['is_active = true'];
        const queryParams: any[] = [];
        let paramIndex = 1;

        if (search) {
            whereConditions.push(`(
                title ILIKE $${paramIndex} OR 
                description ILIKE $${paramIndex} OR 
                abstract ILIKE $${paramIndex} OR 
                keywords ILIKE $${paramIndex}
            )`);
            queryParams.push(`%${search}%`);
            paramIndex++;
        }

        if (agency) {
            whereConditions.push(`agency = $${paramIndex}`);
            queryParams.push(agency);
            paramIndex++;
        }

        if (dataType) {
            whereConditions.push(`data_type = $${paramIndex}`);
            queryParams.push(dataType);
            paramIndex++;
        }

        if (hasDownload) {
            whereConditions.push(`download_url IS NOT NULL AND download_url != ''`);
        }

        if (bboxFilter) {
            whereConditions.push(`(
                bbox_xmax IS NOT NULL AND 
                bbox_xmin <= $${paramIndex} AND 
                bbox_xmax >= $${paramIndex + 1} AND 
                bbox_ymin <= $${paramIndex + 2} AND 
                bbox_ymax >= $${paramIndex + 3}
            )`);
            queryParams.push(bboxFilter.xmax, bboxFilter.xmin, bboxFilter.ymax, bboxFilter.ymin);
            paramIndex += 4;
        }

        if (category) {
            // Join with layer_categories table
            whereConditions.push(`EXISTS (
                SELECT 1 FROM layer_categories lc 
                JOIN geoportal_categories gc ON lc.category_id = gc.category_id 
                WHERE lc.layer_id = gl.layer_id AND gc.name ILIKE $${paramIndex}
            )`);
            queryParams.push(`%${category}%`);
            paramIndex++;
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        // Main query to fetch layers
        const queryText = `
            SELECT 
                layer_id,
                title,
                description,
                abstract,
                keywords,
                data_type,
                agency,
                download_url,
                service_url,
                metadata_url,
                bbox_xmin,
                bbox_ymin,
                bbox_xmax,
                bbox_ymax,
                coordinate_system,
                last_updated,
                is_active
            FROM geoportal_layers gl
            ${whereClause}
            ORDER BY last_updated DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

        queryParams.push(limit, offset);

        // Execute main query
        const layersResult = await query(queryText, queryParams);

        // Get total count for pagination
        const countQuery = `
            SELECT COUNT(*) as total
            FROM geoportal_layers gl
            ${whereClause}
        `;
        
        const countResult = await query(countQuery, queryParams.slice(0, -2)); // Remove limit and offset params
        const total = parseInt(countResult.rows[0]?.total || '0');

        // Get categories for each layer if needed
        const layersWithCategories = await Promise.all(
            layersResult.rows.map(async (layer) => {
                const categoriesResult = await query(`
                    SELECT gc.name, gc.category_id
                    FROM layer_categories lc
                    JOIN geoportal_categories gc ON lc.category_id = gc.category_id
                    WHERE lc.layer_id = $1
                `, [layer.layer_id]);

                return {
                    ...layer,
                    categories: categoriesResult.rows
                };
            })
        );

        // Get available filters
        const [agencies, dataTypes, categories] = await Promise.all([
            query('SELECT DISTINCT agency, COUNT(*) as count FROM geoportal_layers WHERE is_active = true GROUP BY agency ORDER BY count DESC'),
            query('SELECT DISTINCT data_type, COUNT(*) as count FROM geoportal_layers WHERE is_active = true GROUP BY data_type ORDER BY count DESC'),
            query('SELECT DISTINCT gc.name, COUNT(*) as count FROM geoportal_categories gc JOIN layer_categories lc ON gc.category_id = lc.category_id JOIN geoportal_layers gl ON lc.layer_id = gl.layer_id WHERE gl.is_active = true GROUP BY gc.name ORDER BY count DESC')
        ]);

        // Build response
        const response = {
            success: true,
            data: layersWithCategories,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNext: offset + limit < total,
                hasPrev: page > 1
            },
            filters: {
                agencies: agencies.rows,
                dataTypes: dataTypes.rows,
                categories: categories.rows
            },
            timestamp: new Date().toISOString()
        };

        return NextResponse.json(response);

    } catch (error) {
        console.error('Error searching geoportal layers:', error);
        
        return NextResponse.json({
            success: false,
            message: 'Failed to search geoportal layers',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

// POST endpoint to create a download request
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { layerId, requestData } = body;

        if (!layerId) {
            return NextResponse.json({
                success: false,
                message: 'Layer ID is required'
            }, { status: 400 });
        }

        // Check if layer exists and has download URL
        const layerResult = await query(`
            SELECT layer_id, title, download_url, agency 
            FROM geoportal_layers 
            WHERE layer_id = $1 AND is_active = true
        `, [layerId]);

        if (layerResult.rows.length === 0) {
            return NextResponse.json({
                success: false,
                message: 'Layer not found or not active'
            }, { status: 404 });
        }

        const layer = layerResult.rows[0];

        if (!layer.download_url) {
            return NextResponse.json({
                success: false,
                message: 'This layer does not support direct download'
            }, { status: 400 });
        }

        // Create download request record
        const downloadRequest = await query(`
            INSERT INTO geoportal_download_requests (layer_id, request_data, status)
            VALUES ($1, $2, 'pending')
            RETURNING id, created_at
        `, [layerId, JSON.stringify(requestData || {})]);

        // In a real implementation, you would:
        // 1. Make a request to the geoportal download API
        // 2. Handle authentication if required
        // 3. Get the download URL
        // 4. Update the request record with the download URL and expiry

        // For now, we'll simulate a download request
        const requestId = downloadRequest.rows[0].id;
        
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Update with mock download URL (in reality, this would come from geoportal)
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
        const mockDownloadUrl = `https://geoportal.gov.ph/downloads/${layerId}_${requestId}.zip`;

        await query(`
            UPDATE geoportal_download_requests 
            SET status = 'ready', download_url = $1, expires_at = $2, updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
        `, [mockDownloadUrl, expiresAt, requestId]);

        return NextResponse.json({
            success: true,
            message: 'Download request created successfully',
            downloadRequest: {
                id: requestId,
                layerId: layer.layer_id,
                layerTitle: layer.title,
                status: 'ready',
                downloadUrl: mockDownloadUrl,
                expiresAt: expiresAt.toISOString(),
                createdAt: downloadRequest.rows[0].created_at
            }
        });

    } catch (error) {
        console.error('Error creating download request:', error);
        
        return NextResponse.json({
            success: false,
            message: 'Failed to create download request',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
