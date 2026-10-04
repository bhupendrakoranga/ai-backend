import express from "express";
import {
  corsMiddleware,
  securityHeaders,
} from "./middleware/security.middleware.js";
import authRoutes from "./routes/auth.routes.js";

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", process.env.TRUST_PROXY === "true" ? 1 : false);

app.use(securityHeaders);
app.use(corsMiddleware);
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || "20kb" }));

app.get("/", (_req, res) => {
  res.send("Server is ready");
});

app.use("/api/auth", authRoutes);

export default app;
