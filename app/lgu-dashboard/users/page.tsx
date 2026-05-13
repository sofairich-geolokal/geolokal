import UserManagement from "../../components/lguDashboard/users";
import { requireLguRole } from '@/lib/auth';

export default async function UsersPage() {
  // Check authentication - will redirect to login if not authenticated or not LGU user
  await requireLguRole();

  return(
    <div className=" h-auto h-full" >
      <UserManagement />
    </div>
  )
}