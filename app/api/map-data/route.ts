import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Types for map calculations
interface MapCalculation {
    id?: number;
    user_id?: string;
    title: string;
    calculation_type: string;
    input_data: any;
    result_data: any;
    units?: string;
    map_state?: any;
}

interface MapCustomization {
    id?: number;
    user_id?: string;
    title: string;
    description?: string;
    map_config: any;
    view_state?: any;
    is_public?: boolean;
}

// GET endpoint to retrieve calculations and customizations
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId') || 'anonymous';
        const type = searchParams.get('type'); // 'calculations', 'customizations', 'templates'
        const calculationType = searchParams.get('calculationType');

        if (type === 'calculations') {
            let queryText = `
                SELECT id, title, calculation_type, input_data, result_data, units, map_state, created_at, updated_at
                FROM map_calculations 
                WHERE user_id = $1
            `;
            const queryParams = [userId];

            if (calculationType) {
                queryText += ` AND calculation_type = $2 ORDER BY created_at DESC`;
                queryParams.push(calculationType);
            } else {
                queryText += ` ORDER BY created_at DESC`;
            }

            const result = await query(queryText, queryParams);
            
            return NextResponse.json({
                success: true,
                data: result.rows
            });
        }

        if (type === 'customizations') {
            const result = await query(`
                SELECT id, title, description, map_config, view_state, is_public, created_at, updated_at
                FROM map_customizations 
                WHERE user_id = $1 OR is_public = true
                ORDER BY created_at DESC
            `, [userId]);

            return NextResponse.json({
                success: true,
                data: result.rows
            });
        }

        if (type === 'templates') {
            const result = await query(`
                SELECT id, name, description, calculation_type, template_config
                FROM calculation_templates 
                ORDER BY is_default DESC, name ASC
            `);

            return NextResponse.json({
                success: true,
                data: result.rows
            });
        }

        // Get all data for dashboard
        const [calculations, customizations, templates] = await Promise.all([
            query(`
                SELECT calculation_type, COUNT(*) as count, 
                       MAX(created_at) as latest
                FROM map_calculations 
                WHERE user_id = $1
                GROUP BY calculation_type
            `, [userId]),
            query(`
                SELECT COUNT(*) as count, 
                       MAX(created_at) as latest
                FROM map_customizations 
                WHERE user_id = $1
            `, [userId]),
            query(`
                SELECT name, calculation_type 
                FROM calculation_templates 
                WHERE is_default = true
            `)
        ]);

        return NextResponse.json({
            success: true,
            dashboard: {
                calculations: calculations.rows,
                customizations: customizations.rows[0] || { count: 0, latest: null },
                templates: templates.rows
            }
        });

    } catch (error) {
        console.error('Error fetching map data:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to fetch map data',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

// POST endpoint to save calculations and customizations
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { type, data } = body;
        const userId = data.user_id || 'anonymous';

        if (type === 'calculation') {
            const calculation: MapCalculation = data;
            
            const result = await query(`
                INSERT INTO map_calculations (user_id, title, calculation_type, input_data, result_data, units, map_state)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id, created_at
            `, [
                userId,
                calculation.title,
                calculation.calculation_type,
                JSON.stringify(calculation.input_data),
                JSON.stringify(calculation.result_data),
                calculation.units || 'metric',
                JSON.stringify(calculation.map_state || {})
            ]);

            return NextResponse.json({
                success: true,
                message: 'Calculation saved successfully',
                id: result.rows[0].id,
                created_at: result.rows[0].created_at
            });
        }

        if (type === 'customization') {
            const customization: MapCustomization = data;
            
            const result = await query(`
                INSERT INTO map_customizations (user_id, title, description, map_config, view_state, is_public)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id, created_at
            `, [
                userId,
                customization.title,
                customization.description || '',
                JSON.stringify(customization.map_config),
                JSON.stringify(customization.view_state || {}),
                customization.is_public || false
            ]);

            return NextResponse.json({
                success: true,
                message: 'Map customization saved successfully',
                id: result.rows[0].id,
                created_at: result.rows[0].created_at
            });
        }

        return NextResponse.json({
            success: false,
            message: 'Invalid type specified'
        }, { status: 400 });

    } catch (error) {
        console.error('Error saving map data:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to save map data',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

// DELETE endpoint to remove calculations and customizations
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId') || 'anonymous';
        const type = searchParams.get('type');
        const id = searchParams.get('id');

        if (!type || !id) {
            return NextResponse.json({
                success: false,
                message: 'Type and ID are required'
            }, { status: 400 });
        }

        if (type === 'calculation') {
            await query('DELETE FROM map_calculations WHERE id = $1 AND user_id = $2', [id, userId]);
            return NextResponse.json({
                success: true,
                message: 'Calculation deleted successfully'
            });
        }

        if (type === 'customization') {
            await query('DELETE FROM map_customizations WHERE id = $1 AND user_id = $2', [id, userId]);
            return NextResponse.json({
                success: true,
                message: 'Customization deleted successfully'
            });
        }

        return NextResponse.json({
            success: false,
            message: 'Invalid type specified'
        }, { status: 400 });

    } catch (error) {
        console.error('Error deleting map data:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to delete map data',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
