import { Router } from "express";
import ingestRoutes from "./ingest.routes.js";
import devicesRoutes from "./devices.routes.js";
import messagesRoutes from "./messages.routes.js";

const router = Router();

router.use("/ingest", ingestRoutes);     // POST /ingest
router.use("/devices", devicesRoutes);   // GET /devices, GET /devices/:id
router.use("/messages", messagesRoutes); // GET /messages

export default router;
