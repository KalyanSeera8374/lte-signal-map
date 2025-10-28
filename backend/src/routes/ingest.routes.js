import { Router } from "express";
import { validate } from "../middlewares/validate.js";
import { TickGpsSchema } from "../validators.js";
import { ingestController } from "../controllers/ingest.controller.js";

const router = Router();

router.post("/", validate(TickGpsSchema), ingestController.ingest);

export default router;
