import mongoose from "mongoose";

const DeviceDetailSchema = new mongoose.Schema(
  {
    device_name: { type: String, index: true },
    mac_addr: { type: String, required: true, index: true },
    gps_location: {
      latitude: Number,
      longitude: Number,
    },
    lte_signal_strength: Number,
    last_message_timestamp: Date,
    last_seen: { type: Date, default: Date.now },
  },
  { collection: "device_details", timestamps: true }
);

DeviceDetailSchema.index({ mac_addr: 1, device_name: 1 }, { unique: true });

export default mongoose.model("DeviceDetail", DeviceDetailSchema);
