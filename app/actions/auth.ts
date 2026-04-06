'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { query } from '@/lib/db';

export async function login(username: string, password: string, selectedCityId?: string, targetDashboard?: 'lgu' | 'viewer' | 'superadmin') {
  try {
    console.log(' LOGIN ATTEMPT:', { username, selectedCityId, targetDashboard });
    
    // 1. Fetch User
    const result = await query(
      'SELECT id, username, lgu_id, password_hash, role FROM users WHERE username = $1',
      [username]
    );
    
    console.log(' DB QUERY RESULT:', result.rows);
    
    const user = result.rows[0];
    
    if (!user) {
      console.log(' USER NOT FOUND for username:', username);
      return { success: false, error: 'User not found.' };
    }

    // 2. Password Comparison (Plain text as per current setup)
    if (user.password_hash !== password) {
      return { success: false, error: 'Incorrect password.' };
    }

    // 3. Role validation for target dashboard
    if (targetDashboard) {
      if (targetDashboard === 'lgu' && user.role.toLowerCase() === 'viewer') {
        return { success: false, error: 'Viewer role cannot access LGU dashboard.' };
      }
      if (targetDashboard === 'viewer' && user.role.toLowerCase() !== 'viewer') {
        return { success: false, error: 'Only viewer role can access viewer dashboard.' };
      }
      if (targetDashboard === 'superadmin' && user.role.toLowerCase() !== 'superadmin') {
        return { success: false, error: 'Only superadmin role can access superadmin dashboard.' };
      }
    }

    // 4. For viewer role, update their lgu_id and location with selected city if provided
    // Note: Database uses mixed case roles ('Viewer', 'lgu')
    let finalLguId = user.lgu_id;
    let finalLocation = null;
    
    if (user.role.toLowerCase() === 'viewer' && selectedCityId) {
      // Map city ID to location name
      const locationMap: { [key: string]: string } = {
        '1': 'Ibaan, Batangas',
        '2': 'Teresa, Rizal', 
        '3': 'Binangonan, Rizal'
      };
      
      const locationName = locationMap[selectedCityId] || 'Ibaan, Batangas';
      
      await query(
        'UPDATE users SET lgu_id = $1, location = $2 WHERE id = $3',
        [selectedCityId, locationName, user.id]
      );
      finalLguId = selectedCityId;
      finalLocation = locationName;
    }
    
    // 4. Generate Token & Set Cookie
    const authToken = `token_${user.id}_${Date.now()}`;
    const cookieStore = await cookies();
    
    cookieStore.set('auth_token', authToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    
    return { 
      success: true, 
      user: { 
        id: String(user.id), 
        username: user.username, 
        lgu_id: String(finalLguId || ''),
        location: finalLocation,
        role: user.role || 'viewer'
      } 
    };

  } catch (error: any) {
    console.error('SERVER AUTH ERROR:', error.message);
    console.error('FULL ERROR:', error);
    
    // Provide more specific error messages
    if (error.message.includes('ECONNREFUSED') || error.message.includes('connect')) {
      return { success: false, error: 'Database connection failed. Please try again later.' };
    } else if (error.message.includes('password')) {
      return { success: false, error: 'Authentication failed. Please check your credentials.' };
    } else if (error.message.includes('user')) {
      return { success: false, error: 'User not found. Please check your username.' };
    } else {
      return { success: false, error: `Login error: ${error.message}` };
    }
  }
}

export async function logout() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('auth_token');
  } catch (error: any) {
    console.error('LOGOUT ERROR:', error.message);
  }
  redirect('/viewerDashboard/viewerlogin');
}

export async function logoutLgu() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('auth_token');
  } catch (error: any) {
    console.error('LOGOUT ERROR:', error.message);
  }
  redirect('/lgu-dashboard/login');
}

export async function logoutSuperadmin() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('auth_token');
  } catch (error: any) {
    console.error('LOGOUT ERROR:', error.message);
  }
  redirect('/superadmin/login');
}