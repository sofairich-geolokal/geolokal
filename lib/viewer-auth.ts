import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getUserData } from '@/lib/auth';

export async function requireViewerRole() {
  const userId = await getAuthUser();
  
  if (!userId) {
    redirect('/viewerDashboard/viewerlogin');
  }
  
  const user = await getUserData(userId);
  
  if (!user || user.role.toLowerCase() !== 'viewer') {
    redirect('/viewerDashboard/viewerlogin');
  }
  
  return user;
}

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

  return tokenParts[1];
}
