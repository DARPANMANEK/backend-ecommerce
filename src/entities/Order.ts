import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./User";
import { OrderItem } from "./OrderItem";

export type OrderStatus = "pending" | "completed";

@Entity({ name: "orders" })
export class Order {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id!: string;

  @ManyToOne(() => User, { eager: true, onDelete: "SET NULL" })
  user!: User | null;

  @OneToMany(() => OrderItem, (oi) => oi.order, { cascade: true, eager: true })
  items!: OrderItem[];

  @Column({ type: "numeric" })
  totalAmount!: string;

  @Column({ type: "varchar", default: "pending" })
  status!: OrderStatus;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
