
'use client';

import { useState, useEffect } from 'react';
import { ref, onValue, off, DatabaseReference, DataSnapshot } from 'firebase/database';
import { useDatabase } from '@/firebase/provider';

export interface UseRtdbValueResult<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * React hook to subscribe to a Firebase Realtime Database path.
 *
 * @template T The expected type of the data at the specified path.
 * @param {string | null | undefined} path The path to the data in the Realtime Database.
 * @returns {UseRtdbValueResult<T>} An object containing the data, loading state, and error.
 */
export function useRtdbValue<T = any>(
  path: string | null | undefined
): UseRtdbValueResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const database = useDatabase();

  useEffect(() => {
    if (!path || !database) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const dbRef: DatabaseReference = ref(database, path);

    const listener = onValue(
      dbRef,
      (snapshot: DataSnapshot) => {
        if (snapshot.exists()) {
          setData(snapshot.val() as T);
        } else {
          setData(null);
        }
        setIsLoading(false);
      },
      (error: Error) => {
        console.error(`RTDB listener error at path: ${path}`, error);
        setError(error);
        setIsLoading(false);
      }
    );

    // Cleanup function to remove the listener when the component unmounts or path changes.
    return () => {
      off(dbRef, 'value', listener);
    };
  }, [path, database]);

  return { data, isLoading, error };
}
