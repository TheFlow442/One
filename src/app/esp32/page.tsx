
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
 * It also includes a function to clean up old readings to keep the database size manageable.
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

const int MAX_READINGS = 30; // Maximum number of readings to keep in Firestore

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
float voltage = 230.0;
float current = 1.5;
float temperature = 25.0;
int ldr = 750;

// -------- FUNCTION DECLARATIONS --------
void connectToWiFi();
String getAuthToken(const char* email, const char* password);
void sendDataToFirestore(String& idToken, const char* userId);
void cleanupOldReadings(String& idToken, const char* userId);
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

  for (int i = 0; i < NUM_COMMUNITIES; i++) {
    Serial.printf("\\n--- Processing Community %d (%s) ---\\n", i + 1, communities[i].email);

    String idToken = getAuthToken(communities[i].email, communities[i].password);

    if (idToken.length() > 0) {
      voltage = 225.0 + (random(0, 200) / 10.0);
      current = 1.0 + (random(0, 100) / 100.0);
      temperature = 22.0 + (random(0, 100) / 10.0);
      ldr = 700 + random(0, 200);
      
      sendDataToFirestore(idToken, communities[i].uid);
      
      // After sending new data, check if cleanup is needed
      cleanupOldReadings(idToken, communities[i].uid);
      
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

void cleanupOldReadings(String& idToken, const char* userId) {
    Serial.println("Checking for old readings to clean up...");
    HTTPClient http;

    // Construct the URL to run a query
    String queryUrl = "https://firestore.googleapis.com/v1/projects/";
    queryUrl += PROJECT_ID;
    queryUrl += "/databases/(default)/documents:runQuery";

    // --- Step 1: Count the documents ---
    http.begin(queryUrl);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("Authorization", "Bearer " + idToken);

    String parentPath = "projects/" + String(PROJECT_ID) + "/databases/(default)/documents/users/" + String(userId);
    String countQueryBody = "{\\"structuredQuery\\":{\\"from\\":[{\\"collectionId\\":\\"esp32_data\\", \\"allDescendants\\":false}], \\"parent\\":\\"" + parentPath + "\\"}}";
    
    int httpCode = http.POST(countQueryBody);
    int currentCount = 0;

    if (httpCode == HTTP_CODE_OK) {
        String payload = http.getString();
        JsonDocument doc;
        DeserializationError error = deserializeJson(doc, payload);
        if (!error) {
            // Firestore returns multiple documents for a query, we need to count them.
            // A transaction ID or a readTime is returned if there are documents.
            if(doc[0].containsKey("readTime")){
              // This is a bit of a hack as the REST API for query doesn't give a direct count.
              // We will query for all document names and count them.
              // This is not super efficient, but for 30-40 docs, it's acceptable.
            }
        }
    }
    http.end();

    // --- Step 2: If count > MAX_READINGS, get oldest documents to delete ---
    // For simplicity and to avoid complex parsing on ESP32, we will just assume we might be over limit
    // and attempt to delete the oldest. A more robust solution would be a cloud function.

    // Let's get the oldest documents to delete
    String getOldestUrl = "https://firestore.googleapis.com/v1/projects/";
    getOldestUrl += PROJECT_ID;
    getOldestUrl += "/databases/(default)/documents/users/";
    getOldestUrl += userId;
    getOldestUrl += "/esp32_data?orderBy=timestamp%20asc&pageSize=" + String(MAX_READINGS); // Order by ascending to get oldest first

    http.begin(getOldestUrl);
    http.addHeader("Authorization", "Bearer " + idToken);
    httpCode = http.GET();
    
    JsonArray documentsToDelete;
    int totalDocs = 0;

    if (httpCode == HTTP_CODE_OK) {
        String payload = http.getString();
        JsonDocument filter;
        filter.shrinkToFit(); // Make sure it fits
        DeserializationError error = deserializeJson(filter, payload);
        if (!error && filter.containsKey("documents")) {
            JsonArray docs = filter["documents"].as<JsonArray>();
            totalDocs = docs.size();
            Serial.printf("Found %d total documents. Checking if cleanup is needed.\\n", totalDocs);
            
            if (totalDocs > MAX_READINGS) {
              int docsToDeleteCount = totalDocs - MAX_READINGS;
              Serial.printf("Exceeds limit. Will delete %d oldest documents.\\n", docsToDeleteCount);
              for(int i=0; i<docsToDeleteCount; i++){
                documentsToDelete.add(docs[i]["name"].as<String>());
              }
            }
        }
    }
    http.end();

    // --- Step 3: Delete the identified documents ---
    if (documentsToDelete.size() > 0) {
        for (JsonVariant docNameVar : documentsToDelete) {
            String docName = docNameVar.as<String>();
            String deleteUrl = "https://firestore.googleapis.com/v1/" + docName;
            
            http.begin(deleteUrl);
            http.addHeader("Authorization", "Bearer " + idToken);
            int deleteHttpCode = http.sendRequest("DELETE");

            if (deleteHttpCode == HTTP_CODE_NO_CONTENT || deleteHttpCode == HTTP_CODE_OK) {
                Serial.printf("Successfully deleted old document: %s\\n", docName.c_str());
            } else {
                Serial.printf("Failed to delete document: %s. HTTP Code: %d\\n", docName.c_str(), deleteHttpCode);
                Serial.println(http.getString());
            }
            http.end();
            delay(100); // Small delay between delete requests
        }
    } else {
        Serial.println("No cleanup necessary.");
    }
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
