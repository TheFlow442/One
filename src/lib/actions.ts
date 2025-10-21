'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = '__session';

export async function logout() {
  cookies().delete(SESSION_COOKIE_NAME);
  redirect('/login');
}
