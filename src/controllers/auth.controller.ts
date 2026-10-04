import bcrypt from "bcrypt";
import { Request, Response } from "express";
import { resolve } from "node:path";
import { User } from "../models/user.model.js";
import {
  HTTP_STATUS,
  RESPONSE_MESSAGE,
  RESPONSE_STATUS,
  sendResponse,
} from "../utils/apiResponse.js";
import {
  ForgotPasswordInput,
  LoginUserInput,
  RegisterUserInput,
  ResetPasswordInput,
} from "../types/auth.types.js";
import {
  validateForgotPassword,
  validateLoginUser,
  validateRegisterUser,
  validateResetPassword,
} from "../validators/auth.validator.js";
import { generateJwtToken, verifyJwtToken } from "../utils/jwt.js";
import { sendEmail } from "../services/mail.service.js";
import { renderPasswordResetEmail } from "../templates/email.template.js";

const RESET_PASSWORD_TOKEN_EXPIRES_IN_SECONDS = 15 * 60;
const RESET_PASSWORD_TOKEN_EXPIRES_IN_MINUTES =
  RESET_PASSWORD_TOKEN_EXPIRES_IN_SECONDS / 60;

const buildResetPasswordUrl = (userId: string, token: string) => {
  const resetPath = `/reset-password/${userId}/${token}`;
  const frontendUrl = process.env.FRONTEND_URL?.replace(/\/$/, "");

  return frontendUrl ? `${frontendUrl}${resetPath}` : resetPath;
};

const getLoginIllustrationPath = () => {
  return resolve(
    process.cwd(),
    "../frontend/public/images/login-illustration.svg",
  );
};

// Register API
export const registerUser = async (req: Request, res: Response) => {
  try {
    const input = req.body as RegisterUserInput;
    const validationError = validateRegisterUser(input);

    if (validationError) {
      return sendResponse({
        res,
        statusCode: HTTP_STATUS.BAD_REQUEST,
        status: RESPONSE_STATUS.FAIL,
        message: validationError,
      });
    }

    const firstName = input.firstName!.trim();
    const lastName = input.lastName!.trim();
    const email = input.email!.trim().toLowerCase();
    const phoneNumber = input.phoneNumber!.trim();
    const password = input.password!;

    const existingUser = await User.findOne({
      $or: [{ email }, { phoneNumber }],
    });

    if (existingUser?.email === email) {
      return sendResponse({
        res,
        statusCode: HTTP_STATUS.CONFLICT,
        status: RESPONSE_STATUS.FAIL,
        message: RESPONSE_MESSAGE.EMAIL_ALREADY_REGISTERED,
      });
    }

    if (existingUser?.phoneNumber === phoneNumber) {
      return sendResponse({
        res,
        statusCode: HTTP_STATUS.CONFLICT,
        status: RESPONSE_STATUS.FAIL,
        message: RESPONSE_MESSAGE.PHONE_ALREADY_REGISTERED,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      firstName,
      lastName,
      email,
      phoneNumber,
      password: hashedPassword,
    });

    return sendResponse({
      res,
      statusCode: HTTP_STATUS.CREATED,
      status: RESPONSE_STATUS.SUCCESS,
      message: RESPONSE_MESSAGE.USER_REGISTERED,
      data: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber,
      },
    });
  } catch (error) {
    console.error("Register user error", error);
    return sendResponse({
      res,
      statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      status: RESPONSE_STATUS.ERROR,
      message: RESPONSE_MESSAGE.SOMETHING_WENT_WRONG,
    });
  }
};


// User login API
export const loginUser = async (req: Request, res: Response) => {
  try {
    const input = req.body as LoginUserInput;
    const validationError = validateLoginUser(input);

    if (validationError) {
      return sendResponse({
        res,
        statusCode: HTTP_STATUS.BAD_REQUEST,
        status: RESPONSE_STATUS.FAIL,
        message: validationError,
      });
    }

    const email = input.email!.trim().toLowerCase();
    const password = input.password!;

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return sendResponse({
        res,
        statusCode: HTTP_STATUS.UNAUTHORIZED,
        status: RESPONSE_STATUS.FAIL,
        message: RESPONSE_MESSAGE.INVALID_CREDENTIALS,
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return sendResponse({
        res,
        statusCode: HTTP_STATUS.UNAUTHORIZED,
        status: RESPONSE_STATUS.FAIL,
        message: RESPONSE_MESSAGE.INVALID_CREDENTIALS,
      });
    }

    const userData = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
    };
    const token = generateJwtToken({
      id: String(user._id),
      email: user.email,
    });

    return sendResponse({
      res,
      statusCode: HTTP_STATUS.OK,
      status: RESPONSE_STATUS.SUCCESS,
      message: RESPONSE_MESSAGE.USER_LOGGED_IN,
      data: {
        user: userData,
        token,
      },
    });
  } catch (error) {
    console.error("Login user error", error);
    return sendResponse({
      res,
      statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      status: RESPONSE_STATUS.ERROR,
      message: RESPONSE_MESSAGE.SOMETHING_WENT_WRONG,
    });
  }
};

// Forgot password API
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const input = req.body as ForgotPasswordInput;
    const validationError = validateForgotPassword(input);

    if (validationError) {
      return sendResponse({
        res,
        statusCode: HTTP_STATUS.BAD_REQUEST,
        status: RESPONSE_STATUS.FAIL,
        message: validationError,
      });
    }

    const email = input.email!.trim().toLowerCase();
    const user = await User.findOne({ email });

    if (!user) {
      return sendResponse({
        res,
        statusCode: HTTP_STATUS.OK,
        status: RESPONSE_STATUS.SUCCESS,
        message: RESPONSE_MESSAGE.PASSWORD_RESET_LINK_GENERATED,
      });
    }

    const userId = String(user._id);
    const token = generateJwtToken(
      {
        id: userId,
        email: user.email,
        purpose: "password-reset",
        resetVersion: user.passwordResetVersion ?? 0,
      },
      RESET_PASSWORD_TOKEN_EXPIRES_IN_SECONDS,
    );
    const resetUrl = buildResetPasswordUrl(userId, token);

    await sendEmail({
      to: user.email,
      subject: "Reset your password",
      text: `Use this link to reset your password: ${resetUrl}`,
      attachments: [
        {
          filename: "login-illustration.svg",
          path: getLoginIllustrationPath(),
          cid: "login-illustration",
          contentType: "image/svg+xml",
        },
      ],
      html: renderPasswordResetEmail({
        firstName: user.firstName,
        resetUrl,
        expiresInMinutes: RESET_PASSWORD_TOKEN_EXPIRES_IN_MINUTES,
      }),
    });

    return sendResponse({
      res,
      statusCode: HTTP_STATUS.OK,
      status: RESPONSE_STATUS.SUCCESS,
      message: RESPONSE_MESSAGE.PASSWORD_RESET_LINK_GENERATED,
    });
  } catch (error) {
    console.error("Forgot password error", error);
    return sendResponse({
      res,
      statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      status: RESPONSE_STATUS.ERROR,
      message: RESPONSE_MESSAGE.SOMETHING_WENT_WRONG,
    });
  }
};

// Reset password API
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const userId = Array.isArray(req.params.userId)
      ? req.params.userId[0]
      : req.params.userId;
    const token = Array.isArray(req.params.token)
      ? req.params.token[0]
      : req.params.token;
    const input = req.body as ResetPasswordInput;
    const validationError = validateResetPassword(input);

    if (validationError) {
      return sendResponse({
        res,
        statusCode: HTTP_STATUS.BAD_REQUEST,
        status: RESPONSE_STATUS.FAIL,
        message: validationError,
      });
    }

    if (!userId || !token) {
      return sendResponse({
        res,
        statusCode: HTTP_STATUS.UNAUTHORIZED,
        status: RESPONSE_STATUS.FAIL,
        message: RESPONSE_MESSAGE.INVALID_OR_EXPIRED_RESET_TOKEN,
      });
    }

    const payload = verifyJwtToken(token);

    if (
      !payload ||
      payload.purpose !== "password-reset" ||
      String(payload.id) !== userId
    ) {
      return sendResponse({
        res,
        statusCode: HTTP_STATUS.UNAUTHORIZED,
        status: RESPONSE_STATUS.FAIL,
        message: RESPONSE_MESSAGE.INVALID_OR_EXPIRED_RESET_TOKEN,
      });
    }

    const user = await User.findById(userId).select("+password");

    if (!user || payload.email !== user.email) {
      return sendResponse({
        res,
        statusCode: HTTP_STATUS.UNAUTHORIZED,
        status: RESPONSE_STATUS.FAIL,
        message: RESPONSE_MESSAGE.INVALID_OR_EXPIRED_RESET_TOKEN,
      });
    }

    const passwordResetVersion = user.passwordResetVersion ?? 0;
    const payloadResetVersion = Number(payload.resetVersion ?? 0);

    if (
      !Number.isFinite(payloadResetVersion) ||
      payloadResetVersion !== passwordResetVersion
    ) {
      return sendResponse({
        res,
        statusCode: HTTP_STATUS.UNAUTHORIZED,
        status: RESPONSE_STATUS.FAIL,
        message: RESPONSE_MESSAGE.INVALID_OR_EXPIRED_RESET_TOKEN,
      });
    }

    const newPassword = (input.newPassword ?? input.password)!;
    user.password = await bcrypt.hash(newPassword, 10);
    user.passwordResetVersion = passwordResetVersion + 1;
    await user.save();

    const userData = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
    };
    const loginToken = generateJwtToken({
      id: String(user._id),
      email: user.email,
    });

    return sendResponse({
      res,
      statusCode: HTTP_STATUS.OK,
      status: RESPONSE_STATUS.SUCCESS,
      message: RESPONSE_MESSAGE.PASSWORD_RESET_SUCCESS,
      data: {
        user: userData,
        token: loginToken,
      },
    });
  } catch (error) {
    console.error("Reset password error", error);
    return sendResponse({
      res,
      statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      status: RESPONSE_STATUS.ERROR,
      message: RESPONSE_MESSAGE.SOMETHING_WENT_WRONG,
    });
  }
};
