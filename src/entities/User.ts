import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity({ name: "users" })
export class User {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id!: string; // bigint as string

  @Column({ unique: true })
  email!: string;

  @Column()
  name!: string;

  @Column({ type: "text", nullable: true })
  location!: string | null;

  @Column({ type: "text", nullable: true })
  phoneNumber!: string | null;

  @Column()
  passwordHash!: string;

  @Column({ type: "int", nullable: true })
  age!: number | null;

  @Column({ type: "boolean", default: false })
  isAdmin!: boolean;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
