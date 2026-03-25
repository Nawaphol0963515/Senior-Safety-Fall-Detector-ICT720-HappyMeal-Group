# **Project Title: Senior Safety Fall Detector**
## **Subject: ICT720, 2026**
## **Group Name: HappyMeal**
<img width="1363" height="628" alt="スクリーンショット 2026-03-25 15 00 17" src="https://github.com/user-attachments/assets/cc2f0570-ced7-4495-b623-22917aadc958" />

## **Member**
|No.| Name                                | ID               |
|---|------------------------------------|-------------------|
|1.| Nawaphol  Worakijthamrongchai (Ben) |6822040314|
|2.| Nicha     Vikromrotjananan (Baitei) |6822040363|
|3.| Vinnie    Chuawanta (Vinnie フィンニ) |25M41257|
|4.| Satchukan Sinsuwanrak (Nampai) |6814552850|
|5.| Jittarin Chaivong (Poom)|6822040348|

## **Overview:**
The "Senior Safety Fall Detector" is an IoT-based monitoring system designed to protect elderly individuals living independently. By utilizing ESP32 microcontrollers equipped with MPU sensors, the system continuously monitors movement. An integrated AI model analyzes this data in real-time to distinguish between normal daily activities (like dropping a book) and critical emergencies (a human fall). Upon detecting a fall, the system immediately updates a user interface, sends out critical alerts to family members or caregivers, and activates an ESP32S3 camera stream to provide vital visual context of the incident.

## **Objectives:**
Develop an accurate sensing mechanism: Utilize ESP32S2 and MPU sensors to accurately capture motion and orientation data.
Implement intelligent classification: Train an AI model to analyze sensor data with high accuracy, minimizing false alarms by understanding the context of movements.
Enable real-time communication: Establish a robust data pipeline using HTTP/MQTT to transmit data seamlessly from the client to the server.
Provide immediate visual verification: Trigger an ESP32S3 camera stream specifically when a fall is detected to protect daily privacy while ensuring emergency visibility.
Create an intuitive monitoring dashboard: Build a UI that clearly displays the user's current status (FALL / SAFE) for easy monitoring by family or caregivers.

## **Expected Outcomes:**
A fully integrated prototype consisting of sensor nodes, an AI processing server, and a monitoring UI.
A reliable AI classification model capable of distinguishing actual falls from benign events.
A reduction in emergency response times for elderly falls, providing peace of mind to families across geographical distances.

## **Stakeholder:**
Primary: The Elderly (The direct users who require monitoring to maintain safe, independent living).
Secondary: Family Members & Relatives (Those who need real-time peace of mind and alerts regarding their loved one's safety).
Tertiary: Caregivers & Medical Responders (Local care centers that can use the system's alerts and camera feeds to triage emergency responses).

## **User Stories:**
As an elderly person living alone, I want a system that automatically calls for help if I fall and cannot get up, so I can feel safe maintaining my independence.
As a family member living in another city or country, I want to receive an immediate notification on my phone if my parent falls, so I can ensure they get help right away.
As a local caregiver or emergency responder, I want to view a live camera stream when an alert is triggered, so I can assess the severity of the fall and dispatch the appropriate medical assistance.

## Software models
### Software stack
Hardware layer with ESP32s/MPU6050 → Protocol layer with MQTT/HTTP → Backend layer with Python/AI Frameworks → Frontend layer with Web/App frameworks

### Sequence diagram
Nampai's Sensor reads data → Vinnie's Client pushes to Server → Ben's AI evaluates data. IF FALL = TRUE → Poom's Camera activates & Baitei's UI updates to FALL/Triggers Alert

## Future Work:
Smart Home Integration: Allowing the system to automatically unlock the front door for emergency responders if a critical fall is detected.
Vital Sign Monitoring: Integrating heart rate or blood oxygen sensors to provide a more comprehensive health overview during a fall event.
Hardware Miniaturization: Refining the ESP32 and MPU setup into a comfortable, non-intrusive wearable device (like a smart belt or watch).

## Conclusion
As Japan and the global population ages, the intersection of AI and IoT becomes crucial for senior care. The Senior Safety Fall Detector bridges the gap between independent living and necessary medical supervision. By accurately detecting falls, minimizing false alarms, and providing immediate visual context to loved ones and caregivers, this project transforms a moment of crisis and silence into a moment of swift, life-saving action.

## Acknowledgements:
We would like to express our gratitude to the instructors and teaching assistants of TAIST for their guidance.
