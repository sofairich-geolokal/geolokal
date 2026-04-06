'use client';

import { logoutSuperadmin } from '@/app/actions/auth';

export default function SuperadminLogout() {
  return (
    <form action={logoutSuperadmin} className="px-0 pb-0">
      <button 
        type="submit"
        className="w-full bg-[#ef4444] h-12 rounded-xl 
        transition-all hover:scale-[1.02] 
        active:scale-95 text-white font-bold"
      >
        Logout
      </button>
    </form>
  );
}
