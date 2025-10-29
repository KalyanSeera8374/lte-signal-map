# LTE Signal Map Backend

A modern Node.js backend for ingesting GPS/LTE telemetry from devices via **MQTT** (HiveMQ, Mosquitto, etc.) or an **HTTP** fallback, and persisting data to **MongoDB**. Provides clean REST APIs for frontend dashboards to read current device state and historical messages.

---

## ✨ Features
- **MQTT ingestion** (optional) via `mqttWorker.js` with schema validation
- **HTTP ingestion** endpoint (`POST /ingest`) for testing/fallback
- **MongoDB (Mongoose)** models:
  - `device_details`: latest state per device (upsert)
  - `raw_message`: immutable log of all messages (analytics)
- **Zod** runtime validation of incoming payloads
- **Modular architecture** (routes / controllers / services / middlewares)
- **Optional pagination** for list endpoints
- Production‑friendly defaults: CORS, logging (morgan), `.env` config, ESM

---

## 🧰 Tech Stack
- Node.js 18+ (ES Modules)
- Express 4
- Mongoose 8
- Zod 3
- MQTT.js 5 (optional)
- Dotenv, CORS, Morgan

---

## 📦 Project Structure
```
backend/
  .env
  package.json
  src/
    app.js
    server.js
    db.js
    validators.js
    mqttWorker.js            # optional; auto-disabled if no MQTT envs
    models/
      deviceDetail.js
      rawMessage.js
    routes/
      index.js
      ingest.routes.js
      devices.routes.js
      messages.routes.js
    controllers/
      ingest.controller.js
      devices.controller.js
      messages.controller.js
    services/
      ingest.service.js
      devices.service.js
      messages.service.js
    middlewares/
      errorHandler.js
      validate.js
      asyncHandler.js
    utils/
      pagination.js
```

---

## 🚀 Quick Start

### 1) Install dependencies
```bash
npm install
```

### 2) Configure environment
Create **.env** in project root. For local MongoDB & MQTT disabled:
```env
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/lte_map
# Leave MQTT empty to disable the worker locally
# MQTT_URL=
# MQTT_USERNAME=
# MQTT_PASSWORD=
# MQTT_TOPIC=
```

> Tip: use `127.0.0.1` on Windows instead of `localhost` to avoid IPv6/host issues.

### 3) Start MongoDB
- **Local install**: start the MongoDB Windows service (Services → MongoDB)
- **or Docker**:
  ```bash
  docker run -d --name mongo -p 27017:27017 -v mongo-data:/data/db mongo:7
  ```

### 4) Run the server
```bash
npm run dev
```
Expected logs:
```
✅ MongoDB connected
ℹ️ MQTT disabled (MQTT_URL or MQTT_TOPIC missing).
🚀 Server on http://localhost:4000
```

---

## 🔌 Enabling MQTT (optional)
Set these in `.env`.

### Option A — HiveMQ Cloud (requires auth + TLS)
```env
MQTT_URL=mqtts://<your-cluster>.s1.eu.hivemq.cloud:8883
MQTT_USERNAME=<cloud-username>
MQTT_PASSWORD=<cloud-password>
MQTT_TOPIC=devices/tick-gps/#
```

### Option B — Public test broker (no auth; for demos)
```env
MQTT_URL=mqtt://broker.hivemq.com:1883
MQTT_TOPIC=devices/tick-gps/demo1
# leave username/password empty
```

> The worker only attaches `username/password` if provided. If `MQTT_URL` or `MQTT_TOPIC` is empty, MQTT is skipped.

---

## 📡 Payload Schema (Zod)
Example device message:
```json
{
  "timestamp": "2025-10-27T05:17:12Z",
  "device_name": "tick-GPS",
  "gps_location": { "latitude": 34.11973, "longitude": -118.241101 },
  "mac_addr": "a0:b1:c2:39:0c:8c",
  "lte_signal_strength": -84.05
}
```

---

## 🧪 Testing

### Ingest via HTTP (simulates a device)
```bash
curl -X POST http://localhost:4000/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "timestamp": "2025-10-27T05:17:12Z",
    "device_name": "tick-GPS",
    "gps_location": { "latitude": 34.11973, "longitude": -118.241101 },
    "mac_addr": "a0:b1:c2:39:0c:8c",
    "lte_signal_strength": -84.05
  }'
```

### Read from APIs (for frontend)
```bash
# All devices (latest state)
curl "http://localhost:4000/devices"

# All messages (history)
curl "http://localhost:4000/messages"

# Optional pagination
curl "http://localhost:4000/devices?limit=10&page=1"
curl "http://localhost:4000/messages?limit=10&page=1"

# Optional filters for messages
curl "http://localhost:400:4000/messages?mac_addr=a0:b1:c2:39:0c:8c&from=2025-10-27&to=2025-10-28"
```

### Postman
- Create requests:
  - `GET http://localhost:4000/devices`
  - `GET http://localhost:4000/messages`
  - `POST http://localhost:4000/ingest` with JSON body (see above)
- Save to a collection for reuse.

---

## 🧭 API Reference

### `GET /health`
Health check.

### `POST /ingest`
Validate and insert a payload into `raw_message` and upsert latest state into `device_details`.

**Body**: telemetry JSON (see schema above)  
**Response**: `{ "status": "ok" }`

### `GET /devices`
List devices (latest state). Pagination optional via `?limit=&page=`.

**Response** (no pagination):
```json
{ "total": 1, "items": [ /* DeviceDetail[] */ ] }
```

### `GET /devices/:id`
Get a single device by Mongo `_id`.

### `GET /messages`
List raw messages (history). Supports filters:
- `mac_addr` — filter by payload MAC
- `device_name` — filter by payload device name
- `from`, `to` — ISO date/time range (applies to `message_timestamp`)
- `limit`, `page` — optional pagination

**Response** (no pagination):
```json
{ "total": 42, "items": [ /* RawMessage[] */ ] }
```

---

## 🗃️ Data Model

### `device_details` (Mongoose: `DeviceDetail`)
- `device_name: string`
- `mac_addr: string` (required)
- `gps_location: { latitude: number, longitude: number }`
- `lte_signal_strength: number`
- `last_message_timestamp: Date`
- `last_seen: Date` (server receive time)
- **Indexes**:
  - `unique(mac_addr, device_name)` — prevents duplicates

### `raw_message` (Mongoose: `RawMessage`)
- `payload: object` (original message)
- `topic: string` (MQTT topic, if available)
- `message_timestamp: Date` (from payload)
- `received_at: Date` (server time)
- `timestamps: true` → adds `createdAt`, `updatedAt`

---

## ⚙️ Scripts
```json
{
  "dev": "nodemon src/server.js",
  "start": "node src/server.js"
}
```

---

## 📈 Scaling Notes
- 1,000 devices @ every 2 minutes ≈ **~8.3 msg/s** → ~16–17 DB ops/s (insert + upsert) → easily handled by a single Node process + Mongo.
- For higher loads:
  - Increase `mongoose.connect` pool size (`maxPoolSize`)
  - Batch writes (`insertMany`, `bulkWrite`) at 200–500 ms intervals
  - Use **shared subscriptions** (`$share/<group>/topic/#`) to load-balance across instances
  - Keep write-side indexes minimal; add analytics indexes later

---

## 🔒 Security Notes
- Use TLS (`mqtts://`) and broker auth in production
- Restrict CORS to your frontend origin
- Never commit `.env` to version control
- Consider rate limits / API keys for public endpoints

---

## 🧩 Troubleshooting
- **`MongoParseError: Invalid scheme`** → ensure `MONGODB_URI` starts with `mongodb://` or `mongodb+srv://`
- **`ERR_MODULE_NOT_FOUND`** → filename vs import path case mismatch; ESM is case-sensitive
- **`MQTT error: Not authorized`** → provide broker credentials (HiveMQ Cloud) or use a broker that allows anonymous
- **Empty `/devices` or `/messages`** → send a test `POST /ingest` first

---

## 📜 License
MIT (or your preferred license)

---

## 🙌 Credits
Built with ❤️ using Node.js, Express, Mongoose, Zod, and MQTT.js.

