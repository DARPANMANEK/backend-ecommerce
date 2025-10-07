import { Router } from "express";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  createProduct,
  updateProduct,
  deleteProduct,
  fetchAllCategories,
  fetchAllProducts,
  fetchProductsByCategory,
  searchProducts,
} from "../controllers/productController";

const router = Router();

// Categories
router.post("/categories", createCategory);
router.put("/categories/:id", updateCategory);
router.delete("/categories/:id", deleteCategory);
router.get("/categories", fetchAllCategories);

// Products
router.post("/products", createProduct);
router.put("/products/:id", updateProduct);
router.delete("/products/:id", deleteProduct);
router.get("/products", fetchAllProducts);
router.get("/products/category/:categoryId", fetchProductsByCategory);
router.get("/products/search", searchProducts);

export default router;
