import mongoose from "mongoose";

const DeviceDetailSchema = new mongoose.Schema({
  device_name: { type: String, index: true },
  mac_addr: { type: String, required: true, index: true },
  gps_location: {
    latitude: Number,
    longitude: Number,
  },
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], default: [0, 0] },
  },
  lte_signal_strength: Number,
  last_message_timestamp: Date,
  last_seen: { type: Date, default: Date.now },
  // 🆕 Add these
  city: String,
  state: String,
  country: String,
  distance_from_city_km: Number,
}, { collection: "device_details", timestamps: true });


DeviceDetailSchema.index({ mac_addr: 1, device_name: 1 }, { unique: true }); // device identity
DeviceDetailSchema.index({ location: "2dsphere" });
export default mongoose.model("DeviceDetail", DeviceDetailSchema);
