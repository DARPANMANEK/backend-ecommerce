import { Router } from "express";
import {
  createCart,
  updateCart,
  createOrder,
  fetchAllOrders,
  fetchMyOrders,
  updateOrderStatus,
} from "../controllers/cartController";
import { requireAuth, requireAdmin } from "../middleware/auth";

const router = Router();

router.post("/cart", createCart);
router.put("/cart/:id", updateCart);

router.post("/orders", requireAuth, createOrder);
router.get("/orders", requireAuth, requireAdmin, fetchAllOrders);
router.get("/orders/me", requireAuth, fetchMyOrders);
router.patch(
  "/orders/:id/status",
  requireAuth,
  requireAdmin,
  updateOrderStatus
);

export default router;
