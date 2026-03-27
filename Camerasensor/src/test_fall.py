import paho.mqtt.client as mqtt
import time
client = mqtt.Client()
client.connect("broker.hivemq.com", 1883)
# Simulate fall detection
client.publish("happymeal/fall", "1")
print("FALL alert sent! Check your browser.")
time.sleep(30)
# All clear
client.publish("happymeal/fall", "0")
print("SAFE signal sent. Stream stopped.")
client.disconnect()