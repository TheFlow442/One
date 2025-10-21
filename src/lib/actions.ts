'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'volta_view_session';

export type State = {
  message?: string | null;
};

export async function authenticate(
  prevState: State | undefined,
  formData: FormData
): Promise<State> {
  const adminKey = formData.get('key') as string;
  const expectedKey = process.env.ADMIN_KEY || '1250solaradmin';

  if (adminKey === expectedKey) {
    const cookieStore = cookies();
    cookieStore.set(SESSION_COOKIE_NAME, 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });
    redirect('/dashboard');
  } else {
    return { message: 'Invalid admin key. Please try again.' };
  }
}

export async function logout() {
  const cookieStore = cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect('/');
}
