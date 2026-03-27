#include <WiFi.h>
#include <PubSubClient.h>

// ==============================
// WIFI CONFIG
// ==============================
const char* WIFI_SSID = "vinnieee";
const char* WIFI_PASS = "vinnieee";

// ==============================
// MQTT CONFIG
// ==============================
const char* MQTT_BROKER = "broker.emqx.io";
const int MQTT_PORT = 1883;

// Topic from sensor (Nampai)
const char* SUB_TOPIC = "taist/aiot/happymeal/data";

// Topic to server (your forwarding)
const char* PUB_TOPIC = "taist/aiot/happymeal/server";

WiFiClient espClient;
PubSubClient client(espClient);

// ==============================
// CONNECT WIFI
// ==============================
void setup_wifi() {
  Serial.print("Connecting to WiFi...");
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi connected!");
}

// ==============================
// MQTT CALLBACK (receive sensor)
// ==============================
void callback(char* topic, byte* payload, unsigned int length) {
  Serial.println("\nData received from sensor:");

  String message = "";
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }

  Serial.println(message);

  // ==============================
  // FORWARD TO SERVER
  // ==============================
  Serial.println("Forwarding to server...");

  if (client.publish(PUB_TOPIC, message.c_str())) {
    Serial.println("Sent to server");
  } else {
    Serial.println("Failed to send");
  }
}

// ==============================
// MQTT RECONNECT
// ==============================
void reconnect() {
  while (!client.connected()) {
    Serial.print("Connecting to MQTT...");

    String clientId = "VinnieClient-";
    clientId += String(random(0xffff), HEX);

    if (client.connect(clientId.c_str())) {
      Serial.println("Connected!");

      client.subscribe(SUB_TOPIC);

    } else {
      Serial.print("Failed, rc=");
      Serial.print(client.state());
      Serial.println(" retrying...");
      delay(2000);
    }
  }
}

// ==============================
// SETUP
// ==============================
void setup() {
  Serial.begin(115200);

  setup_wifi();

  client.setServer(MQTT_BROKER, MQTT_PORT);
  client.setCallback(callback);
}

// ==============================
// LOOP
// ==============================
void loop() {
  if (!client.connected()) {
    reconnect();
  }

  client.loop();
}
