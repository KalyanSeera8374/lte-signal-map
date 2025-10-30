import { getCityFromCoordinates } from "../utils/reverseGeoCode.js";
import DeviceDetail from "../models/device_Details.js";
import RawMessage from "../models/raw_Message.js";

export const ingestService = {
    async process(data, { topic }) {
        const { latitude, longitude } = data.gps_location || {};
        let cityInfo = null;

        // ✅ Step 1: reverse geocode once
        if (latitude && longitude) {
            cityInfo = await getCityFromCoordinates(latitude, longitude);
            console.log(cityInfo);
            
        }

        // ✅ Step 2: store raw message
        await RawMessage.create({
            payload: data,
            topic,
            message_timestamp: data.timestamp ? new Date(data.timestamp) : undefined,
        });

        // ✅ Step 3: upsert device info
        await DeviceDetail.updateOne(
            { mac_addr: data.mac_addr, device_name: data.device_name },
            {
                $set: {
                    gps_location: data.gps_location,
                    lte_signal_strength: data.lte_signal_strength,
                    last_message_timestamp: data.timestamp
                        ? new Date(data.timestamp)
                        : undefined,
                    last_seen: new Date(),
                    location: {
                        type: "Point",
                        coordinates: [longitude, latitude],
                    },
                    city: cityInfo?.city,
                    country: cityInfo?.country,
                    display_name: cityInfo?.display_name,
                },
            },
            { upsert: true }
        );
    },
};
