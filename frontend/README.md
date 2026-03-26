# 🛡 Senior Safety — Fall Detection Dashboard

A real-time fall detection dashboard that displays sensor data from IoT devices. The system reads accelerometer and gyroscope data, predicts fall events, and visualizes the results on a web dashboard.

---

## Architecture Overview

```
┌─────────────────────┐       HTTP (REST API)       ┌──────────────────────┐
│                     │  ◄──────────────────────►   │                      │
│   Frontend (React)  │       localhost:5173         │   Backend (Flask)    │
│   Vite + Tailwind   │                             │   Python + PyMongo   │
│                     │   GET /api/sensor-data       │                      │
│   localhost:5173     │   GET /api/daily-stats       │   localhost:5002      │
│                     │   GET /api/latest            │                      │
└─────────────────────┘                             └──────────┬───────────┘
                                                               │
                                                               │ PyMongo
                                                               ▼
                                                    ┌──────────────────────┐
                                                    │   MongoDB Atlas      │
                                                    │   happymeal_db       │
                                                    │   └─ sensor_data     │
                                                    └──────────────────────┘
```

---

## Project Structure

```
fall-detection-frontend/
├── src/                        # Frontend source code (React + TypeScript)
│   ├── api/
│   │   └── client.ts           # API client — fetch functions for backend endpoints
│   ├── components/
│   │   ├── StatusBadge.tsx      # FALL / NORMAL status indicator + video icon
│   │   ├── FallCounter.tsx      # Falls today counter card
│   │   ├── SensorChart.tsx      # Line chart (mag_acc, mag_gyro, prediction)
│   │   └── DailyFallBarChart.tsx # Stacked bar chart (daily fall %)
│   ├── data/
│   │   └── mockData.ts         # (Legacy) Frontend-only mock data generator
│   ├── App.tsx                 # Main dashboard — assembles all components
│   ├── main.tsx                # React entry point
│   └── index.css               # Tailwind CSS v4 + theme tokens
│
├── backend/                    # Backend source code (Flask + Python)
│   ├── app.py                  # Flask API server (3 endpoints)
│   ├── generate_mock_data.py   # Generate 14 days of mock sensor data → JSON
│   ├── upload_to_db.py         # Upload JSON data into MongoDB Atlas
│   ├── mock_sensor_data.json   # Generated mock data (40k+ records)
│   └── venv/                   # Python virtual environment
│
├── package.json                # Node.js dependencies (React, Recharts, Tailwind)
├── vite.config.ts              # Vite config with Tailwind CSS plugin
└── tsconfig.app.json           # TypeScript config with @/ path alias
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **Python** ≥ 3.10
- **MongoDB Atlas** account (free tier M0 is fine)

### 1. Setup Frontend

```bash
cd fall-detection-frontend
npm install
```

### 2. Setup Backend

```bash
cd fall-detection-frontend/backend
python -m venv venv
source venv/bin/activate        # macOS/Linux
pip install flask flask-cors pymongo certifi
```

### 3. Generate & Upload Mock Data

```bash
cd backend
source venv/bin/activate

# Step 1: Generate mock JSON data (14 days, ~40k records)
python generate_mock_data.py

# Step 2: Upload to MongoDB Atlas
# ⚠️  First whitelist your IP in Atlas: Security → Network Access → 0.0.0.0/0
python upload_to_db.py
```

### 4. Configure Data Source

In `backend/app.py` line 23, set the data source:

```python
USE_MONGODB = True    # Read from MongoDB Atlas
# USE_MONGODB = False  # Read from local JSON file (no DB needed)
```

### 5. Run the Application

You need **2 terminals** running simultaneously:

**Terminal 1 — Backend (Flask API):**
```bash
cd fall-detection-frontend/backend
source venv/bin/activate
python app.py
# → Running on http://localhost:5002
```

**Terminal 2 — Frontend (Vite dev server):**
```bash
cd fall-detection-frontend
npm run dev
# → Running on http://localhost:5173
```

Open **http://localhost:5173** in your browser 🎉

---

## API Endpoints

| Method | Endpoint | Query Params | Description |
|--------|----------|-------------|-------------|
| `GET` | `/api/sensor-data` | `start` (ISO), `end` (ISO) | Sensor readings within time range |
| `GET` | `/api/daily-stats` | `start` (YYYY-MM-DD), `end` (YYYY-MM-DD) | Daily fall/normal percentages |
| `GET` | `/api/latest` | — | Latest single sensor reading |

### Example Requests

```bash
# Get latest reading
curl http://localhost:5002/api/latest

# Get sensor data for a specific time range
curl "http://localhost:5002/api/sensor-data?start=2026-03-25T00:00:00Z&end=2026-03-25T23:59:59Z"

# Get daily stats for date range
curl "http://localhost:5002/api/daily-stats?start=2026-03-20&end=2026-03-25"
```

---

## MongoDB Schema

**Database:** `happymeal_db`
**Collection:** `sensor_data`

| Field | Type | Description |
|-------|------|-------------|
| `ax`, `ay`, `az` | Number | Accelerometer raw values (m/s²) |
| `gx`, `gy`, `gz` | Number | Gyroscope raw values (rad/s) |
| `mag_acc` | Number | Magnitude of acceleration (~0–13) |
| `mag_gyro` | Number | Magnitude of gyroscope (~0–0.8) |
| `diff_acc` | Number | Difference in acceleration |
| `diff_gyro` | Number | Difference in gyroscope |
| `diff_time` | Number | Time difference between readings (seconds) |
| `prediction` | Number | 0 = Normal, 1 = Fall |
| `confidence` | Number | Prediction confidence (%) |
| `timestamp` | DateTime | Time of the reading (UTC) |

---

## Dashboard Features

- **Status Badge** — Real-time FALL / NORMAL indicator with pulse animation
- **Video Icon** — Clickable when fall detected (red), disabled when normal (grey)
- **Fall Counter** — Number of falls detected today
- **Sensor Chart** — Line chart plotting `mag_acc`, `mag_gyro`, and `prediction`
  - Two tabs: **Today** (filter by time) / **All** (filter by date range)
  - Drag-to-zoom functionality
  - Single Y-axis labeled "Value"
- **Daily Fall Rate** — Stacked bar chart showing fall % vs normal % per day
- **Auto-refresh** — Data refreshes every 30 seconds
- **Error handling** — Shows banner when backend is disconnected with retry button

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite 8 |
| Styling | Tailwind CSS v4 |
| Charts | Recharts |
| Backend | Flask, Flask-CORS |
| Database | MongoDB Atlas (PyMongo) |
| Data Format | JSON (REST API) |
