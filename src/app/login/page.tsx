
'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useAuth, useUser, useFirebase } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { createSession } from '@/lib/auth-actions';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const auth = useAuth();
  const router = useRouter();

  const handleSubmit = async (formData: FormData) => {
    setErrorMessage(undefined);

    if (!auth) {
        setErrorMessage('Authentication service is not available. Please try again later.');
        return;
    }

    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
        setErrorMessage('Email and password are required.');
        return;
    }

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const idToken = await userCredential.user.getIdToken();
        await createSession(idToken);
        router.push('/dashboard');
    } catch (error: any) {
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            setErrorMessage('Invalid email or password.');
        } else if (error.code === 'auth/operation-not-allowed') {
            setErrorMessage('Sign-in with email and password is not enabled for this project. Please enable it in the Firebase console.');
        } else {
            console.error('Login Error:', error);
            setErrorMessage('An unknown error occurred during sign-in.');
        }
    }
  };


  return (
    <main className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>Enter your credentials to access your dashboard.</CardDescription>
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
              <Input id="password" type="password" name="password" required />
            </div>
            {errorMessage && (
              <div className="text-sm text-red-500">
                {errorMessage}
              </div>
            )}
            <LoginButton />
             <Button variant="outline" className="w-full" asChild>
                <Link href="/signup">
                    Don't have an account? Sign Up
                </Link>
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

function LoginButton() {
  const { pending } = useFormStatus();
  const { isUserLoading } = useUser();
  const { areServicesLoading } = useFirebase();
  const isDisabled = pending || isUserLoading || areServicesLoading;

  return (
    <Button className="w-full" type="submit" aria-disabled={isDisabled} disabled={isDisabled}>
      {pending ? 'Signing In...' : 'Sign In'}
    </Button>
  );
}

    