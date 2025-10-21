
'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import * as admin from 'firebase-admin';

const SESSION_COOKIE_NAME = '__session';

// Helper function to initialize Firebase Admin SDK safely.
function initializeAdmin() {
  if (!admin.apps.length) {
    try {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
    } catch (e) {
      console.error('Firebase Admin initialization error:', e);
    }
  }
}

export type AuthState = string | undefined;

// This function is insecure and is for demonstration purposes only in a dev environment.
// It bypasses password checking. In a real app, you would get an ID token from
// the client, send it to the server, and then create a session cookie.
async function createSessionForUser(uid: string) {
    initializeAdmin();
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await admin.auth().createSessionCookie(uid, { expiresIn });

    cookies().set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: expiresIn,
      path: '/',
    });
}


export async function authenticate(
  prevState: AuthState | undefined,
  formData: FormData
): Promise<AuthState> {
  initializeAdmin();
  try {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const userRecord = await admin.auth().getUserByEmail(email);

    // INSECURE: This flow is for demonstration. It doesn't verify the password.
    // A proper flow would involve the client signing in, getting an ID token,
    // and sending that to the server.
    if (userRecord) {
        await createSessionForUser(userRecord.uid);
    } else {
        return 'Invalid email or password.';
    }

  } catch (error: any) {
    if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        return 'Invalid email or password.';
    }
    console.error('Authentication Error:', error);
    return 'An unknown error occurred during sign-in.';
  }
  redirect('/dashboard');
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
    
    await createSessionForUser(userRecord.uid);
    
  } catch (error: any) {
    if (error.code === 'auth/email-already-exists') {
        return 'This email is already in use.';
    } else if (error.code === 'auth/weak-password') {
        return 'The password is too weak. Please use at least 6 characters.';
    }
    console.error('Signup Error:', error);
    return 'An unknown error occurred during sign-up.';
  }
  redirect('/dashboard');
}
