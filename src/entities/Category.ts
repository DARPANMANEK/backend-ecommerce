import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "categories" })
export class Category {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id!: string;

  @Column()
  name!: string;

  @Column({ type: "boolean", default: true })
  visible!: boolean;

  @Column({ type: "int", default: 0 })
  sortId!: number;

  @Column({ type: "text", nullable: true })
  imageUrl!: string | null;
}
