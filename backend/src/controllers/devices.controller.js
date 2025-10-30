import { asyncHandler } from "../middlewares/asyncHandler.js";
import { devicesService } from "../services/devices.service.js";
import { getPagination } from "../utils/pagination.js";

export const devicesController = {
  list: asyncHandler(async (req, res) => {
    const { limit, page } = getPagination(req.query);
    const { items, total } = await devicesService.list({ limit, page });
    res.json({ page, limit, total, items });
  }),

  getById: asyncHandler(async (req, res) => {
    const doc = await devicesService.getById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Device not found" });
    res.json(doc);
  }),
  nearCity: asyncHandler(async (req, res) => {
    // console.log(req);

    const { limit, page } = getPagination(req.query);
    const { city, radius, device_name } = req.query;

    if (!city) {
      return res.status(400).json({ error: "Query param 'city' is required" });
    }

    const radiusKm = radius ? parseFloat(radius) : 5; // default 5 km
    if (Number.isNaN(radiusKm) || radiusKm <= 0) {
      return res.status(400).json({ error: "Invalid 'radius' (km)" });
    }

    const { items, total } = await devicesService.nearCity({
      city,
      radiusKm,
      device_name,
      limit,
      page,
    });

    // Include pagination keys only when used
    if (limit && page) return res.json({ page, limit, total, items });
    return res.json({ total, items });
  }),
};
