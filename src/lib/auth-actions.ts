'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { initializeApp, getApps, FirebaseError } from 'firebase/app';

const SESSION_COOKIE_NAME = 'volta_view_session';

const firebaseConfig = process.env.NEXT_PUBLIC_FIREBASE_CONFIG ? JSON.parse(process.env.NEXT_PUBLIC_FIREBASE_CONFIG) : undefined;

function getFirebaseAuth() {
  if (!firebaseConfig) {
    throw new Error("Firebase config is not available. Make sure NEXT_PUBLIC_FIREBASE_CONFIG is set in your environment variables.");
  }
  if (!getApps().length) {
    initializeApp(firebaseConfig);
  }
  return getAuth();
}

export type AuthState = {
  message?: string | null;
  success?: boolean;
};

export async function authenticate(
  prevState: AuthState | undefined,
  formData: FormData
): Promise<AuthState> {
  const auth = getFirebaseAuth();
  try {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const idToken = await userCredential.user.getIdToken();

    cookies().set(SESSION_COOKIE_NAME, idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });

  } catch (error: any) {
    if (error instanceof FirebaseError) {
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
          return { message: 'Invalid email or password.' };
        }
    }
    return { message: 'An unknown error occurred.' };
  }
  redirect('/dashboard');
}

export async function signup(
  prevState: AuthState | undefined,
  formData: FormData
): Promise<AuthState> {
  const auth = getFirebaseAuth();
  try {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const idToken = await userCredential.user.getIdToken();

    cookies().set(SESSION_COOKIE_NAME, idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });
    
  } catch (error: any) {
    if (error instanceof FirebaseError) {
        if (error.code === 'auth/email-already-in-use') {
            return { message: 'This email is already in use.' };
        } else if (error.code === 'auth/weak-password') {
            return { message: 'The password is too weak. Please use at least 6 characters.'}
        }
    }
    return { message: 'An unknown error occurred during sign-up.' };
  }
  redirect('/dashboard');
}
