#include "main.h"
#include "hw_camera.h"
#include "wifi_cam_server.h"

// constants
#define TAG           "main"
#define BUTTON_PIN    0

// initialize hardware
void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n\n=== Senior Safety Fall Detector — Camera Module ===");

  // Initialize camera hardware
  hw_camera_init();

  // Initialize WiFi + MQTT + HTTP server
  wifi_cam_server_init();

  ESP_LOGI(TAG, "Setup complete — waiting for fall events via MQTT");
}

// main loop
void loop() {
  // Handle MQTT messages and HTTP clients
  wifi_cam_server_loop();
}
