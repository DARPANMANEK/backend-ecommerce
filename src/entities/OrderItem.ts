import { Entity, PrimaryGeneratedColumn, ManyToOne, Column } from "typeorm";
import { Order } from "./Order";
import { Product } from "./Product";

@Entity({ name: "order_items" })
export class OrderItem {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id!: string;

  @ManyToOne(() => Order, (o) => o.items, { onDelete: "CASCADE" })
  order!: Order;

  @ManyToOne(() => Product, { eager: true, onDelete: "SET NULL" })
  product!: Product | null;

  @Column({ type: "int" })
  quantity!: number;

  @Column({ type: "numeric" })
  unitPrice!: string;
}
