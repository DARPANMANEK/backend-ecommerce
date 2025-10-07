import { Router } from "express";
import authRouter from "./auth";
import productRouter from "./products";
import cartRouter from "./cart";
import dashboardRouter from "./dashboard";
import uploadsRouter from "./uploads";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ ok: true });
});

router.use("/auth", authRouter);
router.use("/shop", productRouter);
router.use("/shop", cartRouter);
router.use("/dashboard", dashboardRouter);
router.use("/uploads", uploadsRouter);

export default router;
