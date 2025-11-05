
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { firebaseConfig } from '@/firebase/config';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Cpu, KeyRound, Send, ShieldCheck, Wifi } from 'lucide-react';
import { CodeBlock } from '@/components/code-block';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ESP32Page() {
  const projectId = firebaseConfig.projectId;
  const apiKey = firebaseConfig.apiKey;
  const firestoreEndpoint = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/{userId}/esp32_data`;
  const identityEndpoint = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;

  const payloadExample = `{
  "fields": {
    "voltage": { "doubleValue": 230.5 },
    "current": { "doubleValue": 5.2 },
    "temperature": { "doubleValue": 28.5 },
    "ldr": { "integerValue": 950 },
    "timestamp": { "timestampValue": "2024-08-15T10:00:00Z" }
  }
}`;

  const arduinoCode = `
/*
 * VoltaView ESP32 Firebase Connector
 * 
 * This code connects an ESP32 to a WiFi network, authenticates with
 * Firebase using a user's email/password, and sends sensor data to a 
 * Firestore database via the REST API.
 * 
 * Required Arduino Libraries:
 * - ArduinoJson (by Benoit Blanchon)
 * - HTTPClient
 * 
 * Make sure to install these from the Arduino IDE Library Manager.
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// -------- 1. WIFI & FIREBASE CREDENTIALS (REPLACE WITH YOURS) --------
const char* WIFI_SSID = "op";
const char* WIFI_PASSWORD = "987654321";

// This should be a user that has been created in your Firebase project
const char* FIREBASE_USER_EMAIL = "your-user@example.com";
const char* FIREBASE_USER_PASSWORD = "your-user-password";
const char* USER_ID = "the-firebase-uid-of-the-user"; // The UID of the user above

// These are specific to your Firebase project
const char* WEB_API_KEY = "${apiKey}";
const char* PROJECT_ID = "${projectId}";

// -------- 2. SENSOR & DATA VARS --------
// Placeholder for sensor readings
float voltage = 230.0;
float current = 1.5;
float temperature = 25.0;
int ldr = 750;

String idToken; // Stores the Firebase auth token

// -------- FUNCTION DECLARATIONS --------
void connectToWiFi();
bool getAuthToken();
void sendDataToFirestore();
String getTimestamp();

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\\n=== VoltaView ESP32 Firebase Connector ===");
  
  connectToWiFi();
  
  // Get the initial auth token. In a real app, you'd handle token expiration.
  if (WiFi.status() == WL_CONNECTED) {
    getAuthToken();
  }
}

void loop() {
  if (WiFi.status() == WL_CONNECTED && idToken.length() > 0) {
    // Simulate reading new sensor data
    voltage = 225.0 + (random(0, 200) / 10.0);
    current = 1.0 + (random(0, 100) / 100.0);
    temperature = 22.0 + (random(0, 100) / 10.0);
    ldr = 700 + random(0, 200);

    Serial.println("--- Sending new data ---");
    sendDataToFirestore();
  } else {
    Serial.println("Not connected to WiFi or no auth token.");
  }
  
  // Wait for 30 seconds before sending next update
  delay(30000); 
}

void connectToWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\\nWiFi connected! IP address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\\nFailed to connect to WiFi.");
  }
}

bool getAuthToken() {
  Serial.println("Requesting Firebase Auth Token...");
  HTTPClient http;
  
  String url = "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=";
  url += WEB_API_KEY;

  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  // Create JSON payload for authentication
  JsonDocument doc;
  doc["email"] = FIREBASE_USER_EMAIL;
  doc["password"] = FIREBASE_USER_PASSWORD;
  doc["returnSecureToken"] = true;
  String requestBody;
  serializeJson(doc, requestBody);

  int httpCode = http.POST(requestBody);

  if (httpCode == HTTP_CODE_OK) {
    String payload = http.getString();
    JsonDocument responseDoc;
    deserializeJson(responseDoc, payload);
    idToken = responseDoc["idToken"].as<String>();
    if (idToken.length() > 0) {
      Serial.println("Successfully authenticated and got ID token.");
      http.end();
      return true;
    }
  }
  
  Serial.printf("Failed to get auth token. HTTP Code: %d\\n", httpCode);
  Serial.println(http.getString());
  http.end();
  return false;
}

void sendDataToFirestore() {
  HTTPClient http;

  String url = "https://firestore.googleapis.com/v1/projects/";
  url += PROJECT_ID;
  url += "/databases/(default)/documents/users/";
  url += USER_ID;
  url += "/esp32_data";

  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", "Bearer " + idToken);

  // Create JSON payload for Firestore
  JsonDocument doc;
  JsonObject fields = doc["fields"].to<JsonObject>();
  
  fields["voltage"]["doubleValue"] = voltage;
  fields["current"]["doubleValue"] = current;
  fields["temperature"]["doubleValue"] = temperature;
  fields["ldr"]["integerValue"] = ldr;
  fields["timestamp"]["timestampValue"] = getTimestamp();

  String requestBody;
  serializeJson(doc, requestBody);

  Serial.println("Request Body: " + requestBody);
  
  int httpCode = http.POST(requestBody);

  if (httpCode > 0) {
    Serial.printf("Firestore request completed. HTTP Code: %d\\n", httpCode);
    String payload = http.getString();
    Serial.println("Response: " + payload);
  } else {
    Serial.printf("Firestore request failed. Error: %s\\n", http.errorToString(httpCode).c_str());
  }

  http.end();
}

// Returns timestamp in ISO 8601 format
String getTimestamp() {
  time_t now;
  struct tm timeinfo;
  if(!getLocalTime(&timeinfo)){
    Serial.println("Failed to obtain time");
    return "";
  }
  char buf[sizeof "2011-10-08T07:07:09Z"];
  strftime(buf, sizeof buf, "%Y-%m-%dT%H:%M:%SZ", &timeinfo);
  return String(buf);
}
`;


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
      
      <Tabs defaultValue="guide">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="guide">Step-by-Step Guide</TabsTrigger>
          <TabsTrigger value="code">Full Arduino Code</TabsTrigger>
        </TabsList>
        <TabsContent value="guide">
          <div className="flex flex-col gap-6 pt-4">
            <Alert>
              <ShieldCheck className="h-4 w-4" />
              <AlertTitle>Is this secure?</AlertTitle>
              <AlertDescription>
                Yes. The Web API Key is a public identifier, not a secret. Access to your data is protected by Firestore Security Rules, which require a user to be authenticated via an ID Token.
              </AlertDescription>
            </Alert>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Wifi /> Step 1: Connect to WiFi</CardTitle>
                <CardDescription>
                  First, your ESP32 needs to connect to the internet. The provided code includes logic to connect to your specified network.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="space-y-2">
                  <Label>WiFi Credentials</Label>
                  <div className="flex gap-2">
                    <Input value="SSID: op" readOnly />
                    <Input value="Password: •••••••••" readOnly />
                  </div>
                   <p className="text-sm text-muted-foreground mt-2">These have been pre-filled in the full code example.</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><KeyRound /> Step 2: Authentication</CardTitle>
                <CardDescription>
                  Next, the ESP32 must authenticate as a user to get a temporary ID Token. This token acts as a secure key for sending data and must be included in every request to Firestore.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="space-y-2">
                  <Label htmlFor="api-key">Your Web API Key (Auto-filled)</Label>
                  <Input id="api-key" value={apiKey} readOnly />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="identity-endpoint">Authentication Endpoint URL</Label>
                   <Input id="identity-endpoint" value={identityEndpoint} readOnly />
                   <p className="text-sm text-muted-foreground mt-2">Send a `POST` request to this URL with a registered user's email and password to get an ID Token.</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Send /> Step 3: Sending Sensor Data</CardTitle>
                <CardDescription>
                  Once you have the ID Token, use it to authorize `POST` requests containing your sensor data to the Firestore REST API.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                  <div className="space-y-2">
                      <Label>Authorization Header</Label>
                      <Input value="Authorization: Bearer <ID_TOKEN>" readOnly />
                      <p className="text-sm text-muted-foreground">The code handles this automatically, replacing `{'<ID_TOKEN>'}` with the token from Step 2.</p>
                  </div>
                   <div className="space-y-2">
                      <Label htmlFor="firestore-endpoint">Firestore REST API Endpoint URL</Label>
                      <Input id="firestore-endpoint" value={firestoreEndpoint} readOnly />
                      <p className="text-sm text-muted-foreground">Remember to replace `{'`{userId}`'}` with the actual user's ID in the code.</p>
                  </div>
                  <div className="space-y-2">
                      <Label>Example JSON Payload</Label>
                      <CodeBlock language="json" code={payloadExample} />
                      <p className="text-sm text-muted-foreground">This is the structure of the JSON body for your `POST` request. The app uses these values to derive all the metrics on your dashboard.</p>
                  </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="code">
            <div className="pt-4">
                <Card>
                    <CardHeader>
                        <CardTitle>ESP32 Code</CardTitle>
                        <CardDescription>
                            This is a complete Arduino sketch. You will need to install the `ArduinoJson` library from the Library Manager. Replace the placeholder user credentials with a valid user from your Firebase project.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <CodeBlock language="cpp" code={arduinoCode} />
                    </CardContent>
                </Card>
            </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

    