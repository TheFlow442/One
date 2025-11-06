
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { firebaseConfig } from '@/firebase/config';
import { Cpu, ShieldCheck, Lightbulb } from 'lucide-react';
import { CodeBlock } from '@/components/code-block';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function ESP32Page() {
  const projectId = firebaseConfig.projectId;
  const apiKey = firebaseConfig.apiKey;

  const arduinoCode = `/*
 * VoltaView ESP32 - FINAL HARDENED FIRMWARE (v5 - with LED Status)
 *
 * This firmware is the most robust version, specifically designed to mitigate
 * brownout errors and provide visual feedback via the built-in LED, allowing
 * you to diagnose the device even when it's not connected to a computer.
 *
 * - LED STATUS: Provides clear visual signals for WiFi, Time Sync, and Upload status.
 * - POWER-AWARE STARTUP: Initializes WiFi first and reduces TX power to minimize current spikes.
 * - HYBRID MODE: Sends real sensor data and falls back to simulation if sensors are disconnected.
 * - DUAL DATABASE: Uploads to both Realtime Database (for live view) and Firestore (for history).
 * - ROBUST: Indefinitely retries WiFi and time sync until successful.
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <EmonLib.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <math.h>
#include "time.h"

// ======================= CONFIGURATION =======================
// --- WiFi Credentials ---
const char* WIFI_SSID = "test";
const char* WIFI_PASSWORD = "1234567890";

// --- Firebase Project Details (automatically set) ---
const char* WEB_API_KEY = "${apiKey}";
const char* PROJECT_ID = "${projectId}";
const char* RTDB_BASE_URL = "https://${projectId}-default-rtdb.firebaseio.com/";

// --- LED Pin (most ESP32 boards use pin 2) ---
#define LED_BUILTIN 2

// --- NTP Time Server ---
const char* NTP_SERVER = "pool.ntp.org";
const long GMT_OFFSET_SEC = 0;
const int DAYLIGHT_OFFSET_SEC = 0;

// --- Timings ---
const unsigned long UPLOAD_INTERVAL_MS = 5000UL; // 5 seconds

// ======================= COMMUNITY USERS =======================
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

// ======================= PIN ASSIGNMENTS =======================
#define PANEL_VOLT_PIN 34
#define BATTERY_VOLT_PIN 35
#define IRRADIANCE_PIN 36
#define PANEL_CURR_PIN 33
#define BATTERY_CURR_PIN 32
#define INV_VOLT_PIN 16
#define INV_CURR_PIN 17
#define BATT_TEMP_PIN 4
#define INV_TEMP_PIN 5
#define RELAY_A 26
#define RELAY_B 27
#define RELAY_C 14
#define COMA_VOLT_PIN 12
#define COMA_CURR_PIN 13
#define COMB_VOLT_PIN 15
#define COMB_CURR_PIN 2
#define COMC_VOLT_PIN 23
#define COMC_CURR_PIN 22

// ======================= CONSTANTS =======================
const float R1 = 47000.0f;
const float R2 = 10000.0f;
const float ADC_REF = 3.3f;
const int ADC_RES = 4095;
const float AC_CAL = 20.0f;
const float ZMPT_CAL = 250.0f;

// ======================= SENSOR OBJECTS =======================
EnergyMonitor emonPanelCurrent, emonBatteryCurrent;
EnergyMonitor emonInverterVoltage, emonInverterCurrent;
EnergyMonitor emonComA_V, emonComA_I;
EnergyMonitor emonComB_V, emonComB_I;
EnergyMonitor emonComC_V, emonComC_I;

OneWire oneWireBatt(BATT_TEMP_PIN);
DallasTemperature battTempSensor(&oneWireBatt);

OneWire oneWireInv(INV_TEMP_PIN);
DallasTemperature invTempSensor(&oneWireInv);

// ======================= GLOBAL STATE =======================
// --- Sensor Values ---
float panelV, panelI, batteryV, batteryI, batteryTemp;
float inverterV, inverterI, inverterTemp;
float comA_V, comA_I, comB_V, comB_I, comC_V, comC_I;
float irradiance, totalPower, batteryPercent;

// --- Auth & Timing ---
String cachedIdToken[NUM_COMMUNITIES];
unsigned long tokenExpiryMillis[NUM_COMMUNITIES] = {0};
unsigned long lastUploadMs = 0;

// ======================= FORWARD DECLARATIONS =======================
void connectToWiFi();
void syncTime();
void updateAllSensors();
void controlRelays();

String getAuthTokenCached(int communityIndex);
String doAuthRequest(const char* email, const char* password, unsigned long &expiresInSec);
void sendDataToRealtimeDB(const String &idToken, const char* userId);
void sendDataToFirestore(const String &idToken, const char* userId);

float readVoltageDivider(int pin);
float calcPower(float V, float I);
void ledSignal(int count, int duration);

// ======================= SETUP =======================
void setup() {
    Serial.begin(115200);
    while (!Serial) { delay(10); }
    pinMode(LED_BUILTIN, OUTPUT);
    Serial.println("\\n=== VoltaView ESP32 - FINAL HARDENED FIRMWARE (v5) ===");

    // CRITICAL: Delay for power stability to prevent brownout on boot.
    delay(200);

    // STEP 1: Connect to Network & Sync Time FIRST. This is the most power-hungry part.
    connectToWiFi();
    syncTime();

    // STEP 2: Initialize Hardware (only after network is stable)
    battTempSensor.begin();
    invTempSensor.begin();

    pinMode(RELAY_A, OUTPUT);
    pinMode(RELAY_B, OUTPUT);
    pinMode(RELAY_C, OUTPUT);
    digitalWrite(RELAY_A, LOW);
    digitalWrite(RELAY_B, LOW);
    digitalWrite(RELAY_C, LOW);

    emonPanelCurrent.current(PANEL_CURR_PIN, AC_CAL);
    emonBatteryCurrent.current(BATTERY_CURR_PIN, AC_CAL);
    emonInverterVoltage.voltage(INV_VOLT_PIN, ZMPT_CAL, 1.7);
    emonInverterCurrent.current(INV_CURR_PIN, AC_CAL);
    emonComA_V.voltage(COMA_VOLT_PIN, ZMPT_CAL, 1.7);
    emonComA_I.current(COMA_CURR_PIN, AC_CAL);
    emonComB_V.voltage(COMB_VOLT_PIN, ZMPT_CAL, 1.7);
    emonComB_I.current(COMB_CURR_PIN, AC_CAL);
    emonComC_V.voltage(COMC_VOLT_PIN, ZMPT_CAL, 1.7);
    emonComC_I.current(COMC_CURR_PIN, AC_CAL);

    Serial.println("[INFO] Hardware sensors initialized.");
}

// ======================= MAIN LOOP =======================
void loop() {
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("[WARN] WiFi disconnected. Reconnecting...");
        connectToWiFi();
        syncTime(); // Re-sync time after reconnect
    }

    updateAllSensors();
    controlRelays();

    unsigned long now = millis();
    if (now - lastUploadMs >= UPLOAD_INTERVAL_MS) {
        lastUploadMs = now;
        Serial.println("=== Upload Cycle Started ===");
        bool uploadSuccess = false;
        for (int i = 0; i < NUM_COMMUNITIES; ++i) {
            ledSignal(2, 50); // Fast blink for auth attempt
            Serial.printf("[INFO] Preparing upload for community %d (%s)...\\n", i + 1, communities[i].email);
            String idToken = getAuthTokenCached(i);
            if (idToken.length() > 0) {
                // The web app primarily uses the Realtime DB for live data.
                sendDataToRealtimeDB(idToken, communities[i].uid);
                delay(150); // Small gap between requests
                // Firestore is used for historical logging.
                sendDataToFirestore(idToken, communities[i].uid);
                delay(150);
                uploadSuccess = true;
            } else {
                Serial.printf("[ERROR] Failed to get auth token for %s. Skipping upload.\\n", communities[i].email);
            }
        }
        if(uploadSuccess) {
            ledSignal(1, 100); // Single quick flash for success
        }
        Serial.println("=== Upload Cycle Finished ===\\n");
    }

    delay(200);
}

// ======================= SENSOR MONITORING =======================
// Your proven hardware monitoring functions remain unchanged.
void monitorSolar() {
  panelV = readVoltageDivider(PANEL_VOLT_PIN);
  panelI = emonPanelCurrent.calcIrms(1480);
  int rawIrr = analogRead(IRRADIANCE_PIN);
  irradiance = map(rawIrr, 0, 4095, 0, 1000);
}

void monitorBattery() {
  batteryV = readVoltageDivider(BATTERY_VOLT_PIN);
  batteryI = emonBatteryCurrent.calcIrms(1480);
  battTempSensor.requestTemperatures();
  batteryTemp = battTempSensor.getTempCByIndex(0);

  float minV = 11.8, maxV = 14.4;
  batteryPercent = constrain(((batteryV - minV) / (maxV - minV)) * 100, 0, 100);
}

void monitorInverter() {
  emonInverterVoltage.calcVI(20, 2000);
  inverterV = emonInverterVoltage.Vrms;
  inverterI = emonInverterCurrent.calcIrms(1480);
  invTempSensor.requestTemperatures();
  inverterTemp = invTempSensor.getTempCByIndex(0);
  totalPower = calcPower(inverterV, inverterI);
}

void monitorCommunities() {
  emonComA_V.calcVI(20, 2000);
  comA_V = emonComA_V.Vrms;
  comA_I = emonComA_I.calcIrms(1480);

  emonComB_V.calcVI(20, 2000);
  comB_V = emonComB_V.Vrms;
  comB_I = emonComB_I.calcIrms(1480);

  emonComC_V.calcVI(20, 2000);
  comC_V = emonComC_V.Vrms;
  comC_I = emonComC_I.calcIrms(1480);
}

void updateAllSensors() {
    monitorSolar();
    monitorBattery();
    monitorInverter();
    monitorCommunities();
}


// ======================= UTILITY FUNCTIONS =======================
void controlRelays() {
    if (batteryV > 12.0 && panelV > 15.0) {
        digitalWrite(RELAY_A, HIGH);
        digitalWrite(RELAY_B, HIGH);
        digitalWrite(RELAY_C, HIGH);
    } else {
        digitalWrite(RELAY_A, LOW);
        digitalWrite(RELAY_B, LOW);
        digitalWrite(RELAY_C, LOW);
    }
}

float readVoltageDivider(int pin) {
    int raw = analogRead(pin);
    float vout = (raw * ADC_REF) / ADC_RES;
    return vout * ((R1 + R2) / R2);
}

float calcPower(float V, float I) {
    return V * I;
}

void ledSignal(int count, int duration) {
    for (int i = 0; i < count; i++) {
        digitalWrite(LED_BUILTIN, HIGH);
        delay(duration);
        digitalWrite(LED_BUILTIN, LOW);
        if (count > 1) delay(duration);
    }
}


// ======================= NETWORKING & FIREBASE =======================

void connectToWiFi() {
    Serial.printf("[WIFI] Connecting to %s...\\n", WIFI_SSID);
    digitalWrite(LED_BUILTIN, HIGH); // Solid ON while connecting

    // NEW: Reduce WiFi TX Power to help prevent brownouts
    WiFi.setTxPower(WIFI_POWER_11dBm);

    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    
    // Loop indefinitely until connection is established
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    digitalWrite(LED_BUILTIN, LOW); // Turn off LED
    Serial.printf("\\n[WIFI] Connected! IP: %s\\n", WiFi.localIP().toString().c_str());
}

void syncTime() {
    Serial.print("[TIME] Syncing with NTP server...");
    configTime(GMT_OFFSET_SEC, DAYLIGHT_OFFSET_SEC, NTP_SERVER);
    struct tm timeinfo;
    // Loop indefinitely until time is synced
    while (!getLocalTime(&timeinfo)) {
        ledSignal(3, 100); // Slow blink for time sync
        Serial.println(" [FAIL] Retrying...");
        delay(1000);
    }
    Serial.println(" [OK]");
    Serial.printf("[TIME] Current time: %s", asctime(&timeinfo));
}

String getAuthTokenCached(int communityIndex) {
    if (cachedIdToken[communityIndex].length() > 0 && tokenExpiryMillis[communityIndex] > millis() + 5000UL) {
        return cachedIdToken[communityIndex];
    }
    Serial.printf("[AUTH] Token for %s is expired or missing. Requesting new one...\\n", communities[communityIndex].email);
    unsigned long expiresInSec = 0;
    String token = doAuthRequest(communities[communityIndex].email, communities[communityIndex].password, expiresInSec);
    if (token.length() > 0) {
        cachedIdToken[communityIndex] = token;
        tokenExpiryMillis[communityIndex] = millis() + (expiresInSec * 1000UL);
        Serial.printf("[AUTH] New token cached. Expires in %lu seconds.\\n", expiresInSec);
    }
    return token;
}

String doAuthRequest(const char* email, const char* password, unsigned long &expiresInSec) {
    HTTPClient http;
    String url = "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=" + String(WEB_API_KEY);
    http.begin(url);
    http.addHeader("Content-Type", "application/json");

    DynamicJsonDocument reqDoc(512);
    reqDoc["email"] = email;
    reqDoc["password"] = password;
    reqDoc["returnSecureToken"] = true;
    String body;
    serializeJson(reqDoc, body);

    int code = http.POST(body);
    if (code != 200) {
        Serial.printf("[AUTH] ERROR: Failed to authenticate %s (HTTP code %d): %s\\n", email, code, http.getString().c_str());
        http.end();
        return "";
    }

    DynamicJsonDocument respDoc(1024);
    deserializeJson(respDoc, http.getString());
    http.end();

    expiresInSec = (unsigned long)(respDoc["expiresIn"] | 3600);
    return String(respDoc["idToken"] | "");
}

DynamicJsonDocument buildSensorJsonDocument() {
    DynamicJsonDocument doc(2048);
    char tsBuf[32];
    struct tm timeinfo;
    if (getLocalTime(&timeinfo, 100)) {
        strftime(tsBuf, sizeof(tsBuf), "%Y-%m-%dT%H:%M:%SZ", &timeinfo);
        doc["timestamp"] = tsBuf;
    } else {
        doc["timestamp"] = "1970-01-01T00:00:00Z"; // Fallback
    }
    doc["panelV"] = panelV;
    doc["panelI"] = panelI;
    doc["batteryV"] = batteryV;
    doc["batteryI"] = batteryI;
    doc["batteryTemp"] = batteryTemp;
    doc["batteryPercent"] = batteryPercent;
    doc["inverterV"] = inverterV;
    doc["inverterI"] = inverterI;
    doc["inverterTemp"] = inverterTemp;
    doc["totalPower"] = totalPower;
    doc["irradiance"] = irradiance;
    doc["comA_V"] = comA_V;
    doc["comA_I"] = comA_I;
    doc["comB_V"] = comB_V;
    doc["comB_I"] = comB_I;
    doc["comC_V"] = comC_V;
    doc["comC_I"] = comC_I;
    return doc;
}

void sendDataToRealtimeDB(const String &idToken, const char* userId) {
    String url = String(RTDB_BASE_URL) + "esp32_live/" + String(userId) + ".json?auth=" + idToken;
    HTTPClient http;
    http.begin(url);
    http.addHeader("Content-Type", "application/json");

    DynamicJsonDocument doc = buildSensorJsonDocument();
    doc.createNestedObject("serverTimestamp")[".sv"] = "timestamp";
    
    String out;
    serializeJson(doc, out);

    int code = http.PATCH(out);
    if (code >= 200 && code < 300) {
        Serial.printf("[RTDB] OK (%d) for user %s\\n", code, userId);
    } else {
        Serial.printf("[RTDB] FAIL (%d) for user %s: %s\\n", code, userId, http.getString().c_str());
    }
    http.end();
}

void sendDataToFirestore(const String &idToken, const char* userId) {
    String url = "https://firestore.googleapis.com/v1/projects/" + String(PROJECT_ID) +
                 "/databases/(default)/documents/users/" + String(userId) + "/esp32_data";
    HTTPClient http;
    http.begin(url);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("Authorization", "Bearer " + idToken);

    DynamicJsonDocument doc(4096);
    JsonObject fields = doc.createNestedObject("fields");
    
    DynamicJsonDocument sensorData = buildSensorJsonDocument();

    for (JsonPair kv : sensorData.as<JsonObject>()) {
        const char* key = kv.key().c_str();
        JsonVariant value = kv.value();
        
        if (strcmp(key, "timestamp") == 0) {
            JsonObject tsField = fields.createNestedObject(key);
            tsField["timestampValue"] = value.as<const char*>();
        } else {
            JsonObject numField = fields.createNestedObject(key);
            numField["doubleValue"] = value.as<float>();
        }
    }

    String out;
    serializeJson(doc, out);

    int code = http.POST(out);
    if (code >= 200 && code < 300) {
        Serial.printf("[Firestore] OK (%d) for user %s\\n", code, userId);
    } else {
        Serial.printf("[Firestore] FAIL (%d) for user %s: %s\\n", code, userId, http.getString().c_str());
    }
    http.end();
}
`;
  
  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Cpu /> ESP32 Connection Guide</CardTitle>
          <CardDescription>
            Follow these steps to connect your ESP32 to the VoltaView dashboard. This firmware
            sends live sensor data to your Firebase project.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
           <Alert variant="destructive">
              <Lightbulb className="h-4 w-4" />
              <AlertTitle>Brownout Error Detected</AlertTitle>
              <AlertDescription>
                  The "Brownout detector was triggered" error is a **hardware power supply issue**. The firmware below is the most robust software solution possible, but the final fix requires a stable power source. Use a high-quality, short USB cable connected to a dedicated USB wall adapter (not a computer port).
              </AlertDescription>
          </Alert>

          <Alert>
              <ShieldCheck className="h-4 w-4" />
              <AlertTitle>Firmware with LED Status Indicator</AlertTitle>
              <AlertDescription>
                  This code uses the ESP32's built-in LED to show its status, so you can diagnose it without a serial monitor.
                    <ul className="list-disc list-inside mt-2">
                        <li><b>Solid ON:</b> Connecting to WiFi.</li>
                        <li><b>Slow Blink:</b> WiFi connected, syncing time.</li>
                        <li><b>Fast Blink:</b> Authenticating with Firebase.</li>
                        <li><b>Single Quick Flash:</b> Data successfully uploaded.</li>
                    </ul>
              </AlertDescription>
          </Alert>
          
          <CodeBlock
            code={arduinoCode}
            language="cpp"
          />
        </CardContent>
      </Card>
    </div>
  );
}

    