import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sun } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Welcome</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This is your VoltaView dashboard.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">
            Today Generation
          </CardTitle>
          <Sun className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">802.65 kWh</div>
        </CardContent>
      </Card>
    </div>
  );
}
