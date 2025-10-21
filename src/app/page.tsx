'use client';

import { useState } from 'react';
import { LoginForm } from '@/components/auth/login-form';
import { SignupForm } from '@/components/auth/signup-form';
import { BoltIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from '@/components/ui/card';


export default function AuthPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center space-y-4 text-center">
        <div className="flex items-center gap-2">
           <BoltIcon className="h-8 w-8 text-primary" />
           <h1 className="text-3xl font-bold tracking-tight text-foreground">VoltaView</h1>
        </div>
        <p className="text-muted-foreground">Admin Access</p>
      </div>
      <Tabs defaultValue="signin" className="w-full max-w-sm mt-4">
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