import UserManagement from "../../components/lguDashboard/users";
import { requireAuth } from '@/lib/auth';

export default async function UsersPage() {
  // Check authentication - will redirect to login if not authenticated
  await requireAuth();

  return(
    <div className=" h-auto h-full" >
      <UserManagement />
    </div>
  )
}