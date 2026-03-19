'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { query } from '@/lib/db';

export async function login(username: string, password: string, selectedCityId?: string) {
  try {
    // 1. Fetch User
    const result = await query(
      'SELECT id, username, lgu_id, password_hash, role FROM users WHERE username = $1',
      [username]
    );
    
    const user = result.rows[0];
    
    if (!user) {
      return { success: false, error: 'User not found.' };
    }

    // 2. Password Comparison (Plain text as per your current setup)
    if (user.password_hash !== password) {
      return { success: false, error: 'Incorrect password.' };
    }

    // 3. For Viewer role, update their lgu_id with selected city if provided
    let finalLguId = user.lgu_id;
    if (user.role === 'Viewer' && selectedCityId) {
      // Update the user's lgu_id with the selected city
      await query(
        'UPDATE users SET lgu_id = $1 WHERE id = $2',
        [selectedCityId, user.id]
      );
      finalLguId = selectedCityId;
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
    
    // Ensure all returned values are strings/primitives
    return { 
      success: true, 
      user: { 
        id: String(user.id), 
        username: user.username, 
        lgu_id: String(finalLguId || ''),
        role: user.role || 'Viewer'
      } 
    };

  } catch (error: any) {
    // This logs the specific DB error to your SERVER console (Terminal)
    console.error('SERVER AUTH ERROR:', error.message);
    return { success: false, error: 'Database connection failed. Please try again later.' };
  }
}

export async function logout() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('auth_token');
  } catch (error: any) {
    console.error('LOGOUT ERROR:', error.message);
  }
  redirect('/lgu-login');
}