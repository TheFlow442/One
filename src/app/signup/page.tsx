'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useAuth, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { createSession } from '@/lib/auth-actions';
import { useRouter } from 'next/navigation';
import { doc, setDoc } from 'firebase/firestore';


export default function SignupPage() {
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();

  const handleSubmit = async (formData: FormData) => {
    setErrorMessage(undefined);
    if (!auth || !firestore) {
        setErrorMessage('Firebase is not ready. Please wait a moment and try again.');
        return;
    }

    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
        setErrorMessage('Email and password are required.');
        return;
    }
    if (password.length < 6) {
        setErrorMessage('Password must be at least 6 characters long.');
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Create user document in Firestore
        const userRef = doc(firestore, 'users', user.uid);
        // Using await here to ensure document is created before session
        await setDoc(userRef, {
            id: user.uid,
            email: user.email
        }, { merge: true });

        const idToken = await user.getIdToken();
        await createSession(idToken);
        router.push('/dashboard');
    } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
            setErrorMessage('This email is already in use.');
        } else if (error.code === 'auth/weak-password') {
            setErrorMessage('The password is too weak. Please use at least 6 characters.');
        } else {
            console.error('Signup Error:', error);
            setErrorMessage('An unknown error occurred during sign-up.');
        }
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign Up</CardTitle>
          <CardDescription>Create an account to get started.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                name="email"
                placeholder="m@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" name="password" required minLength={6} />
            </div>
            {errorMessage && (
              <div className="text-sm text-red-500">
                {errorMessage}
              </div>
            )}
            <SignUpButton />
            <Button variant="outline" className="w-full" asChild>
                <Link href="/login">
                    Already have an account? Sign In
                </Link>
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

function SignUpButton() {
  const { pending } = useFormStatus();
  const auth = useAuth();
  return (
    <Button className="w-full" type="submit" aria-disabled={pending || !auth} disabled={pending || !auth}>
      {pending ? 'Creating Account...' : 'Sign Up'}
    </Button>
  );
}
