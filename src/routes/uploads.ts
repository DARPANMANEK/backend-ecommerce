import { Router } from "express";
import { signUpload } from "../controllers/productController";

const router = Router();

router.post("/sign", signUpload);

export default router;
