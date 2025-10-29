import RawMessage from "../models/raw_Message.js";
import DeviceDetail from "../models/device_Details.js";

export const ingestService = {
    async process(data, { topic }) {
        // 1) Save raw
        await RawMessage.create({
            payload: data,
            topic,
            message_timestamp: data.timestamp ? new Date(data.timestamp) : undefined,
        });

        // 2) Upsert device
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
    },
};
