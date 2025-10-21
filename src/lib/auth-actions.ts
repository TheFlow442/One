
'use server';

import { cookies } from 'next/headers';
import * as admin from 'firebase-admin';

const SESSION_COOKIE_NAME = '__session';

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

export async function createSession(idToken: string) {
  initializeAdmin();
  const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

  try {
    const sessionCookie = await admin.auth().createSessionCookie(idToken, { expiresIn });
    cookies().set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: expiresIn,
      path: '/',
    });
  } catch (error) {
    console.error('Failed to create session cookie:', error);
    // Re-throw or handle the error as needed. For now, we'll just log it.
    // In a real app, you might want to return an error response.
    throw new Error('Session creation failed');
  }
}

export async function deleteSession() {
    cookies().delete(SESSION_COOKIE_NAME);
}
