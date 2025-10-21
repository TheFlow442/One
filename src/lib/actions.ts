'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'volta_view_session';

export async function logout() {
  cookies().delete(SESSION_COOKIE_NAME);
  redirect('/');
}
