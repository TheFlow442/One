
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { firebaseConfig } from '@/firebase/config';
import { Cpu, ShieldCheck } from 'lucide-react';
import { CodeBlock } from '@/components/code-block';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function ESP32Page() {
  const projectId = firebaseConfig.projectId;
  const apiKey = firebaseConfig.apiKey;

  const arduinoCode = `/*
 * VoltaView ESP32 - Modular Hybrid Firmware (Firestore + Realtime DB)
 *
 * - Hybrid mode: Real sensors when available; simulated fallback otherwise
 * - Sends each upload to Firestore (/users/{uid}/esp32_data) and Realtime DB (/esp32_live/{uid})
 * - Token caching per community (reduces Auth calls)
 * - NTP time sync, reconnect handling, brownout-mitigation delays
 * - Target board: ESP32 Dev Module
 *
 * Libraries required:
 * - ArduinoJson
 * - EmonLib
 * - OneWire
 * - DallasTemperature
 *
 * Notes:
 * - Replace WIFI_SSID, WIFI_PASSWORD, WEB_API_KEY, PROJECT_ID as needed
 * - Ensure Firebase users exist and correct passwords are set
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>       // use ArduinoJson 6/7
#include <EmonLib.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <math.h>
#include "time.h"

// ======================= CONFIG =======================
#define USE_SIMULATED_DATA false   // true = force sim-only; false = use hardware with simulated fallbacks

// WiFi / Firebase config
const char* WIFI_SSID      = "YOUR_WIFI_SSID";          // <- change
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";        // <- change
const char* WEB_API_KEY    = "${apiKey}"; // <- change if needed
const char* PROJECT_ID     = "${projectId}";     // <- change if needed
const char* RTDB_BASE_URL = "https://${projectId}-default-rtdb.firebaseio.com/"; // RealTime DB base

// NTP
const char* NTP_SERVER = "pool.ntp.org";
const long GMT_OFFSET_SEC = 0;
const int DAYLIGHT_OFFSET_SEC = 0;

// Upload interval (ms)
const unsigned long UPLOAD_INTERVAL_MS = 5000UL; // 5 seconds

// ======================= COMMUNITIES (3 UIDs) =======================
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

// ======================= PINS & CONSTANTS =======================
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

const float R1 = 47000.0f;
const float R2 = 10000.0f;
const float ADC_REF = 3.3f;
const int ADC_RES = 4095;
const float AC_CAL = 20.0f;
const float ZMPT_CAL = 250.0f;

// ======================= OBJECTS (only with hardware) =======================
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

// ======================= GLOBAL SENSOR STATE =======================
float panelV = 0.0f, panelI = 0.0f;
float batteryV = 0.0f, batteryI = 0.0f, batteryTemp = 0.0f, batteryPercent = 0.0f;
float inverterV = 0.0f, inverterI = 0.0f, inverterTemp = 0.0f, totalPower = 0.0f;
float comA_V = 0.0f, comA_I = 0.0f, comB_V = 0.0f, comB_I = 0.0f, comC_V = 0.0f, comC_I = 0.0f;
float irradiance = 0.0f;

// ======================= AUTH TOKEN CACHE (per community) =======================
String cachedIdToken[NUM_COMMUNITIES];
unsigned long tokenExpiryMillis[NUM_COMMUNITIES]; // epoch millis when token expires (approx)

// ======================= TIMING =======================
unsigned long lastUploadMs = 0;

// ======================= FORWARD DECLARATIONS =======================
void connectToWiFi();
void syncTime();
String getAuthTokenCached(int communityIndex);
String doAuthRequest(const char* email, const char* password, unsigned long &expiresInSec);
void sendToRealtimeDB(const String &idToken, const char* userId);
void sendToFirestore(const String &idToken, const char* userId);
void updateSensors();
void updateSimulatedData();
void controlRelays();
float readVoltageDivider(int pin);
float calcPower(float V, float I);

// ======================= SETUP (Restructured for sequential boot) =======================
void setup() {
    Serial.begin(115200);
    while (!Serial) { delay(10); } // wait for serial
    Serial.println("\\n=== VoltaView ESP32 - Modular Hybrid Firmware ===");

    // small delay to give power rails a moment (helpful for brownout)
    delay(200);

    // 1. Connect to WiFi - BLOCKING call that ensures connection before proceeding.
    connectToWiFi();

    // 2. Sync Time (requires Wi-Fi)
    syncTime();

    // 3. Initialize Sensors/Peripherals (Now occurs only after successful Wi-Fi and Time sync)
#if !USE_SIMULATED_DATA
    // initialize hardware peripherals
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
#else
    // seed random with floating analog read
    randomSeed(analogRead(0));
    Serial.println("[INFO] Running in SIMULATION mode.");
#endif

    // 4. Initialize token cache entries
    for (int i = 0; i < NUM_COMMUNITIES; ++i) {
        cachedIdToken[i] = "";
        tokenExpiryMillis[i] = 0;
    }
}

// ======================= LOOP =======================
void loop() {
    // keep WiFi alive
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("[WARN] WiFi disconnected - reconnecting...");
        connectToWiFi(); // Block until connected
        syncTime();      // Re-sync time after reconnect
    }

    // update sensor readings (hardware or simulated fallback)
    updateSensors();

    // control relays depending on battery level
    controlRelays();

    // periodic upload
    unsigned long now = millis();
    if (now - lastUploadMs >= UPLOAD_INTERVAL_MS) {
        lastUploadMs = now;
        Serial.println("=== Upload Cycle ===");
        for (int i = 0; i < NUM_COMMUNITIES; ++i) {
            Serial.printf("[INFO] Preparing upload for community %d (%s)\\n", i + 1, communities[i].email);
            String idToken = getAuthTokenCached(i);
            if (idToken.length() > 0) {
                sendToRealtimeDB(idToken, communities[i].uid);
                delay(150); // small gap
                sendToFirestore(idToken, communities[i].uid);
                delay(150);
            } else {
                Serial.printf("[ERROR] No valid idToken for %s — skipping.\\n", communities[i].email);
            }
        }
        Serial.println("====================");
    }

    // small loop delay to reduce busy-waiting
    delay(200);
}

// ======================= SENSORS / SIMULATION =======================
void updateSensors() {
#if USE_SIMULATED_DATA
    updateSimulatedData();
#else
    // Real sensor reads (attempt)
    panelV = readVoltageDivider(PANEL_VOLT_PIN);
    panelI = emonPanelCurrent.calcIrms(1480);
    irradiance = map(analogRead(IRRADIANCE_PIN), 0, 4095, 0, 1000);

    batteryV = readVoltageDivider(BATTERY_VOLT_PIN);
    batteryI = emonBatteryCurrent.calcIrms(1480);
    battTempSensor.requestTemperatures();
    batteryTemp = battTempSensor.getTempCByIndex(0);
    batteryPercent = constrain(((batteryV - 11.8f) / (14.4f - 11.8f)) * 100.0f, 0.0f, 100.0f);

    emonInverterVoltage.calcVI(20, 2000);
    inverterV = emonInverterVoltage.Vrms;
    inverterI = emonInverterCurrent.calcIrms(1480);
    invTempSensor.requestTemperatures();
    inverterTemp = invTempSensor.getTempCByIndex(0);
    totalPower = calcPower(inverterV, inverterI);

    emonComA_V.calcVI(20, 2000); comA_V = emonComA_V.Vrms; comA_I = emonComA_I.calcIrms(1480);
    emonComB_V.calcVI(20, 2000); comB_V = emonComB_V.Vrms; comB_I = emonComB_I.calcIrms(1480);
    emonComC_V.calcVI(20, 2000); comC_V = emonComC_V.Vrms; comC_I = emonComC_I.calcIrms(1480);

    // validate panelV: if it's NaN or zero (no sensors connected), fall back to simulation
    if (!isfinite(panelV) || panelV <= 0.05f) {
        Serial.println("[WARN] Invalid hardware reads detected — using simulated fallback for this cycle.");
        updateSimulatedData();
    }
#endif
}

void updateSimulatedData() {
    // Build a simple daylight model and randomized variation
    time_t now;
    struct tm timeinfo;
    time(&now);
    localtime_r(&now, &timeinfo);

    float hour_of_day = (float)timeinfo.tm_hour + (float)timeinfo.tm_min / 60.0f;
    float sine_wave = sinf((hour_of_day - 6.0f) * (PI / 12.0f)); // -1..1 with peak ~ noon
    if (sine_wave < 0.0f) sine_wave = 0.0f;

    irradiance = (sine_wave > 0.0f) ? (300.0f + sine_wave * 600.0f + (float)random(-50, 50)) : (float)random(0, 20);

    panelV = 16.0f + (irradiance / 1000.0f) * 2.0f + ((float)random(-10, 10) / 10.0f);
    panelI = max(0.0f, (irradiance / 1000.0f) * 5.0f + ((float)random(-2, 2) / 10.0f));

    if (irradiance > 200.0f) {
        batteryI = 1.0f + (irradiance / 1000.0f) * 1.5f + ((float)random(0, 5) / 10.0f);
        batteryV = 13.0f + (irradiance / 1000.0f) * 1.4f;
        batteryTemp = 20.0f + (irradiance / 1000.0f) * 10.0f + (float)random(-2, 2);
    } else {
        batteryI = -2.0f - ((float)random(0, 10) / 10.0f);
        batteryV = 12.5f - ((float)random(0, 5) / 10.0f);
        batteryTemp = 18.0f + (float)random(-2, 2);
    }
    batteryV = constrain(batteryV, 11.8f, 14.4f);
    batteryPercent = constrain(((batteryV - 11.8f) / (14.4f - 11.8f)) * 100.0f, 0.0f, 100.0f);

    inverterV = 225.0f + (float)random(-5, 5);
    inverterI = 1.5f + ((float)random(-5, 5) / 10.0f);
    inverterTemp = 35.0f + (float)random(-5, 5);
    totalPower = calcPower(inverterV, inverterI);

    comA_V = 225.0f + (float)random(-2, 2);
    float hourf = hour_of_day;
    comA_I = max(0.1f, 0.5f + sinf(hourf * 0.5f) * 0.4f + ((float)random(-10, 10) / 100.0f));
    comB_V = 225.0f + (float)random(-2, 2);
    comB_I = max(0.1f, 0.4f + sinf(hourf * 0.4f) * 0.3f + ((float)random(-10, 10) / 100.0f));
    comC_V = 225.0f + (float)random(-2, 2);
    comC_I = max(0.1f, 0.6f + sinf(hourf * 0.6f) * 0.5f + ((float)random(-10, 10) / 100.0f));
}

// ======================= RELAY CONTROL =======================
void controlRelays() {
    bool active = (batteryV > 12.0f);
#if !USE_SIMULATED_DATA
    digitalWrite(RELAY_A, active ? HIGH : LOW);
    digitalWrite(RELAY_B, active ? HIGH : LOW);
    digitalWrite(RELAY_C, active ? HIGH : LOW);
#endif
}

// ======================= UTILS =======================
float readVoltageDivider(int pin) {
#if USE_SIMULATED_DATA
    return 0.0f;
#else
    int raw = analogRead(pin);
    float vout = ((float)raw * ADC_REF) / (float)ADC_RES;
    return vout * ((R1 + R2) / R2);
#endif
}

float calcPower(float V, float I) {
    return V * I;
}

// ======================= NETWORK & AUTH (Modified connectToWiFi) =======================
void connectToWiFi() {
    // This function is modified to BLOCK until a successful connection is made.
    Serial.printf("[WIFI] Connecting to %s\\n", WIFI_SSID);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    int tries = 0;
    const int MAX_TRIES = 80; // Allows up to 20 seconds for the initial connection

    while (WiFi.status() != WL_CONNECTED) {
        if (tries >= MAX_TRIES) {
             Serial.println("\\n[WIFI] Connection failed after max tries. Retrying indefinitely...");
             tries = 0; // Reset tries and continue loop
        }
        delay(250);
        Serial.print(".");
        tries++;
    }

    Serial.printf("\\n[WIFI] Connected. IP: %s\\n", WiFi.localIP().toString().c_str());
}

void syncTime() {
    Serial.print("[TIME] Syncing NTP...");
    configTime(GMT_OFFSET_SEC, DAYLIGHT_OFFSET_SEC, NTP_SERVER);
    struct tm timeinfo;
    if (!getLocalTime(&timeinfo)) {
        Serial.println(" [FAIL]");
    } else {
        Serial.println(" [OK]");
        Serial.printf("[TIME] %s", asctime(&timeinfo));
    }
}

// Get cached token or request a new one when expired
String getAuthTokenCached(int communityIndex) {
    unsigned long nowMs = millis();
    if (cachedIdToken[communityIndex].length() > 0 && tokenExpiryMillis[communityIndex] > nowMs + 2000UL) {
        // cached token still valid (with 2s safety margin)
        return cachedIdToken[communityIndex];
    }

    unsigned long expiresInSec = 0;
    String token = doAuthRequest(communities[communityIndex].email, communities[communityIndex].password, expiresInSec);
    if (token.length() > 0 && expiresInSec > 0) {
        cachedIdToken[communityIndex] = token;
        // convert expiry seconds to millis since now
        tokenExpiryMillis[communityIndex] = millis() + (expiresInSec * 1000UL);
        Serial.printf("[AUTH] Cached token for community %d (expires in %lus)\\n", communityIndex + 1, expiresInSec);
    }
    return token;
}

// Perform REST auth and return idToken; also returns expiresIn seconds via reference
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

    http.setTimeout(10000);
    int code = http.POST(body);
    if (code != 200) {
        Serial.printf("[AUTH] Failed to authenticate %s (code=%d): %s\\n", email, code, http.getString().c_str());
        http.end();
        expiresInSec = 0;
        return "";
    }

    String resp = http.getString();
    http.end();

    DynamicJsonDocument respDoc(1024);
    DeserializationError err = deserializeJson(respDoc, resp);
    if (err) {
        Serial.println("[AUTH] Failed to parse auth response");
        expiresInSec = 0;
        return "";
    }

    const char* idToken = respDoc["idToken"] | "";
    const char* refreshToken = respDoc["refreshToken"] | "";
    expiresInSec = (unsigned long)(respDoc["expiresIn"] | 3600); // fallback to 1h

    if (strlen(idToken) == 0) {
        Serial.println("[AUTH] No idToken returned");
        return "";
    }

    return String(idToken);
}

// ======================= UPLOAD: Realtime DB =======================
void sendToRealtimeDB(const String &idToken, const char* userId) {
    // Path: /esp32_live/{uid}.json?auth=<idToken>
    String url = String(RTDB_BASE_URL) + "esp32_live/" + String(userId) + ".json?auth=" + idToken;
    HTTPClient http;
    http.begin(url);
    http.addHeader("Content-Type", "application/json");

    DynamicJsonDocument doc(2048);

    // client-side ISO timestamp as convenience
    char tsBuf[32];
    struct tm timeinfo;
    if (getLocalTime(&timeinfo)) {
        strftime(tsBuf, sizeof(tsBuf), "%Y-%m-%dT%H:%M:%SZ", &timeinfo);
        doc["timestamp"] = tsBuf;
    } else {
        doc["timestamp"] = "1970-01-01T00:00:00Z";
    }

    // sensor fields
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

    // Add server timestamp using RTDB's ".sv" special key
    JsonObject serverTsObj = doc.createNestedObject("serverTimestamp");
    serverTsObj[".sv"] = "timestamp";

    String out;
    serializeJson(doc, out);

    http.setTimeout(10000);
    // Use PATCH so we update fields without overwriting other nodes
    int code = http.PATCH(out);
    if (code >= 200 && code < 300) {
        Serial.printf("[RTDB] OK %s (code=%d)\\n", userId, code);
    } else {
        Serial.printf("[RTDB] FAIL %s (code=%d): %s\\n", userId, code, http.getString().c_str());
    }
    http.end();
}

// ======================= UPLOAD: Firestore =======================
void sendToFirestore(const String &idToken, const char* userId) {
    // POST to collection to create doc:
    // https://firestore.googleapis.com/v1/projects/<PROJECT_ID>/databases/(default)/documents/users/<uid>/esp32_data
    String url = "https://firestore.googleapis.com/v1/projects/" + String(PROJECT_ID) +
                 "/databases/(default)/documents/users/" + String(userId) + "/esp32_data";

    HTTPClient http;
    http.begin(url);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("Authorization", "Bearer " + idToken);

    DynamicJsonDocument doc(4096);
    JsonObject fields = doc.createNestedObject("fields");

    // Helper to set a double field
    auto setDouble = [&](const char* key, float v) {
        JsonObject o = fields.createNestedObject(key);
        o["doubleValue"] = v;
    };

    // timestamp
    char tsBuf[32];
    struct tm timeinfo;
    if (getLocalTime(&timeinfo)) {
        strftime(tsBuf, sizeof(tsBuf), "%Y-%m-%dT%H:%M:%SZ", &timeinfo);
        JsonObject t = fields.createNestedObject("timestamp");
        t["timestampValue"] = tsBuf;
    } else {
        JsonObject t = fields.createNestedObject("timestamp");
        t["timestampValue"] = "1970-01-01T00:00:00Z";
    }

    // sensor fields
    setDouble("panelV", panelV);
    setDouble("panelI", panelI);
    setDouble("batteryV", batteryV);
    setDouble("batteryI", batteryI);
    setDouble("batteryTemp", batteryTemp);
    setDouble("batteryPercent", batteryPercent);
    setDouble("inverterV", inverterV);
    setDouble("inverterI", inverterI);
    setDouble("inverterTemp", inverterTemp);
    setDouble("totalPower", totalPower);
    setDouble("irradiance", irradiance);
    setDouble("comA_V", comA_V);
    setDouble("comA_I", comA_I);
    setDouble("comB_V", comB_V);
    setDouble("comB_I", comB_I);
    setDouble("comC_V", comC_V);
    setDouble("comC_I", comC_I);

    String out;
    serializeJson(doc, out);

    http.setTimeout(10000);
    int code = http.POST(out);
    if (code >= 200 && code < 300) {
        Serial.printf("[Firestore] OK %s (code=%d)\\n", userId, code);
    } else {
        Serial.printf("[Firestore] FAIL %s (code=%d): %s\\n", userId, code, http.getString().c_str());
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
                </Aler<ctrl63>