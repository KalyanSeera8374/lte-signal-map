import { asyncHandler } from "../middlewares/asyncHandler.js";
import { ingestService } from "../services/ingest.service.js";

export const ingestController = {
  ingest: asyncHandler(async (req, res) => {
    const data = req.validated; // set by validate() middleware
    await ingestService.process(data, { topic: undefined });
    res.status(201).json({ status: "ok" });
  }),
};
