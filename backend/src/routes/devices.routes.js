import { Router } from "express";
import { devicesController } from "../controllers/devices.controller.js";

const router = Router();

router.get("/", devicesController.list);
router.get("/:id", devicesController.getById);

// 👇 NEW: find devices near a city center
router.get("/near-city/search", devicesController.nearCity);

export default router;
