import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";
import { hashPassword, verifyPassword } from "../utils/password";
import { z } from "zod";
import { signJwt } from "../middleware/auth";

const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  location: z.string().optional(),
  number: z.string().optional(),
  password: z.string().min(6),
  age: z.number().int().min(0).optional(),
  isAdmin: z.boolean().optional(),
});

export async function register(req: Request, res: Response) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const { email, name, location, number, password, age, isAdmin } = parsed.data;

  const repo = AppDataSource.getRepository(User);
  const existing = await repo.findOne({ where: { email } });
  if (existing)
    return res.status(409).json({ message: "Email already registered" });

  const passwordHash = await hashPassword(password);
  const user = repo.create({
    email,
    name,
    location: location ?? null,
    phoneNumber: number ?? null,
    passwordHash,
    age: age ?? null,
    isAdmin: isAdmin ?? false,
  });
  await repo.save(user);

  const token = signJwt({ userId: user.id, isAdmin: user.isAdmin });
  return res
    .status(201)
    .json({ token, user: { id: user.id, email: user.email, name: user.name } });
}

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function signIn(req: Request, res: Response) {
  const parsed = signInSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const { email, password } = parsed.data;
  console.log(password, "password");
  const repo = AppDataSource.getRepository(User);
  const user = await repo.findOne({ where: { email } });
  // If no user exists with the provided email, inform frontend to show registration flow
  if (!user) return res.status(200).json({ userRegistered: false });

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  const token = signJwt({ userId: user.id, isAdmin: user.isAdmin });
  return res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name },
  });
}

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

export async function changePassword(req: Request, res: Response) {
  const userJwt = (req as any).user as { userId: string } | undefined;
  if (!userJwt) return res.status(401).json({ message: "Unauthorized" });

  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const repo = AppDataSource.getRepository(User);
  const user = await repo.findOne({ where: { id: userJwt.userId } });
  if (!user) return res.status(404).json({ message: "User not found" });

  const ok = await verifyPassword(
    parsed.data.currentPassword,
    user.passwordHash
  );
  if (!ok)
    return res.status(400).json({ message: "Current password incorrect" });

  user.passwordHash = await hashPassword(parsed.data.newPassword);
  await repo.save(user);

  return res.json({ message: "Password updated" });
}

const resetPasswordSchema = z.object({
  email: z.string().email(),
  newPassword: z.string().min(6),
});

export async function resetPassword(req: Request, res: Response) {
  // As requested: reset using email only (no email send), for simplicity
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const { email, newPassword } = parsed.data;
  const repo = AppDataSource.getRepository(User);
  const user = await repo.findOne({ where: { email } });
  if (!user) return res.status(404).json({ message: "User not found" });

  user.passwordHash = await hashPassword(newPassword);
  await repo.save(user);

  return res.json({ message: "Password reset" });
}
