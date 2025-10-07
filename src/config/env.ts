import "dotenv/config";

export const env = {
  NODE_ENV: (process.env.NODE_ENV ?? "development") as
    | "development"
    | "test"
    | "production",
  PORT: process.env.PORT ?? "4000",
  DATABASE_URL: process.env.DATABASE_URL ?? "",
  JWT_SECRET: process.env.JWT_SECRET ?? "",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "7d",
  SUPABASE_URL: process.env.SUPABASE_URL ?? "",
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  SUPABASE_PUBLIC_URL: process.env.SUPABASE_PUBLIC_URL ?? "",
  SUPABASE_BUCKET: process.env.SUPABASE_BUCKET,
};
