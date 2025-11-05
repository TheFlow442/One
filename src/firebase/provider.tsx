
'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Database } from 'firebase/database';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener'

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  database: Database;
  auth: Auth;
}

// Internal state for user authentication
interface UserAuthState {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// Combined state for the Firebase context
export interface FirebaseContextState {
  areServicesAvailable: boolean;
  areServicesLoading: boolean;
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  database: Database | null;
  auth: Auth | null;
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// Return type for useFirebase()
export interface FirebaseServicesAndUser {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  database: Database;
  auth: Auth;
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
  areServicesLoading: boolean;
}

// Return type for useUser() - specific to user auth state
export interface UserHookResult {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// React Context
export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

const createUserProfileDocument = async (firestore: Firestore, user: User) => {
    const userRef = doc(firestore, 'users', user.uid);
    const userProfile = {
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      createdAt: serverTimestamp(),
    };
    // Use setDoc with merge: true to create or update the document
    await setDoc(userRef, userProfile, { merge: true });
};

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  database,
  auth,
}) => {
  const [userAuthState, setUserAuthState] = useState<UserAuthState>({
    user: null,
    isUserLoading: true,
    userError: null,
  });

  const areServicesAvailable = !!(firebaseApp && firestore && auth && database);
  const [areServicesLoading, setAreServicesLoading] = useState(!areServicesAvailable);

  useEffect(() => {
    if (areServicesAvailable) {
      setAreServicesLoading(false);
    }
  }, [areServicesAvailable]);

  useEffect(() => {
    if (!auth || !firestore) {
      setUserAuthState({ user: null, isUserLoading: false, userError: new Error("Auth or Firestore service not provided.") });
      return;
    }

    setUserAuthState({ user: auth.currentUser, isUserLoading: true, userError: null });

    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        if (firebaseUser) {
            createUserProfileDocument(firestore, firebaseUser).catch(console.error);
        }
        setUserAuthState({ user: firebaseUser, isUserLoading: false, userError: null });
      },
      (error) => {
        console.error("FirebaseProvider: onAuthStateChanged error:", error);
        setUserAuthState({ user: null, isUserLoading: false, userError: error });
      }
    );
    return () => unsubscribe();
  }, [auth, firestore]);

  const contextValue = useMemo((): FirebaseContextState => ({
    areServicesAvailable,
    areServicesLoading,
    firebaseApp: areServicesAvailable ? firebaseApp : null,
    firestore: areServicesAvailable ? firestore : null,
    database: areServicesAvailable ? database : null,
    auth: areServicesAvailable ? auth : null,
    user: userAuthState.user,
    isUserLoading: userAuthState.isUserLoading,
    userError: userAuthState.userError,
  }), [areServicesAvailable, areServicesLoading, firebaseApp, firestore, database, auth, userAuthState]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = (): FirebaseServicesAndUser => {
  const context = useContext(FirebaseContext);

  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }
  
  if (!context.areServicesAvailable || !context.firebaseApp || !context.firestore || !context.auth || !context.database) {
    if (context.areServicesLoading) {
      // This is a valid state during initialization, return a loading state.
      // Components should check areServicesLoading.
    } else {
      throw new Error('Firebase core services not available. This is likely a race condition during initialization. Please try refreshing the page.');
    }
  }

  return {
    firebaseApp: context.firebaseApp as FirebaseApp,
    firestore: context.firestore as Firestore,
    database: context.database as Database,
    auth: context.auth as Auth,
    user: context.user,
    isUserLoading: context.isUserLoading,
    userError: context.userError,
    areServicesLoading: context.areServicesLoading,
  };
};

export const useAuth = (): Auth => {
  const { auth, areServicesLoading } = useFirebase();
  if (areServicesLoading) {
    // This is tricky. Returning null is what caused issues.
    // For now, the component logic using this must handle the loading state.
  }
  return auth;
};

export const useFirestore = (): Firestore => {
  const { firestore, areServicesLoading } = useFirebase();
   if (areServicesLoading) {
    // This is tricky. Returning null is what caused issues.
  }
  return firestore;
};

export const useDatabase = (): Database => {
  const { database, areServicesLoading } = useFirebase();
   if (areServicesLoading) {
    // This is tricky. Returning null is what caused issues.
  }
  return database;
};

export const useFirebaseApp = (): FirebaseApp => {
  const { firebaseApp } = useFirebase();
  return firebaseApp;
};

type MemoFirebase <T> = T & {__memo?: boolean};

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T | (MemoFirebase<T>) {
  const memoized = useMemo(factory, deps);
  
  if(typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;
  
  return memoized;
}

export const useUser = (): UserHookResult => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a FirebaseProvider.');
  }
  return { 
    user: context.user, 
    isUserLoading: context.isUserLoading, 
    userError: context.userError 
  };
};
