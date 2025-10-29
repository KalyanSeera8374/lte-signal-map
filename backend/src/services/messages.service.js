import RawMessage from "../models/raw_Message.js";

export const messagesService = {
  async list({ limit, page, filters }) {
    const skip = (page - 1) * limit;

    const query = {};
    // allow filtering by fields inside payload
    if (filters?.mac_addr) query["payload.mac_addr"] = filters.mac_addr;
    if (filters?.device_name) query["payload.device_name"] = filters.device_name;

    // time range
    if (filters?.from || filters?.to) {
      query.message_timestamp = {};
      if (filters.from) query.message_timestamp.$gte = new Date(filters.from);
      if (filters.to) query.message_timestamp.$lte = new Date(filters.to);
    }

    const [items, total] = await Promise.all([
      RawMessage.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      RawMessage.countDocuments(query),
    ]);

    return { items, total };
  },
};
