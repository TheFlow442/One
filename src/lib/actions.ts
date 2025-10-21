
'use server';

import { redirect } from 'next/navigation';
import { deleteSession } from './auth-actions';


export async function logout() {
  await deleteSession();
  redirect('/login');
}
