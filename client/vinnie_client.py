import json
from datetime import datetime

import paho.mqtt.client as mqtt
from pymongo import MongoClient
import certifi

# ==============================
# MQTT CONFIG
# ==============================
MQTT_BROKER = "broker.emqx.io"
MQTT_PORT = 1883
MQTT_TOPIC = "taist/aiot/happymeal/server"

# ==============================
# MONGODB CONFIG
# ==============================
username = "happymeal_db_admin"
password = "Happymeal1234"
MONGO_URL = f"mongodb+srv://{username}:{password}@happymeal.oen73dn.mongodb.net/"

client = MongoClient(MONGO_URL, tlsCAFile=certifi.where())

db = client["happymeal_db"]
collection = db["sensor_data"]

print("Connected to MongoDB!")

# ==============================
# MQTT CALLBACK
# ==============================
def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("Connected to MQTT Broker!")
        client.subscribe(MQTT_TOPIC)
    else:
        print("Failed to connect, return code:", rc)


def on_message(client, userdata, msg):
    print("\n Data received from ESP32:")

    try:
        payload = msg.payload.decode()
        print(payload)

        data = json.loads(payload)

        # ==============================
        # ADD TIMESTAMP
        # ==============================
        data["timestamp"] = datetime.now()

        # ==============================
        # SAVE TO MONGODB
        # ==============================
        collection.insert_one(data)

        print("Data saved to MongoDB!")

    except Exception as e:
        print("Error:", e)


# ==============================
# MQTT CLIENT SETUP
# ==============================
mqtt_client = mqtt.Client()

mqtt_client.on_connect = on_connect
mqtt_client.on_message = on_message

mqtt_client.connect(MQTT_BROKER, MQTT_PORT, 60)

# ==============================
# LOOP
# ==============================
print("Server is running... Waiting for data...")
mqtt_client.loop_forever()
