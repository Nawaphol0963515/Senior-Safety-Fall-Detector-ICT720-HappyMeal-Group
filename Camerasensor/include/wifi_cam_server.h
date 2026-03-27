#ifndef __WIFI_CAM_SERVER_H__
#define __WIFI_CAM_SERVER_H__

#include <Arduino.h>
#include <esp_log.h>

// ============================================================
// CONFIGURE THESE FOR YOUR NETWORK
// ============================================================
#define WIFI_SSID       "𝕭𝖊𝖓𝖙𝖔⚽☯️➕" // change wifi here
#define WIFI_PASSWORD   "Bento-285" // change wifi here

// MQTT Broker — use the same broker your team's Client (Vinnie) publishes to
#define MQTT_BROKER     "broker.hivemq.com"   // or your team's broker IP
#define MQTT_PORT       1883
#define MQTT_TOPIC_FALL "happymeal/fall"       // topic Vinnie publishes fall alerts to
#define MQTT_TOPIC_CAM  "happymeal/camera"     // topic to publish camera status back
// ============================================================

void wifi_cam_server_init(void);
void wifi_cam_server_loop(void);
bool is_streaming_active(void);

#endif // __WIFI_CAM_SERVER_H__
