import { NextRequest, NextResponse } from 'next/server';
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: { rejectUnauthorized: false }
});

// GET - Fetch saved maps for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const mapId = searchParams.get('id');

    if (mapId) {
      // Fetch specific saved map
      const result = await pool.query(`
        SELECT sm.*, u.username, u.email 
        FROM saved_maps sm 
        LEFT JOIN users u ON sm.user_id = u.id 
        WHERE sm.id = $1
      `, [parseInt(mapId)]);

      if (result.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Saved map not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: result.rows[0],
      });
    }

    if (userId) {
      // Fetch all saved maps for a user
      const result = await pool.query(`
        SELECT sm.*, u.username, u.email 
        FROM saved_maps sm 
        LEFT JOIN users u ON sm.user_id = u.id 
        WHERE sm.user_id = $1 
        ORDER BY sm.created_at DESC
      `, [parseInt(userId)]);

      return NextResponse.json({
        success: true,
        data: result.rows,
        count: result.rows.length,
      });
    }

    return NextResponse.json(
      { success: false, error: 'User ID or Map ID is required' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error fetching saved maps:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch saved maps' },
      { status: 500 }
    );
  }
}

// POST - Save a new map configuration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      user_id,
      map_name,
      map_description,
      map_config,
      basemap,
      center_lat,
      center_lng,
      zoom_level,
      layers_config,
      is_public,
    } = body;

    // Validate required fields
    if (!user_id || !map_name || !map_config) {
      return NextResponse.json(
        { success: false, error: 'User ID, map name, and map config are required' },
        { status: 400 }
      );
    }

    const result = await pool.query(`
      INSERT INTO saved_maps (
        user_id, map_name, map_description, map_config, basemap, 
        center_lat, center_lng, zoom_level, layers_config, is_public
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      parseInt(user_id),
      map_name,
      map_description || '',
      JSON.stringify(map_config),
      basemap || 'Open Street Map',
      center_lat ? parseFloat(center_lat) : 13.4124,
      center_lng ? parseFloat(center_lng) : 122.5619,
      zoom_level ? parseInt(zoom_level) : 6,
      JSON.stringify(layers_config || {}),
      is_public !== undefined ? is_public : false
    ]);

    // Get user info for the response
    const userResult = await pool.query(
      'SELECT id, username, email FROM users WHERE id = $1',
      [parseInt(user_id)]
    );

    const savedMap = result.rows[0];
    savedMap.users = userResult.rows[0] || null;

    return NextResponse.json({
      success: true,
      data: savedMap,
      message: 'Map saved successfully',
    });
  } catch (error) {
    console.error('Error saving map:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save map' },
      { status: 500 }
    );
  }
}

// PUT - Update an existing saved map
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Map ID is required' },
        { status: 400 }
      );
    }

    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    if (updateData.user_id !== undefined) {
      updateFields.push(`user_id = $${paramIndex++}`);
      values.push(parseInt(updateData.user_id));
    }
    if (updateData.map_name !== undefined) {
      updateFields.push(`map_name = $${paramIndex++}`);
      values.push(updateData.map_name);
    }
    if (updateData.map_description !== undefined) {
      updateFields.push(`map_description = $${paramIndex++}`);
      values.push(updateData.map_description);
    }
    if (updateData.map_config !== undefined) {
      updateFields.push(`map_config = $${paramIndex++}`);
      values.push(JSON.stringify(updateData.map_config));
    }
    if (updateData.basemap !== undefined) {
      updateFields.push(`basemap = $${paramIndex++}`);
      values.push(updateData.basemap);
    }
    if (updateData.center_lat !== undefined) {
      updateFields.push(`center_lat = $${paramIndex++}`);
      values.push(parseFloat(updateData.center_lat));
    }
    if (updateData.center_lng !== undefined) {
      updateFields.push(`center_lng = $${paramIndex++}`);
      values.push(parseFloat(updateData.center_lng));
    }
    if (updateData.zoom_level !== undefined) {
      updateFields.push(`zoom_level = $${paramIndex++}`);
      values.push(parseInt(updateData.zoom_level));
    }
    if (updateData.layers_config !== undefined) {
      updateFields.push(`layers_config = $${paramIndex++}`);
      values.push(JSON.stringify(updateData.layers_config));
    }
    if (updateData.is_public !== undefined) {
      updateFields.push(`is_public = $${paramIndex++}`);
      values.push(updateData.is_public);
    }

    updateFields.push(`updated_at = NOW()`);
    values.push(parseInt(id));

    const result = await pool.query(`
      UPDATE saved_maps 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `, values);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Saved map not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'Map updated successfully',
    });
  } catch (error) {
    console.error('Error updating saved map:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update saved map' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a saved map
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Map ID is required' },
        { status: 400 }
      );
    }

    const result = await pool.query('DELETE FROM saved_maps WHERE id = $1 RETURNING *', [parseInt(id)]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Saved map not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Saved map deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting saved map:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete saved map' },
      { status: 500 }
    );
  }
}
