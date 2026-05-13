'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { query } from '@/lib/db';

// Interface to fix the 'unknown' type error for the database result
interface UserLoginResult {
  id: string | number;
  username: string;
  lgu_id: string | null;
  password_hash: string;
  role: string;
}

export async function login(
  username: string, 
  password: string, 
  selectedCityId?: string, 
  targetDashboard?: 'lgu' | 'viewer' | 'superadmin'
) {
  try {
    // 1. Fetch User (Explicitly typed as UserLoginResult)
    const result = (await query(
      'SELECT id, username, lgu_id, password_hash, role FROM users WHERE username = $1 LIMIT 1',
      [username]
    )) as { rows: UserLoginResult[] };
    
    const user = result.rows[0];
    
    if (!user) {
      console.log(' USER NOT FOUND for username:', username);
      return { success: false, error: 'User not found.' };
    }

    // 2. Password Comparison (Plain text as per your setup)
    if (user.password_hash !== password) {
      return { success: false, error: 'Incorrect password.' };
    }

    // 3. Role validation for target dashboard
    if (targetDashboard) {
      const userRole = user.role.toLowerCase();
      if (targetDashboard === 'lgu' && userRole === 'viewer') {
        return { success: false, error: 'Viewer role cannot access LGU dashboard.' };
      }
      if (targetDashboard === 'viewer' && userRole !== 'viewer') {
        return { success: false, error: 'Only viewer role can access viewer dashboard.' };
      }
      if (targetDashboard === 'superadmin' && userRole !== 'superadmin') {
        return { success: false, error: 'Only superadmin role can access superadmin dashboard.' };
      }
    }

    // 4. Update viewer info if applicable
    let finalLguId = user.lgu_id;
    let finalLocation = null;
    
    if (user.role.toLowerCase() === 'viewer' && selectedCityId) {
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
    
    // 5. Generate Token & Set Cookie
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
    return { success: false, error: 'An error occurred during login.' };
  }
}

/**
 * Standard logout - Redirects to main page
 */
export async function logout() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('auth_token');
  } catch (error: any) {
    console.error('LOGOUT ERROR:', error.message);
  }
  redirect('/');
}

/**
 * LGU logout - Now redirects to main page
 */
export async function logoutLgu() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('auth_token');
  } catch (error: any) {
    console.error('LOGOUT ERROR:', error.message);
  }
  redirect('/');
}

/**
 * Superadmin logout - Now redirects to main page
 */
export async function logoutSuperadmin() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('auth_token');
  } catch (error: any) {
    console.error('LOGOUT ERROR:', error.message);
  }
  redirect('/');
}