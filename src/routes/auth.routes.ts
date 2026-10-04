import { Router } from "express";
import {
  forgotPassword,
  loginUser,
  registerUser,
  resetPassword,
} from "../controllers/auth.controller.js";
import { rateLimit } from "../middleware/security.middleware.js";

const router = Router();
const AUTH_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

router.post(
  "/register",
  rateLimit({
    keyPrefix: "auth:register",
    maxRequests: 10,
    windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
  }),
  registerUser,
);
router.post(
  "/login",
  rateLimit({
    keyPrefix: "auth:login",
    maxRequests: 5,
    windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
  }),
  loginUser,
);
router.post(
  "/forgot-password",
  rateLimit({
    keyPrefix: "auth:forgot-password",
    maxRequests: 3,
    windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
  }),
  forgotPassword,
);
router.post(
  "/reset-password/:userId/:token",
  rateLimit({
    keyPrefix: "auth:reset-password",
    maxRequests: 5,
    windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
  }),
  resetPassword,
);

export default router;
