
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
 * This code connects a single ESP32 to a WiFi network, synchronizes its time
 * with an NTP server, then sequentially authenticates as three different 
 * Firebase users and sends corresponding sensor data to a Firestore database 
 * via the REST API.
 * 
 * Required Arduino Libraries:
 * - ArduinoJson (by Benoit Blanchon)
 * - HTTPClient
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "time.h"

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

// -------- 3. NTP & TIME --------
const char* NTP_SERVER = "pool.ntp.org";
const long  GMT_OFFSET_SEC = 0;
const int   DAYLIGHT_OFFSET_SEC = 0;

// -------- 4. SENSOR & DATA VARS (SIMULATED) --------
float voltage = 230.0;
float current = 1.5;
float temperature = 25.0;
int ldr = 750;

// -------- FUNCTION DECLARATIONS --------
void connectToWiFi();
void syncTime();
String getAuthToken(const char* email, const char* password);
void sendDataToFirestore(String& idToken, const char* userId);

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\\n=== VoltaView ESP32 Multi-Community Sender ===");
  
  connectToWiFi();
  syncTime();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected. Trying to reconnect...");
    connectToWiFi();
    if(WiFi.status() == WL_CONNECTED) {
      syncTime(); // Re-sync time after reconnecting
    }
    return;
  }

  for (int i = 0; i < NUM_COMMUNITIES; i++) {
    Serial.printf("\\n--- Processing Community %d (%s) ---\\n", i + 1, communities[i].email);

    String idToken = getAuthToken(communities[i].email, communities[i].password);

    if (idToken.length() > 0) {
      voltage = 225.0 + (random(0, 200) / 10.0);
      current = 1.0 + (random(0, 100) / 100.0);
      temperature = 22.0 + (random(0, 100) / 10.0);
      ldr = 700 + random(0, 200);
      
      sendDataToFirestore(idToken, communities[i].uid);
      
    } else {
      Serial.println("Skipping data send due to auth failure.");
    }
    
    delay(500); 
  }
  
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

void syncTime() {
  Serial.print("Syncing time with NTP server...");
  configTime(GMT_OFFSET_SEC, DAYLIGHT_OFFSET_SEC, NTP_SERVER);
  struct tm timeinfo;
  if(!getLocalTime(&timeinfo)){
    Serial.println(" Failed to obtain time");
    return;
  }
  Serial.println(" Time synchronized.");
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
  
  // Create a struct to hold the time
  struct tm timeinfo;

  // Check if the time is available
  if(!getLocalTime(&timeinfo)){
    Serial.println("Failed to obtain time for timestamp");
    // Optionally handle error, e.g., don't send data or send with a null timestamp
    return;
  }
  
  // Format the timestamp in ISO 8601 format
  char timestamp[30];
  strftime(timestamp, sizeof(timestamp), "%Y-%m-%dT%H:%M:%SZ", &timeinfo);
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
            This Arduino sketch is pre-configured with all user credentials and now includes NTP time synchronization for accurate timestamps. You will need to install the `ArduinoJson` library from the Library Manager in your Arduino IDE.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CodeBlock language="cpp" code={arduinoCode} />
        </CardContent>
      </Card>
    </div>
  );
}
