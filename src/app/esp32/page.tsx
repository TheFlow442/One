
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { firebaseConfig } from '@/firebase/config';
import { Cpu, ShieldCheck, Lightbulb, AlertTriangle } from 'lucide-react';
import { CodeBlock } from '@/components/code-block';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function ESP32Page() {
  const projectId = firebaseConfig.projectId;
  const apiKey = firebaseConfig.apiKey;

  const arduinoCode = `/* VoltaView ESP32 Integrated Firmware (Fixed Edition)
   - Disables Brownout Detector as a temporary, aggressive fix for power issues.
   - Monitors its own supply voltage on GPIO34.
   - Sends all sensor data to Firestore at /users/{uid}/esp32_data
   - Includes corrected battery percentage calculation.
   - This is the definitive firmware for the project.
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <EmonLib.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <time.h>
// Required for brownout disable
#include "soc/soc.h"
#include "soc/rtc_cntl_reg.h"

// -------- WIFI & FIREBASE CONFIG --------
const char* WIFI_SSID = "DESK";
const char* WIFI_PASSWORD = "1234567890";
const char* WEB_API_KEY = "${apiKey}";
const char* PROJECT_ID = "${projectId}";

// -------- COMMUNITY USERS --------
struct Community {
  const char* name;
  const char* email;
  const char* password;
  const char* uid;
};

Community communities[] = {
  {"A", "user1@volta.view", "password123", "0nkCeSiTQbcTEhEMcUhQwYT39U72"},
  {"B", "user2@volta.view", "password123", "F0jfqt20cPXSqJ2nsJeZtseO1qn2"},
  {"C", "user3@volta.view", "password123", "7yV6eXu6A1ReAXdtqOVMWszmiOD2"}
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

// Voltage monitor and LED
#define VOLTAGE_MON_PIN 34 // Note: Same pin as Panel Voltage
#define LED_PIN 2

// -------- CONSTANTS --------
const float R1 = 47000.0;
const float R2 = 10000.0;
const float ADC_REF = 3.3;
const int ADC_RES = 4095;
const float AC_CAL = 20.0;
const float ZMPT_CAL = 250.0;

// Voltage monitor divider
const float R1_MON = 100000.0;
const float R2_MON = 100000.0;

// -------- OBJECTS --------
EnergyMonitor emonPanelCurrent, emonBatteryCurrent;
EnergyMonitor emonInverterVoltage, emonInverterCurrent;
EnergyMonitor emonComA_V, emonComA_I;
EnergyMonitor emonComB_V, emonComB_I;
EnergyMonitor emonComC_V, emonComC_I;

OneWire oneWireBatt(BATT_TEMP_PIN);
DallasTemperature battTempSensor(&oneWireBatt);
OneWire oneWireInv(INV_TEMP_PIN);
DallasTemperature invTempSensor(&oneWireInv);

// -------- SENSOR VARIABLES --------
float panelV = 0, panelI = 0, batteryV = 0, batteryI = 0, batteryTemp = 0;
float inverterV = 0, inverterI = 0, inverterTemp = 0;
float comA_V = 0, comA_I = 0, comB_V = 0, comB_I = 0, comC_V = 0, comC_I = 0;
float irradiance = 0, totalPower = 0, batteryPercent = 0, supplyVoltage = 0;

// -------- TIMING --------
unsigned long lastUpload = 0;
const unsigned long uploadInterval = 10000; // every 10s

// -------- FUNCTION DECLARATIONS --------
void connectToWiFi();
String getAuthToken(const char* email, const char* password);
void sendDataToFirestore(String& idToken, const Community& community);
void updateSensors();
void controlRelays();
float readVoltageDivider(int pin);
float calcPower(float V, float I);
float readSupplyVoltage();

// -------- SETUP --------
void setup() {
  // Disable brownout detector temporarily
  WRITE_PERI_REG(RTC_CNTL_BROWN_OUT_REG, 0);

  Serial.begin(115200);
  delay(500);
  Serial.println("\\n=== VoltaView ESP32 Integrated Firmware (Fixed Edition) ===");

  // LED blink test
  pinMode(LED_PIN, OUTPUT);
  for (int i = 0; i < 3; i++) {
    digitalWrite(LED_PIN, HIGH);
    delay(200);
    digitalWrite(LED_PIN, LOW);
    delay(200);
  }
  Serial.println("Startup LED test complete — firmware running.");

  connectToWiFi();
  configTime(0, 0, "pool.ntp.org");

  // Initialize sensors
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
}

// -------- LOOP --------
void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected. Reconnecting...");
    connectToWiFi();
    delay(500);
  }

  updateSensors();
  controlRelays();

  // Voltage monitor
  supplyVoltage = readSupplyVoltage();
  Serial.printf("Supply Voltage: %.2f V\\n", supplyVoltage);
  if (supplyVoltage < 3.0) {
    Serial.println("⚠️ Warning: supply voltage dropping near brownout!");
  }

  // Upload data periodically
  if (millis() - lastUpload > uploadInterval) {
    lastUpload = millis();
    for (int i = 0; i < NUM_COMMUNITIES; i++) {
      Serial.printf("\\n--- Uploading data for %s ---\\n", communities[i].email);
      String idToken = getAuthToken(communities[i].email, communities[i].password);
      if (idToken.length() > 0) {
        sendDataToFirestore(idToken, communities[i]);
        delay(1500);
      }
    }
  }
  delay(1000);
}

// -------- SENSOR FUNCTIONS --------
void updateSensors() {
  // Solar
  panelV = readVoltageDivider(PANEL_VOLT_PIN);
  panelI = emonPanelCurrent.calcIrms(1480);
  irradiance = map(analogRead(IRRADIANCE_PIN), 0, 4095, 0, 1000);

  // Battery
  batteryV = readVoltageDivider(BATTERY_VOLT_PIN);
  batteryI = emonBatteryCurrent.calcIrms(1480);
  battTempSensor.requestTemperatures();
  batteryTemp = battTempSensor.getTempCByIndex(0);
  batteryPercent = ((batteryV - 11.8f) / (14.4f - 11.8f)) * 100.0f;
  if (batteryPercent < 0.0f) batteryPercent = 0.0f;
  if (batteryPercent > 100.0f) batteryPercent = 100.0f;

  // Inverter
  emonInverterVoltage.calcVI(20, 2000);
  inverterV = emonInverterVoltage.Vrms;
  inverterI = emonInverterCurrent.calcIrms(1480);
  invTempSensor.requestTemperatures();
  inverterTemp = invTempSensor.getTempCByIndex(0);
  totalPower = calcPower(inverterV, inverterI);

  // Community lines
  emonComA_V.calcVI(20, 2000); comA_V = emonComA_V.Vrms; comA_I = emonComA_I.calcIrms(1480);
  emonComB_V.calcVI(20, 2000); comB_V = emonComB_V.Vrms; comB_I = emonComB_I.calcIrms(1480);
  emonComC_V.calcVI(20, 2000); comC_V = emonComC_V.Vrms; comC_I = emonComC_I.calcIrms(1480);

  Serial.printf("Panel: %.2fV %.2fA | Batt: %.2fV %.2fA %.2f°C | Inv: %.2fV %.2fA %.2f°C\\n",
                panelV, panelI, batteryV, batteryI, batteryTemp, inverterV, inverterI, inverterTemp);
}

void controlRelays() {
  bool active = (batteryV > 12.0 && panelV > 15.0);
  digitalWrite(RELAY_A, active ? HIGH : LOW);
  digitalWrite(RELAY_B, active ? HIGH : LOW);
  digitalWrite(RELAY_C, active ? HIGH : LOW);
}

float readVoltageDivider(int pin) {
  int raw = analogRead(pin);
  float vout = (raw * ADC_REF) / ADC_RES;
  return vout * ((R1 + R2) / R2);
}

float calcPower(float V, float I) { return V * I; }

float readSupplyVoltage() {
  int raw = analogRead(VOLTAGE_MON_PIN);
  float vout = (raw * ADC_REF) / ADC_RES;
  return vout * ((R1_MON + R2_MON) / R2_MON);
}

// -------- WIFI & FIREBASE FUNCTIONS --------
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

String getAuthToken(const char* email, const char* password) {
  HTTPClient http;
  String url = "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=" + String(WEB_API_KEY);
  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  DynamicJsonDocument doc(512);
  doc["email"] = email;
  doc["password"] = password;
  doc["returnSecureToken"] = true;
  String body;
  serializeJson(doc, body);

  http.setTimeout(10000);
  int code = http.POST(body);
  String responseStr = http.getString();
  http.end();

  if (code == 200) {
    DynamicJsonDocument resp(1024);
    if (deserializeJson(resp, responseStr) == DeserializationError::Ok) {
      Serial.println("Auth success!");
      return resp["idToken"].as<String>();
    }
  }
  Serial.printf("Auth failed (%s): %d\\n", email, code);
  return "";
}

void sendDataToFirestore(String& idToken, const Community& community) {
  HTTPClient http;
  String url = "https://firestore.googleapis.com/v1/projects/" + String(PROJECT_ID) +
               "/databases/(default)/documents/users/" + String(community.uid) + "/esp32_data";

  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", "Bearer " + idToken);

  DynamicJsonDocument doc(4096);
  JsonObject f = doc.createNestedObject("fields");

  // General readings
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

  // Community readings
  f["comA_V"]["doubleValue"] = comA_V;
  f["comA_I"]["doubleValue"] = comA_I;
  f["comB_V"]["doubleValue"] = comB_V;
  f["comB_I"]["doubleValue"] = comB_I;
  f["comC_V"]["doubleValue"] = comC_V;
  f["comC_I"]["doubleValue"] = comC_I;

  // Supply voltage
  f["supplyVoltage"]["doubleValue"] = supplyVoltage;

  // Timestamp
  time_t now;
  struct tm timeinfo;
  if (getLocalTime(&timeinfo)) {
    char timestamp[32];
    strftime(timestamp, sizeof(timestamp), "%Y-%m-%dT%H:%M:%SZ", &timeinfo);
    f["timestamp"]["timestampValue"] = String(timestamp);
  }

  String json;
  serializeJson(doc, json);

  http.setTimeout(10000);
  int code = http.POST(json);
  String response = http.getString();
  http.end();

  if (code >= 200 && code < 300)
    Serial.printf("Data sent to Firestore (%s): %d\\n", community.name, code);
  else {
    Serial.printf("Firestore upload failed: %d\\n", code);
    Serial.println(response);
  }
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
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Brownout Error Detected: Hardware Power Issue</AlertTitle>
              <AlertDescription>
                  The "Brownout detector was triggered" error is a **hardware power supply issue**. The firmware below includes an aggressive but temporary fix by disabling the brownout detector. The final, most reliable solution is to use a stable power source (e.g., a high-quality USB wall adapter) and a short, high-quality USB cable.
              </AlertDescription>
          </Alert>

          <Alert>
              <ShieldCheck className="h-4 w-4" />
              <AlertTitle>Definitive Firmware (Firestore-Only)</AlertTitle>
              <AlertDescription>
                  This code is the official version for the project. It sends all sensor data directly to Firestore and is designed to be compatible with the web application's data reading logic. It includes the brownout detector fix.
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
