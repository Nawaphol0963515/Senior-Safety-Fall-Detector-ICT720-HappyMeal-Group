#include "wifi_cam_server.h"
#include "hw_camera.h"
#include <WiFi.h>
#include <WebServer.h>
#include <PubSubClient.h>
#include <esp_camera.h>

#define TAG "wifi_cam"

// ── Objects ──
static WebServer server(80);
static WiFiClient wifi_client;
static PubSubClient mqtt(wifi_client);

// ── State ──
static bool stream_active = false;        // true when fall detected
static bool manual_stream = false;        // true when manually started from UI
static unsigned long fall_timestamp = 0;  // when the fall was detected
#define STREAM_TIMEOUT_MS  60000         // auto-stop after 2 minutes

// ── MQTT callback — triggered when fall alert arrives ──
static void mqtt_callback(char *topic, byte *payload, unsigned int length) {
    String msg;
    for (unsigned int i = 0; i < length; i++) {
        msg += (char)payload[i];
    }
    ESP_LOGI(TAG, "MQTT [%s]: %s", topic, msg.c_str());

    if (String(topic) == MQTT_TOPIC_FALL) {
        if (msg == "1" || msg == "true" || msg == "FALL") {
            stream_active = true;
            fall_timestamp = millis();
            ESP_LOGI(TAG, ">>> FALL DETECTED — camera stream ACTIVATED");
            Serial.println("========== FALL DETECTED — STREAM ON ==========");

            // Publish camera status back so UI knows stream is live
            mqtt.publish(MQTT_TOPIC_CAM, "LIVE");
        } else if (msg == "0" || msg == "false" || msg == "SAFE") {
            stream_active = false;
            ESP_LOGI(TAG, ">>> Status SAFE — camera stream DEACTIVATED");
            mqtt.publish(MQTT_TOPIC_CAM, "OFF");
        }
    }
}

// ── Reconnect MQTT if disconnected ──
static void mqtt_reconnect() {
    if (mqtt.connected()) return;

    String client_id = "ESP32CAM-" + String(random(0xffff), HEX);
    ESP_LOGI(TAG, "Connecting to MQTT broker %s ...", MQTT_BROKER);

    if (mqtt.connect(client_id.c_str())) {
        ESP_LOGI(TAG, "MQTT connected!");
        mqtt.subscribe(MQTT_TOPIC_FALL);
        ESP_LOGI(TAG, "Subscribed to: %s", MQTT_TOPIC_FALL);
        mqtt.publish(MQTT_TOPIC_CAM, "READY");
    } else {
        ESP_LOGE(TAG, "MQTT connect failed, rc=%d", mqtt.state());
    }
}

// ── HTTP: "/" index page ──
static void handle_root() {
    String html = "<!DOCTYPE html><html><head>"
        "<meta charset='UTF-8'>"
        "<meta name='viewport' content='width=device-width,initial-scale=1'>"
        "<title>Fall Detector Camera</title>"
        "<style>"
        "body{font-family:sans-serif;text-align:center;background:#1a1a2e;color:#eee;margin:0;padding:20px}"
        ".status{font-size:1.5em;font-weight:bold;padding:15px;border-radius:8px;margin:15px 0}"
        ".live{background:#e94560}.safe{background:#4CAF50}"
        "img{max-width:100%;border:2px solid #e94560;border-radius:8px}"
        "</style></head><body>"
        "<h1>Senior Safety Fall Detector</h1>"
        "<h3>Group HappyMeal - Camera Module</h3>"
        "<div id='status' class='status safe'>SAFE - Standby</div>"
        "<div id='feed'><p style='color:#888'>Camera on standby. Stream activates on fall detection.</p></div>"
        "<script>"
        "var streaming=false;"
        "function checkStatus(){"
        "  fetch('/status').then(r=>r.json()).then(d=>{"
        "    var s=document.getElementById('status');"
        "    var f=document.getElementById('feed');"
        "    if(d.stream_active && !streaming){"
        "      s.textContent='FALL DETECTED - LIVE';"
        "      s.className='status live';"
        "      f.innerHTML='<img src=\"/stream?'+Date.now()+'\">';"
        "      streaming=true;"
        "    } else if(!d.stream_active && streaming){"
        "      s.textContent='SAFE - Standby';"
        "      s.className='status safe';"
        "      f.innerHTML='<p style=color:#888>Camera on standby.</p>';"
        "      streaming=false;"
        "    } else if(!d.stream_active){"
        "      s.textContent='SAFE - Standby';"
        "      s.className='status safe';"
        "    }"
        "  }).catch(e=>{});"
        "}"
        "setInterval(checkStatus,2000);"
        "checkStatus();"
        "</script></body></html>";
    server.send(200, "text/html", html);
}

// ── HTTP: "/capture" single JPEG ──
static void handle_capture() {
    camera_fb_t *fb = esp_camera_fb_get();
    if (!fb) {
        server.send(500, "text/plain", "Camera capture failed");
        return;
    }
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send_P(200, "image/jpeg", (const char *)fb->buf, fb->len);
    esp_camera_fb_return(fb);
}

// ── HTTP: "/start-stream" manually activate camera from UI ──
static void handle_start_stream() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    stream_active = true;
    manual_stream = true;
    fall_timestamp = millis();  // reset timeout
    ESP_LOGI(TAG, ">>> MANUAL stream START from UI");
    Serial.println("========== MANUAL STREAM ON (from UI) ==========");
    mqtt.publish(MQTT_TOPIC_CAM, "LIVE");
    server.send(200, "application/json", "{\"status\":\"streaming\",\"message\":\"Camera stream started\"}");
}

// ── HTTP: "/stop-stream" manually deactivate camera from UI ──
static void handle_stop_stream() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    stream_active = false;
    manual_stream = false;
    ESP_LOGI(TAG, ">>> MANUAL stream STOP from UI");
    Serial.println("========== MANUAL STREAM OFF (from UI) ==========");
    mqtt.publish(MQTT_TOPIC_CAM, "OFF");
    server.send(200, "application/json", "{\"status\":\"stopped\",\"message\":\"Camera stream stopped\"}");
}

// ── HTTP: "/stream" MJPEG (serves when stream_active — fall or manual) ──
static void handle_stream() {
    if (!stream_active) {
        server.sendHeader("Access-Control-Allow-Origin", "*");
        server.send(503, "text/plain", "Stream not active");
        return;
    }

    WiFiClient client = server.client();
    String response = "HTTP/1.1 200 OK\r\n"
                      "Content-Type: multipart/x-mixed-replace; boundary=frame\r\n"
                      "Access-Control-Allow-Origin: *\r\n"
                      "\r\n";
    client.print(response);

    while (client.connected() && stream_active) {
        // Check timeout inside the loop
        if (millis() - fall_timestamp > STREAM_TIMEOUT_MS) {
            stream_active = false;
            ESP_LOGI(TAG, "Stream auto-stopped after timeout");
            mqtt.publish(MQTT_TOPIC_CAM, "OFF");
            break;
        }

        camera_fb_t *fb = esp_camera_fb_get();
        if (!fb) {
            ESP_LOGE(TAG, "Stream: capture failed");
            break;
        }

        String header = "--frame\r\n"
                        "Content-Type: image/jpeg\r\n"
                        "Content-Length: " + String(fb->len) + "\r\n"
                        "\r\n";
        client.print(header);
        client.write(fb->buf, fb->len);
        client.print("\r\n");

        esp_camera_fb_return(fb);
        delay(100);
    }
}

// ── HTTP: "/status" JSON endpoint for UI ──
static void handle_status() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    String ip = WiFi.localIP().toString();
    String json = "{\"stream_active\":" + String(stream_active ? "true" : "false") +
                  ",\"manual_stream\":" + String(manual_stream ? "true" : "false") +
                  ",\"stream_url\":\"http://" + ip + "/stream\"" +
                  ",\"capture_url\":\"http://" + ip + "/capture\"" +
                  ",\"start_url\":\"http://" + ip + "/start-stream\"" +
                  ",\"stop_url\":\"http://" + ip + "/stop-stream\"}";
    server.send(200, "application/json", json);
}

// ── Init: WiFi + MQTT + HTTP ──
void wifi_cam_server_init() {
    // Connect WiFi
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    ESP_LOGI(TAG, "Connecting to WiFi: %s", WIFI_SSID);

    int retries = 0;
    while (WiFi.status() != WL_CONNECTED && retries < 30) {
        delay(500);
        Serial.print(".");
        retries++;
    }

    if (WiFi.status() == WL_CONNECTED) {
        Serial.println();
        Serial.println("=========================================");
        Serial.print("  Camera IP: http://");
        Serial.println(WiFi.localIP());
        Serial.println("  Endpoints:");
        Serial.println("    /        — Status page");
        Serial.println("    /stream  — MJPEG stream (when fall detected)");
        Serial.println("    /capture — Single snapshot");
        Serial.println("    /status  — JSON status for UI");
        Serial.println("=========================================");
    } else {
        ESP_LOGE(TAG, "WiFi connection FAILED");
        return;
    }

    // Setup MQTT
    mqtt.setServer(MQTT_BROKER, MQTT_PORT);
    mqtt.setCallback(mqtt_callback);
    mqtt_reconnect();

    // Setup HTTP routes
    server.on("/", handle_root);
    server.on("/capture", handle_capture);
    server.on("/stream", handle_stream);
    server.on("/status", handle_status);
    server.on("/start-stream", handle_start_stream);
    server.on("/stop-stream", handle_stop_stream);
    server.begin();
    ESP_LOGI(TAG, "HTTP server started");

}

// ── Loop: must be called from main loop() ──
void wifi_cam_server_loop() {
    // Reconnect MQTT if needed
    if (!mqtt.connected()) {
        mqtt_reconnect();
    }
    mqtt.loop();

    // Handle HTTP requests
    server.handleClient();

    // Auto-stop stream after timeout
    if (stream_active && (millis() - fall_timestamp > STREAM_TIMEOUT_MS)) {
        stream_active = false;
        ESP_LOGI(TAG, "Stream auto-stopped after timeout");
        mqtt.publish(MQTT_TOPIC_CAM, "OFF");
    }
}

bool is_streaming_active() {
    return stream_active;
}
