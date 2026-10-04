import type { Response } from "express";
import type { Document } from "mongoose";
import type { RESPONSE_STATUS } from "../utils/apiResponse.js";

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  passwordResetVersion: number;
}

export interface RegisterUserInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  password?: string;
  confirmPassword?: string;
}

export interface LoginUserInput {
  email?: string;
  password?: string;
}

export interface ForgotPasswordInput {
  email?: string;
}

export interface ResetPasswordInput {
  newPassword?: string;
  password?: string;
  confirmPassword?: string;
}

export type ResponseStatus =
  (typeof RESPONSE_STATUS)[keyof typeof RESPONSE_STATUS];

export interface ApiResponseOptions {
  res: Response;
  statusCode: number;
  status: ResponseStatus;
  message: string;
  data?: unknown;
}
