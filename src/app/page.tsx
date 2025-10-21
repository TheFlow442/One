import { LoginForm } from '@/components/auth/login-form';
import { BoltIcon } from 'lucide-react';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center space-y-4 text-center">
        <div className="flex items-center gap-2">
           <BoltIcon className="h-8 w-8 text-primary" />
           <h1 className="text-3xl font-bold tracking-tight text-foreground">VoltaView</h1>
        </div>
        <p className="text-muted-foreground">Admin Access</p>
      </div>
      <LoginForm />
    </main>
  );
}
