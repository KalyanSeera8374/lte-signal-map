import mqtt from "mqtt";
import "dotenv/config.js";
import DeviceDetail from "./models/device_Details.js";
import RawMessage from "./models/raw_Message.js";
import { TickGpsSchema } from "./validators.js";

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
    try {
      const data = TickGpsSchema.parse(JSON.parse(message.toString("utf8")));

      await RawMessage.create({
        payload: data,
        topic,
        message_timestamp: data.timestamp ? new Date(data.timestamp) : undefined,
      });

      await DeviceDetail.updateOne(
        { mac_addr: data.mac_addr, device_name: data.device_name },
        {
          $set: {
            gps_location: data.gps_location,
            lte_signal_strength: data.lte_signal_strength,
            last_message_timestamp: data.timestamp ? new Date(data.timestamp) : undefined,
            last_seen: new Date(),
          },
        },
        { upsert: true }
      );
    } catch (err) {
      console.error("MQTT message handling error:", err.message);
    }
  });

  client.on("error", (err) => console.error("MQTT error:", err.message));
}
