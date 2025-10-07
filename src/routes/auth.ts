import { Router } from "express";
import {
  changePassword,
  register,
  resetPassword,
  signIn,
} from "../controllers/authController";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.post("/register", register);
router.post("/signin", signIn);
router.post("/change-password", requireAuth, changePassword);
router.post("/reset-password", resetPassword);

export default router;
