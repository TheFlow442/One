
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
 * - Sends live data to Firebase Firestore for multiple community users
 * - Uses WiFi + REST API (no external Firebase library)
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
// Set to true to send simulated data instead of reading hardware sensors.
// Useful for testing the cloud and web app without physical hardware.
#define USE_SIMULATED_DATA true

// -------- WIFI & FIREBASE CONFIG --------
const char* WIFI_SSID = "DESKTOP";
const char* WIFI_PASSWORD = "1234567890";
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
const unsigned long uploadInterval = 2000; // every 2s for better responsiveness

// -------- FUNCTION DECLARATIONS --------
void connectToWiFi();
void syncTime();
String getAuthToken(const char* email, const char* password);
void sendDataToFirestore(String& idToken, const char* userId);
void updateSensors();
void controlRelays();
float readVoltageDivider(int pin);
float calcPower(float V, float I);
void updateSimulatedData();

// -------- SETUP --------
void setup() {
  Serial.begin(115200);
  Serial.println("\\n=== VoltaView ESP32 Integrated Firmware ===");

  connectToWiFi();
  syncTime();
  
  #if USE_SIMULATED_DATA
    randomSeed(analogRead(0));
  #else
    // Initialize real sensors
    battTempSensor.begin();
    invTempSensor.begin();

    // Relays
    pinMode(RELAY_A, OUTPUT);
    pinMode(RELAY_B, OUTPUT);
    pinMode(RELAY_C, OUTPUT);
    digitalWrite(RELAY_A, LOW);
    digitalWrite(RELAY_B, LOW);
    digitalWrite(RELAY_C, LOW);

    // Energy monitors
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
  #endif
}

// -------- LOOP --------
void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected. Reconnecting...");
    connectToWiFi();
    if(WiFi.status() == WL_CONNECTED) syncTime();
    return;
  }

  updateSensors();
  controlRelays();

  if (millis() - lastUpload > uploadInterval) {
    lastUpload = millis();
    for (int i = 0; i < NUM_COMMUNITIES; i++) {
      Serial.printf("\\n--- Uploading data for %s ---\\n", communities[i].email);
      String idToken = getAuthToken(communities[i].email, communities[i].password);
      if (idToken.length() > 0) {
        sendDataToFirestore(idToken, communities[i].uid);
      }
    }
  }

  delay(1000);
}

// -------- SENSOR FUNCTIONS --------
void updateSensors() {
  #if USE_SIMULATED_DATA
    updateSimulatedData();
  #else
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

  Serial.printf("Panel: %.2fV %.2fA | Batt: %.2fV %.2fA %.2f°C | Inv: %.2fV %.2fA %.2f°C\\n",
                panelV, panelI, batteryV, batteryI, batteryTemp, inverterV, inverterI, inverterTemp);
}

void updateSimulatedData() {
    // Simulate time-of-day for realistic solar data
    time_t now;
    struct tm timeinfo;
    time(&now);
    localtime_r(&now, &timeinfo);
    float hour_of_day = timeinfo.tm_hour + timeinfo.tm_min / 60.0;
    
    // Simulate a sine wave for solar irradiance based on time of day
    float sine_wave = sin((hour_of_day - 6) * PI / 12); // Peaks at noon (12)
    irradiance = (sine_wave > 0) ? 300 + (sine_wave * 600) + random(-50, 50) : 0;
    irradiance = max(0.0f, irradiance);

    panelV = 16.0 + (irradiance / 1000.0) * 2.0 + random(-10, 10) / 10.0;
    panelI = (irradiance / 1000.0) * 5.0 + random(-2, 2) / 10.0;
    
    // Simulate battery charging/discharging
    if (irradiance > 200) { // Charging during the day
        batteryI = 1.0 + (irradiance / 1000) * 1.5 + random(0, 5) / 10.0;
        batteryV = 13.0 + (irradiance / 1000) * 1.4;
        batteryTemp = 20.0 + (irradiance / 1000) * 10 + random(-2, 2);
    } else { // Discharging at night
        batteryI = -2.0 - random(0, 10) / 10.0; // Negative for discharging
        batteryV = 12.5 - random(0, 5)/10.0;
        batteryTemp = 18.0 + random(-2, 2);
    }
    batteryV = constrain(batteryV, 11.8, 14.4);
    batteryPercent = constrain(((batteryV - 11.8) / (14.4 - 11.8)) * 100, 0, 100);

    // Simulate inverter and load
    inverterV = 225.0 + random(-5, 5);
    inverterI = 1.5 + random(-5, 5) / 10.0;
    inverterTemp = 35.0 + random(-5, 5);
    totalPower = calcPower(inverterV, inverterI);

    // Simulate community loads
    comA_V = 225.0 + random(-2, 2);
    comA_I = 0.5 + random(-2, 2) / 10.0;
    comB_V = 225.0 + random(-2, 2);
    comB_I = 0.4 + random(-2, 2) / 10.0;
    comC_V = 225.0 + random(-2, 2);
    comC_I = 0.6 + random(-2, 2) / 10.0;
}


void controlRelays() {
  bool active = (batteryV > 12.0 && panelV > 15.0);
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
  Serial.printf("Connecting to WiFi: %s\\n", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int tries = 0;
  while (WiFi.status() != WL_CONNECTED && tries < 30) {
    delay(500);
    Serial.print(".");
    tries++;
  }
  if (WiFi.status() == WL_CONNECTED)
    Serial.printf("\\nConnected! IP: %s\\n", WiFi.localIP().toString().c_str());
  else
    Serial.println("\\nWiFi connection failed.");
}

void syncTime() {
  Serial.print("Syncing time with NTP server...");
  configTime(GMT_OFFSET_SEC, DAYLIGHT_OFFSET_SEC, NTP_SERVER);
  struct tm timeinfo;
  if(!getLocalTime(&timeinfo)){
    Serial.println(" Failed to obtain time. Retrying...");
    delay(1000);
    syncTime();
    return;
  }
  Serial.println(" Time synchronized.");
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
    Serial.println("Auth success!");
    return resp["idToken"].as<String>();
  } else {
    Serial.printf("Auth failed (%s): %d\\n", email, code);
    Serial.println(http.getString());
    http.end();
    return "";
  }
}

void sendDataToFirestore(String& idToken, const char* userId) {
  HTTPClient http;
  String url = "https://firestore.googleapis.com/v1/projects/" + String(PROJECT_ID) +
               "/databases/(default)/documents/users/" + String(userId) + "/esp32_data";

  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", "Bearer " + idToken);

  JsonDocument doc;
  JsonObject f = doc["fields"].to<JsonObject>();

  // Add timestamp
  struct tm timeinfo;
  if(getLocalTime(&timeinfo)){
    char timestamp[30];
    strftime(timestamp, sizeof(timestamp), "%Y-%m-%dT%H:%M:%SZ", &timeinfo);
    f["timestamp"]["stringValue"] = timestamp; // Firestore expects a string for serverValue timestamp
  } else {
    Serial.println("Failed to get local time for timestamp!");
  }

  f["panelV"]["doubleValue"] = panelV;
  f["panelI"]["doubleValue"] = panelI;
  f["batteryV"]["doubleValue"] = batteryV;
  f["batteryI"]["doubleValue"] = batteryI;
  f["batteryTemp"]["doubleValue"] = batteryTemp;
  f["batteryPercent"]["doubleValue"] = batteryPercent;
  f["inverterV"]["doubleValue"] = inverterV;
  f["inverterI"]["doubleValue"] = inverterI;
  f["inverterTemp"]["doubleValue"] = inverterTemp;
  f["totalPower"]["doubleValue"] = totalPower;
  f["irradiance"]["doubleValue"] = irradiance;

  f["comA_V"]["doubleValue"] = comA_V;
  f["comA_I"]["doubleValue"] = comA_I;
  f["comB_V"]["doubleValue"] = comB_V;
  f["comB_I"]["doubleValue"] = comB_I;
  f["comC_V"]["doubleValue"] = comC_V;
  f["comC_I"]["doubleValue"] = comC_I;

  String json;
  serializeJson(doc, json);

  http.setTimeout(10000);
  int code = http.POST(json);

  if (code >= 200 && code < 300) {
    Serial.printf("Data sent to Firestore (%s): %d\\n", userId, code);
  } else {
    Serial.printf("Firestore upload failed: %d\\n", code);
    Serial.println(http.getString());
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
            Follow these steps to connect your ESP32 device and start sending data to the VoltaView dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold">1. Hardware Requirements</h3>
            <ul className="list-disc list-inside text-muted-foreground mt-2">
              <li>ESP32 Development Board</li>
              <li>Required sensors for voltage, current, and temperature (or use simulation mode)</li>
              <li>Breadboard and jumper wires</li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold">2. Software Setup</h3>
            <ul className="list-disc list-inside text-muted-foreground mt-2">
              <li>Install the Arduino IDE</li>
              <li>Install the ESP32 board definitions</li>
              <li>Install necessary libraries: <code className='bg-muted p-1 rounded-sm'>ArduinoJson</code>, <code className='bg-muted p-1 rounded-sm'>EmonLib</code>, <code className='bg-muted p-1 rounded-sm'>OneWire</code>, <code className='bg-muted p-1 rounded-sm'>DallasTemperature</code></li>
            </ul>
          </div>
           <Alert>
              <ShieldCheck className="h-4 w-4" />
              <AlertTitle>Your Project Credentials</AlertTitle>
              <AlertDescription>
                The code below is pre-configured with your unique Firebase project ID and API key.
              </AlertDescription>
            </Alert>
          <div>
            <h3 className="text-lg font-semibold">3. Upload Firmware</h3>
            <p className="text-muted-foreground">Copy and paste the code below into a new Arduino sketch, update your <code className="bg-muted p-1 rounded-sm">WIFI_SSID</code> and <code className="bg-muted p-1 rounded-sm">WIFI_PASSWORD</code>, and upload it to your ESP32. Set <code className='bg-muted p-1 rounded-sm'>USE_SIMULATED_DATA</code> to <code className='bg-muted p-1 rounded-sm'>false</code> if you have real sensors connected.</p>
          </div>
          <CodeBlock code={arduinoCode} language="cpp" />
        </CardContent>
      </Card>
    </div>
  );
}

    

    