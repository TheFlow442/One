
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { firebaseConfig } from '@/firebase/config';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Cpu, KeyRound, Send } from 'lucide-react';
import { CodeBlock } from '@/components/code-block';

export default function ESP32Page() {
  const projectId = firebaseConfig.projectId;
  const apiKey = firebaseConfig.apiKey;
  const firestoreEndpoint = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/{userId}/esp32_data`;
  const identityEndpoint = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;

  const payloadExample = `{
    "fields": {
        "timestamp": {
            "timestampValue": "2024-08-15T10:00:00Z"
        },
        "sensorValue": {
            "doubleValue": 230.5
        }
    }
}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Cpu className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">ESP32 Connection Guide</h1>
          <p className="text-muted-foreground">
            Follow these steps for your ESP32 to connect and send data to Firebase.
          </p>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><KeyRound /> Step 1: Authentication</CardTitle>
          <CardDescription>
            First, the ESP32 must authenticate as a user to get a temporary ID Token. This token acts as a secure key for sending data. It needs to be done once and then refreshed when it expires (usually after one hour).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <div className="space-y-2">
            <Label htmlFor="api-key">Web API Key (Included in Endpoint URL)</Label>
            <Input id="api-key" value={apiKey} readOnly />
          </div>
          <div className="space-y-2">
            <Label htmlFor="identity-endpoint">Authentication Endpoint URL</Label>
             <Input id="identity-endpoint" value={identityEndpoint} readOnly />
             <p className="text-sm text-muted-foreground mt-2">Send a `POST` request to this URL with the user's email and password in the body to receive an ID Token.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Send /> Step 2: Sending Data to Firestore</CardTitle>
          <CardDescription>
            Once you have the ID Token, use it to authorize `POST` requests to the Firestore REST API.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label>Authorization Header</Label>
                <Input value="Authorization: Bearer <ID_TOKEN>" readOnly />
                <p className="text-sm text-muted-foreground">Include this header in your request, replacing `{'<ID_TOKEN>'}` with the token from Step 1.</p>
            </div>
             <div className="space-y-2">
                <Label htmlFor="firestore-endpoint">Firestore REST API Endpoint URL</Label>
                <Input id="firestore-endpoint" value={firestoreEndpoint} readOnly />
                <p className="text-sm text-muted-foreground">Remember to replace `{'`{userId}`'}` with the actual user's ID.</p>
            </div>
            <div className="space-y-2">
                <Label>Example JSON Payload</Label>
                <CodeBlock language="json" code={payloadExample} />
                <p className="text-sm text-muted-foreground">This is the structure of the JSON body for your `POST` request to the Firestore endpoint.</p>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
