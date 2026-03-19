import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { query } from '@/lib/db';

export async function getAuthUser() {
  const cookieStore = await cookies();
  const authToken = cookieStore.get('auth_token')?.value;
  
  if (!authToken) {
    return null;
  }

  // Extract user ID from token (format: token_{userId}_{timestamp})
  const tokenParts = authToken.split('_');
  if (tokenParts.length !== 3 || tokenParts[0] !== 'token') {
    return null;
  }

  const userId = tokenParts[1];
  return userId;
}

export async function getUserData(userId: string) {
  try {
    const result = await query(
      `SELECT u.id, u.username, u.email, u.role, u.lgu_id, c.name as lgu_name, c.province, 
       COALESCE(c.province, 'Batangas') as province_display,
       COALESCE(c.name, 'Ibaan') as city_display
       FROM users u 
       LEFT JOIN city_muni_master c ON u.lgu_id = c.id 
       WHERE u.id = $1`,
      [userId]
    );
    
    const user = result.rows[0] || null;
    
    // Format location string as "Batangas, Ibaan"
    if (user) {
      user.location = `${user.province_display}, ${user.city_display}`;
    }
    
    return user;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
}

export async function requireAuth() {
  const userId = await getAuthUser();
  
  if (!userId) {
    redirect('/lgu-login');
  }
  
  return userId;
}

export async function isAuthenticated() {
  const userId = await getAuthUser();
  return !!userId;
}
