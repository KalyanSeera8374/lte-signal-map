import "dotenv/config.js";
import mongoose from "mongoose";
import DeviceDetail from "../models/device_Details.js"; // match your file name
import { getCityFromCoordinates } from "../utils/reverseGeoCode.js";

await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });

const cursor = DeviceDetail.find({
  "gps_location.latitude": { $type: "number" },
  "gps_location.longitude": { $type: "number" },
}).cursor();

let updated = 0;
for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
  const { latitude, longitude } = doc.gps_location || {};
  if (latitude == null || longitude == null) continue;

  const geo = await getCityFromCoordinates(latitude, longitude);
  await DeviceDetail.updateOne(
    { _id: doc._id },
    {
      $set: {
        location: { type: "Point", coordinates: [longitude, latitude] },
        city: geo?.city ?? null,
        state: geo?.state ?? null,
        country: geo?.country ?? null,
        display_name: geo?.display_name ?? null,
      },
    }
  );
  updated++;
  if (updated % 50 === 0) console.log("Updated", updated);
}

console.log("Backfill done. Updated:", updated);
await mongoose.disconnect();
process.exit(0);
