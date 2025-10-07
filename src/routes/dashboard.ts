import { Router } from "express";
import { getDashboardStats } from "../controllers/dashboardController";
import { requireAdmin, requireAuth } from "../middleware/auth";

const router = Router();

router.get("/stats", requireAuth, requireAdmin, getDashboardStats);

export default router;
