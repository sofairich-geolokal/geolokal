import { logout } from '@/app/actions/auth';

export const dynamic = 'force-dynamic';

export default async function LogoutPage() {
  await logout();
  return null;
}
