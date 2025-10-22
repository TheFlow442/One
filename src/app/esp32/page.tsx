
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { firebaseConfig } from '@/firebase/config';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Cpu } from 'lucide-react';
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
          <h1 className="text-3xl font-bold">ESP32 Connection Details</h1>
          <p className="text-muted-foreground">
            Use these details in your ESP32 code to connect to your Firebase project.
          </p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Firebase Project Configuration</CardTitle>
          <CardDescription>
            These are the core credentials your ESP32 needs to identify your Firebase project.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-id">Project ID</Label>
            <Input id="project-id" value={projectId} readOnly />
          </div>
          <div className="space-y-2">
            <Label htmlFor="api-key">Web API Key</Label>
            <Input id="api-key" value={apiKey} readOnly />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle>Authentication Endpoint</CardTitle>
            <CardDescription>
                To get a user ID token, your ESP32 should sign in as a user by sending a POST request to this endpoint with the user's email and password.
            </CardDescription>
        </CardHeader>
        <CardContent>
             <Input id="identity-endpoint" value={identityEndpoint} readOnly />
             <p className="text-sm text-muted-foreground mt-2">The ID token returned from this request must be included in the Authorization header of your Firestore requests as a Bearer token.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Firestore REST API Endpoint</CardTitle>
          <CardDescription>
            Your ESP32 should send `POST` requests to this URL to store data. Remember to replace `'{userId}'` with the actual user's ID obtained after authentication.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <Input id="firestore-endpoint" value={firestoreEndpoint} readOnly />
            <div className="space-y-2">
                <Label>Example JSON Payload</Label>
                <CodeBlock language="json" code={payloadExample} />
                <p className="text-sm text-muted-foreground">This is the structure of the JSON body for your POST request.</p>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
