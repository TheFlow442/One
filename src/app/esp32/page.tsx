
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { firebaseConfig } from '@/firebase/config';
import { Cpu, KeyRound, Send, ShieldCheck, Wifi, User, Users } from 'lucide-react';
import { CodeBlock } from '@/components/code-block';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ESP32Page() {
  const projectId = firebaseConfig.projectId;
  const apiKey = firebaseConfig.apiKey;

  const generateArduinoCode = (community: 'A' | 'B' | 'C') => {
    let userEmail, userPassword, userId;
    switch (community) {
      case 'A':
        userEmail = 'user1@volta.view';
        userPassword = 'password123';
        userId = '0nkCeSiTQbcTEhEMcUhQwYT39U72';
        break;
      case 'B':
        userEmail = 'user2@volta.view';
        userPassword = 'password123';
        userId = `REPLACE_WITH_UID_FOR_${userEmail}`;
        break;
      case 'C':
        userEmail = 'user3@volta.view';
        userPassword = 'password123';
        userId = `REPLACE_WITH_UID_FOR_${userEmail}`;
        break;
    }

    return `
/*
 * VoltaView ESP32 Firebase Connector - Community ${community}
 * 
 * This code connects an ESP32 to a WiFi network, authenticates with
 * Firebase using a user's email/password, and sends sensor data to a 
 * Firestore database via the REST API.
 * 
 * Required Arduino Libraries:
 * - ArduinoJson (by Benoit Blanchon)
 * - HTTPClient
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// -------- 1. WIFI & FIREBASE CREDENTIALS (REPLACE WITH YOURS) --------
const char* WIFI_SSID = "op";
const char* WIFI_PASSWORD = "987654321";

// This should be the user dedicated to Community ${community}
const char* FIREBASE_USER_EMAIL = "${userEmail}";
const char* FIREBASE_USER_PASSWORD = "${userPassword}";
const char* USER_ID = "${userId}"; // <-- IMPORTANT: REPLACE THIS if needed

// These are specific to your Firebase project
const char* WEB_API_KEY = "${apiKey}";
const char* PROJECT_ID = "${projectId}";

// -------- 2. SENSOR & DATA VARS --------
float voltage = 230.0;
float current = 1.5;
float temperature = 25.0;
int ldr = 750;
String idToken; 

// -------- FUNCTION DECLARATIONS --------
void connectToWiFi();
bool getAuthToken();
void sendDataToFirestore();
String getTimestamp();

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\\n=== VoltaView ESP32 - Community ${community} ===");
  
  connectToWiFi();
  
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

  JsonDocument doc;
  JsonObject fields = doc["fields"].to<JsonObject>();
  
  fields["voltage"]["doubleValue"] = voltage;
  fields["current"]["doubleValue"] = current;
  fields["temperature"]["doubleValue"] = temperature;
  fields["ldr"]["integerValue"] = ldr;
  
  // This part of the code for timestamping is simplified.
  // A robust implementation would use an NTP client to get accurate time.
  struct timeval tv;
  gettimeofday(&tv, NULL);
  char timestamp[30];
  strftime(timestamp, 30, "%Y-%m-%dT%H:%M:%SZ", gmtime(&tv.tv_sec));
  fields["timestamp"]["timestampValue"] = timestamp;

  String requestBody;
  serializeJson(doc, requestBody);
  
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

// Returns timestamp in ISO 8601 format. This is a fallback.
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
  };

  const arduinoCodeA = generateArduinoCode('A');
  const arduinoCodeB = generateArduinoCode('B');
  const arduinoCodeC = generateArduinoCode('C');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Cpu className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">ESP32 Connection Guide</h1>
          <p className="text-muted-foreground">
            Configuration and code for each community's ESP32 device.
          </p>
        </div>
      </div>
      
      <Alert>
        <ShieldCheck className="h-4 w-4" />
        <AlertTitle>Important: Create Users in Firebase</AlertTitle>
        <AlertDescription>
          This guide provides separate code for each community. You must first create three corresponding users in your Firebase project's Authentication section. Then, replace the placeholder UID in each code snippet with the actual UID for that user.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="community_a" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="community_a"><Users className="mr-2" /> Community A</TabsTrigger>
          <TabsTrigger value="community_b"><Users className="mr-2" /> Community B</TabsTrigger>
          <TabsTrigger value="community_c"><Users className="mr-2" /> Community C</TabsTrigger>
        </TabsList>

        <TabsContent value="community_a">
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>ESP32 Code for Community A</CardTitle>
              <CardDescription>
                This Arduino sketch is pre-configured for Community A. You will need to install the `ArduinoJson` library from the Library Manager in your Arduino IDE.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CodeBlock language="cpp" code={arduinoCodeA} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="community_b">
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>ESP32 Code for Community B</CardTitle>
              <CardDescription>
                 This Arduino sketch is pre-configured for Community B. Replace the placeholder UID with the one for user2@volta.view.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CodeBlock language="cpp" code={arduinoCodeB} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="community_c">
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>ESP32 Code for Community C</CardTitle>
              <CardDescription>
                This Arduino sketch is pre-configured for Community C. Replace the placeholder UID with the one for user3@volta.view.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CodeBlock language="cpp" code={arduinoCodeC} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
