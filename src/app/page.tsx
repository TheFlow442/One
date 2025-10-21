import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Zap, Waves, Flame, Thermometer } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="bg-primary text-primary-foreground p-6 rounded-lg flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Smart Solar Microgrid Management</h1>
          <p className="text-sm">Monitor your solar system in real-time</p>
        </div>
        <Avatar>
          <AvatarImage src="https://picsum.photos/seed/user-avatar/40/40" />
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
      </header>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Voltage</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">0.0 V</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Current</CardTitle>
            <Waves className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">0.00 A</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Power</CardTitle>
            <Flame className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">0 W</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Temperature</CardTitle>
            <Thermometer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">0 °C</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
