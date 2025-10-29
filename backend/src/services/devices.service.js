import DeviceDetail from "../models/device_Details.js";

export const devicesService = {
  async list({ limit, page }) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      DeviceDetail.find({})
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      DeviceDetail.countDocuments({}),
    ]);
    return { items, total };
  },

  async getById(id) {
    return DeviceDetail.findById(id).lean();
  },
};
