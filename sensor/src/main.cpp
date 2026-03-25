#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <Wire.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// Internet connectivity
const char *WIFI_SSID = "𝕭𝖊𝖓𝖙𝖔⚽☯️➕"; // SSID of AP that has FTM Enabled
const char *WIFI_PASSWD = "Bento-285";  // STA Password

const char *MQTT_BROKER = "broker.emqx.io";
const char *PUB_TOPIC = "taist/aiot/happymeal/data";
const char *SUB_TOPIC = "taist/aiot/happymeal/cmd";

void mqtt_callback(char* topic, byte* payload, unsigned int length);
bool upload_data(float ax, float ay, float az, float gx, float gy, float gz);

WiFiClient espClient;
PubSubClient mqttClient(espClient);

Adafruit_MPU6050 mpu;

void setup(void) {
  Serial.begin(9600);
  Wire.begin(41, 40, 400000);
  while (!Serial)
    delay(10); // will pause Zero, Leonardo, etc until serial console opens

  Serial.println("Adafruit MPU6050 test!");

  // Try to initialize!
  if (!mpu.begin(0x68)) {
    Serial.println("Failed to find MPU6050 chip");
    while (1) {
      delay(10);
    }
  }
  Serial.println("MPU6050 Found!");

  //setupt motion detection
  mpu.setHighPassFilter(MPU6050_HIGHPASS_0_63_HZ);
  mpu.setMotionDetectionThreshold(1);
  mpu.setMotionDetectionDuration(20);
  mpu.setInterruptPinLatch(true);	// Keep it latched.  Will turn off when reinitialized.
  mpu.setInterruptPinPolarity(true);
  mpu.setMotionInterrupt(true);

  Serial.println("");
  delay(100);

  // WiFi connect
  Serial.print("WiFi connecting.");
  WiFi.begin(WIFI_SSID, WIFI_PASSWD);
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(100);
  }
  Serial.println("WiFi connected");
}

bool upload_data(float ax, float ay, float az, float gx, float gy, float gz) {
  Serial.println("Start uploading");

  // MQTT
  mqttClient.setServer(MQTT_BROKER, 1883);
  mqttClient.setCallback(mqtt_callback);
  char dev_id[64];
  randomSeed(esp_random());
  sprintf(dev_id, "DEV%d", random());
  if (!mqttClient.connect(dev_id)) {
    return false;
  }
  //mqttClient.subscribe(SUB_TOPIC);
  //delay(500); // Delay before
  Serial.println("MQTT connected");

  // JSON
  JsonDocument json_doc;
  char json_txt[256];
  json_doc["tstamp"] = millis();
  json_doc["ax"] = ax;
  json_doc["ay"] = ay;
  json_doc["az"] = az;
  json_doc["gx"] = gx;
  json_doc["gy"] = gy;
  json_doc["gz"] = gz;
  
  serializeJson(json_doc, json_txt);
  mqttClient.publish(PUB_TOPIC, json_txt);
  mqttClient.loop();
  //delay(500); // Delay after
  mqttClient.disconnect();
  Serial.println(json_txt);
  delay(100);
  return true;
}

void mqtt_callback(char* topic, byte* payload, unsigned int length) {
}

void loop() {
  if(mpu.getMotionInterruptStatus()) {
    /* Get new sensor events with the readings */
    sensors_event_t a, g, temp;
    mpu.getEvent(&a, &g, &temp);

    upload_data(a.acceleration.x, a.acceleration.y, a.acceleration.z, g.gyro.x, g.gyro.y, g.gyro.z);
  }
  delay(1000);
}