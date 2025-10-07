import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { Product } from "../entities/Product";
import { Category } from "../entities/Category";
import { Order } from "../entities/Order";

export async function getDashboardStats(_req: Request, res: Response) {
  const productRepo = AppDataSource.getRepository(Product);
  const categoryRepo = AppDataSource.getRepository(Category);
  const orderRepo = AppDataSource.getRepository(Order);

  const [
    totalProducts,
    visibleProducts,
    categoriesCount,
    ordersCount,
    last10Orders,
  ] = await Promise.all([
    productRepo.count(),
    productRepo.count({ where: { visible: true } }),
    categoryRepo.count(),
    orderRepo.count(),
    orderRepo.find({ take: 10, order: { createdAt: "DESC" } }),
  ]);

  return res.json({
    totalProducts,
    visibleProducts,
    categoriesCount,
    ordersCount,
    last10Orders,
  });
}
