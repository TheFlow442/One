
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
 * VoltaView ESP32 Integrated Firmware
 * - Reads real hardware sensors OR generates simulated data
 * - Sends live data to Firebase Realtime Database for multiple community users
 * - Uses WiFi + REST API
 * - Includes NTP time synchronization for accurate timestamps
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <EmonLib.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include "time.h"

// -------- SIMULATION MODE --------
// Set to 'true' to generate fake data without hardware.
// Set to 'false' if you have sensors connected.
#define USE_SIMULATED_DATA true

// -------- WIFI & FIREBASE CONFIG --------
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* WEB_API_KEY = "${apiKey}";
const char* PROJECT_ID = "${projectId}";

// -------- NTP & TIME --------
const char* NTP_SERVER = "pool.ntp.org";
const long  GMT_OFFSET_SEC = 0;
const int   DAYLIGHT_OFFSET_SEC = 0;

// -------- COMMUNITY USERS --------
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

// -------- PIN ASSIGNMENTS --------
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

// -------- CONSTANTS --------
const float R1 = 47000.0;
const float R2 = 10000.0;
const float ADC_REF = 3.3;
const int ADC_RES = 4095;
const float AC_CAL = 20.0;
const float ZMPT_CAL = 250.0;

// -------- OBJECTS --------
#if !USE_SIMULATED_DATA
EnergyMonitor emonPanelCurrent, emonBatteryCurrent;
EnergyMonitor emonInverterVoltage, emonInverterCurrent;
EnergyMonitor emonComA_V, emonComA_I;
EnergyMonitor emonComB_V, emonComB_I;
EnergyMonitor emonComC_V, emonComC_I;

OneWire oneWireBatt(BATT_TEMP_PIN);
DallasTemperature battTempSensor(&oneWireBatt);

OneWire oneWireInv(INV_TEMP_PIN);
DallasTemperature invTempSensor(&oneWireInv);
#endif

// -------- SENSOR VARIABLES --------
float panelV, panelI, batteryV, batteryI, batteryTemp;
float inverterV, inverterI, inverterTemp;
float comA_V, comA_I, comB_V, comB_I, comC_V, comC_I;
float irradiance, totalPower, batteryPercent;

// -------- TIMING --------
unsigned long lastUpload = 0;
const unsigned long uploadInterval = 2000; // 2 seconds

// -------- FUNCTION DECLARATIONS --------
void connectToWiFi();
void syncTime();
String getAuthToken(const char* email, const char* password);
void sendDataToRealtimeDB(String& idToken, const char* userId);
void updateSensors();
void controlRelays();
float readVoltageDivider(int pin);
float calcPower(float V, float I);
void updateSimulatedData();

// -------- SETUP --------
void setup() {
  Serial.begin(115200);
  while(!Serial); // Wait for Serial to be ready
  Serial.println("\\n=== VoltaView ESP32 - Realtime Database Firmware ===");

  connectToWiFi();
  syncTime();
  
  #if USE_SIMULATED_DATA
    randomSeed(analogRead(0));
    Serial.println("[INFO] Initialized in simulation mode.");
  #else
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
    Serial.println("[INFO] Initialized hardware sensors.");
  #endif
}

// -------- LOOP --------
void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WARN] WiFi disconnected. Attempting to reconnect...");
    connectToWiFi();
    // If connection is successful, re-sync time
    if(WiFi.status() == WL_CONNECTED) {
      syncTime();
    }
    return; // Skip the rest of the loop until connected
  }

  // Update sensor values (real or simulated)
  updateSensors();
  controlRelays();

  // Check if it's time to upload
  if (millis() - lastUpload > uploadInterval) {
    lastUpload = millis();
    Serial.println("\\n---------------------------------");
    Serial.printf("[INFO] %lu: Starting data upload cycle.\\n", millis());
    
    for (int i = 0; i < NUM_COMMUNITIES; i++) {
      Serial.printf("[INFO] Processing Community %d (%s)\\n", i + 1, communities[i].email);
      String idToken = getAuthToken(communities[i].email, communities[i].password);
      
      if (idToken.length() > 0) {
        Serial.printf("[OK] Authentication successful for %s\\n", communities[i].email);
        sendDataToRealtimeDB(idToken, communities[i].uid);
      } else {
        Serial.printf("[ERROR] Authentication failed for %s. Skipping upload for this user.\\n", communities[i].email);
      }
    }
    Serial.println("---------------------------------\\n");
  }
}

// -------- SENSOR FUNCTIONS --------
void updateSensors() {
  #if USE_SIMULATED_DATA
    updateSimulatedData();
  #else
    // Real sensor reading logic
    panelV = readVoltageDivider(PANEL_VOLT_PIN);
    panelI = emonPanelCurrent.calcIrms(1480);
    irradiance = map(analogRead(IRRADIANCE_PIN), 0, 4095, 0, 1000);
    batteryV = readVoltageDivider(BATTERY_VOLT_PIN);
    batteryI = emonBatteryCurrent.calcIrms(1480);
    battTempSensor.requestTemperatures();
    batteryTemp = battTempSensor.getTempCByIndex(0);
    batteryPercent = constrain(((batteryV - 11.8) / (14.4 - 11.8)) * 100, 0, 100);
    emonInverterVoltage.calcVI(20, 2000);
    inverterV = emonInverterVoltage.Vrms;
    inverterI = emonInverterCurrent.calcIrms(1480);
    invTempSensor.requestTemperatures();
    inverterTemp = invTempSensor.getTempCByIndex(0);
    totalPower = calcPower(inverterV, inverterI);
    emonComA_V.calcVI(20, 2000); comA_V = emonComA_V.Vrms; comA_I = emonComA_I.calcIrms(1480);
    emonComB_V.calcVI(20, 2000); comB_V = emonComB_V.Vrms; comB_I = emonComB_I.calcIrms(1480);
    emonComC_V.calcVI(20, 2000); comC_V = emonComC_V.Vrms; comC_I = emonComC_I.calcIrms(1480);
  #endif
}

void updateSimulatedData() {
    time_t now;
    struct tm timeinfo;
    time(&now);
    localtime_r(&now, &timeinfo);
    
    // Check if time is valid before using it
    if(timeinfo.tm_year < (2023 - 1900)) { // tm_year is years since 1900
        // Time not synced, use a fallback for simulation to avoid all zeroes
        irradiance = 500 + random(-100, 100);
    } else {
        // Generate a sine wave based on the hour of the day to simulate daylight
        float hour_of_day = timeinfo.tm_hour + timeinfo.tm_min / 60.0;
        float sine_wave = sin((hour_of_day - 6) * PI / 12); // Peaks at midday
        irradiance = (sine_wave > 0) ? 300 + (sine_wave * 600) + random(-50, 50) : 0;
    }
    irradiance = max(0.0f, irradiance);

    // Simulate panel and battery values based on irradiance
    panelV = 16.0 + (irradiance / 1000.0) * 2.0 + random(-10, 10) / 10.0;
    panelI = max(0.0f, (irradiance / 1000.0) * 5.0 + random(-2, 2) / 10.0);
    
    if (irradiance > 200) { // Charging during the day
        batteryI = 1.0 + (irradiance / 1000) * 1.5 + random(0, 5) / 10.0;
        batteryV = 13.0 + (irradiance / 1000) * 1.4;
        batteryTemp = 20.0 + (irradiance / 1000) * 10 + random(-2, 2);
    } else { // Discharging at night or on cloudy days
        batteryI = -2.0 - random(0, 10) / 10.0;
        batteryV = 12.5 - random(0, 5)/10.0;
        batteryTemp = 18.0 + random(-2, 2);
    }
    batteryV = constrain(batteryV, 11.8, 14.4);
    batteryPercent = constrain(((batteryV - 11.8) / (14.4 - 11.8)) * 100, 0, 100);

    // Simulate inverter and total power
    inverterV = 225.0 + random(-5, 5);
    inverterI = 1.5 + random(-5, 5) / 10.0;
    inverterTemp = 35.0 + random(-5, 5);
    totalPower = calcPower(inverterV, inverterI);

    // Simulate community loads with some variation
    comA_V = 225.0 + random(-2, 2);
    comA_I = max(0.1f, 0.5 + sin((timeinfo.tm_hour + timeinfo.tm_min / 60.0) * 0.5) * 0.4 + random(-10, 10) / 100.0);
    comB_V = 225.0 + random(-2, 2);
    comB_I = max(0.1f, 0.4 + sin((timeinfo.tm_hour + timeinfo.tm_min / 60.0) * 0.4) * 0.3 + random(-10, 10) / 100.0);
    comC_V = 225.0 + random(-2, 2);
    comC_I = max(0.1f, 0.6 + sin((timeinfo.tm_hour + timeinfo.tm_min / 60.0) * 0.6) * 0.5 + random(-10, 10) / 100.0);
}


void controlRelays() {
  bool active = (batteryV > 12.0); // Only supply power if battery has charge
  #if !USE_SIMULATED_DATA
    digitalWrite(RELAY_A, active);
    digitalWrite(RELAY_B, active);
    digitalWrite(RELAY_C, active);
  #endif
}

float readVoltageDivider(int pin) {
  #if USE_SIMULATED_DATA
    return 0; // Not used in sim mode
  #else
    int raw = analogRead(pin);
    float vout = (raw * ADC_REF) / ADC_RES;
    return vout * ((R1 + R2) / R2);
  #endif
}

float calcPower(float V, float I) {
  return V * I;
}

// -------- WIFI, TIME & FIREBASE FUNCTIONS --------
void connectToWiFi() {
  Serial.printf("[WIFI] Connecting to: %s\\n", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int tries = 0;
  while (WiFi.status() != WL_CONNECTED && tries < 30) {
    delay(500);
    Serial.print(".");
    tries++;
  }
  if (WiFi.status() == WL_CONNECTED)
    Serial.printf("\\n[WIFI] Connected! IP Address: %s\\n", WiFi.localIP().toString().c_str());
  else
    Serial.println("\\n[WIFI] Connection failed after several retries.");
}

void syncTime() {
    Serial.print("[TIME] Syncing time with NTP server...");
    configTime(GMT_OFFSET_SEC, DAYLIGHT_OFFSET_SEC, NTP_SERVER);
    struct tm timeinfo;
    if(!getLocalTime(&timeinfo)){
        Serial.println(" [FAIL]");
        Serial.println("[WARN] Failed to obtain time. Simulation might be inaccurate.");
    } else {
        Serial.println(" [OK]");
        Serial.printf("[TIME] Current time: %s", asctime(&timeinfo));
    }
}

String getAuthToken(const char* email, const char* password) {
  HTTPClient http;
  String url = "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=" + String(WEB_API_KEY);
  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  JsonDocument doc;
  doc["email"] = email;
  doc["password"] = password;
  doc["returnSecureToken"] = true;
  String body;
  serializeJson(doc, body);

  http.setTimeout(10000);
  int code = http.POST(body);

  if (code == 200) {
    JsonDocument resp;
    deserializeJson(resp, http.getString());
    http.end();
    return resp["idToken"].as<String>();
  } else {
    Serial.printf("[HTTP] Auth failed for %s. Code: %d, Response: %s\\n", email, code, http.getString().c_str());
    http.end();
    return "";
  }
}

void sendDataToRealtimeDB(String& idToken, const char* userId) {
  HTTPClient http;
  // Construct the URL for the Realtime Database REST API
  String url = "https://" + String(PROJECT_ID) + ".firebaseio.com/esp32_data/" + String(userId) + ".json?auth=" + idToken;

  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  JsonDocument doc;
  
  // Get current timestamp for the data
  char timestamp[30];
  struct tm timeinfo;
  if(getLocalTime(&timeinfo, 1000)){ // 1s timeout
    strftime(timestamp, sizeof(timestamp), "%Y-%m-%dT%H:%M:%SZ", &timeinfo);
    doc["timestamp"] = timestamp;
  } else {
    doc["timestamp"] = "1970-01-01T00:00:00Z"; // Fallback timestamp
  }
  
  // Add all sensor values to the JSON document
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
  
  // Add Firebase's server-side timestamp for a reliable "last updated" value
  doc[".sv"] = "timestamp";

  String json;
  serializeJson(doc, json);

  http.setTimeout(10000);
  // Use PUT to overwrite the data at the specified location
  int code = http.PUT(json);

  if (code == 200) {
    Serial.printf("[RTDB] Data sent successfully for user %s.\\n", userId);
  } else {
    Serial.printf("[RTDB] Upload failed for user %s. Code: %d\\n", userId, code);
    Serial.printf("[HTTP] Response: %s\\n", http.getString().c_str());
  }
  http.end();
}
`
  
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
          <div>
            <h3 className="text-lg font-semibold">Step 1: Prerequisites</h3>
            <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
              <li>ESP32 Development Board</li>
              <li>Arduino IDE or VS Code with PlatformIO</li>
              <li>Required Arduino Libraries: `WiFi`, `HTTPClient`, `ArduinoJson`, `EmonLib`, `OneWire`, `DallasTemperature`</li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Step 2: Configure Firmware</h3>
             <p className="text-muted-foreground mt-1">Copy the code below into your Arduino IDE. You must update the `WIFI_SSID` and `WIFI_PASSWORD` placeholders with your WiFi credentials.</p>
          </div>
            <Alert>
                <ShieldCheck className="h-4 w-4" />
                <AlertTitle>Security Note</AlertTitle>
                <AlertDescription>
                    Your Firebase Project ID and Web API Key are included in the code. This is secure and standard practice for public client-side applications. Access is controlled by Firebase Authentication and Security Rules, not by keeping the key secret.
                </AlertDescription>
            </Alert>
          <CodeBlock code={arduinoCode} language="cpp" />
        </CardContent>
      </Card>
    </div>
  );
}

    