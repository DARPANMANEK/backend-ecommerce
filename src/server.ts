import "reflect-metadata";
import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { initializeDataSource } from "./config/data-source";
import apiRouter from "./routes";

async function bootstrap() {
  await initializeDataSource();

  const app = express();
  app.use(cors());
  app.use(express.json());

  app.use("/api", apiRouter);

  app.use(
    (
      err: any,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ) => {
      console.error(err);
      res
        .status(err.status || 500)
        .json({ message: err.message || "Internal Server Error" });
    }
  );

  app.listen(Number(env.PORT), () => {
    console.log(`Server running on http://localhost:${env.PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error("Failed to start server", err);
  process.exit(1);
});
