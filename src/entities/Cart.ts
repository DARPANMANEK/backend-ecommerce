import {
  Entity,
  PrimaryGeneratedColumn,
  OneToMany,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { CartItem } from "./CartItem";

@Entity({ name: "carts" })
export class Cart {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id!: string;

  @OneToMany(() => CartItem, (ci) => ci.cart, { cascade: true, eager: true })
  items!: CartItem[];

  @Column({ type: "numeric", default: 0 })
  totalAmount!: string;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
