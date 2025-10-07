import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { Cart } from "../entities/Cart";
import { CartItem } from "../entities/CartItem";
import { Product } from "../entities/Product";
import { Order } from "../entities/Order";
import { OrderItem } from "../entities/OrderItem";
import { z } from "zod";

const cartItemInput = z.object({
  productId: z.string(),
  quantity: z.number().int().min(1),
});
const cartInput = z.object({ items: z.array(cartItemInput).min(1) });

function getPagination(query: Request["query"]) {
  const page = Math.max(1, Number(query.page ?? 1) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit ?? 10) || 10));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

function computeTotal(
  items: CartItem[] | { product: Product | null; quantity: number }[]
): string {
  let total = 0;
  for (const item of items) {
    const price = Number(
      item.product?.discountedPrice ?? item.product?.price ?? 0
    );
    total += price * item.quantity;
  }
  return total.toFixed(2);
}

export async function createCart(req: Request, res: Response) {
  const parsed = cartInput.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const productRepo = AppDataSource.getRepository(Product);
  const cartRepo = AppDataSource.getRepository(Cart);

  const cart = cartRepo.create({ items: [], totalAmount: "0" });
  cart.items = [];
  for (const { productId, quantity } of parsed.data.items) {
    const product = await productRepo.findOne({ where: { id: productId } });
    const item = new CartItem();
    item.product = product ?? null;
    item.quantity = quantity;
    // Don't set item.cart = cart to avoid circular reference
    // TypeORM will handle the relationship automatically
    cart.items.push(item);
  }
  cart.totalAmount = computeTotal(cart.items);
  await cartRepo.save(cart);

  // Return a clean object without circular references
  const response = {
    id: cart.id,
    totalAmount: cart.totalAmount,
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt,
    items: cart.items.map((item) => ({
      id: item.id,
      product: item.product,
      quantity: item.quantity,
    })),
  };

  return res.status(201).json(response);
}

export async function updateCart(req: Request, res: Response) {
  const cartId = req.params.id;
  const parsed = cartInput.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const productRepo = AppDataSource.getRepository(Product);
  const cartRepo = AppDataSource.getRepository(Cart);
  const cart = await cartRepo.findOne({ where: { id: cartId } });
  if (!cart) return res.status(404).json({ message: "Cart not found" });

  cart.items = [];
  for (const { productId, quantity } of parsed.data.items) {
    const product = await productRepo.findOne({ where: { id: productId } });
    const item = new CartItem();
    item.product = product ?? null;
    item.quantity = quantity;
    // Don't set item.cart = cart to avoid circular reference
    // TypeORM will handle the relationship automatically
    cart.items.push(item);
  }
  cart.totalAmount = computeTotal(cart.items);
  await cartRepo.save(cart);

  // Return a clean object without circular references
  const response = {
    id: cart.id,
    totalAmount: cart.totalAmount,
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt,
    items: cart.items.map((item) => ({
      id: item.id,
      product: item.product,
      quantity: item.quantity,
    })),
  };

  return res.json(response);
}

const createOrderSchema = z.object({ cartId: z.string() });

export async function createOrder(req: Request, res: Response) {
  const user = (req as any).user as { userId: string } | undefined;
  if (!user) return res.status(401).json({ message: "Unauthorized" });

  const parsed = createOrderSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const cartRepo = AppDataSource.getRepository(Cart);
  const orderRepo = AppDataSource.getRepository(Order);
  const cart = await cartRepo.findOne({ where: { id: parsed.data.cartId } });
  if (!cart) return res.status(404).json({ message: "Cart not found" });

  const order = orderRepo.create({
    user: { id: user.userId } as any,
    items: [],
    totalAmount: cart.totalAmount,
    status: "pending",
  });
  for (const item of cart.items) {
    const oi = new OrderItem();
    oi.order = order;
    oi.product = item.product;
    oi.quantity = item.quantity;
    oi.unitPrice = (item.product?.discountedPrice ??
      item.product?.price ??
      "0") as string;
    order.items.push(oi);
  }
  await orderRepo.save(order);

  // Return a clean object without circular references
  const response = {
    id: order.id,
    user: order.user,
    totalAmount: order.totalAmount,
    status: order.status,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    items: order.items.map((item) => ({
      id: item.id,
      product: item.product,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
  };

  return res.status(201).json(response);
}

export async function fetchAllOrders(_req: Request, res: Response) {
  const orderRepo = AppDataSource.getRepository(Order);
  const { page, limit, skip } = getPagination(_req.query);
  const [orders, total] = await orderRepo.findAndCount({
    order: { createdAt: "DESC" },
    skip,
    take: limit,
  });
  const pages = Math.ceil(total / limit) || 1;
  return res.json({ data: orders, page, limit, total, pages });
}

export async function fetchMyOrders(req: Request, res: Response) {
  const user = (req as any).user as { userId: string } | undefined;
  if (!user) return res.status(401).json({ message: "Unauthorized" });

  const orderRepo = AppDataSource.getRepository(Order);
  const { page, limit, skip } = getPagination(req.query);
  const [orders, total] = await orderRepo.findAndCount({
    where: { user: { id: user.userId } as any },
    order: { createdAt: "DESC" },
    skip,
    take: limit,
  });

  const sanitized = orders.map((order) => ({
    id: order.id,
    user: order.user,
    totalAmount: order.totalAmount,
    status: order.status,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    items: order.items.map((item) => ({
      id: item.id,
      product: item.product,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
  }));

  const pages = Math.ceil(total / limit) || 1;
  return res.json({ data: sanitized, page, limit, total, pages });
}

const updateOrderStatusSchema = z.object({
  status: z.enum(["pending", "completed"]),
});

export async function updateOrderStatus(req: Request, res: Response) {
  const id = req.params.id;
  const parsed = updateOrderStatusSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const orderRepo = AppDataSource.getRepository(Order);
  const order = await orderRepo.findOne({ where: { id } });
  if (!order) return res.status(404).json({ message: "Order not found" });

  order.status = parsed.data.status;
  await orderRepo.save(order);

  // Return a clean object without circular references
  const response = {
    id: order.id,
    user: order.user,
    totalAmount: order.totalAmount,
    status: order.status,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    items: order.items.map((item) => ({
      id: item.id,
      product: item.product,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
  };

  return res.json(response);
}
