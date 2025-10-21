'use server';

import { redirect } from 'next/navigation';
import { deleteSession } from './auth-actions';
import { signOut } from 'firebase/auth';
import { useFirebase } from '@/firebase';


export async function logout() {
  await deleteSession();
  redirect('/login');
}
