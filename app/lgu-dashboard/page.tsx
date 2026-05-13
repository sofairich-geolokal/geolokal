import { redirect } from 'next/navigation';
import { getAuthUser, getUserData } from '@/lib/auth';

export default async function LGUDashboard() {
  // Check if user is authenticated
  const userId = await getAuthUser();
  
  if (userId) {
    // Get user data to check role
    const user = await getUserData(userId);
    
    // If superadmin, redirect to users page
    if (user && user.role.toLowerCase() === 'superadmin') {
      redirect('/lgu-dashboard/users');
    }
  }
  
  // For non-superadmin users, show welcome message
  // The layout already provides the sidebar structure
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Welcome to LGU Dashboard</h1>
      <p className="text-gray-600">Select a menu item from the sidebar to get started.</p>
    </div>
  );
}