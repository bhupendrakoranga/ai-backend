# Backend API

Express + TypeScript backend for authentication, password recovery, and email-based password reset.

## Tech Stack

- Node.js with TypeScript
- Express 5
- MongoDB with Mongoose
- bcrypt for password hashing
- Nodemailer for email delivery
- Custom HS256 JWT helper for auth and password reset tokens

## Project Structure

```text
src/
  app.ts                     Express app and route mounting
  server.ts                  Environment loading, MongoDB connection, server start
  controllers/
    auth.controller.ts        Register, login, forgot password, reset password APIs
  db/
    connectDB.ts              MongoDB connection helper
  models/
    user.model.ts             User schema
  middleware/
    security.middleware.ts     CORS, security headers, and rate limiting
  routes/
    auth.routes.ts            Auth route definitions
  services/
    mail.service.ts           Nodemailer mail sender
  templates/
    email.template.ts         Password reset email HTML template
  types/
    auth.types.ts             Shared auth and API response types
  utils/
    apiResponse.ts            Common response helper, statuses, messages
    jwt.ts                    JWT generate and verify helpers
  validators/
    auth.validator.ts         Request body validation
```

## Setup

Install dependencies:

```bash
npm install
```

Create a `.env` file in the `api-backend` folder. Do not commit real credentials.

```env
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/full-stack
FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173
JSON_BODY_LIMIT=20kb
TRUST_PROXY=false
JWT_SECRET=replace-with-a-strong-secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-app-password
EMAIL_FROM=your-email@example.com
```

Notes:

- `MONGO_URI` is required.
- `JWT_SECRET` is required in production. In local development, the code has a fallback secret.
- `FRONTEND_URL` is used to build the password reset page link.
- `CORS_ORIGIN` is a comma-separated browser origin allowlist. It falls back to `FRONTEND_URL`.
- `JSON_BODY_LIMIT` controls the maximum JSON request body size.
- `TRUST_PROXY=true` should only be used when the app is behind a trusted reverse proxy.
- `SMTP_*` values are required when sending forgot-password emails.
- `.env`, `node_modules`, and `dist` are ignored by `.gitignore`.

## Scripts

```bash
npm run dev
```

Starts the backend with `nodemon` and `tsx`.

```bash
npm run check
```

Runs TypeScript validation without emitting files.

```bash
npm run build
```

Builds TypeScript into `dist`.

```bash
npm start
```

Runs the compiled server from `dist/server.js`.

On Windows PowerShell, if `npm run ...` is blocked by script policy, use `npm.cmd run ...`.

## Base URL

```text
http://localhost:3000
```

Auth routes are mounted under:

```text
/api/auth
```

Health route:

```http
GET /
```

Response:

```text
Server is ready
```

## Common API Response Shape

All auth APIs use the same response wrapper:

```json
{
  "statusCode": 200,
  "status": "success",
  "message": "Message text",
  "data": {}
}
```

Possible status values:

- `success`
- `fail`
- `error`

Common HTTP statuses:

- `200` OK
- `201` Created
- `204` No Content
- `400` Bad Request
- `401` Unauthorized
- `403` Forbidden
- `404` Not Found
- `409` Conflict
- `429` Too Many Requests
- `500` Internal Server Error

## Security Middleware

The app applies security middleware before routes:

- Disables the `X-Powered-By` header.
- Adds security headers:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-DNS-Prefetch-Control: off`
  - `Referrer-Policy: no-referrer`
  - `Cross-Origin-Opener-Policy: same-origin`
  - `Cross-Origin-Resource-Policy: same-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
  - `Content-Security-Policy: default-src 'none'; frame-ancestors 'none'; base-uri 'none'`
- Applies CORS using `CORS_ORIGIN` or `FRONTEND_URL`.
- Allows `GET`, `POST`, and `OPTIONS` methods.
- Allows `Content-Type` and `Authorization` request headers.
- Limits JSON request bodies with `JSON_BODY_LIMIT`, default `20kb`.

Auth endpoints also have in-memory IP-based rate limits:

| Route | Limit |
| --- | --- |
| `POST /api/auth/register` | 10 requests per 15 minutes |
| `POST /api/auth/login` | 5 requests per 15 minutes |
| `POST /api/auth/forgot-password` | 3 requests per 15 minutes |
| `POST /api/auth/reset-password/:userId/:token` | 5 requests per 15 minutes |

Rate-limited responses:

```json
{
  "statusCode": 429,
  "status": "fail",
  "message": "Too many requests. Please try again later"
}
```

The current limiter is in-memory. For multi-server production deployments, replace it with a shared store such as Redis.

## User Model

The user collection stores:

```ts
{
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  passwordResetVersion: number;
}
```

Important details:

- `email` is unique, lowercase, and trimmed.
- `phoneNumber` is unique and trimmed.
- `password` is hashed with bcrypt and is excluded by default from queries.
- `passwordResetVersion` starts at `0` and increments after a successful password reset. This invalidates old reset links after use.

## Auth APIs

### Register

```http
POST /api/auth/register
```

Request body:

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phoneNumber": "9876543210",
  "password": "Pass1234",
  "confirmPassword": "Pass1234"
}
```

Validation:

- `firstName`, `lastName`, `email`, `phoneNumber`, `password`, and `confirmPassword` are required.
- `email` must be valid.
- `password` must be at least 8 characters.
- `password` must include at least one letter and one number.
- `password` cannot start or end with spaces.
- `password` and `confirmPassword` must match.
- `email` must not already exist.
- `phoneNumber` must not already exist.

Success response:

```json
{
  "statusCode": 201,
  "status": "success",
  "message": "User registered successfully",
  "data": {
    "id": "user-id",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phoneNumber": "9876543210"
  }
}
```

### Login

```http
POST /api/auth/login
```

Request body:

```json
{
  "email": "john@example.com",
  "password": "Pass1234"
}
```

Validation:

- `email` is required and must be valid.
- `password` is required.
- Password is compared with the stored bcrypt hash.

Success response:

```json
{
  "statusCode": 200,
  "status": "success",
  "message": "User logged in successfully",
  "data": {
    "user": {
      "id": "user-id",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phoneNumber": "9876543210"
    },
    "token": "jwt-token"
  }
}
```

Invalid credentials response message:

```text
Invalid email or password
```

### Forgot Password

```http
POST /api/auth/forgot-password
```

Request body:

```json
{
  "email": "john@example.com"
}
```

Validation:

- `email` is required and must be valid.
- The response stays the same whether or not the user exists. This prevents attackers from checking which emails are registered.

What happens:

- Finds the user by email.
- If the user does not exist, returns the same success response and does not send an email.
- If the user exists, generates a password reset JWT.
- Reset token expires in 15 minutes.
- Token payload includes:
  - `id`
  - `email`
  - `purpose: "password-reset"`
  - `resetVersion`
- Builds frontend reset page URL:

```text
{FRONTEND_URL}/reset-password/{userId}/{token}
```

- Sends email using Nodemailer.
- Uses the HTML email template from `src/templates/email.template.ts`.
- Attaches `../frontend/public/images/login-illustration.svg` with CID `login-illustration`.

Success response:

```json
{
  "statusCode": 200,
  "status": "success",
  "message": "Password reset link generated successfully"
}
```

### Reset Password

```http
POST /api/auth/reset-password/:userId/:token
```

This API is called from the reset password page after the user opens the email link.

Recommended request body:

```json
{
  "newPassword": "NewPass1234",
  "confirmPassword": "NewPass1234"
}
```

The API also supports this body for current frontend compatibility:

```json
{
  "password": "NewPass1234",
  "confirmPassword": "NewPass1234"
}
```

Validation:

- New password is required.
- New password must be at least 8 characters.
- New password must include at least one letter and one number.
- New password cannot start or end with spaces.
- `confirmPassword` is required.
- New password and confirm password must match.
- `userId` and `token` must be present in route params.
- Reset token must be valid and not expired.
- Reset token must have `purpose: "password-reset"`.
- Token user id must match route `userId`.
- Token email must match the database user email.
- Token `resetVersion` must match the user's current `passwordResetVersion`.

What happens on success:

- New password is hashed with bcrypt.
- User password is updated.
- `passwordResetVersion` increments by 1.
- Old reset links for that user become invalid.
- A fresh login JWT is generated.
- Response returns the same login shape as the login API, so the frontend can log the user in after reset.

Success response:

```json
{
  "statusCode": 200,
  "status": "success",
  "message": "Password reset successfully",
  "data": {
    "user": {
      "id": "user-id",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phoneNumber": "9876543210"
    },
    "token": "jwt-token"
  }
}
```

Invalid or expired token response:

```json
{
  "statusCode": 401,
  "status": "fail",
  "message": "Invalid or expired reset token"
}
```

## JWT Behavior

JWT helper file:

```text
src/utils/jwt.ts
```

Generated tokens:

- Use HS256 HMAC SHA-256.
- Include `iat` and `exp`.
- Login token default expiry is 7 days.
- Reset password token expiry is 15 minutes.

Verification:

- Checks token format.
- Checks header algorithm and type.
- Checks signature using `JWT_SECRET`.
- Uses constant-time signature comparison.
- Checks expiry.
- Returns `null` for invalid or expired tokens.

## Email Flow

Mail sender:

```text
src/services/mail.service.ts
```

Email template:

```text
src/templates/email.template.ts
```

Required env variables for email:

```env
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=
```

The forgot-password email includes:

- HTML layout
- Greeting with user's first name
- Reset password button
- Link expiry text
- Inline image using `cid:login-illustration`
- Plain text fallback containing the reset URL

## End-to-End Password Reset Flow

1. User submits email to `POST /api/auth/forgot-password`.
2. Backend validates email format.
3. Backend returns the same success response whether or not the user exists.
4. If the user exists, backend generates a 15-minute reset token with `purpose: "password-reset"`.
5. Backend sends reset URL to the user's email.
6. User opens frontend page:

```text
/reset-password/:userId/:token
```

7. Frontend submits new password and confirm password to:

```text
POST /api/auth/reset-password/:userId/:token
```

8. Backend validates passwords and reset token.
9. Backend hashes and saves the new password.
10. Backend increments `passwordResetVersion` to invalidate old links.
11. Backend returns user data and a fresh login token.

## Security Notes

- Never store plain text passwords.
- Never include real `.env` values in documentation or commits.
- README examples must use placeholder values only. Do not paste real SMTP passwords, email app passwords, JWT secrets, database passwords, or production URLs with secrets.
- Reset tokens are short-lived and expire after 15 minutes.
- Reset links are invalidated after successful password reset.
- Password reset responses use a generic invalid token message for security.
- Forgot-password responses do not reveal whether an email is registered.
- Auth routes have IP-based rate limiting.
- Browser access is restricted by the configured CORS origin allowlist.
- In production, always set a strong `JWT_SECRET`.

## Verification

TypeScript check:

```bash
npm.cmd run check
```

Current result:

```text
tsc --noEmit
```

No TypeScript errors.
