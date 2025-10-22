
'use client';

import { useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useFirebase, useUser } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { doc } from 'firebase/firestore';
import { Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';


const ADMIN_EMAIL = 'admin@volta.view';
const ADMIN_PASSWORD = 'verylongandsecurepassword'; // This is a placeholder and not used for login, but required for account creation.

export default function SignupPage() {
  const { auth, firestore, areServicesLoading } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();

  // Correctly handle the side effect of creating an admin user.
  useEffect(() => {
    const handleCreateAdmin = async () => {
        if (areServicesLoading || !auth) return;
        try {
            // This will only create the user if they don't already exist.
            // It will fail silently if the user exists, which is fine for this purpose.
            await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
        } catch (error: any) {
            if (error.code !== 'auth/email-already-in-use') {
                console.error("Could not ensure admin account exists:", error);
            }
        }
    }
    handleCreateAdmin();
  }, [auth, areServicesLoading]);


  const handleSubmit = async (formData: FormData) => {
    if (areServicesLoading || !auth || !firestore) {
      toast({
        title: 'Error',
        description: 'Authentication service is not ready. Please wait a moment and try again.',
        variant: 'destructive',
      });
      return;
    }

    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
        toast({
            title: 'Sign Up Failed',
            description: 'Email and password are required.',
            variant: 'destructive',
        });
        return;
    }
    if (password.length < 6) {
        toast({
            title: 'Sign Up Failed',
            description: 'Password must be at least 6 characters long.',
            variant: 'destructive',
        });
        return;
    }
    
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Create user document in Firestore using the non-blocking helper
        const userRef = doc(firestore, 'users', user.uid);
        setDocumentNonBlocking(userRef, {
            id: user.uid,
            email: user.email
        }, { merge: true });

        toast({
            title: 'Sign Up Successful',
            description: 'You can now sign in with your new account.',
        });
        router.push('/login');

    } catch (error: any) {
        let description = 'An unknown error occurred during sign-up.';
        if (error.code === 'auth/email-already-in-use') {
            description = 'This email is already in use.';
        } else if (error.code === 'auth/weak-password') {
            description = 'The password is too weak. Please use at least 6 characters.';
        }
        console.error('Signup Error:', error);
        toast({
            title: 'Sign Up Failed',
            description,
            variant: 'destructive',
        });
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="flex items-center gap-2 mb-4">
            <Zap className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-primary">VoltaView</h1>
      </div>
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
                placeholder="name@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" name="password" required minLength={6} />
            </div>
            <SignUpButton />
            <div className="text-center text-sm">
                Already have an account?{' '}
                <Link href="/login" className="text-primary hover:underline">
                    Sign In
                </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

function SignUpButton() {
  const { pending } = useFormStatus();
  const { isUserLoading } = useUser();
  const { areServicesLoading } = useFirebase();
  const isDisabled = pending || isUserLoading || areServicesLoading;

  return (
    <Button className="w-full" type="submit" aria-disabled={isDisabled} disabled={isDisabled}>
      {pending ? 'Creating Account...' : 'Sign Up'}
    </Button>
  );
}
