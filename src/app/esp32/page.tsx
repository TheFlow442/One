
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { firebaseConfig } from '@/firebase/config';
import { Cpu, ShieldCheck } from 'lucide-react';
import { CodeBlock } from '@/components/code-block';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function ESP32Page() {
  const projectId = firebaseConfig.projectId;
  const apiKey = firebaseConfig.apiKey;

  const arduinoCode = `
/*
 * VoltaView ESP32 Firebase Connector - Multi-Community Device
 * 
 * This code connects a single ESP32 to a WiFi network, then sequentially 
 * authenticates as three different Firebase users (one for each community)
 * and sends the corresponding sensor data to a Firestore database via the REST API.
 * 
 * Required Arduino Libraries:
 * - ArduinoJson (by Benoit Blanchon)
 * - HTTPClient
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// -------- 1. WIFI & FIREBASE PROJECT CREDENTIALS --------
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

const char* WEB_API_KEY = "${apiKey}";
const char* PROJECT_ID = "${projectId}";

// -------- 2. COMMUNITY USER CREDENTIALS --------
struct Community {
  const char* email;
  const char* password;
  const char* uid;
};

Community communities[] = {
  {"user1@volta.view", "password123", "0nkCeSiTQbcTEhEMcUhQwYT39U72"},
  {"user2@volta.view", "password123", "F0jfqt20cPXSqJ2nsJeZtseO1qn2"},
  {"user3@volta.view", "password123", "7yV6eXu6A1ReAXdtqOVMWszmiOD2"}
};
const int NUM_COMMUNITIES = sizeof(communities) / sizeof(communities[0]);

// -------- 3. SENSOR & DATA VARS (SIMULATED) --------
// In your final code, replace these with your actual sensor reading functions.
float voltage = 230.0;
float current = 1.5;
float temperature = 25.0;
int ldr = 750;

// -------- FUNCTION DECLARATIONS --------
void connectToWiFi();
String getAuthToken(const char* email, const char* password);
void sendDataToFirestore(String& idToken, const char* userId);
String getTimestamp();

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\\n=== VoltaView ESP32 Multi-Community Sender ===");
  
  connectToWiFi();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected. Trying to reconnect...");
    connectToWiFi();
    return;
  }

  // Loop through each community
  for (int i = 0; i < NUM_COMMUNITIES; i++) {
    Serial.printf("\\n--- Processing Community %d (%s) ---\\n", i + 1, communities[i].email);

    // 1. Get Auth Token for the current community's user
    String idToken = getAuthToken(communities[i].email, communities[i].password);

    if (idToken.length() > 0) {
      // 2. Simulate reading sensor data for this community
      // IMPORTANT: Replace this with your actual sensor reading logic for each community.
      voltage = 225.0 + (random(0, 200) / 10.0);
      current = 1.0 + (random(0, 100) / 100.0);
      temperature = 22.0 + (random(0, 100) / 10.0);
      ldr = 700 + random(0, 200);
      
      // 3. Send the data to Firestore
      sendDataToFirestore(idToken, communities[i].uid);
      
    } else {
      Serial.println("Skipping data send due to auth failure.");
    }
    
    // Short delay before processing the next community for stability
    delay(500); 
  }
  
  // Wait for a short period before starting the next full cycle
  Serial.println("\\n=== Completed Full Cycle. Waiting... ===");
  delay(2000); 
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

String getAuthToken(const char* email, const char* password) {
  Serial.println("Requesting Firebase Auth Token...");
  HTTPClient http;
  
  String url = "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=";
  url += WEB_API_KEY;

  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  JsonDocument doc;
  doc["email"] = email;
  doc["password"] = password;
  doc["returnSecureToken"] = true;
  String requestBody;
  serializeJson(doc, requestBody);

  int httpCode = http.POST(requestBody);

  if (httpCode == HTTP_CODE_OK) {
    String payload = http.getString();
    JsonDocument responseDoc;
    deserializeJson(responseDoc, payload);
    String idToken = responseDoc["idToken"].as<String>();
    if (idToken.length() > 0) {
      Serial.println("Successfully authenticated and got ID token.");
      http.end();
      return idToken;
    }
  }
  
  Serial.printf("Failed to get auth token. HTTP Code: %d\\n", httpCode);
  Serial.println(http.getString());
  http.end();
  return "";
}

void sendDataToFirestore(String& idToken, const char* userId) {
  HTTPClient http;

  String url = "https://firestore.googleapis.com/v1/projects/";
  url += PROJECT_ID;
  url += "/databases/(default)/documents/users/";
  url += userId;
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
  
  struct timeval tv;
  gettimeofday(&tv, NULL);
  char timestamp[30];
  strftime(timestamp, 30, "%Y-%m-%dT%H:%M:%SZ", gmtime(&tv.tv_sec));
  fields["timestamp"]["timestampValue"] = timestamp;

  String requestBody;
  serializeJson(doc, requestBody);
  
  int httpCode = http.POST(requestBody);

  if (httpCode > 0) {
    Serial.printf("Firestore request completed for user %s. HTTP Code: %d\\n", userId, httpCode);
    String payload = http.getString();
    if (httpCode >= 200 && httpCode < 300) {
      // Success
    } else {
      Serial.println("Response: " + payload);
    }
  } else {
    Serial.printf("Firestore request failed. Error: %s\\n", http.errorToString(httpCode).c_str());
  }

  http.end();
}
`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Cpu className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">ESP32 Connection Guide</h1>
          <p className="text-muted-foreground">
            A single ESP32 sketch to send data for all three communities.
          </p>
        </div>
      </div>
      
      <Alert>
        <ShieldCheck className="h-4 w-4" />
        <AlertTitle>Important: Single Device Configuration</AlertTitle>
        <AlertDescription>
          This sketch is designed to run on a single ESP32. It will cycle through each community's credentials, authenticating and sending data sequentially. Remember to replace `YOUR_WIFI_SSID` and `YOUR_WIFI_PASSWORD` with your actual network credentials.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Unified ESP32 Code for All Communities</CardTitle>
          <CardDescription>
            This Arduino sketch is pre-configured with all user credentials. You will need to install the `ArduinoJson` library from the Library Manager in your Arduino IDE.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CodeBlock language="cpp" code={arduinoCode} />
        </CardContent>
      </Card>
    </div>
  );
}
