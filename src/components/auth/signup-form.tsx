'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { signup } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { KeyRound, UserPlus } from 'lucide-react';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export function SignupForm() {
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
  }, [state, toast]);

  return (
    <Card className="mt-4 w-full max-w-sm">
      <CardHeader>
        <CardTitle>Sign Up</CardTitle>
        <CardDescription>Create a new admin account.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={dispatch} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="john.doe@example.com" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" placeholder="••••••••" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="adminKey">Admin Key</Label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="adminKey"
                name="adminKey"
                type="password"
                placeholder="••••••••"
                required
                className="pl-10"
              />
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