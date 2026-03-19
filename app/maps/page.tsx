import { requireAuth } from '@/lib/auth';

export default async function MapsPage() {
  // Check authentication - will redirect to login if not authenticated
  await requireAuth();

  return (
    <div>
      <h1>Maps</h1>
    </div>
  );
}