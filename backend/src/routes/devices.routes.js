import { Router } from "express";
import { devicesController } from "../controllers/devices.controller.js";

const router = Router();

router.get("/", devicesController.list);
router.get("/:id", devicesController.getById);

export default router;
