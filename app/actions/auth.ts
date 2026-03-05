// app/actions/auth.ts
'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function logout() {
  const cookieStore = await cookies();
  
  // 1. Delete your session/auth cookie
  cookieStore.delete('auth_token'); 
  
  // 2. Redirect the user to the login page
  redirect('/login');
}