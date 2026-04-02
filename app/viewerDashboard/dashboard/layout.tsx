import { requireViewerRole } from '@/lib/viewer-auth';

export default async function ViewerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Enforce viewer role authentication
  const user = await requireViewerRole();
  
  return <>{children}</>;
}
