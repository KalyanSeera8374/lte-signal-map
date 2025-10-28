import mongoose from "mongoose";

const RawMessageSchema = new mongoose.Schema(
  {
    payload: { type: Object, required: true },
    topic: { type: String },
    message_timestamp: { type: Date },
    received_at: { type: Date, default: Date.now }
  },
  { collection: "raw_message", timestamps: true }
);

export default mongoose.model("RawMessage", RawMessageSchema);
