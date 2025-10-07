import "reflect-metadata";
import { DataSource } from "typeorm";
import { env } from "./env";

export const AppDataSource = new DataSource({
  type: "postgres",
  url: env.DATABASE_URL,
  synchronize: true,
  logging: false,
  entities: [__dirname + "/../entities/*.{ts,js}"],
  migrations: [__dirname + "/../migrations/*.{ts,js}"],
});

export async function initializeDataSource(): Promise<DataSource> {
  if (AppDataSource.isInitialized) return AppDataSource;
  return AppDataSource.initialize();
}
