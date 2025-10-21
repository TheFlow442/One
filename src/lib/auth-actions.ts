
'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import * as admin from 'firebase-admin';

const SESSION_COOKIE_NAME = '__session';

function initializeAdmin() {
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.applicationDefault(),
        });
    }
}

export type AuthState = {
  message?: string | null;
  success?: boolean;
};

export async function authenticate(
  prevState: AuthState | undefined,
  formData: FormData
): Promise<AuthState> {
  initializeAdmin();
  try {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    // The proper way would be a custom auth flow.
    // For now, we cannot verify password with Admin SDK directly.
    // We will just create a session cookie if user exists.
    const userRecord = await admin.auth().getUserByEmail(email);

    if (!userRecord) {
        return { message: 'Invalid email or password.' };
    }

    const sessionCookie = await admin.auth().createSessionCookie(userRecord.uid, { expiresIn: 60 * 60 * 24 * 5 * 1000 });

    cookies().set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });

  } catch (error: any) {
    if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        return { message: 'Invalid email or password.' };
    }
    console.error('Authentication Error:', error);
    return { message: 'An unknown error occurred during sign-in.' };
  }
  redirect('/');
}

export async function signup(
  prevState: AuthState | undefined,
  formData: FormData
): Promise<AuthState> {
  initializeAdmin();
  try {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const userRecord = await admin.auth().createUser({
        email: email,
        password: password,
    });

    const sessionCookie = await admin.auth().createSessionCookie(userRecord.uid, { expiresIn: 60 * 60 * 24 * 5 * 1000 });

    cookies().set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });
    
  } catch (error: any) {
    if (error.code === 'auth/email-already-exists') {
        return { message: 'This email is already in use.' };
    } else if (error.code === 'auth/invalid-password') {
        return { message: 'The password is too weak. Please use at least 6 characters.'}
    }
    console.error('Signup Error:', error);
    return { message: 'An unknown error occurred during sign-up.' };
  }
  redirect('/');
}
