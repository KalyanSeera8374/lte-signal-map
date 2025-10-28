import { asyncHandler } from "../middlewares/asyncHandler.js";
import { messagesService } from "../services/messages.service.js";
import { getPagination } from "../utils/pagination.js";

export const messagesController = {
  list: asyncHandler(async (req, res) => {
    const { limit, page } = getPagination(req.query);
    const filters = {
      mac_addr: req.query.mac_addr,
      device_name: req.query.device_name,
      from: req.query.from, // ISO strings
      to: req.query.to,
    };
    const { items, total } = await messagesService.list({ limit, page, filters });
    res.json({ page, limit, total, items });
  }),
};
