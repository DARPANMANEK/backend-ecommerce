import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from "typeorm";
import { Category } from "./Category";

@Entity({ name: "products" })
export class Product {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id!: string;

  @Column()
  name!: string;

  @Column({ type: "numeric" })
  price!: string; // numeric stored as string

  @Column({ type: "numeric", nullable: true })
  discountedPrice!: string | null;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @ManyToOne(() => Category, {
    eager: true,
    onDelete: "SET NULL",
  })
  category!: Category | null;

  @Column({ type: "int", default: 0 })
  sortId!: number;

  @Column({ type: "boolean", default: true })
  visible!: boolean;

  @Column({ type: "boolean", default: true })
  isInStock!: boolean;

  @Column({ type: "text", nullable: true })
  imageUrl!: string | null;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;
}
