import mqtt from "mqtt";
import "dotenv/config.js";
import DeviceDetail from "./models/device_Details.js";
import RawMessage from "./models/raw_Message.js";
import { TickGpsSchema } from "./validators.js";
import { getCityFromCoordinates } from "./utils/reverseGeoCode.js";
import { getCityCenter } from "./utils/geocodeCity.js";              // NEW
import { haversineKm } from "./utils/distance.js";

export function startMqtt() {
  const { MQTT_URL, MQTT_USERNAME, MQTT_PASSWORD, MQTT_TOPIC } = process.env;
  if (!MQTT_URL || !MQTT_TOPIC) {
    console.warn("ℹ️ MQTT disabled (MQTT_URL or MQTT_TOPIC missing).");
    return;
  }

  const client = mqtt.connect(MQTT_URL, {
    username: MQTT_USERNAME,
    password: MQTT_PASSWORD,
    reconnectPeriod: 3000,
    keepalive: 60,
  });

  client.on("connect", () => {
    console.log("✅ MQTT connected");
    client.subscribe(MQTT_TOPIC, (err) => {
      if (err) console.error("MQTT subscribe error:", err.message);
      else console.log("📡 Subscribed to:", MQTT_TOPIC);
    });
  });

  client.on("message", async (topic, message) => {
    console.log("📥 Incoming MQTT Message on:", topic);

    try {
      // ✅ Step 1: Parse + validate the payload
      const data = TickGpsSchema.parse(JSON.parse(message.toString("utf8")));

      const { latitude, longitude } = data.gps_location || {};
      let geo = null;
      let distanceFromCityKm = null; // ✅ always declare this variable upfront

      // ✅ Step 2: Reverse geocode once (city, state, country)
      if (typeof latitude === "number" && typeof longitude === "number") {
        geo = await getCityFromCoordinates(latitude, longitude);
        if (geo?.city) {
          const center = await getCityCenter(geo.city, geo.state, geo.country);
          if (center) {
            distanceFromCityKm = haversineKm(latitude, longitude, center.lat, center.lon);
            if (typeof distanceFromCityKm === "number") {
              distanceFromCityKm = Math.round(distanceFromCityKm * 10) / 10;
            } else {
              distanceFromCityKm = null;
            }
          }
        }
      }

      // ✅ Step 3: Save raw message for analytics
      await RawMessage.create({
        payload: data,
        topic,
        message_timestamp: data.timestamp ? new Date(data.timestamp) : undefined,
      });

      // ✅ Step 4: Upsert or update device info
      await DeviceDetail.updateOne(
        { mac_addr: data.mac_addr, device_name: data.device_name },
        {
          $set: {
            gps_location: data.gps_location,
            lte_signal_strength: data.lte_signal_strength,
            last_message_timestamp: data.timestamp ? new Date(data.timestamp) : undefined,
            last_seen: new Date(),

            ...(latitude != null && longitude != null
              ? {
                location: {
                  type: "Point",
                  coordinates: [Number(longitude), Number(latitude)],
                },
              }
              : {}),

            // ✅ Step 5: Add city, state, country, display_name
            city: geo?.city ?? null,
            state: geo?.state ?? null,
            country: geo?.country ?? null,
            display_name: geo?.display_name ?? null,
            distance_from_city_km: distanceFromCityKm,
          },
        },
        { upsert: true }
      );
    } catch (err) {
      console.error("❌ MQTT message handling error:", err.message);
    }
  });

  client.on("error", (err) => console.error("MQTT error:", err.message));
}
