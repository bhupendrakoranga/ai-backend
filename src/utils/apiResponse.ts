import type { ApiResponseOptions } from "../types/auth.types.js";

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const RESPONSE_STATUS = {
  SUCCESS: "success",
  FAIL: "fail",
  ERROR: "error",
} as const;

export const RESPONSE_MESSAGE = {
  USER_REGISTERED: "User registered successfully",
  USER_LOGGED_IN: "User logged in successfully",
  PASSWORD_RESET_LINK_GENERATED: "Password reset link generated successfully",
  PASSWORD_RESET_SUCCESS: "Password reset successfully",
  INVALID_OR_EXPIRED_RESET_TOKEN: "Invalid or expired reset token",
  CORS_ORIGIN_NOT_ALLOWED: "CORS origin is not allowed",
  EMAIL_ALREADY_REGISTERED: "Email is already registered",
  EMAIL_NOT_REGISTERED: "Email is not registered",
  PHONE_ALREADY_REGISTERED: "Phone number is already registered",
  INVALID_CREDENTIALS: "Invalid email or password",
  TOO_MANY_REQUESTS: "Too many requests. Please try again later",
  SOMETHING_WENT_WRONG: "Something went wrong",
} as const;

export const sendResponse = ({
  res,
  statusCode,
  status,
  message,
  data,
}: ApiResponseOptions) => {
  return res.status(statusCode).json({
    statusCode,
    status,
    message,
    data,
  });
};
