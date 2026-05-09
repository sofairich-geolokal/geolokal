import { redirect } from 'next/navigation';
import { getAuthUser, getUserData } from '@/lib/auth';
import Sidebar from '@/app/components/lguDashboard/Sidebar';

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
  
  // For non-superadmin users, show normal dashboard
  return (
    <div className="flex">
      <Sidebar />
    </div>
  );
}