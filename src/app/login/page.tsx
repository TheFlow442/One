
'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useFirebase, useUser } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { createSession } from '@/lib/auth-actions';
import { useRouter } from 'next/navigation';
import { Checkbox } from '@/components/ui/checkbox';
import { Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ADMIN_SECRET_KEY = '1258solaradmin';
const ADMIN_EMAIL = 'admin@volta.view';
const ADMIN_PASSWORD = 'verylongandsecurepassword'; // This is a placeholder and not used for login, but required for account creation.

export default function LoginPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const { auth, areServicesLoading } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (formData: FormData) => {

    if (areServicesLoading || !auth) {
      toast({
        title: 'Error',
        description: 'Authentication service is not ready. Please wait a moment and try again.',
        variant: 'destructive',
      });
      return;
    }

    if (isAdmin) {
      const secretKey = formData.get('secretKey') as string;
      if (secretKey !== ADMIN_SECRET_KEY) {
        toast({
          title: 'Login Failed',
          description: 'Invalid admin secret key.',
          variant: 'destructive',
        });
        return;
      }
      // For admin, we bypass the form email/password and use a dedicated admin account
      try {
        const userCredential = await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
        const idToken = await userCredential.user.getIdToken();
        await createSession(idToken);
        toast({
          title: 'Login Successful',
          description: 'Redirecting to your dashboard...',
        });
        router.push('/dashboard');
      } catch (error: any) {
          // This can happen if the admin user doesn't exist.
          console.error('Admin Login Error:', error);
          if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
               toast({
                 title: 'Login Failed',
                 description: 'Admin account not found or configured correctly.',
                 variant: 'destructive',
               });
          } else {
               toast({
                 title: 'Login Failed',
                 description: 'An unknown error occurred during admin sign-in.',
                 variant: 'destructive',
               });
          }
      }
      return; 
    }

    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
        toast({
          title: 'Login Failed',
          description: 'Email and password are required.',
          variant: 'destructive',
        });
        return;
    }
    
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const idToken = await userCredential.user.getIdToken();
        await createSession(idToken);
        toast({
          title: 'Login Successful',
          description: "Welcome back! We're redirecting you to your dashboard.",
        });
        router.push('/dashboard');
    } catch (error: any) {
        let description = 'An unknown error occurred during sign-in.';
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            description = 'Invalid email or password.';
        } else if (error.code === 'auth/operation-not-allowed') {
            description = 'Email/password sign-in is not enabled. Please contact support.';
        } else {
             // Catch session creation failure specifically
            description = 'Could not create a session. Please try again.';
        }
        console.error('Login Error:', error);
        toast({
          title: 'Login Failed',
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
          <CardTitle>Sign In</CardTitle>
          <CardDescription>Enter your credentials to access your dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            {!isAdmin && (
                <>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        name="email"
                        placeholder="name@example.com"
                        required={!isAdmin}
                      />
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password">Password</Label>
                            <Link href="#" className="text-sm text-primary hover:underline">
                                Forgot password?
                            </Link>
                        </div>
                      <Input id="password" type="password" name="password" required={!isAdmin} />
                    </div>
                </>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox id="is-admin" checked={isAdmin} onCheckedChange={() => setIsAdmin(!isAdmin)} />
              <Label htmlFor="is-admin" className="font-normal">Sign in as Admin</Label>
            </div>

            {isAdmin && (
                <div className="space-y-2">
                    <Label htmlFor="secretKey">Admin Secret Key</Label>
                    <Input id="secretKey" type="password" name="secretKey" required />
                </div>
            )}

            <LoginButton />
             <div className="text-center text-sm">
                Don't have an account?{' '}
                <Link href="/signup" className="text-primary hover:underline">
                    Sign up
                </Link>
            </div>
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
