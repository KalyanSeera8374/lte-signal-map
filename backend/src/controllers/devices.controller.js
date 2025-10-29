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
};
