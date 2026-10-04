import {
  ForgotPasswordInput,
  LoginUserInput,
  RegisterUserInput,
  ResetPasswordInput,
} from "../types/auth.types.js";

const PASSWORD_MIN_LENGTH = 8;

const validatePasswordStrength = (password: string): string | null => {
  if (password !== password.trim()) {
    return "Password cannot start or end with spaces";
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
  }

  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return "Password must include at least one letter and one number";
  }

  return null;
};

export const validateRegisterUser = (data: RegisterUserInput): string | null => {
  const requiredFields: Array<keyof RegisterUserInput> = [
    "firstName",
    "lastName",
    "email",
    "phoneNumber",
    "password",
    "confirmPassword",
  ];

  for (const field of requiredFields) {
    if (typeof data[field] !== "string" || data[field]?.trim() === "") {
      return `${field} is required`;
    }
  }

  if (!/^\S+@\S+\.\S+$/.test(data.email!.trim())) {
    return "Email is invalid";
  }

  const passwordError = validatePasswordStrength(data.password!);

  if (passwordError) {
    return passwordError;
  }

  if (data.password !== data.confirmPassword) {
    return "Password and confirm password do not match";
  }

  return null;
};

// Login validation
export const validateLoginUser = (data: LoginUserInput): string | null => {
  if (typeof data.email !== "string" || data.email.trim() === "") {
    return "Email is required";
  }

  if (!/^\S+@\S+\.\S+$/.test(data.email.trim())) {
    return "Email is invalid";
  }

  if (typeof data.password !== "string" || data.password.trim() === "") {
    return "Password is required";
  }

  return null;
};

export const validateForgotPassword = (
  data: ForgotPasswordInput,
): string | null => {
  if (typeof data.email !== "string" || data.email.trim() === "") {
    return "Email is required";
  }

  if (!/^\S+@\S+\.\S+$/.test(data.email.trim())) {
    return "Email is invalid";
  }

  return null;
};

export const validateResetPassword = (
  data: ResetPasswordInput,
): string | null => {
  const newPassword = data.newPassword ?? data.password;

  if (typeof newPassword !== "string" || newPassword.trim() === "") {
    return "New password is required";
  }

  const passwordError = validatePasswordStrength(newPassword);

  if (passwordError) {
    return passwordError;
  }

  if (
    typeof data.confirmPassword !== "string" ||
    data.confirmPassword.trim() === ""
  ) {
    return "Confirm password is required";
  }

  if (newPassword !== data.confirmPassword) {
    return "New password and confirm password do not match";
  }

  return null;
};
