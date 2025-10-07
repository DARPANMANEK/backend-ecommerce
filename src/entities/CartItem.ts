import { Entity, PrimaryGeneratedColumn, ManyToOne, Column } from "typeorm";
import { Cart } from "./Cart";
import { Product } from "./Product";

@Entity({ name: "cart_items" })
export class CartItem {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id!: string;

  @ManyToOne(() => Cart, (c) => c.items, { onDelete: "CASCADE" })
  cart!: Cart;

  @ManyToOne(() => Product, { eager: true, onDelete: "SET NULL" })
  product!: Product | null;

  @Column({ type: "int" })
  quantity!: number;
}
