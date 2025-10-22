
'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Bell, MessageSquare, UserCheck, UserX, Users } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const users = [
    { id: 'user-1', email: 'user1@example.com', status: 'active' },
    { id: 'user-2', email: 'user2@example.com', status: 'active' },
    { id: 'user-3', email: 'user3@example.com', status: 'inactive' },
    { id: 'user-4', email: 'user4@example.com', status: 'active' },
    { id: 'user-5', email: 'user5@example.com', status: 'inactive' },
];

export default function AdminPage() {

    const activeUsers = users.filter(u => u.status === 'active').length;
    const inactiveUsers = users.filter(u => u.status === 'inactive').length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Users className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">User management and system notifications.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bell /> Push Notification</CardTitle>
            <CardDescription>Send a broadcast message to all users.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Textarea placeholder="Type your notification message here..." />
            <Button>Send Notification</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users /> User Overview</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex items-center justify-between p-4 bg-accent/50 rounded-lg">
                <div className="flex items-center gap-2">
                    <UserCheck className="h-6 w-6 text-green-500"/>
                    <span className="font-bold">Active Users</span>
                </div>
                <span className="text-2xl font-bold">{activeUsers}</span>
            </div>
             <div className="flex items-center justify-between p-4 bg-accent/50 rounded-lg">
                <div className="flex items-center gap-2">
                    <UserX className="h-6 w-6 text-red-500"/>
                    <span className="font-bold">Inactive Users</span>
                </div>
                <span className="text-2xl font-bold">{inactiveUsers}</span>
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>View and manage all registered users.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(user => (
                <TableRow key={user.id}>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.status === 'active' ? 'default' : 'destructive'} className={user.status === 'active' ? 'bg-green-500' : ''}>{user.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm">
                        <MessageSquare className="mr-2 h-4 w-4"/>
                        Message
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
