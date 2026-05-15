import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { query } from '@/lib/db';

// Define the interface for the user object returned by your database
interface UserData {
  id: string;
  username: string;
  email: string;
  role: string;
  lgu_id: string;
  lgu_name: string | null;
  province: string | null;
  province_display: string;
  city_display: string;
  location?: string;
}

/**
 * Gets the current authenticated user ID from cookies
 */
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

/**
 * Fetches detailed user data from the database
 */
export async function getUserData(userId: string): Promise<UserData | null> {
  try {
    // Optimized query - fetch essential fields without JOIN for faster performance
    const result = (await query(
      `SELECT u.id, u.username, u.email, u.role, u.lgu_id
        FROM users u 
        WHERE u.id = $1`,
      [userId]
    )) as { rows: UserData[] };
    
    const user = result.rows[0] || null;
    
    if (user) {
      // Set default values for location fields
      user.lgu_name = null;
      user.province = null;
      user.province_display = 'Batangas';
      user.city_display = 'Ibaan';
      user.location = `${user.province_display}, ${user.city_display}`;
    }
    
    return user;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
}

/**
 * Middleware-like function to ensure a user is logged in
 */
export async function requireAuth() {
  const userId = await getAuthUser();
  
  if (!userId) {
    redirect('/');
  }
  
  return userId;
}

/**
 * Ensures user has LGU access and is not a 'viewer'
 * Superadmin is also allowed to access LGU dashboard
 */
export async function requireLguRole() {
  const userId = await getAuthUser();
  
  if (!userId) {
    redirect('/');
  }
  
  const user = await getUserData(userId);
  
  if (!user || user.role.toLowerCase() === 'viewer') {
    redirect('/');
  }
  
  // Allow both LGU users and superadmin to access LGU dashboard
  return user;
}

/**
 * Ensures user is a Superadmin
 */
export async function requireSuperadminRole() {
  const userId = await getAuthUser();
  
  if (!userId) {
    redirect('/');
  }
  
  const user = await getUserData(userId);
  
  if (!user || user.role.toLowerCase() !== 'superadmin') {
    redirect('/');
  }
  
  return user;
}

/**
 * Simple check for authentication status
 */
export async function isAuthenticated() {
  const userId = await getAuthUser();
  return !!userId;
}