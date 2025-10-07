import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { Category } from "../entities/Category";
import { Product } from "../entities/Product";
import { z } from "zod";
import { createSignedUploadUrl } from "../utils/supabase";

const categorySchema = z.object({
  name: z.string().min(1),
  visible: z.boolean().optional(),
  sortID: z.number().int().optional(),
  imageUrl: z.string().url().optional(),
});

export async function createCategory(req: Request, res: Response) {
  const parsed = categorySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const repo = AppDataSource.getRepository(Category);
  const imageUrl: string | null = parsed.data.imageUrl ?? null;
  const cat = repo.create({
    name: parsed.data.name,
    visible: parsed.data.visible ?? true,
    sortId: parsed.data.sortID ?? 0,
    imageUrl,
  });
  await repo.save(cat);
  return res.status(201).json(cat);
}

export async function updateCategory(req: Request, res: Response) {
  const id = req.params.id;
  const parsed = categorySchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const repo = AppDataSource.getRepository(Category);
  const cat = await repo.findOne({ where: { id } });
  if (!cat) return res.status(404).json({ message: "Category not found" });
  if (parsed.data.name !== undefined) cat.name = parsed.data.name;
  if (parsed.data.visible !== undefined) cat.visible = parsed.data.visible;
  if (parsed.data.sortID !== undefined) cat.sortId = parsed.data.sortID;
  if (parsed.data.imageUrl !== undefined)
    cat.imageUrl = parsed.data.imageUrl ?? null;
  await repo.save(cat);
  return res.json(cat);
}

export async function deleteCategory(req: Request, res: Response) {
  const id = req.params.id;
  const repo = AppDataSource.getRepository(Category);
  const cat = await repo.findOne({ where: { id } });
  if (!cat) return res.status(404).json({ message: "Category not found" });
  await repo.remove(cat);
  return res.status(204).send();
}

const productSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
  discountedPrice: z.number().positive().optional(),
  description: z.string().optional(),
  categoryid: z.string().optional(), // bigint string
  sortID: z.number().int().optional(),
  visible: z.boolean().optional(),
  isInStock: z.boolean().optional(),
  imageUrl: z.string().url().optional(),
});

function getPagination(query: Request["query"]) {
  const page = Math.max(1, Number(query.page ?? 1) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit ?? 10) || 10));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export async function createProduct(req: Request, res: Response) {
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const productRepo = AppDataSource.getRepository(Product);
  const categoryRepo = AppDataSource.getRepository(Category);
  let category: Category | null = null;
  if (parsed.data.categoryid) {
    category = await categoryRepo.findOne({
      where: { id: parsed.data.categoryid },
    });
  }

  const imageUrl: string | null = parsed.data.imageUrl ?? null;

  const prod = productRepo.create({
    name: parsed.data.name,
    price: parsed.data.price.toString(),
    discountedPrice: parsed.data.discountedPrice
      ? parsed.data.discountedPrice.toString()
      : null,
    description: parsed.data.description ?? null,
    category,
    sortId: parsed.data.sortID ?? 0,
    visible: parsed.data.visible ?? true,
    isInStock: parsed.data.isInStock ?? true,
    imageUrl,
  });
  await productRepo.save(prod);
  return res.status(201).json(prod);
}

export async function updateProduct(req: Request, res: Response) {
  const id = req.params.id;
  const parsed = productSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const productRepo = AppDataSource.getRepository(Product);
  const categoryRepo = AppDataSource.getRepository(Category);
  const prod = await productRepo.findOne({ where: { id } });
  if (!prod) return res.status(404).json({ message: "Product not found" });

  const data = parsed.data;
  if (data.name !== undefined) prod.name = data.name;
  if (data.price !== undefined) prod.price = data.price.toString();
  if (data.discountedPrice !== undefined)
    prod.discountedPrice = data.discountedPrice
      ? data.discountedPrice.toString()
      : null;
  if (data.description !== undefined)
    prod.description = data.description ?? null;
  if (data.categoryid !== undefined) {
    prod.category = data.categoryid
      ? await categoryRepo.findOne({ where: { id: data.categoryid } })
      : null;
  }
  if (data.sortID !== undefined) prod.sortId = data.sortID;
  if (data.visible !== undefined) prod.visible = data.visible;
  if (data.isInStock !== undefined) prod.isInStock = data.isInStock;
  if (data.imageUrl !== undefined) prod.imageUrl = data.imageUrl ?? null;

  await productRepo.save(prod);
  return res.json(prod);
}

export async function deleteProduct(req: Request, res: Response) {
  const id = req.params.id;
  const repo = AppDataSource.getRepository(Product);
  const prod = await repo.findOne({ where: { id } });
  if (!prod) return res.status(404).json({ message: "Product not found" });
  await repo.remove(prod);
  return res.status(204).send();
}

export async function fetchAllCategories(req: Request, res: Response) {
  const repo = AppDataSource.getRepository(Category);
  const allParam = req.query.all;
  if (allParam !== undefined && allParam !== null) {
    const items = await repo.find({ order: { sortId: "ASC" } });
    return res.json(items);
  }

  const { page, limit, skip } = getPagination(req.query);
  const [items, total] = await repo.findAndCount({
    order: { sortId: "ASC" },
    skip,
    take: limit,
  });
  const pages = Math.ceil(total / limit) || 1;
  return res.json({ data: items, page, limit, total, pages });
}

export async function fetchAllProducts(req: Request, res: Response) {
  const repo = AppDataSource.getRepository(Product);
  const { page, limit, skip } = getPagination(req.query);
  const [items, total] = await repo.findAndCount({
    order: { sortId: "ASC" },
    relations: { category: true },
    skip,
    take: limit,
  });
  const pages = Math.ceil(total / limit) || 1;
  return res.json({ data: items, page, limit, total, pages });
}

export async function fetchProductsByCategory(req: Request, res: Response) {
  const categoryId = req.params.categoryId;
  const repo = AppDataSource.getRepository(Product);
  const { page, limit, skip } = getPagination(req.query);
  const [items, total] = await repo.findAndCount({
    where: { category: { id: categoryId } },
    order: { sortId: "ASC" },
    relations: { category: true },
    skip,
    take: limit,
  });
  const pages = Math.ceil(total / limit) || 1;
  return res.json({ data: items, page, limit, total, pages });
}

export async function searchProducts(req: Request, res: Response) {
  const q = (req.query.q as string | undefined)?.toLowerCase() ?? "";
  const { page, limit, skip } = getPagination(req.query);
  const repo = AppDataSource.getRepository(Product);
  const qb = repo
    .createQueryBuilder("product")
    .leftJoinAndSelect("product.category", "category")
    .where(
      "LOWER(product.name) LIKE :q OR LOWER(product.description) LIKE :q",
      { q: `%${q}%` }
    )
    .orderBy("product.sortId", "ASC")
    .skip(skip)
    .take(limit);
  const [items, total] = await qb.getManyAndCount();
  const pages = Math.ceil(total / limit) || 1;
  return res.json({ data: items, page, limit, total, pages });
}

export async function signUpload(req: Request, res: Response) {
  const fileName = (req.body?.fileName as string | undefined) ?? "upload.bin";
  const contentType =
    (req.body?.contentType as string | undefined) ?? "application/octet-stream";
  try {
    const { signedUrl, token, objectPath, publicUrl } =
      await createSignedUploadUrl(fileName, contentType);
    return res.json({ signedUrl, token, objectPath, publicUrl, contentType });
  } catch (e: any) {
    return res
      .status(500)
      .json({ message: e.message || "Failed to sign upload" });
  }
}
