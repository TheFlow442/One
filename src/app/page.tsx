'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { authenticate, signup } from '@/lib/auth-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BoltIcon, KeyRound, LogInIcon, AtSign, UserPlus } from 'lucide-react';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function LoginForm() {
  const [state, dispatch] = useFormState(authenticate, undefined);
  const { toast } = useToast();

  useEffect(() => {
    if (state?.message) {
      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description: state.message,
      });
    }
  }, [state, toast]);

  return (
    <Card className="mt-4 w-full max-w-sm">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>Enter your credentials to access the dashboard.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={dispatch} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="john.doe@example.com"
                required
                className="pl-10"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                className="pl-10"
              />
            </div>
          </div>
          <LoginButton />
        </form>
      </CardContent>
    </Card>
  );
}

function LoginButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" aria-disabled={pending}>
      {pending ? (
        <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Signing In...
        </>
      ) : (
        <>
            <LogInIcon className="mr-2 h-5 w-5" />
            Sign In
        </>
      )}
    </Button>
  );
}

function SignupForm() {
  const [state, dispatch] = useFormState(signup, undefined);
  const { toast } = useToast();

  useEffect(() => {
    if (state?.message) {
      toast({
        variant: state.success ? "default" : "destructive",
        title: state.success ? "Success!" : "Sign-up Failed",
        description: state.message,
      });
    }
  }, [state]);

  return (
    <Card className="mt-4 w-full max-w-sm">
      <CardHeader>
        <CardTitle>Sign Up</CardTitle>
        <CardDescription>Create a new account.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={dispatch} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email-signup">Email</Label>
            <div className="relative">
              <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input id="email-signup" name="email" type="email" placeholder="john.doe@example.com" required className="pl-10" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password-signup">Password</Label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input id="password-signup" name="password" type="password" placeholder="••••••••" required className="pl-10" />
            </div>
          </div>
          <SignupButton />
        </form>
      </CardContent>
    </Card>
  );
}

function SignupButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" aria-disabled={pending}>
      {pending ? (
        <>
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Signing Up...
        </>
      ) : (
        <>
          <UserPlus className="mr-2 h-5 w-5" />
          Sign Up
        </>
      )}
    </Button>
  );
}


export default function AuthPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center space-y-2 text-center mb-4">
        <div className="flex items-center gap-2">
           <BoltIcon className="h-8 w-8 text-primary" />
           <h1 className="text-3xl font-bold tracking-tight text-foreground">VoltaView</h1>
        </div>
      </div>
      <Tabs defaultValue="signin" className="w-full max-w-sm">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="signin">Sign In</TabsTrigger>
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
        </TabsList>
        <TabsContent value="signin">
          <LoginForm />
        </TabsContent>
        <TabsContent value="signup">
          <SignupForm />
        </TabsContent>
      </Tabs>
    </main>
  );
}
