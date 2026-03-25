#include <WiFi.h>
#include <PubSubClient.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ----------------------------------------------------------------
// 1. CONFIGURATION: Update these with your actual details
// ----------------------------------------------------------------
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// MQTT Broker Details (e.g., Mosquitto, HiveMQ, or Ben's local server)
const char* mqtt_server = "192.168.1.100"; // Replace with your broker IP
const int mqtt_port = 1883;
const char* mqtt_topic = "happymeal/sensor/fall_data";

// HTTP API Endpoint (Alternative to MQTT, for Ben's backend)
const char* http_endpoint = "http://192.168.1.100:5000/api/sensor";

// Device Identifier
const char* device_id = "ESP32S2_Vinnie_01";

// ----------------------------------------------------------------
// 2. GLOBAL OBJECTS
// ----------------------------------------------------------------
WiFiClient espClient;
PubSubClient mqttClient(espClient);

// Timer variables for non-blocking delay
unsigned long lastSendTime = 0;
const unsigned long sendInterval = 1000; // Send data every 1 second

// ----------------------------------------------------------------
// 3. WIFI & MQTT CONNECTION FUNCTIONS
// ----------------------------------------------------------------
void setup_wifi() {
  delay(10);
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  // Wait for connection
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

void reconnect_mqtt() {
  // Loop until we're reconnected
  while (!mqttClient.connected()) {
    Serial.print("Attempting MQTT connection...");
    // Attempt to connect using the Device ID
    if (mqttClient.connect(device_id)) {
      Serial.println("connected");
    } else {
      Serial.print("failed, rc=");
      Serial.print(mqttClient.state());
      Serial.println(" try again in 5 seconds");
      delay(5000); // Wait 5 seconds before retrying
    }
  }
}

// ----------------------------------------------------------------
// 4. MAIN SETUP
// ----------------------------------------------------------------
void setup() {
  Serial.begin(115200);
  
  setup_wifi();
  
  mqttClient.setServer(mqtt_server, mqtt_port);
  
  // NOTE: If Nampai is using the same ESP32, initialize the MPU sensor here.
  // If Nampai is on a different board, initialize UART/ESP-NOW here.
}

// ----------------------------------------------------------------
// 5. MAIN LOOP
// ----------------------------------------------------------------
void loop() {
  // Ensure WiFi is connected
  if (WiFi.status() != WL_CONNECTED) {
    setup_wifi();
  }

  // Ensure MQTT is connected
  if (!mqttClient.connected()) {
    reconnect_mqtt();
  }
  mqttClient.loop();

  // Non-blocking timer to send data
  unsigned long currentTime = millis();
  if (currentTime - lastSendTime >= sendInterval) {
    lastSendTime = currentTime;

    // --- STEP A: Receive Data from Nampai ---
    // Placeholder variables - replace these with actual data from Nampai's sensor code
    float accelX = 0.5; // Example mock data
    float accelY = 9.8; 
    float accelZ = 0.2;
    float gyroX = 1.1;
    float gyroY = 0.0;
    float gyroZ = -0.5;

    // --- STEP B: Serialize to JSON ---
    StaticJsonDocument<200> doc;
    doc["device_id"] = device_id;
    doc["accel_x"] = accelX;
    doc["accel_y"] = accelY;
    doc["accel_z"] = accelZ;
    doc["gyro_x"] = gyroX;
    doc["gyro_y"] = gyroY;
    doc["gyro_z"] = gyroZ;
    // doc["timestamp"] = millis(); // Optional: add timestamp if Ben's AI needs it

    char jsonBuffer[512];
    serializeJson(doc, jsonBuffer);

    // --- STEP C: Send Data via MQTT ---
    Serial.print("Publishing MQTT: ");
    Serial.println(jsonBuffer);
    mqttClient.publish(mqtt_topic, jsonBuffer);

    // --- STEP D: Send Data via HTTP (Optional / Fallback) ---
    /*
    HTTPClient http;
    http.begin(http_endpoint);
    http.addHeader("Content-Type", "application/json");
    int httpResponseCode = http.POST(jsonBuffer);
    
    if (httpResponseCode > 0) {
      Serial.print("HTTP Response code: ");
      Serial.println(httpResponseCode);
    } else {
      Serial.print("Error code: ");
      Serial.println(httpResponseCode);
    }
    http.end();
    */
  }
}