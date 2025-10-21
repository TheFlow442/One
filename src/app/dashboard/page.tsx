import { LogoutButton } from './logout-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Admin Dashboard</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Welcome to your VoltaView dashboard!</p>
          <LogoutButton />
        </CardContent>
      </Card>
    </div>
  );
}
