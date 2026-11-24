import express from "express";
import { apiNotFound, errorHandler } from "./errors.js";
import { submissionsRouter } from "./submissions.js";

export function createApp() {
  const app = express();

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/submissions", submissionsRouter);

  app.use("/api", apiNotFound);
  app.use(errorHandler);

  return app;
}
