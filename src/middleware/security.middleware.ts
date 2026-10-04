import type { NextFunction, Request, RequestHandler, Response } from "express";
import {
  HTTP_STATUS,
  RESPONSE_MESSAGE,
  RESPONSE_STATUS,
  sendResponse,
} from "../utils/apiResponse.js";

type RateLimitOptions = {
  keyPrefix: string;
  maxRequests: number;
  message?: string;
  windowMs: number;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const rateLimitStore = new Map<string, RateLimitEntry>();

const parseAllowedOrigins = () => {
  const origins = process.env.CORS_ORIGIN || process.env.FRONTEND_URL || "";

  return origins
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean);
};

const getClientIp = (req: Request) => {
  return req.ip || req.socket.remoteAddress || "unknown";
};

export const securityHeaders: RequestHandler = (_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-DNS-Prefetch-Control", "off");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
  );

  next();
};

export const corsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const origin = req.headers.origin?.replace(/\/$/, "");
  const allowedOrigins = parseAllowedOrigins();
  const allowsAllOrigins = allowedOrigins.includes("*");

  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Max-Age", "86400");

  if (!origin) {
    if (req.method === "OPTIONS") {
      return res.sendStatus(HTTP_STATUS.NO_CONTENT);
    }

    return next();
  }

  if (allowsAllOrigins || allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", allowsAllOrigins ? "*" : origin);

    if (req.method === "OPTIONS") {
      return res.sendStatus(HTTP_STATUS.NO_CONTENT);
    }

    return next();
  }

  if (req.method === "OPTIONS") {
    return res.sendStatus(HTTP_STATUS.FORBIDDEN);
  }

  return sendResponse({
    res,
    statusCode: HTTP_STATUS.FORBIDDEN,
    status: RESPONSE_STATUS.FAIL,
    message: RESPONSE_MESSAGE.CORS_ORIGIN_NOT_ALLOWED,
  });
};

export const rateLimit = ({
  keyPrefix,
  maxRequests,
  message = RESPONSE_MESSAGE.TOO_MANY_REQUESTS,
  windowMs,
}: RateLimitOptions): RequestHandler => {
  return (req, res, next) => {
    const now = Date.now();
    const key = `${keyPrefix}:${getClientIp(req)}`;
    const existingEntry = rateLimitStore.get(key);
    const entry =
      existingEntry && existingEntry.resetAt > now
        ? existingEntry
        : { count: 0, resetAt: now + windowMs };

    entry.count += 1;
    rateLimitStore.set(key, entry);

    const remainingRequests = Math.max(maxRequests - entry.count, 0);
    const resetInSeconds = Math.ceil((entry.resetAt - now) / 1000);

    res.setHeader("RateLimit-Limit", String(maxRequests));
    res.setHeader("RateLimit-Remaining", String(remainingRequests));
    res.setHeader("RateLimit-Reset", String(resetInSeconds));

    if (entry.count > maxRequests) {
      res.setHeader("Retry-After", String(resetInSeconds));

      return sendResponse({
        res,
        statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
        status: RESPONSE_STATUS.FAIL,
        message,
      });
    }

    next();
  };
};
